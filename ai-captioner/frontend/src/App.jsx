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
import SubtitleStylePanel from './components/SubtitleStylePanel';
import TtsPanel from './components/TtsPanel';
import TemplateGallery from './components/TemplateGallery';
import ShortcutGuide from './components/ShortcutGuide';
import DropZone from './components/DropZone';
import PlaybackSpeed from './components/PlaybackSpeed';
import SubtitleSearch from './components/SubtitleSearch';
import SubtitleStats from './components/SubtitleStats';
import VideoExporter from './components/VideoExporter';
import { ThemeToggle } from './components/ThemeProvider';
import { SpeakerLegend } from './components/SpeakerBadge';

// 커스텀 훅
import useVideoPlayer from './hooks/useVideoPlayer';
import useSubtitles from './hooks/useSubtitles';
import useSession from './hooks/useSession';

const API_BASE = 'http://localhost:8000';

const DEFAULT_SUBTITLE_STYLE = {
    fontFamily: "'Pretendard', sans-serif",
    fontSize: 24,
    color: '#FFFFFF',
    bgColor: 'rgba(0,0,0,0.6)',
    position: 'bottom',
    shadow: true,
    bold: false,
    italic: false,
};

const App = () => {
    // --- 커스텀 훅: 비디오 재생 ---
    const {
        currentTime, duration, isPlaying, zoomLevel, setZoomLevel,
        videoRef, togglePlay, seekTo,
        handlePlay, handlePause, handleEnded,
        handleTimeUpdate, handleLoadedMetadata, formatTime,
    } = useVideoPlayer();

    // --- State: 데이터 ---
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('idle');
    const [previewUrl, setPreviewUrl] = useState(null);
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [waveform, setWaveform] = useState([]);
    const [jobId, setJobId] = useState(null);
    const [progress, setProgress] = useState({ stage: 'uploading' });

    // --- State: 싱크 & UI ---
    const [activeTab, setActiveTab] = useState('home');
    const [syncOffset, setSyncOffset] = useState(0.0);
    const [showInsight, setShowInsight] = useState(false);

    // --- State: 자막 스타일 ---
    const [subtitleStyle, setSubtitleStyle] = useState(DEFAULT_SUBTITLE_STYLE);
    const [showStylePanel, setShowStylePanel] = useState(false);

    // --- State: 무음 구간 ---
    const [silenceSegments, setSilenceSegments] = useState([]);

    // --- State: 화자 분리 (Phase 2) ---
    const [speakers, setSpeakers] = useState([]);

    // --- State: TTS ---
    const [showTtsPanel, setShowTtsPanel] = useState(false);

    // --- State: 템플릿 ---
    const [showTemplateGallery, setShowTemplateGallery] = useState(false);

    // --- State: 번역 ---
    const [translatedCaptions, setTranslatedCaptions] = useState(null);
    const [targetLang, setTargetLang] = useState('en');

    // --- State: Sprint 4 ---
    const [showShortcutGuide, setShowShortcutGuide] = useState(false);
    const [exportFormat, setExportFormat] = useState('srt');

    // --- State: 이미지 오버레이 ---
    const [overlayImage, setOverlayImage] = useState(null);

    // --- State: 자막 위치 (드래그) ---
    const [subtitlePos, setSubtitlePos] = useState(null);

    // --- State: Phase 1 새 기능 ---
    const [showSearch, setShowSearch] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const [showVideoExporter, setShowVideoExporter] = useState(false);

    // --- State: Toast ---
    const [toasts, setToasts] = useState([]);

    // --- Refs ---
    const fileInputRef = useRef(null);

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

    // --- 커스텀 훅: 자막 관리 ---
    const {
        captions, setCaptions,
        captionHistory, historyIndex,
        handleUndo, handleRedo, initializeHistory,
        updateCaption, updateCaptionTiming,
        deleteCaption, addCaption: addCaptionBase,
        mergeCaptions: mergeCaptionsBase,
        splitCaption: splitCaptionBase,
    } = useSubtitles(addToast);

    // App 레벨에서 currentTime/syncOffset 바인딩
    const handleAddCaption = useCallback(() => addCaptionBase(currentTime, duration), [addCaptionBase, currentTime, duration]);
    const handleMergeCaptions = useCallback(() => mergeCaptionsBase(currentTime, syncOffset), [mergeCaptionsBase, currentTime, syncOffset]);
    const handleSplitCaption = useCallback(() => splitCaptionBase(currentTime, syncOffset), [splitCaptionBase, currentTime, syncOffset]);

    // --- 커스텀 훅: 세션 관리 ---
    useSession({
        captions, syncOffset, subtitleStyle, subtitlePos, overlayImage, status, file,
        setCaptions, setSyncOffset, setSubtitleStyle, setSubtitlePos,
        setOverlayImage, setStatus, setFile, setPreviewUrl,
    });

    // === SRT 내보내기 ===
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
    useEffect(() => {
        const handleKeyDown = (e) => {
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
                case 'KeyF':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        setShowSearch(prev => !prev);
                    }
                    break;
                case 'F11':
                    e.preventDefault();
                    if (!document.fullscreenElement) {
                        document.documentElement.requestFullscreen?.();
                    } else {
                        document.exitFullscreen?.();
                    }
                    break;
                case 'BracketLeft':  // [ 키: 싱크 -0.5초
                    e.preventDefault();
                    setSyncOffset(prev => {
                        const v = Math.round((prev - 0.5) * 10) / 10;
                        return v;
                    });
                    break;
                case 'BracketRight': // ] 키: 싱크 +0.5초
                    e.preventDefault();
                    setSyncOffset(prev => {
                        const v = Math.round((prev + 0.5) * 10) / 10;
                        return v;
                    });
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [togglePlay, seekTo, duration, handleUndo, handleRedo, handleExportSRT, videoRef]);

    // === 파일 처리 ===
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
            setCaptions([]);
            setAiAnalysis(null);
            setWaveform([]);
            setStatus('idle');
            setShowInsight(false);
            setSilenceSegments([]);
            setOverlayImage(null);
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
        if (status === 'processing' && jobId) {
            timer = setInterval(async () => {
                try {
                    try {
                        const progressRes = await axios.get(`${API_BASE}/progress/${jobId}`);
                        if (progressRes.data.stage) setProgress({ stage: progressRes.data.stage });
                    } catch (_) { }

                    const res = await axios.get(`${API_BASE}/status/${jobId}`);
                    if (res.data.status === 'COMPLETED') {
                        const videoDuration = videoRef.current?.duration || duration || Infinity;
                        const segments = (res.data.segments || [])
                            .filter(seg => seg.start < videoDuration)
                            .map((seg, i) => ({
                                ...seg,
                                end: Math.min(seg.end, videoDuration),
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
                        initializeHistory(segments);
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
    }, [status, jobId, addToast, duration, videoRef, setCaptions, initializeHistory]);

    // === 내보내기 ===
    const handleExportVideo = async () => {
        if (!jobId) return addToast('먼저 영상을 분석해주세요', 'warning');
        setStatus('exporting');
        addToast('영상 내보내기를 시작합니다...', 'info');
        try {
            const res = await axios.post(`${API_BASE}/export-video`, { jobId, withSubtitles: true });
            window.open(res.data.downloadUrl, '_blank');
            setStatus('completed');
            addToast('영상 내보내기 완료!', 'success');
        } catch (e) {
            addToast('내보내기 실패: ' + (e.response?.data?.error || e.message), 'error');
            setStatus('completed');
        }
    };
    // === 화자 분리 (Phase 2) ===
    const identifySpeakersHandler = useCallback(async () => {
        if (!jobId) return addToast('먼저 영상을 분석해주세요', 'warning');
        if (captions.length === 0) return addToast('자막이 없습니다', 'warning');
        addToast('🎤 화자를 분리하고 있습니다...', 'info');
        try {
            const res = await axios.post(`${API_BASE}/speaker-identify`, { jobId });
            setCaptions(res.data.segments);
            setSpeakers(res.data.speakers || []);
            addToast(`✅ ${res.data.speakers?.length || 1}명의 화자가 식별되었습니다!`, 'success');
        } catch (e) {
            addToast('화자 분리 실패: ' + (e.response?.data?.error || e.message), 'error');
        }
    }, [jobId, captions, addToast, setCaptions]);

    // === 무음 구간 감지 ===
    const detectSilence = useCallback(async () => {
        if (!jobId) return addToast('먼저 영상을 분석해주세요', 'warning');
        addToast('무음 구간을 탐지하고 있습니다...', 'info');
        try {
            const res = await axios.get(`${API_BASE}/silence-detect/${jobId}`);
            setSilenceSegments(res.data.silenceSegments || []);
            addToast(`🔇 무음 구간 ${res.data.silenceSegments?.length || 0}개 발견`, 'success');
        } catch (e) {
            addToast('무음 탐지 실패: ' + (e.response?.data?.error || e.message), 'error');
        }
    }, [jobId, addToast]);

    const removeSilence = useCallback(async () => {
        if (!jobId || silenceSegments.length === 0) return addToast('먼저 무음 구간을 탐지해주세요', 'warning');
        addToast('무음 구간을 제거하고 있습니다...', 'info');
        try {
            const res = await axios.post(`${API_BASE}/remove-silence`, { jobId, silenceSegments });
            if (res.data.downloadUrl) {
                window.open(res.data.downloadUrl, '_blank');
                addToast('✅ 무음 제거 완료! 새 영상이 다운로드됩니다.', 'success');
            }
        } catch (e) {
            addToast('무음 제거 실패: ' + (e.response?.data?.error || e.message), 'error');
        }
    }, [jobId, silenceSegments, addToast]);

    // === 번역 ===
    const translateCaptions = useCallback(async (lang = targetLang) => {
        if (!jobId || captions.length === 0) return addToast('먼저 자막을 생성해주세요', 'warning');
        addToast(`${lang.toUpperCase()}로 번역 중...`, 'info');
        try {
            const res = await axios.post(`${API_BASE}/translate`, { jobId, targetLang: lang });
            setTranslatedCaptions(res.data.segments);
            setTargetLang(lang);
            addToast(`✅ ${res.data.segments?.length || 0}개 자막 번역 완료!`, 'success');
        } catch (e) {
            addToast('번역 실패: ' + (e.response?.data?.error || e.message), 'error');
        }
    }, [jobId, captions, targetLang, addToast]);

    // === 템플릿 적용 ===
    const applyTemplate = useCallback((template) => {
        if (template.subtitleStyle) {
            setSubtitleStyle(prev => ({ ...prev, ...template.subtitleStyle }));
        }
        setShowTemplateGallery(false);
        addToast(`📐 "${template.templateName}" 템플릿 적용 완료`, 'success');
    }, [addToast]);

    // === 멀티포맷 자막 내보내기 ===
    const handleExportSubtitle = useCallback((format = 'srt') => {
        if (captions.length === 0) return addToast('내보낼 자막이 없습니다', 'warning');

        const formatSRTTime = (s) => {
            const ms = Math.max(0, Math.round(s * 1000));
            const h = String(Math.floor(ms / 3600000)).padStart(2, '0');
            const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, '0');
            const sec = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
            const milli = String(ms % 1000).padStart(3, '0');
            return `${h}:${m}:${sec},${milli}`;
        };

        let content, ext, mime;
        switch (format) {
            case 'vtt':
                content = 'WEBVTT\n\n' + captions.map((c, i) =>
                    `${i + 1}\n${formatSRTTime(c.start).replace(',', '.')} --> ${formatSRTTime(c.end).replace(',', '.')}\n${c.text}\n`
                ).join('\n');
                ext = '.vtt'; mime = 'text/vtt';
                break;
            case 'txt':
                content = captions.map(c => c.text).join('\n');
                ext = '.txt'; mime = 'text/plain';
                break;
            default: // srt
                content = captions.map((c, i) =>
                    `${i + 1}\n${formatSRTTime(c.start)} --> ${formatSRTTime(c.end)}\n${c.text}\n`
                ).join('\n');
                ext = '.srt'; mime = 'text/plain';
        }

        const blob = new Blob([content], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `subtitles${ext}`;
        a.click();
        URL.revokeObjectURL(url);
        addToast(`✅ ${format.toUpperCase()} 자막 내보내기 완료`, 'success');
    }, [captions, addToast]);

    // === 드래그&드롭 파일 처리 ===
    const handleFileDrop = useCallback((droppedFile) => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setFile(droppedFile);
        setPreviewUrl(URL.createObjectURL(droppedFile));
        addToast(`📁 "${droppedFile.name}" 파일이 로드되었습니다`, 'success');
    }, [previewUrl, addToast]);

    // === 현재 자막 ===
    const currentCaption = captions.find(c => currentTime >= c.start + syncOffset && currentTime <= c.end + syncOffset);

    // === SRT 파일 불러오기 ===
    const handleImportSRT = useCallback(() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.srt,.vtt,.txt';
        input.onchange = (e) => {
            const srtFile = e.target.files[0];
            if (!srtFile) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const text = ev.target.result;
                const segments = [];
                // SRT 파싱
                const blocks = text.trim().split(/\n\s*\n/);
                blocks.forEach((block, i) => {
                    const lines = block.trim().split('\n');
                    if (lines.length < 3) return;
                    const timeMatch = lines[1].match(/(\d{2}):(\d{2}):(\d{2})[,\.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,\.](\d{3})/);
                    if (!timeMatch) return;
                    const start = +timeMatch[1] * 3600 + +timeMatch[2] * 60 + +timeMatch[3] + +timeMatch[4] / 1000;
                    const end = +timeMatch[5] * 3600 + +timeMatch[6] * 60 + +timeMatch[7] + +timeMatch[8] / 1000;
                    const subtitleText = lines.slice(2).join(' ').trim();
                    segments.push({ id: `srt_${i}_${Date.now()}`, start, end, text: subtitleText, confidence: 1.0 });
                });
                if (segments.length > 0) {
                    setCaptions(segments);
                    initializeHistory(segments);
                    setStatus('completed');
                    addToast(`📄 SRT 불러오기 성공! ${segments.length}개 자막`, 'success');
                } else {
                    addToast('SRT 파싱 실패: 유효한 자막을 찾을 수 없습니다', 'error');
                }
            };
            reader.readAsText(srtFile);
        };
        input.click();
    }, [addToast, setCaptions, initializeHistory]);

    return (
        <DropZone onFileDrop={handleFileDrop} disabled={status === 'processing'}>
            <div className="app-container">
                <header className="app-header">
                    <div className="brand-section">
                        <span className="app-logo">AI CAPTIONER PRO</span>
                        <span className="project-title">{file ? file.name : '새 프로젝트'}</span>
                    </div>
                    <div className="header-right">
                        {status === 'completed' && <span className="status-badge">✅ 분석 완료</span>}
                        <button
                            style={{
                                background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                                border: 'none', cursor: 'pointer', fontSize: '12px',
                                padding: '6px 14px', borderRadius: '8px', color: '#fff',
                                fontWeight: 600, display: previewUrl ? 'inline-flex' : 'none',
                                alignItems: 'center', gap: '4px',
                            }}
                            onClick={() => setShowVideoExporter(true)}
                            title="동영상 내보내기"
                        >🎬 내보내기</button>
                        <button
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '4px' }}
                            onClick={() => setShowStats(prev => !prev)}
                            title="자막 통계"
                        >📊</button>
                        <button
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '4px' }}
                            onClick={() => setShowSearch(prev => !prev)}
                            title="검색 (Ctrl+F)"
                        >🔍</button>
                        <ThemeToggle />
                    </div>
                    <input type="file" ref={fileInputRef} hidden onChange={handleFileChange} accept="video/*,audio/*" />
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
                    onAddCaption={handleAddCaption}
                    onMergeCaptions={handleMergeCaptions}
                    onSplitCaption={handleSplitCaption}
                    onToggleInsight={() => setShowInsight(prev => !prev)}
                    showInsight={showInsight}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    canUndo={historyIndex > 0}
                    canRedo={historyIndex < captionHistory.length - 1}
                    onToggleStylePanel={() => setShowStylePanel(prev => !prev)}
                    onDetectSilence={detectSilence}
                    onRemoveSilence={removeSilence}
                    silenceCount={silenceSegments.length}
                    onToggleTts={() => setShowTtsPanel(prev => !prev)}
                    onToggleTemplate={() => setShowTemplateGallery(prev => !prev)}
                    onTranslate={translateCaptions}
                    targetLang={targetLang}
                    setTargetLang={setTargetLang}
                    hasTranslation={!!translatedCaptions}
                    onImportSRT={handleImportSRT}
                    onIdentifySpeakers={identifySpeakersHandler}
                    hasSpeakers={speakers.length > 0}
                />

                <main className="main-layout">
                    {speakers.length > 0 && <SpeakerLegend speakers={speakers} />}
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
                        subtitleStyle={subtitleStyle}
                        overlayImage={overlayImage}
                        onChangeOverlayImage={setOverlayImage}
                        onRemoveOverlayImage={() => setOverlayImage(null)}
                        onUpdateCaption={updateCaption}
                        subtitlePos={subtitlePos}
                        onSubtitlePosChange={setSubtitlePos}
                    />

                    <WordChipEditor
                        captions={captions}
                        currentTime={currentTime}
                        syncOffset={syncOffset}
                        onSeek={seekTo}
                        onUpdateCaption={updateCaption}
                        onDeleteCaption={deleteCaption}
                        onMergeCaptions={handleMergeCaptions}
                        onSplitCaption={handleSplitCaption}
                        status={status}
                        isPlaying={isPlaying}
                    />

                    <AiInsightPanel
                        analysis={aiAnalysis}
                        onSeek={seekTo}
                        isVisible={showInsight}
                        onToggle={() => setShowInsight(prev => !prev)}
                    />

                    <SubtitleStylePanel
                        style={subtitleStyle}
                        onStyleChange={setSubtitleStyle}
                        isVisible={showStylePanel}
                        onClose={() => setShowStylePanel(false)}
                    />

                    <TtsPanel
                        isVisible={showTtsPanel}
                        onClose={() => setShowTtsPanel(false)}
                        captions={captions}
                        currentCaption={currentCaption}
                    />

                    <TemplateGallery
                        isVisible={showTemplateGallery}
                        onClose={() => setShowTemplateGallery(false)}
                        onApplyTemplate={applyTemplate}
                    />

                    <SubtitleSearch
                        isVisible={showSearch}
                        onClose={() => setShowSearch(false)}
                        captions={captions}
                        onUpdateCaption={updateCaption}
                        onSeek={seekTo}
                        syncOffset={syncOffset}
                    />

                    <SubtitleStats
                        captions={captions}
                        duration={duration}
                        isVisible={showStats}
                        syncOffset={syncOffset}
                        onClose={() => setShowStats(false)}
                    />
                </main>

                <Timeline
                    currentTime={currentTime}
                    duration={duration}
                    zoomLevel={zoomLevel}
                    setZoomLevel={setZoomLevel}
                    videoRef={videoRef}
                    captions={captions}
                    waveform={waveform}
                    togglePlay={togglePlay}
                    formatTime={formatTime}
                    onSeek={seekTo}
                    syncOffset={syncOffset}
                    silenceSegments={silenceSegments}
                    isPlaying={isPlaying}
                    onUpdateCaptionTiming={updateCaptionTiming}
                />

                <AnimatePresence>
                    <ProgressOverlay status={status} progress={progress} />
                </AnimatePresence>

                <Toast toasts={toasts} onRemove={removeToast} />

                <ShortcutGuide
                    isVisible={showShortcutGuide}
                    onClose={() => setShowShortcutGuide(false)}
                />

                <VideoExporter
                    isVisible={showVideoExporter}
                    onClose={() => setShowVideoExporter(false)}
                    previewUrl={previewUrl}
                    captions={captions}
                    syncOffset={syncOffset}
                    subtitleStyle={subtitleStyle}
                    overlayImage={overlayImage}
                    duration={duration}
                />
            </div>
        </DropZone>
    );
};

export default App;
