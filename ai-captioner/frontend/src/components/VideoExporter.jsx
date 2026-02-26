import React, { useState, useRef, useCallback, useEffect } from 'react';

/**
 * VideoExporter — Canvas + MediaRecorder 기반 영상 내보내기
 * - 원본 영상 + 오버레이 이미지 + 자막을 합성하여 WebM/MP4 다운로드
 * - 실시간 프리뷰 + 진행률 표시
 */
const VideoExporter = ({
    isVisible,
    onClose,
    previewUrl,
    captions = [],
    syncOffset = 0,
    subtitleStyle = {},
    overlayImage,
    duration,
}) => {
    const [isExporting, setIsExporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState('');
    const canvasRef = useRef(null);
    const hiddenVideoRef = useRef(null);
    const overlayImgRef = useRef(null);
    const abortRef = useRef(false);

    // 오버레이 이미지 프리로드
    useEffect(() => {
        if (overlayImage) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = overlayImage;
            overlayImgRef.current = img;
        } else {
            overlayImgRef.current = null;
        }
    }, [overlayImage]);

    // 현재 시간에 해당하는 자막 찾기
    const getCaptionAtTime = useCallback((time) => {
        return captions.find(cap => {
            const start = cap.start + syncOffset;
            const end = cap.end + syncOffset;
            return time >= start && time <= end;
        });
    }, [captions, syncOffset]);

    // 자막 그리기
    const drawSubtitle = useCallback((ctx, cap, w, h) => {
        if (!cap) return;

        const fontSize = subtitleStyle.fontSize || 20;
        const fontFamily = subtitleStyle.fontFamily || "'Pretendard', sans-serif";
        const fontWeight = subtitleStyle.bold ? 'bold' : 'normal';
        const fontStyle = subtitleStyle.italic ? 'italic' : 'normal';

        ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';

        const text = cap.text;
        const textMetrics = ctx.measureText(text);
        const textWidth = textMetrics.width;
        const padding = 16;

        // 위치 결정
        let y;
        switch (subtitleStyle.position) {
            case 'top': y = h * 0.15; break;
            case 'center': y = h * 0.55; break;
            default: y = h * 0.9; break;
        }

        // 배경 박스
        const bgColor = subtitleStyle.bgColor || 'rgba(0,0,0,0.6)';
        ctx.fillStyle = bgColor;
        const boxX = (w - textWidth) / 2 - padding;
        const boxY = y - fontSize - padding / 2;
        const boxW = textWidth + padding * 2;
        const boxH = fontSize + padding;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 6);
        ctx.fill();

        // 텍스트 그림자
        if (subtitleStyle.shadow) {
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
        }

        // 텍스트
        ctx.fillStyle = subtitleStyle.color || '#FFFFFF';
        ctx.fillText(text, w / 2, y);

        // 그림자 리셋
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }, [subtitleStyle]);

    // 내보내기 실행
    const handleExport = useCallback(async () => {
        if (!previewUrl) return;

        setIsExporting(true);
        setProgress(0);
        setStatusText('영상 준비 중...');
        abortRef.current = false;

        const canvas = canvasRef.current;
        const video = hiddenVideoRef.current;

        // 비디오 로드 대기
        video.src = previewUrl;
        video.muted = false;
        video.currentTime = 0;

        await new Promise((resolve) => {
            video.onloadeddata = resolve;
        });

        // 원본 영상 비율 유지 (세로→세로, 가로→가로, 찌그러짐 방지)
        const w = video.videoWidth || 1280;
        const h = video.videoHeight || 720;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');

        // MediaRecorder 설정
        const stream = canvas.captureStream(30);

        // 오디오 트랙 추가
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioCtx.createMediaElementSource(video);
            const dest = audioCtx.createMediaStreamDestination();
            source.connect(dest);
            source.connect(audioCtx.destination);

            dest.stream.getAudioTracks().forEach(track => {
                stream.addTrack(track);
            });
        } catch (e) {
            console.warn('오디오 스트림 연결 실패, 영상만 내보냅니다:', e);
        }

        const mimeType = MediaRecorder.isTypeSupported('video/webm; codecs=vp9,opus')
            ? 'video/webm; codecs=vp9,opus'
            : MediaRecorder.isTypeSupported('video/webm; codecs=vp8,opus')
                ? 'video/webm; codecs=vp8,opus'
                : 'video/webm';

        const recorder = new MediaRecorder(stream, {
            mimeType,
            videoBitsPerSecond: 5000000
        });

        const chunks = [];
        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: mimeType.split(';')[0] });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `exported_video_${Date.now()}.webm`;
            a.click();
            URL.revokeObjectURL(url);

            setIsExporting(false);
            setProgress(100);
            setStatusText('내보내기 완료!');
        };

        recorder.start(100);
        video.currentTime = 0;
        setStatusText('영상 렌더링 중...');

        // 프레임 렌더링 루프
        const renderFrame = () => {
            if (abortRef.current || video.ended || video.paused) {
                recorder.stop();
                video.pause();
                return;
            }

            // 프레임 그리기
            ctx.clearRect(0, 0, w, h);

            // 1. 비디오 or 오버레이 이미지 (원본 비율 유지)
            if (overlayImgRef.current && overlayImgRef.current.complete) {
                ctx.drawImage(overlayImgRef.current, 0, 0, w, h);
            } else {
                ctx.drawImage(video, 0, 0, w, h);
            }

            // 2. 자막
            const cap = getCaptionAtTime(video.currentTime);
            drawSubtitle(ctx, cap, w, h);

            // 진행률
            const pct = Math.min(100, (video.currentTime / (duration || 1)) * 100);
            setProgress(Math.round(pct));

            requestAnimationFrame(renderFrame);
        };

        video.play();
        requestAnimationFrame(renderFrame);
    }, [previewUrl, captions, syncOffset, subtitleStyle, overlayImage, duration, getCaptionAtTime, drawSubtitle]);

    // 내보내기 취소
    const handleCancel = () => {
        abortRef.current = true;
        setIsExporting(false);
        setStatusText('취소됨');
    };

    if (!isVisible) return null;

    /* ── 스타일 ── */
    const S = {
        overlay: {
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        },
        modal: {
            background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
            borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)',
            padding: '32px', maxWidth: '520px', width: '90%',
            boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        },
        title: {
            fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '20px',
            display: 'flex', alignItems: 'center', gap: '10px',
        },
        info: {
            display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px',
        },
        row: {
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 14px', background: 'rgba(255,255,255,0.05)',
            borderRadius: '8px', fontSize: '13px', color: '#ccc',
        },
        progressBar: {
            width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)',
            borderRadius: '4px', overflow: 'hidden', marginBottom: '12px',
        },
        progressFill: {
            height: '100%', borderRadius: '4px', transition: 'width 0.3s ease',
            background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)',
            width: `${progress}%`,
        },
        btn: {
            padding: '12px 28px', borderRadius: '10px', fontWeight: 600,
            fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s ease',
            border: 'none',
        },
        btnPrimary: {
            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            color: '#fff',
        },
        btnCancel: {
            background: 'rgba(255,255,255,0.08)', color: '#aaa',
            border: '1px solid rgba(255,255,255,0.1)',
        },
    };

    return (
        <div style={S.overlay} onClick={onClose}>
            <div style={S.modal} onClick={e => e.stopPropagation()}>
                <div style={S.title}>
                    🎬 동영상 내보내기
                </div>

                <div style={S.info}>
                    <div style={S.row}>
                        <span>📹 영상 길이</span>
                        <span style={{ color: '#a78bfa', fontWeight: 600 }}>
                            {duration ? `${Math.floor(duration / 60)}:${String(Math.floor(duration % 60)).padStart(2, '0')}` : '-'}
                        </span>
                    </div>
                    <div style={S.row}>
                        <span>📝 자막</span>
                        <span style={{ color: captions.length > 0 ? '#10b981' : '#6b7280' }}>
                            {captions.length > 0 ? `${captions.length}개 포함` : '없음'}
                        </span>
                    </div>
                    <div style={S.row}>
                        <span>🖼️ 이미지 오버레이</span>
                        <span style={{ color: overlayImage ? '#10b981' : '#6b7280' }}>
                            {overlayImage ? '적용됨' : '없음'}
                        </span>
                    </div>
                    <div style={S.row}>
                        <span>📦 출력 형식</span>
                        <span style={{ color: '#a78bfa', fontWeight: 600 }}>WebM (VP9)</span>
                    </div>
                </div>

                {isExporting && (
                    <>
                        <div style={S.progressBar}>
                            <div style={S.progressFill} />
                        </div>
                        <p style={{ color: '#8b8ba7', fontSize: '12px', textAlign: 'center', marginBottom: '16px' }}>
                            {statusText} ({progress}%)
                        </p>
                    </>
                )}

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    {isExporting ? (
                        <button style={{ ...S.btn, ...S.btnCancel }} onClick={handleCancel}>
                            ✕ 취소
                        </button>
                    ) : (
                        <>
                            <button style={{ ...S.btn, ...S.btnCancel }} onClick={onClose}>
                                닫기
                            </button>
                            <button
                                style={{ ...S.btn, ...S.btnPrimary }}
                                onClick={handleExport}
                                disabled={!previewUrl}
                            >
                                🎬 내보내기 시작
                            </button>
                        </>
                    )}
                </div>

                {statusText === '내보내기 완료!' && (
                    <p style={{ color: '#10b981', textAlign: 'center', marginTop: '12px', fontSize: '13px', fontWeight: 600 }}>
                        ✅ 다운로드가 시작되었습니다!
                    </p>
                )}
            </div>

            {/* 숨겨진 렌더링 요소 */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <video ref={hiddenVideoRef} style={{ display: 'none' }} crossOrigin="anonymous" />
        </div>
    );
};

export default VideoExporter;
