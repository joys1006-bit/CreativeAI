import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import './App.css';

const App = () => {
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('idle'); // idle, uploading, processing, completed
    const [progress, setProgress] = useState(0);
    const [captions, setCaptions] = useState([]);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [jobId, setJobId] = useState(null);
    const fileInputRef = useRef(null);
    const videoRef = useRef(null);

    const [captionStyle, setCaptionStyle] = useState({
        fontSize: 24,
        color: '#ffffff',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderRadius: 8,
        padding: 12,
        marginBottom: 40
    });

    const [targetLanguage, setTargetLanguage] = useState('ko');
    const [projectLibrary, setProjectLibrary] = useState([]);

    // Load library on start
    useEffect(() => {
        const saved = localStorage.getItem('ai_captioner_projects');
        if (saved) setProjectLibrary(JSON.parse(saved));
    }, []);

    const saveToLibrary = (data) => {
        const newProject = {
            id: Date.now(),
            date: new Date().toLocaleString(),
            fileName: file?.name || 'Unknown',
            ...data
        };
        const updated = [newProject, ...projectLibrary].slice(0, 10); // Keep last 10
        setProjectLibrary(updated);
        localStorage.setItem('ai_captioner_projects', JSON.stringify(updated));
    };

    const loadFromLibrary = (project) => {
        setCaptions(project.segments);
        setAiAnalysis({
            summary: project.summary,
            keywords: project.keywords,
            sentiment: project.sentiment
        });
        setWaveform(project.waveform || []);
        setStatus('completed');
    };

    const handleStyleChange = (e) => {
        const { name, value } = e.target;
        setCaptionStyle(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const resetProject = () => {
        setFile(null);
        setPreviewUrl(null);
        setStatus('idle');
        setProgress(0);
        setCaptions([]);
        setJobId(null);
        setAiAnalysis(null);
        setWaveform([]);
        // Clear file input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            resetProject(); // Clear previous state first
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
        }
    };

    // Environment detection
    const isElectron = window.electron !== undefined;

    const handleUpload = async () => {
        if (!file) return;

        if (isElectron) {
            // --- ELECTRON MODE ---
            setStatus('processing');
            setProgress(0);
            try {
                window.electron.onProgress((data) => {
                    if (data.status === 'extracting') setProgress(10);
                    else if (data.status === 'analyzing') setProgress(40);
                    else if (data.status === 'completed') setProgress(100);
                });

                const result = await window.electron.processVideo(file.path);

                if (result.status === 'COMPLETED') {
                    setCaptions(result.segments);
                    const analysis = {
                        summary: result.summary,
                        keywords: result.keywords,
                        sentiment: result.sentiment || "분석 완료"
                    };
                    setAiAnalysis(analysis);
                    setWaveform(result.waveform || []);
                    setStatus('completed');
                    saveToLibrary({
                        segments: result.segments,
                        ...analysis,
                        waveform: result.waveform
                    });
                } else {
                    throw new Error(result.error || "Unknown error");
                }
            } catch (error) {
                console.error(error);
                alert(`앱 처리 중 오류: ${error.message}`);
                setStatus('idle');
                setJobId(null); // Allow retry
            }
        } else {
            // --- WEB MODE ---
            setStatus('uploading');
            const formData = new FormData();
            formData.append('file', file);
            formData.append('language', targetLanguage); // Pass language to backend

            try {
                const res = await axios.post('http://localhost:8000/upload', formData, {
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setProgress(percentCompleted);
                    },
                });

                setJobId(res.data.jobId);
                setStatus('processing');
            } catch (error) {
                console.error(error);
                alert("웹 업로드 중 오류가 발생했습니다. 백엔드 서버가 켜져 있는지 확인해주세요.");
                setStatus('idle');
                setJobId(null); // Allow retry
            }
        }
    };

    const [aiAnalysis, setAiAnalysis] = useState(null); // { summary, keywords }
    const [waveform, setWaveform] = useState([]);
    const canvasRef = useRef(null);

    // Polling logic (Web Mode Only)
    useEffect(() => {
        let timer;
        if (!isElectron && status === 'processing' && jobId) {
            timer = setInterval(async () => {
                try {
                    const res = await axios.get(`http://localhost:8000/status/${jobId}`);
                    if (res.data.status === 'COMPLETED') {
                        setCaptions(res.data.segments);
                        const analysis = {
                            summary: res.data.summary,
                            keywords: res.data.keywords,
                            sentiment: res.data.sentiment || "분석 완료"
                        };
                        setAiAnalysis(analysis);
                        setWaveform(res.data.waveform || []);
                        setStatus('completed');
                        saveToLibrary({
                            segments: res.data.segments,
                            ...analysis,
                            waveform: res.data.waveform
                        });
                        clearInterval(timer);
                    } else if (res.data.status === 'FAILED') {
                        alert("자막 생성에 실패했습니다. (Backend Error)");
                        setStatus('idle');
                        setJobId(null); // Allow retry
                        clearInterval(timer);
                    }
                } catch (e) {
                    console.error("Polling error:", e);
                    // Don't alert on every polling error, but maybe track consecutive failures?
                }
            }, 2000);
        }
        return () => clearInterval(timer);
    }, [status, jobId, isElectron]);


    const [zoomLevel, setZoomLevel] = useState(100);
    const [duration, setDuration] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const timelineRef = useRef(null);
    const [dragTarget, setDragTarget] = useState(null); // { index, type: 'start'|'end'|'move', startX, initialStart, initialEnd }

    const formatTime = (seconds) => {
        const date = new Date(seconds * 1000);
        const mm = date.getUTCMinutes().toString().padStart(2, '0');
        const ss = date.getUTCSeconds().toString().padStart(2, '0');
        const ms = date.getUTCMilliseconds().toString().padStart(3, '0');
        return `${mm}:${ss},${ms}`;
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    };

    // High-frequency time tracking for smoother captions
    useEffect(() => {
        let animationFrameId;

        const loop = () => {
            if (videoRef.current && !videoRef.current.paused && !isDragging) {
                setCurrentTime(videoRef.current.currentTime);
            }
            animationFrameId = requestAnimationFrame(loop);
        };

        loop();

        return () => cancelAnimationFrame(animationFrameId);
    }, [isDragging]); // Re-run when dragging state changes

    const handleTimeUpdate = () => {
        // Backup update (optional, or removed since rAF handles it)
        // if (videoRef.current && !isDragging) setCurrentTime(videoRef.current.currentTime);
    };

    const seekTo = (time) => {
        if (videoRef.current) {
            videoRef.current.currentTime = Math.max(0, Math.min(time, duration));
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    const handleTimelineClick = (e) => {
        // Prevent seeking if clicking on a block (handled by stopPropagation in block, but good to be safe)
        if (isDragging) return;

        const rect = timelineRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left + timelineRef.current.scrollLeft;
        const clickTime = x / zoomLevel;
        seekTo(clickTime);
    };

    const handleCaptionDragStart = (e, index, type) => {
        e.stopPropagation();
        setIsDragging(true);
        setDragTarget({
            index,
            type,
            startX: e.clientX,
            initialStart: captions[index].start,
            initialEnd: captions[index].end
        });
    };

    // Dragging Logic (Global mouse move/up)
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging || !dragTarget) return;

            const deltaX = e.clientX - dragTarget.startX;
            const deltaTime = deltaX / zoomLevel;
            const newCaptions = [...captions];
            const targetCap = newCaptions[dragTarget.index];

            if (dragTarget.type === 'move') {
                const duration = targetCap.end - targetCap.start;
                targetCap.start = Math.max(0, dragTarget.initialStart + deltaTime);
                targetCap.end = targetCap.start + duration;
            } else if (dragTarget.type === 'start') {
                targetCap.start = Math.min(targetCap.end - 0.1, Math.max(0, dragTarget.initialStart + deltaTime));
            } else if (dragTarget.type === 'end') {
                targetCap.end = Math.max(targetCap.start + 0.1, dragTarget.initialEnd + deltaTime);
            }

            setCaptions(newCaptions);
        };

        const handleMouseUp = () => {
            if (isDragging) {
                setIsDragging(false);
                setDragTarget(null);
            }
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragTarget, captions, zoomLevel]);

    const downloadSRT = () => {
        let content = '';
        captions.forEach((cap, i) => {
            content += `${i + 1}\n`;
            content += `${formatTime(cap.start).replace('.', ',')} --> ${formatTime(cap.end).replace('.', ',')}\n`;
            content += `${cap.text}\n\n`;
        });

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'captions.srt';
        a.click();
    };

    // Derived state for current caption
    const currentCaption = captions.find(c => currentTime >= c.start && currentTime <= c.end);

    // Resume component rendering
    const [activeTab, setActiveTab] = useState('list');

    // Waveform Drawing Logic
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || waveform.length === 0) return;

        const ctx = canvas.getContext('2d');
        const width = duration * zoomLevel;
        const height = canvas.clientHeight;

        // Canvas resolution adjustment for sharpness
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = 'rgba(100, 200, 255, 0.3)';

        const samplesPerSec = 20; // Must match backend
        const pixelPerSample = zoomLevel / samplesPerSec;

        ctx.beginPath();
        ctx.moveTo(0, height / 2);

        waveform.forEach((amp, i) => {
            const x = i * pixelPerSample;
            const y = height / 2;
            const barHeight = amp * height * 0.8; // 80% height capability

            // Draw mirrored waveform
            ctx.fillRect(x, y - barHeight / 2, Math.max(1, pixelPerSample - 1), barHeight);
        });
    }, [waveform, zoomLevel, duration]);

    return (
        <div className="app-container">
            {/* 1. Header Area */}
            <header className="app-header">
                <div className="logo">AI Captioner Pro</div>
                <div className="header-actions">
                    <button className="secondary" onClick={resetProject}>
                        🔙 새 프로젝트
                    </button>
                    {status === 'idle' && !jobId && file && (
                        <button className="primary" onClick={handleUpload}>
                            ▶ 분석 시작
                        </button>
                    )}
                </div>
            </header>

            {/* 2. Main Content Area (Player + Sidebar) */}
            <main className="main-content">
                {/* 2.1 Video Player Area */}
                <div className="player-area">
                    {!previewUrl ? (
                        <div
                            className="upload-placeholder"
                            onClick={() => fileInputRef.current.click()}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={handleFileChange}
                                accept="video/*"
                            />
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📂</div>
                            <h3>비디오 업로드</h3>
                            <p>여기를 클릭하여 분석할 영상을 선택하세요</p>
                            {status === 'uploading' && (
                                <div style={{ marginTop: '20px', width: '200px' }}>
                                    <div className="progress-bar">
                                        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                                    </div>
                                    <p style={{ textAlign: 'center', marginTop: '8px' }}>업로드 중... {progress}%</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="video-wrapper">
                            {status === 'processing' && (
                                <div style={{
                                    position: 'absolute', inset: 0, zIndex: 10,
                                    background: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <div className="loading-spinner"></div>
                                    <p style={{ marginTop: '16px' }}>AI 분석 중... {progress}%</p>
                                </div>
                            )}
                            <video
                                ref={videoRef}
                                src={previewUrl}
                                controls
                                className="preview-video"
                                onTimeUpdate={handleTimeUpdate}
                                onLoadedMetadata={handleLoadedMetadata}
                            />
                            {currentCaption && (
                                <motion.div
                                    className="caption-overlay"
                                    key={currentCaption.text}
                                    style={{
                                        fontSize: `${captionStyle.fontSize}px`,
                                        color: captionStyle.color,
                                        backgroundColor: captionStyle.backgroundColor,
                                        borderRadius: `${captionStyle.borderRadius}px`,
                                        padding: `${captionStyle.padding}px`,
                                        bottom: `${captionStyle.marginBottom}px`
                                    }}
                                >
                                    {currentCaption.text}
                                </motion.div>
                            )}
                        </div>
                    )}
                </div>

                {/* 2.2 Sidebar Area */}
                <aside className="sidebar">
                    <div className="sidebar-tabs">
                        <button className={`tab-btn ${activeTab === 'analysis' ? 'active' : ''}`} onClick={() => setActiveTab('analysis')}>📊 분석</button>
                        <button className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}>📝 자막</button>
                        <button className={`tab-btn ${activeTab === 'style' ? 'active' : ''}`} onClick={() => setActiveTab('style')}>🎨 스타일</button>
                    </div>

                    <div className="sidebar-panel">
                        {activeTab === 'analysis' && (
                            <div className="sidebar-scroll">
                                {aiAnalysis ? (
                                    <>
                                        <div className="ai-card">
                                            <h4>🤖 AI 요약</h4>
                                            <p style={{ lineHeight: '1.6', fontSize: '14px', color: '#ddd' }}>{aiAnalysis.summary}</p>
                                        </div>
                                        <div className="ai-card">
                                            <h4>🎭 감성 분석</h4>
                                            <p style={{ color: 'var(--accent)', fontWeight: 'bold' }}>{aiAnalysis.sentiment}</p>
                                        </div>
                                        <div className="ai-card">
                                            <h4>🏷️ 키워드</h4>
                                            <div className="keyword-chips">
                                                {aiAnalysis.keywords.map((k, i) => (
                                                    <span key={i} className="chip">#{k}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div>
                                        <h4 style={{ marginBottom: '16px' }}>📽️ 최근 프로젝트</h4>
                                        {projectLibrary.length > 0 ? (
                                            <div className="library-list">
                                                {projectLibrary.map((proj) => (
                                                    <div key={proj.id} className="caption-item" onClick={() => loadFromLibrary(proj)}>
                                                        <div className="timestamp">{proj.date}</div>
                                                        <div style={{ fontWeight: 'bold', marginTop: '4px' }}>{proj.fileName}</div>
                                                        <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{proj.keywords.slice(0, 3).join(', ')}...</div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p style={{ color: '#666', textAlign: 'center', marginTop: '40px' }}>
                                                영상을 분석하면<br />비즈니스 인사이트가 표시됩니다.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'list' && (
                            <div>
                                <button className="secondary" style={{ width: '100%', marginBottom: '16px' }} onClick={downloadSRT}>
                                    📥 SRT 다운로드
                                </button>
                                <div className="caption-items small">
                                    {captions.map((cap, i) => (
                                        <div
                                            key={i}
                                            className={`caption-item ${currentTime >= cap.start && currentTime <= cap.end ? 'active' : ''}`}
                                            onClick={() => seekTo(cap.start)}
                                        >
                                            <span className="timestamp">{formatTime(cap.start).split(',')[0]}</span>
                                            <p>{cap.text}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'style' && (
                            <div className="style-controls">
                                <div className="control-group">
                                    <label>글자 크기 ({captionStyle.fontSize}px)</label>
                                    <input type="range" name="fontSize" min="12" max="60" value={captionStyle.fontSize} onChange={handleStyleChange} />
                                </div>
                                <div className="control-group">
                                    <label>하단 위치 ({captionStyle.marginBottom}px)</label>
                                    <input type="range" name="marginBottom" min="0" max="200" value={captionStyle.marginBottom} onChange={handleStyleChange} />
                                </div>
                                <div className="control-group">
                                    <label>글자 색상</label>
                                    <input type="color" name="color" value={captionStyle.color} onChange={handleStyleChange} />
                                </div>
                            </div>
                        )}
                    </div>
                </aside>
            </main>

            {/* 3. Timeline Area */}
            <section className="timeline-area">
                <div className="timeline-toolbar">
                    <div className="zoom-controls">
                        <button className="secondary" onClick={() => setZoomLevel(z => Math.max(z - 20, 20))}>-</button>
                        <span style={{ margin: '0 10px', fontSize: '12px' }}>ZOOM</span>
                        <button className="secondary" onClick={() => setZoomLevel(z => Math.min(z + 20, 300))}>+</button>
                    </div>
                </div>
                <div className="timeline-scroll-container" ref={timelineRef} onClick={handleTimelineClick}>
                    <div className="timeline-track" style={{ width: `${duration * zoomLevel}px` }}>
                        <canvas
                            ref={canvasRef}
                            className="waveform-canvas"
                            width={duration * zoomLevel} // Explicit width
                            height={200} // Explicit height
                        />
                        <div className="playhead" style={{ left: `${currentTime * zoomLevel}px` }}></div>
                        {captions.map((cap, i) => (
                            <div
                                key={i}
                                className={`timeline-block ${currentTime >= cap.start && currentTime <= cap.end ? 'active' : ''}`}
                                style={{
                                    left: `${cap.start * zoomLevel}px`,
                                    width: `${(cap.end - cap.start) * zoomLevel}px`
                                }}
                                onMouseDown={(e) => handleCaptionDragStart(e, i, 'move')}
                            >
                                <div className="block-handle left" onMouseDown={(e) => handleCaptionDragStart(e, i, 'start')}></div>
                                {cap.text}
                                <div className="block-handle right" onMouseDown={(e) => handleCaptionDragStart(e, i, 'end')}></div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default App;
