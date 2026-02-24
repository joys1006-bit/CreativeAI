import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * 비디오 스테이지 컴포넌트
 * - 재생/일시정지 오버레이 애니메이션
 * - 자막 오버레이 트랜지션
 * - FIX: onPlay/onPause/onEnded 이벤트로 상태 동기화
 * - FIX: timeoutRef 메모리 릭 방지
 */
const VideoStage = ({ videoRef, previewUrl, currentCaption, togglePlay, handleTimeUpdate, handleLoadedMetadata, handlePlay, handlePause, handleEnded, isPlaying }) => {
    const [showPlayIcon, setShowPlayIcon] = React.useState(false);
    const timeoutRef = React.useRef(null);

    // FIX: 컴포넌트 언마운트 시 timeout 정리
    React.useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    const handleClick = () => {
        togglePlay();
        setShowPlayIcon(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setShowPlayIcon(false), 600);
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
                    {/* 재생/일시정지 오버레이 */}
                    <AnimatePresence>
                        {showPlayIcon && (
                            <motion.div
                                className="play-overlay"
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.5 }}
                                transition={{ duration: 0.4 }}
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
                            >
                                {currentCaption.text}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="stage-empty">
                    <motion.div
                        className="empty-icon"
                        animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.5, 0.3] }}
                        transition={{ repeat: Infinity, duration: 3 }}
                    >
                        🎬
                    </motion.div>
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
