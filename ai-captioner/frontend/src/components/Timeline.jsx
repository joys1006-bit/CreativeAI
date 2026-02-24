import React, { useRef, useEffect, useMemo } from 'react';

/**
 * 타임라인 컴포넌트
 * - Canvas 기반 실제 waveform 렌더링 (파형은 데이터 변경 시에만 렌더)
 * - 별도 playhead Canvas (고빈도 업데이트)
 * - 타임라인 ruler
 * - FIX: waveform Canvas를 currentTime에서 분리하여 성능 최적화
 */
const Timeline = ({ currentTime, duration, zoomLevel, setZoomLevel, captions, waveform, togglePlay, formatTime, onSeek, syncOffset = 0 }) => {
    const waveformCanvasRef = useRef(null);
    const playheadCanvasRef = useRef(null);
    const rulerCanvasRef = useRef(null);
    const trackWidth = useMemo(() => Math.max(duration * zoomLevel, 200), [duration, zoomLevel]);

    // 파형 Canvas 렌더링 — 데이터 변경 시에만 (currentTime 제외!)
    useEffect(() => {
        const canvas = waveformCanvasRef.current;
        if (!canvas || !waveform || waveform.length === 0) return;

        const ctx = canvas.getContext('2d');
        const w = trackWidth;
        const h = 60;
        canvas.width = w;
        canvas.height = h;

        ctx.clearRect(0, 0, w, h);

        const gradient = ctx.createLinearGradient(0, h, 0, 0);
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.6)');
        gradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.4)');
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0.1)');

        ctx.fillStyle = gradient;

        const barWidth = Math.max(1, w / waveform.length);
        for (let i = 0; i < waveform.length; i++) {
            const amplitude = waveform[i] * h;
            const x = i * barWidth;
            ctx.fillRect(x, h - amplitude, barWidth - 0.5, amplitude);
        }
    }, [waveform, trackWidth]); // FIX: currentTime 제거!

    // Playhead 오버레이 — 고빈도 업데이트 (별도 Canvas)
    useEffect(() => {
        const canvas = playheadCanvasRef.current;
        if (!canvas || !duration) return;

        const ctx = canvas.getContext('2d');
        const w = trackWidth;
        const h = 60;
        canvas.width = w;
        canvas.height = h;

        ctx.clearRect(0, 0, w, h);

        // 재생 위치까지 반투명 하이라이트
        const playX = (currentTime / duration) * w;
        if (playX > 0 && playX < w) {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
            ctx.fillRect(0, 0, playX, h);
        }
    }, [currentTime, duration, trackWidth]);

    // Ruler Canvas 렌더링
    useEffect(() => {
        const canvas = rulerCanvasRef.current;
        if (!canvas || !duration) return;

        const ctx = canvas.getContext('2d');
        const w = trackWidth;
        const h = 24;
        canvas.width = w;
        canvas.height = h;

        ctx.clearRect(0, 0, w, h);

        const interval = zoomLevel >= 50 ? 5 : zoomLevel >= 20 ? 10 : 30;
        for (let t = 0; t <= duration; t += interval) {
            const x = t * zoomLevel;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(x, h - 12, 1, 12);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = '10px Inter, sans-serif';
            const min = String(Math.floor(t / 60)).padStart(2, '0');
            const sec = String(Math.floor(t % 60)).padStart(2, '0');
            ctx.fillText(`${min}:${sec}`, x + 3, h - 14);
        }

        const subInterval = interval / 5;
        for (let t = 0; t <= duration; t += subInterval) {
            const x = t * zoomLevel;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fillRect(x, h - 5, 1, 5);
        }
    }, [duration, zoomLevel, trackWidth]);

    // 타임라인 클릭으로 재생 위치 변경
    const handleTrackClick = (e) => {
        if (!onSeek || !duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left + e.currentTarget.scrollLeft;
        const time = x / zoomLevel;
        if (time >= 0 && time <= duration) {
            onSeek(time);
        }
    };

    return (
        <div className="timeline-container">
            <div className="timeline-controls">
                <div className="playback-info">
                    <button className="icon-btn" onClick={togglePlay}>⏯</button>
                    <span className="current-time">{formatTime(currentTime)}</span>
                    <span className="duration-separator">/</span>
                    <span className="total-duration">{formatTime(duration)}</span>
                </div>
                <div className="zoom-control">
                    <span>🔍</span>
                    <input
                        type="range" min="10" max="200"
                        value={zoomLevel}
                        onChange={(e) => setZoomLevel(parseInt(e.target.value))}
                    />
                    <span className="zoom-value">{zoomLevel}%</span>
                </div>
            </div>

            <div className="timeline-tracks-wrapper" onClick={handleTrackClick}>
                {/* Ruler */}
                <canvas
                    ref={rulerCanvasRef}
                    className="timeline-ruler-canvas"
                    style={{ width: `${trackWidth}px`, height: '24px' }}
                />

                <div
                    className="tracks-container"
                    style={{ width: `${trackWidth}px` }}
                >
                    {/* Waveform (정적) */}
                    <canvas
                        ref={waveformCanvasRef}
                        className="waveform-canvas"
                        style={{ width: `${trackWidth}px`, height: '60px', position: 'absolute', top: 0 }}
                    />
                    {/* Playhead 오버레이 (동적) */}
                    <canvas
                        ref={playheadCanvasRef}
                        className="waveform-canvas"
                        style={{ width: `${trackWidth}px`, height: '60px', position: 'absolute', top: 0, pointerEvents: 'none' }}
                    />

                    {/* Playhead 라인 */}
                    <div
                        className="playhead"
                        style={{ left: `${currentTime * zoomLevel}px` }}
                    />

                    {/* Caption Clips */}
                    <div className="caption-track" style={{ marginTop: '64px' }}>
                        {captions.map((cap, idx) => {
                            const start = cap.start + syncOffset;
                            const end = cap.end + syncOffset;
                            const isActive = currentTime >= start && currentTime <= end;
                            return (
                                <div
                                    key={cap.id || idx}
                                    className={`caption-clip ${isActive ? 'clip-active' : ''}`}
                                    style={{
                                        left: `${start * zoomLevel}px`,
                                        width: `${Math.max((end - start) * zoomLevel, 4)}px`
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (onSeek) onSeek(start);
                                    }}
                                    title={cap.text}
                                >
                                    {cap.text}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Timeline;
