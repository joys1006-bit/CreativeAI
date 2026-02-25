import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * 비디오 스테이지 컴포넌트
 * - subtitleStyle prop으로 자막 스타일 적용
 * - 재생/일시정지 오버레이 + 자막 트랜지션
 * - 배경 이미지 오버레이 기능
 * - ★ 화면 자막 클릭 시 인라인 편집
 */
const VideoStage = ({
    videoRef, previewUrl, currentCaption,
    togglePlay, handleTimeUpdate, handleLoadedMetadata,
    handlePlay, handlePause, handleEnded,
    isPlaying, subtitleStyle = {},
    overlayImage, onChangeOverlayImage, onRemoveOverlayImage,
    onUpdateCaption,
}) => {
    const [showPlayIcon, setShowPlayIcon] = useState(false);
    const [showControls, setShowControls] = useState(false);
    const [isEditingSubtitle, setIsEditingSubtitle] = useState(false);
    const [editText, setEditText] = useState('');
    const editInputRef = useRef(null);
    const timeoutRef = useRef(null);
    const controlsTimeoutRef = useRef(null);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        };
    }, []);

    // 자막 변경 시 편집 상태 초기화
    useEffect(() => {
        if (isEditingSubtitle && currentCaption) {
            // 자막이 바뀌면 편집 종료
            setIsEditingSubtitle(false);
        }
    }, [currentCaption?.id]);

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

    /* ── 자막 더블클릭 편집 ── */
    const handleSubtitleDoubleClick = (e) => {
        e.stopPropagation();
        if (!currentCaption || !onUpdateCaption) return;
        // 재생 중이면 일시정지
        if (isPlaying && videoRef?.current) {
            videoRef.current.pause();
        }
        setEditText(currentCaption.text);
        setIsEditingSubtitle(true);
        setTimeout(() => editInputRef.current?.focus(), 50);
    };

    const handleSubtitleEditDone = () => {
        if (currentCaption && editText !== currentCaption.text) {
            onUpdateCaption(currentCaption.id, editText);
        }
        setIsEditingSubtitle(false);
    };

    const handleSubtitleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubtitleEditDone();
        }
        if (e.key === 'Escape') {
            setIsEditingSubtitle(false);
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
            top: 0, left: 0, width: '100%', height: '100%',
            objectFit: 'cover', zIndex: 1, pointerEvents: 'none',
        },
        imageControls: {
            position: 'absolute', top: '12px', right: '12px', zIndex: 10,
            display: 'flex', gap: '8px',
            opacity: showControls ? 1 : 0, transition: 'opacity 0.3s ease',
        },
        controlBtn: {
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '8px 14px', background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '10px', color: '#fff', fontSize: '12px',
            fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s ease',
        },
        addImageBtn: {
            position: 'absolute', top: '12px', right: '12px', zIndex: 10,
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '8px 14px', background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px', color: 'rgba(255,255,255,0.7)', fontSize: '12px',
            fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s ease',
            opacity: showControls ? 1 : 0,
        },
        subtitleBase: {
            position: 'absolute',
            zIndex: 6,
            fontFamily: subtitleStyle.fontFamily || "'Pretendard', sans-serif",
            fontSize: `${subtitleStyle.fontSize || 24}px`,
            color: subtitleStyle.color || '#FFFFFF',
            background: subtitleStyle.bgColor || 'rgba(0,0,0,0.6)',
            fontWeight: subtitleStyle.bold ? 700 : 400,
            fontStyle: subtitleStyle.italic ? 'italic' : 'normal',
            textShadow: subtitleStyle.shadow ? '2px 2px 4px rgba(0,0,0,0.8)' : 'none',
            padding: '8px 16px', borderRadius: '6px',
            maxWidth: '80%', width: 'auto', textAlign: 'center',
            left: '50%', transform: 'translateX(-50%)',
            whiteSpace: 'normal', wordBreak: 'keep-all',
            cursor: 'pointer',
            ...getSubtitlePosition(),
        },
        editInput: {
            background: 'rgba(0,0,0,0.8)',
            color: '#fff',
            border: '2px solid #a78bfa',
            borderRadius: '8px',
            fontSize: `${subtitleStyle.fontSize || 24}px`,
            fontFamily: subtitleStyle.fontFamily || "'Pretendard', sans-serif",
            fontWeight: subtitleStyle.bold ? 700 : 400,
            padding: '10px 16px',
            textAlign: 'center',
            outline: 'none',
            width: '80%',
            maxWidth: '600px',
            resize: 'none',
            zIndex: 20,
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            ...getSubtitlePosition(),
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

                    {/* 이미지 오버레이 */}
                    {overlayImage && (
                        <img src={overlayImage} alt="오버레이" style={S.imageOverlay} onClick={handleClick} />
                    )}

                    {/* 이미지 컨트롤 */}
                    {overlayImage ? (
                        <div style={S.imageControls}>
                            <button style={S.controlBtn} onClick={handleImageUpload}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.6)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.7)'}
                            >🖼️ 이미지 변경</button>
                            <button style={{ ...S.controlBtn, color: '#f87171' }} onClick={onRemoveOverlayImage}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.4)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.7)'}
                            >✕ 원본 복원</button>
                        </div>
                    ) : (
                        <button style={S.addImageBtn} onClick={handleImageUpload}
                            onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'rgba(139,92,246,0.5)'; }}
                            onMouseLeave={e => { e.currentTarget.style.opacity = showControls ? '1' : '0'; e.currentTarget.style.background = 'rgba(0,0,0,0.5)'; }}
                        >🖼️ 이미지 교체</button>
                    )}

                    {/* 재생/일시정지 오버레이 */}
                    <AnimatePresence>
                        {showPlayIcon && (
                            <motion.div className="play-overlay"
                                initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.5 }} transition={{ duration: 0.4 }}
                                style={{ zIndex: 5 }}
                            >
                                <span className="play-overlay-icon">{isPlaying ? '▶' : '⏸'}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ★ 자막 인라인 편집 */}
                    {isEditingSubtitle && currentCaption ? (
                        <textarea
                            ref={editInputRef}
                            style={S.editInput}
                            value={editText}
                            onChange={e => setEditText(e.target.value)}
                            onBlur={handleSubtitleEditDone}
                            onKeyDown={handleSubtitleKeyDown}
                            rows={2}
                        />
                    ) : (
                        /* 자막 오버레이 (더블클릭으로 편집 진입) */
                        <AnimatePresence mode="wait">
                            {currentCaption && (
                                <motion.div
                                    className="subtitle-overlay"
                                    key={currentCaption.id || currentCaption.text}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    style={{ ...S.subtitleBase }}
                                    onDoubleClick={handleSubtitleDoubleClick}
                                    title="더블클릭하여 자막 편집"
                                >
                                    {currentCaption.text}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}
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
