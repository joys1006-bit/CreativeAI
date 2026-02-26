import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * 비디오 재생 관련 로직을 관리하는 커스텀 훅
 * 담당: 프론트엔드 개발자 (L4)
 * 설계: 프론트엔드 아키텍트 (L6)
 */
const useVideoPlayer = () => {
    // --- 상태: 재생 ---
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(100);

    // --- Ref ---
    const videoRef = useRef(null);

    // === 재생 제어 ===
    const togglePlay = useCallback(() => {
        if (!videoRef.current) return;
        if (videoRef.current.paused) videoRef.current.play();
        else videoRef.current.pause();
    }, []);

    const seekTo = useCallback((time) => {
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            setCurrentTime(time);
        }
    }, []);

    // === 이벤트 핸들러 ===
    const handlePlay = useCallback(() => setIsPlaying(true), []);
    const handlePause = useCallback(() => setIsPlaying(false), []);
    const handleEnded = useCallback(() => setIsPlaying(false), []);
    const handleTimeUpdate = () => setCurrentTime(videoRef.current?.currentTime || 0);
    const handleLoadedMetadata = () => setDuration(videoRef.current?.duration || 0);

    // === 고빈도 업데이트 루프 (requestAnimationFrame) ===
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

    // === 시간 포맷 유틸 ===
    const formatTime = useCallback((s) => {
        if (!s || isNaN(s)) return '00:00';
        return new Date(s * 1000).toISOString().substr(14, 5);
    }, []);

    return {
        // 상태
        currentTime,
        duration,
        isPlaying,
        zoomLevel,
        setZoomLevel,
        // Ref
        videoRef,
        // 함수
        togglePlay,
        seekTo,
        handlePlay,
        handlePause,
        handleEnded,
        handleTimeUpdate,
        handleLoadedMetadata,
        formatTime,
    };
};

export default useVideoPlayer;
