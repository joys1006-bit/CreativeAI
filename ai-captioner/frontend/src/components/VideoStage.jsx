import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * 비디오 스테이지 컴포넌트
 * - subtitleStyle prop으로 자막 스타일 적용
 * - 재생/일시정지 오버레이 + 자막 트랜지션
 * - 배경 이미지 오버레이 기능 (동영상 위에 이미지 교체)
 */
const VideoStage = ({
    videoRef, previewUrl, currentCaption,
    togglePlay, handleTimeUpdate, handleLoadedMetadata,
    handlePlay, handlePause, handleEnded,
    isPlaying, subtitleStyle = {},
    overlayImage, onChangeOverlayImage, onRemoveOverlayImage,
}) => {
    const [showPlayIcon, setShowPlayIcon] = React.useState(false);
    const [showControls, setShowControls] = React.useState(false);
    const timeoutRef = React.useRef(null);
    const controlsTimeoutRef = React.useRef(null);

    React.useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        };
    }, []);

    const handleClick = () => {
        togglePlay();
        setShowPlayIcon(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setShowPlayIcon(false), 600);
    };

    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    };

    const getSubtitlePosition = () => {
        switch (subtitleStyle.position) {
            case 'top': return { top: '10%', bottom: 'auto' };
            case 'center': return { top: '50%', bottom: 'auto', transform: 'translate(-50%, -50%)' };
            default: return { bottom: '10%', top: 'auto' };
        }
    };

    /* ── 이미지 교체 핸들러 ── */
    const handleImageUpload = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const url = URL.createObjectURL(file);
                onChangeOverlayImage?.(url);
            }
        };
        input.click();
    };

    /* ── 인라인 스타일 ── */
    const S = {
        imageOverlay: {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 1,
            pointerEvents: 'none',
        },
        imageControls: {
            position: 'absolute',
            top: '12px',
            right: '12px',
            zIndex: 10,
            display: 'flex',
            gap: '8px',
            opacity: showControls ? 1 : 0,
            transition: 'opacity 0.3s ease',
        },
        controlBtn: {
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '8px 14px',
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '10px',
            color: '#fff',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
        },
        addImageBtn: {
            position: 'absolute',
            top: '12px',
            right: '12px',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '8px 14px',
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px',
            color: 'rgba(255,255,255,0.7)',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            opacity: showControls ? 1 : 0,
        },
    };

    return (
        <div className="stage-container">
            {previewUrl ? (
                <div
                    className="video-player-frame"
                    onMouseMove={handleMouseMove}
                    onMouseEnter={() => setShowControls(true)}
                    onMouseLeave={() => setShowControls(false)}
                    style={{ position: 'relative' }}
                >
                    {/* 원본 비디오 (오디오 소스) */}
                    <video
                        ref={videoRef}
                        src={previewUrl}
                        className="main-video"
                        onClick={handleClick}
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                        onPlay={handlePlay}
                        onPause={handlePause}
                        onEnded={handleEnded}
                        style={overlayImage ? { visibility: 'hidden' } : {}}
                    />

                    {/* 이미지 오버레이 (교체된 이미지) */}
                    {overlayImage && (
                        <img
                            src={overlayImage}
                            alt="오버레이 이미지"
                            style={S.imageOverlay}
                            onClick={handleClick}
                        />
                    )}

                    {/* 이미지 컨트롤 (호버 시 표시) */}
                    {overlayImage ? (
                        <div style={S.imageControls}>
                            <button
                                style={S.controlBtn}
                                onClick={handleImageUpload}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(139,92,246,0.6)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.7)'; }}
                            >
                                🖼️ 이미지 변경
                            </button>
                            <button
                                style={{ ...S.controlBtn, color: '#f87171' }}
                                onClick={onRemoveOverlayImage}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.4)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.7)'; }}
                            >
                                ✕ 원본 복원
                            </button>
                        </div>
                    ) : (
                        <button
                            style={S.addImageBtn}
                            onClick={handleImageUpload}
                            onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'rgba(139,92,246,0.5)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.opacity = showControls ? '1' : '0'; e.currentTarget.style.background = 'rgba(0,0,0,0.5)'; }}
                        >
                            🖼️ 이미지 교체
                        </button>
                    )}

                    {/* 재생/일시정지 오버레이 */}
                    <AnimatePresence>
                        {showPlayIcon && (
                            <motion.div className="play-overlay"
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.5 }}
                                transition={{ duration: 0.4 }}
                                style={{ zIndex: 5 }}
                            >
                                <span className="play-overlay-icon">{isPlaying ? '▶' : '⏸'}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* 자막 오버레이 */}
                    <AnimatePresence mode="wait">
                        {currentCaption && (
                            <motion.div
                                className="subtitle-overlay"
                                key={currentCaption.id || currentCaption.text}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                style={{
                                    zIndex: 6,
                                    fontFamily: subtitleStyle.fontFamily || "'Pretendard', sans-serif",
                                    fontSize: `${subtitleStyle.fontSize || 24}px`,
                                    color: subtitleStyle.color || '#FFFFFF',
                                    background: subtitleStyle.bgColor || 'rgba(0,0,0,0.6)',
                                    fontWeight: subtitleStyle.bold ? 700 : 400,
                                    fontStyle: subtitleStyle.italic ? 'italic' : 'normal',
                                    textShadow: subtitleStyle.shadow ? '2px 2px 4px rgba(0,0,0,0.8)' : 'none',
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    maxWidth: '80%',
                                    width: 'auto',
                                    textAlign: 'center',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    whiteSpace: 'normal',
                                    wordBreak: 'keep-all',
                                    ...getSubtitlePosition(),
                                }}
                            >
                                {currentCaption.text}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="stage-empty">
                    <motion.div className="empty-icon"
                        animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.5, 0.3] }}
                        transition={{ repeat: Infinity, duration: 3 }}
                    >🎬</motion.div>
                    <p>작업할 영상을 불러와주세요</p>
                    <button className="btn-primary" onClick={() => document.querySelector('input[type="file"]').click()}>
                        영상 파일 선택
                    </button>
                </div>
            )}
        </div>
    );
};

export default VideoStage;
