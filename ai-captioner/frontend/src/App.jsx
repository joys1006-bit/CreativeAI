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
    const pushHistory = useCallback((newCaptions) => {
        setCaptionHistory(prev => {
            const sliced = prev.slice(0, historyIndex + 1);
            return [...sliced, JSON.parse(JSON.stringify(newCaptions))];
        });
        setHistoryIndex(prev => prev + 1);
    }, [historyIndex]);

    const handleUndo = useCallback(() => {
        if (historyIndex > 0) {
            const prevIndex = historyIndex - 1;
            setHistoryIndex(prevIndex);
            setCaptions(JSON.parse(JSON.stringify(captionHistory[prevIndex])));
            addToast('되돌리기 완료', 'info');
        }
    }, [historyIndex, captionHistory, addToast]);

    const handleRedo = useCallback(() => {
        if (historyIndex < captionHistory.length - 1) {
            const nextIndex = historyIndex + 1;
            setHistoryIndex(nextIndex);
            setCaptions(JSON.parse(JSON.stringify(captionHistory[nextIndex])));
            addToast('다시하기 완료', 'info');
        }
    }, [historyIndex, captionHistory, addToast]);

    // === 재생 로직 ===
    const togglePlay = useCallback(() => {
        if (!videoRef.current) return;
        if (videoRef.current.paused) {
            videoRef.current.play();
            setIsPlaying(true);
        } else {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    }, []);

    const seekTo = useCallback((time) => {
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            setCurrentTime(time);
        }
    }, []);

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

    // === 키보드 단축키 ===
    useEffect(() => {
        const handleKeyDown = (e) => {
            // textarea 입력 중에는 무시
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
                        addToast('SRT 파일이 저장되었습니다', 'success');
                    }
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [togglePlay, seekTo, duration, handleUndo, handleRedo, addToast]);

    // === 파일 처리 ===
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
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
            addToast('업로드에 실패했습니다: ' + (error.response?.data || error.message), 'error');
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
                    // 진행 단계 시뮬레이션 (백엔드 progress API 없을 때 폴백)
                    if (pollCount === 3) setProgress({ stage: 'transcribing' });
                    if (pollCount === 8) setProgress({ stage: 'correcting' });
                    if (pollCount === 12) setProgress({ stage: 'finalizing' });

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
                        addToast('분석 실패: ' + res.data.error, 'error');
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
            addToast('내보내기 실패: ' + e.message, 'error');
            setStatus('completed');
        }
    };

    const handleExportSRT = useCallback(() => {
        if (captions.length === 0) return addToast('자막 데이터가 없습니다', 'warning');
        const srtContent = captions.map((c, i) => {
            const formatSRTTime = (s) => {
                const d = new Date(s * 1000);
                return d.toISOString().substr(11, 8) + ',' + d.toISOString().substr(19, 3);
            };
            return `${i + 1}\n${formatSRTTime(c.start + syncOffset)} --> ${formatSRTTime(c.end + syncOffset)}\n${c.text}\n`;
        }).join('\n');

        const blob = new Blob([srtContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${file?.name || 'subtitle'}.srt`;
        a.click();
        addToast('SRT 파일이 저장되었습니다', 'success');
    }, [captions, syncOffset, file, addToast]);

    // === 자막 CRUD ===
    const updateCaption = useCallback((id, newText) => {
        setCaptions(prev => {
            const updated = prev.map((c, idx) =>
                (c.id === id || idx === id) ? { ...c, text: newText } : c
            );
            pushHistory(updated);
            return updated;
        });
    }, [pushHistory]);

    const deleteCaption = useCallback((index) => {
        setCaptions(prev => {
            const updated = prev.filter((_, i) => i !== index);
            pushHistory(updated);
            addToast('자막이 삭제되었습니다', 'info');
            return updated;
        });
    }, [pushHistory, addToast]);

    const addCaption = useCallback(() => {
        const newStart = currentTime;
        const newEnd = Math.min(currentTime + 3, duration);
        const newSegment = {
            id: `seg_new_${Date.now()}`,
            start: newStart,
            end: newEnd,
            text: '새 자막',
            confidence: 1.0
        };
        setCaptions(prev => {
            // 시간순으로 삽입
            const updated = [...prev, newSegment].sort((a, b) => a.start - b.start);
            pushHistory(updated);
            addToast('새 자막이 추가되었습니다', 'success');
            return updated;
        });
    }, [currentTime, duration, pushHistory, addToast]);

    const mergeCaptions = useCallback(() => {
        if (captions.length < 2) return addToast('합칠 자막이 부족합니다', 'warning');
        // 현재 재생 시간에 있는 자막과 다음 자막을 합침
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
            pushHistory(updated);
            addToast('자막 2개가 합쳐졌습니다', 'success');
            return updated;
        });
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
