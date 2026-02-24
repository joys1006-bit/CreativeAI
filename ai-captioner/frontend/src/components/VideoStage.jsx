import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * 비디오 스테이지 컴포넌트
 * - subtitleStyle prop으로 자막 스타일 적용
 * - 재생/일시정지 오버레이 + 자막 트랜지션
 */
const VideoStage = ({ videoRef, previewUrl, currentCaption, togglePlay, handleTimeUpdate, handleLoadedMetadata, handlePlay, handlePause, handleEnded, isPlaying, subtitleStyle = {} }) => {
    const [showPlayIcon, setShowPlayIcon] = React.useState(false);
    const timeoutRef = React.useRef(null);

    React.useEffect(() => {
        return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
    }, []);

    const handleClick = () => {
        togglePlay();
        setShowPlayIcon(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setShowPlayIcon(false), 600);
    };

    const getSubtitlePosition = () => {
        switch (subtitleStyle.position) {
            case 'top': return { top: '10%', bottom: 'auto' };
            case 'center': return { top: '50%', bottom: 'auto', transform: 'translate(-50%, -50%)' };
            default: return { bottom: '10%', top: 'auto' };
        }
    };

    return (
        <div className="stage-container">
            {previewUrl ? (
                <div className="video-player-frame">
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
                    />
                    <AnimatePresence>
                        {showPlayIcon && (
                            <motion.div className="play-overlay"
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.5 }}
                                transition={{ duration: 0.4 }}
                            >
                                <span className="play-overlay-icon">{isPlaying ? '▶' : '⏸'}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

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
                                    fontFamily: subtitleStyle.fontFamily || "'Pretendard', sans-serif",
                                    fontSize: `${subtitleStyle.fontSize || 24}px`,
                                    color: subtitleStyle.color || '#FFFFFF',
                                    background: subtitleStyle.bgColor || 'rgba(0,0,0,0.6)',
                                    fontWeight: subtitleStyle.bold ? 700 : 400,
                                    fontStyle: subtitleStyle.italic ? 'italic' : 'normal',
                                    textShadow: subtitleStyle.shadow ? '2px 2px 4px rgba(0,0,0,0.8)' : 'none',
                                    padding: '8px 16px',
                                    borderRadius: '6px',
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
