import React, { useState } from 'react';

/**
 * 영상 속도 조절 컴포넌트
 * - 0.25x ~ 3x 속도 지원
 * - 프리셋 버튼 + 현재 속도 표시
 */
const PlaybackSpeed = ({ videoRef }) => {
    const [speed, setSpeed] = useState(1);
    const [isOpen, setIsOpen] = useState(false);

    const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3];

    const handleSpeedChange = (newSpeed) => {
        setSpeed(newSpeed);
        if (videoRef?.current) {
            videoRef.current.playbackRate = newSpeed;
        }
        setIsOpen(false);
    };

    const S = {
        wrapper: {
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
        },
        trigger: {
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 10px',
            background: speed !== 1 ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.06)',
            border: '1px solid ' + (speed !== 1 ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.1)'),
            borderRadius: '8px',
            color: speed !== 1 ? '#a78bfa' : '#8b8ba7',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        },
        dropdown: {
            position: 'absolute',
            bottom: '110%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1e1e38',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            zIndex: 100,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            minWidth: '80px',
        },
        option: (isActive) => ({
            padding: '6px 12px',
            background: isActive ? 'rgba(139,92,246,0.2)' : 'transparent',
            border: 'none',
            borderRadius: '8px',
            color: isActive ? '#a78bfa' : '#c0c0d8',
            fontSize: '12px',
            fontWeight: isActive ? 700 : 400,
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all 0.15s ease',
            fontFamily: "'JetBrains Mono', monospace",
        }),
    };

    return (
        <div style={S.wrapper}>
            <button
                style={S.trigger}
                onClick={() => setIsOpen(!isOpen)}
                title="재생 속도 변경"
            >
                ⚡ {speed}x
            </button>

            {isOpen && (
                <div style={S.dropdown}>
                    {speeds.map(s => (
                        <button
                            key={s}
                            style={S.option(s === speed)}
                            onClick={() => handleSpeedChange(s)}
                            onMouseEnter={(e) => { if (s !== speed) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                            onMouseLeave={(e) => { if (s !== speed) e.currentTarget.style.background = 'transparent'; }}
                        >
                            {s}x
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PlaybackSpeed;
