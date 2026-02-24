import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { AnimatePresence } from 'framer-motion';
import './App.css';

// 컴포넌트
import RibbonToolbar from './components/RibbonToolbar';
import VideoStage from './components/VideoStage';
import WordChipEditor from './components/WordChipEditor';
import Timeline from './components/Timeline';
import ProgressOverlay from './components/ProgressOverlay';
import AiInsightPanel from './components/AiInsightPanel';
import Toast from './components/Toast';

const API_BASE = 'http://localhost:8000';

const App = () => {
    // --- State: 데이터 ---
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('idle');
    const [captions, setCaptions] = useState([]);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [waveform, setWaveform] = useState([]);
    const [jobId, setJobId] = useState(null);
    const [progress, setProgress] = useState({ stage: 'uploading' });

    // --- State: UI/재생 ---
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(100);
    const [activeTab, setActiveTab] = useState('home');
    const [syncOffset, setSyncOffset] = useState(0.0);
    const [showInsight, setShowInsight] = useState(false);

    // --- State: Toast ---
    const [toasts, setToasts] = useState([]);

    // --- State: Undo/Redo ---
    const [captionHistory, setCaptionHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // --- Refs ---
    const fileInputRef = useRef(null);
    const videoRef = useRef(null);
    const historyDebounceRef = useRef(null);

    // === Toast 헬퍼 ===
    const addToast = useCallback((message, type = 'info') => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    // === Undo/Redo 헬퍼 ===
    // FIX: pushHistory를 useRef 기반으로 변경하여 stale closure 방지
    const historyRef = useRef({ captionHistory: [], historyIndex: -1 });

    // historyRef를 state와 동기화
    useEffect(() => {
        historyRef.current = { captionHistory, historyIndex };
    }, [captionHistory, historyIndex]);

    // FIX: 디바운스된 히스토리 저장 (매 키입력이 아닌 500ms 쉬면 저장)
    const pushHistory = useCallback((newCaptions) => {
        if (historyDebounceRef.current) clearTimeout(historyDebounceRef.current);
        historyDebounceRef.current = setTimeout(() => {
            const { captionHistory: hist, historyIndex: idx } = historyRef.current;
            const sliced = hist.slice(0, idx + 1);
            const newHistory = [...sliced, JSON.parse(JSON.stringify(newCaptions))];
            setCaptionHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
        }, 500);
    }, []);

    const handleUndo = useCallback(() => {
        if (historyRef.current.historyIndex > 0) {
            const prevIndex = historyRef.current.historyIndex - 1;
            setHistoryIndex(prevIndex);
            setCaptions(JSON.parse(JSON.stringify(historyRef.current.captionHistory[prevIndex])));
            addToast('되돌리기 완료', 'info');
        }
    }, [addToast]);

    const handleRedo = useCallback(() => {
        const { captionHistory: hist, historyIndex: idx } = historyRef.current;
        if (idx < hist.length - 1) {
            const nextIndex = idx + 1;
            setHistoryIndex(nextIndex);
            setCaptions(JSON.parse(JSON.stringify(hist[nextIndex])));
            addToast('다시하기 완료', 'info');
        }
    }, [addToast]);

    // === 재생 로직 ===
    const togglePlay = useCallback(() => {
        if (!videoRef.current) return;
        if (videoRef.current.paused) {
            videoRef.current.play();
        } else {
            videoRef.current.pause();
        }
        // isPlaying은 onPlay/onPause 이벤트에서 관리
    }, []);

    const seekTo = useCallback((time) => {
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            setCurrentTime(time);
        }
    }, []);

    // FIX: 비디오 재생 상태를 이벤트 기반으로 동기화
    const handlePlay = useCallback(() => setIsPlaying(true), []);
    const handlePause = useCallback(() => setIsPlaying(false), []);
    const handleEnded = useCallback(() => setIsPlaying(false), []);
    const handleTimeUpdate = () => setCurrentTime(videoRef.current?.currentTime || 0);
    const handleLoadedMetadata = () => setDuration(videoRef.current?.duration || 0);

    // 고빈도 업데이트 루프 (requestAnimationFrame)
    useEffect(() => {
        let animationFrameId;
        const loop = () => {
            if (videoRef.current && !videoRef.current.paused) {
                setCurrentTime(videoRef.current.currentTime);
            }
            animationFrameId = requestAnimationFrame(loop);
        };
        loop();
        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    // === SRT 내보내기 ===
    // FIX: handleExportSRT를 키보드 단축키보다 먼저 정의
    const handleExportSRT = useCallback(() => {
        if (captions.length === 0) return addToast('자막 데이터가 없습니다', 'warning');
        const srtContent = captions.map((c, i) => {
            const formatSRTTime = (s) => {
                const totalMs = Math.max(0, Math.round(s * 1000));
                const hours = String(Math.floor(totalMs / 3600000)).padStart(2, '0');
                const mins = String(Math.floor((totalMs % 3600000) / 60000)).padStart(2, '0');
                const secs = String(Math.floor((totalMs % 60000) / 1000)).padStart(2, '0');
                const ms = String(totalMs % 1000).padStart(3, '0');
                return `${hours}:${mins}:${secs},${ms}`;
            };
            return `${i + 1}\n${formatSRTTime(c.start + syncOffset)} --> ${formatSRTTime(c.end + syncOffset)}\n${c.text}\n`;
        }).join('\n');

        const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${file?.name?.replace(/\.[^.]+$/, '') || 'subtitle'}.srt`;
        a.click();
        URL.revokeObjectURL(url);
        addToast('SRT 파일이 저장되었습니다', 'success');
    }, [captions, syncOffset, file, addToast]);

    // === 키보드 단축키 ===
    // FIX: handleExportSRT를 deps에 포함
    useEffect(() => {
        const handleKeyDown = (e) => {
            // textarea/input 입력 중에는 무시
            if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;

            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    togglePlay();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    seekTo(Math.max(0, (videoRef.current?.currentTime || 0) - 5));
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    seekTo(Math.min(duration, (videoRef.current?.currentTime || 0) + 5));
                    break;
                case 'KeyZ':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        if (e.shiftKey) handleRedo();
                        else handleUndo();
                    }
                    break;
                case 'KeyS':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        handleExportSRT();
                    }
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [togglePlay, seekTo, duration, handleUndo, handleRedo, handleExportSRT]);

    // === 파일 처리 ===
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            // 이전 previewUrl 해제 (메모리 릭 방지)
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
            setCaptions([]);
            setAiAnalysis(null);
            setWaveform([]);
            setStatus('idle');
            setShowInsight(false);
            setCaptionHistory([]);
            setHistoryIndex(-1);
            addToast(`"${selectedFile.name}" 로드 완료`, 'success');
        }
    };

    // === 업로드 & 분석 ===
    const handleUpload = async () => {
        if (!file) return addToast('먼저 영상을 불러와 주세요', 'warning');
        setStatus('uploading');
        setProgress({ stage: 'uploading' });

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('language', 'ko');
            const res = await axios.post(`${API_BASE}/upload`, formData);
            setJobId(res.data.jobId);
            setStatus('processing');
            setProgress({ stage: 'extracting' });
            addToast('업로드 완료! AI 분석을 시작합니다', 'info');
        } catch (error) {
            console.error(error);
            addToast('업로드에 실패했습니다: ' + (error.response?.data?.error || error.response?.data || error.message), 'error');
            setStatus('idle');
        }
    };

    // === 폴링 ===
    useEffect(() => {
        let timer;
        let pollCount = 0;
        if (status === 'processing' && jobId) {
            timer = setInterval(async () => {
                try {
                    pollCount++;

                    // FIX: 백엔드 progress API에서 실제 단계 가져오기
                    try {
                        const progressRes = await axios.get(`${API_BASE}/progress/${jobId}`);
                        if (progressRes.data.stage) {
                            setProgress({ stage: progressRes.data.stage });
                        }
                    } catch (_) {
                        // progress API 미지원 시 폴백 시뮬레이션
                        if (pollCount === 3) setProgress({ stage: 'transcribing' });
                        if (pollCount === 8) setProgress({ stage: 'correcting' });
                        if (pollCount === 12) setProgress({ stage: 'finalizing' });
                    }

                    const res = await axios.get(`${API_BASE}/status/${jobId}`);
                    if (res.data.status === 'COMPLETED') {
                        const segments = (res.data.segments || []).map((seg, i) => ({
                            ...seg,
                            id: seg.id || `seg_${i}_${Date.now()}`
                        }));
                        setCaptions(segments);
                        setAiAnalysis({
                            summary: res.data.summary,
                            keywords: res.data.keywords,
                            sentiment: res.data.sentiment,
                            sentimentScore: res.data.sentimentScore,
                            highlights: res.data.highlights
                        });
                        setWaveform(res.data.waveform || []);
                        setStatus('completed');
                        // 초기 히스토리 저장
                        setCaptionHistory([JSON.parse(JSON.stringify(segments))]);
                        setHistoryIndex(0);
                        clearInterval(timer);
                        addToast(`✨ 자막 ${segments.length}개 생성 완료!`, 'success');
                    } else if (res.data.status === 'FAILED') {
                        addToast('분석 실패: ' + (res.data.error || '알 수 없는 오류'), 'error');
                        setStatus('idle');
                        clearInterval(timer);
                    }
                } catch (e) { /* 폴링 에러 무시 */ }
            }, 2000);
        }
        return () => clearInterval(timer);
    }, [status, jobId, addToast]);

    // === 내보내기 ===
    const handleExportVideo = async () => {
        if (!jobId) return addToast('먼저 영상을 분석해주세요', 'warning');
        setStatus('exporting');
        addToast('영상 내보내기를 시작합니다...', 'info');
        try {
            const res = await axios.post(`${API_BASE}/export-video`, {
                jobId,
                withSubtitles: true
            });
            window.open(res.data.downloadUrl, '_blank');
            setStatus('completed');
            addToast('영상 내보내기 완료!', 'success');
        } catch (e) {
            addToast('내보내기 실패: ' + (e.response?.data?.error || e.message), 'error');
            setStatus('completed');
        }
    };

    // === 자막 CRUD ===
    // FIX: pushHistory를 setCaptions 밖에서 호출
    const updateCaption = useCallback((id, newText) => {
        setCaptions(prev => {
            const updated = prev.map((c, idx) =>
                (c.id === id || idx === id) ? { ...c, text: newText } : c
            );
            return updated;
        });
        // 디바운스된 히스토리
        setCaptions(current => {
            pushHistory(current);
            return current;
        });
    }, [pushHistory]);

    const deleteCaption = useCallback((index) => {
        setCaptions(prev => {
            const updated = prev.filter((_, i) => i !== index);
            return updated;
        });
        // 삭제는 즉시 히스토리
        setTimeout(() => {
            setCaptions(current => {
                pushHistory(current);
                return current;
            });
        }, 0);
        addToast('자막이 삭제되었습니다', 'info');
    }, [pushHistory, addToast]);

    const addCaption = useCallback(() => {
        const newStart = currentTime;
        const newEnd = Math.min(currentTime + 3, duration || currentTime + 3);
        const newSegment = {
            id: `seg_new_${Date.now()}`,
            start: newStart,
            end: newEnd,
            text: '새 자막',
            confidence: 1.0
        };
        setCaptions(prev => {
            const updated = [...prev, newSegment].sort((a, b) => a.start - b.start);
            return updated;
        });
        setTimeout(() => {
            setCaptions(current => {
                pushHistory(current);
                return current;
            });
        }, 0);
        addToast('새 자막이 추가되었습니다', 'success');
    }, [currentTime, duration, pushHistory, addToast]);

    const mergeCaptions = useCallback(() => {
        if (captions.length < 2) return addToast('합칠 자막이 부족합니다', 'warning');
        const currentIdx = captions.findIndex(c => {
            const start = c.start + syncOffset;
            const end = c.end + syncOffset;
            return currentTime >= start && currentTime <= end;
        });

        if (currentIdx === -1 || currentIdx >= captions.length - 1) {
            return addToast('합칠 위치를 찾을 수 없습니다. 재생 바를 자막 위에 놓아주세요.', 'warning');
        }

        const current = captions[currentIdx];
        const next = captions[currentIdx + 1];
        const merged = {
            ...current,
            end: next.end,
            text: current.text + ' ' + next.text
        };

        setCaptions(prev => {
            const updated = [...prev];
            updated[currentIdx] = merged;
            updated.splice(currentIdx + 1, 1);
            return updated;
        });
        setTimeout(() => {
            setCaptions(current => {
                pushHistory(current);
                return current;
            });
        }, 0);
        addToast('자막 2개가 합쳐졌습니다', 'success');
    }, [captions, currentTime, syncOffset, pushHistory, addToast]);

    // === 현재 자막 ===
    const currentCaption = captions.find(c => {
        const start = c.start + syncOffset;
        const end = c.end + syncOffset;
        return currentTime >= start && currentTime <= end;
    });

    const formatTime = (s) => {
        if (!s || isNaN(s)) return '00:00';
        return new Date(s * 1000).toISOString().substr(14, 5);
    };

    return (
        <div className="app-container">
            <header className="app-header">
                <div className="brand-section">
                    <span className="app-logo">AI CAPTIONER PRO</span>
                    <span className="project-title">{file ? file.name : '새 프로젝트'}</span>
                </div>
                <div className="header-right">
                    {status === 'completed' && (
                        <span className="status-badge">✅ 분석 완료</span>
                    )}
                </div>
                <input type="file" ref={fileInputRef} hidden onChange={handleFileChange} accept="video/*" />
            </header>

            <RibbonToolbar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onSelectFile={() => fileInputRef.current.click()}
                onStartAnalysis={handleUpload}
                onExportVideo={handleExportVideo}
                onExportSRT={handleExportSRT}
                status={status}
                syncOffset={syncOffset}
                setSyncOffset={setSyncOffset}
                hasFile={!!file}
                hasCaptions={captions.length > 0}
                onAddCaption={addCaption}
                onMergeCaptions={mergeCaptions}
                onToggleInsight={() => setShowInsight(prev => !prev)}
                showInsight={showInsight}
                onUndo={handleUndo}
                onRedo={handleRedo}
                canUndo={historyIndex > 0}
                canRedo={historyIndex < captionHistory.length - 1}
            />

            <main className="main-layout">
                <VideoStage
                    videoRef={videoRef}
                    previewUrl={previewUrl}
                    currentCaption={currentCaption}
                    togglePlay={togglePlay}
                    handleTimeUpdate={handleTimeUpdate}
                    handleLoadedMetadata={handleLoadedMetadata}
                    handlePlay={handlePlay}
                    handlePause={handlePause}
                    handleEnded={handleEnded}
                    isPlaying={isPlaying}
                />

                <WordChipEditor
                    captions={captions}
                    currentTime={currentTime}
                    syncOffset={syncOffset}
                    onSeek={seekTo}
                    onUpdateCaption={updateCaption}
                    onDeleteCaption={deleteCaption}
                    onMergeCaptions={mergeCaptions}
                    status={status}
                />

                <AiInsightPanel
                    analysis={aiAnalysis}
                    onSeek={seekTo}
                    isVisible={showInsight}
                    onToggle={() => setShowInsight(prev => !prev)}
                />
            </main>

            <Timeline
                currentTime={currentTime}
                duration={duration}
                zoomLevel={zoomLevel}
                setZoomLevel={setZoomLevel}
                captions={captions}
                waveform={waveform}
                togglePlay={togglePlay}
                formatTime={formatTime}
                onSeek={seekTo}
                syncOffset={syncOffset}
            />

            {/* 프로그레스 오버레이 */}
            <AnimatePresence>
                <ProgressOverlay status={status} progress={progress} />
            </AnimatePresence>

            {/* Toast 알림 */}
            <Toast toasts={toasts} onRemove={removeToast} />
        </div>
    );
};

export default App;
