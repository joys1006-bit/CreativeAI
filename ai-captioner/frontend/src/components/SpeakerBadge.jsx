import React from 'react';

/**
 * 화자 배지 컴포넌트
 * 각 자막 세그먼트에 화자 식별 정보를 시각적으로 표시합니다.
 * 담당: 프론트엔드 개발자 (L4)
 */

// 화자별 인라인 스타일 (CSS 충돌 방지 — self-check 교훈 #6)
const badgeStyle = (color) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 600,
    color: '#fff',
    backgroundColor: color || '#8B5CF6',
    whiteSpace: 'nowrap',
    lineHeight: '18px',
    letterSpacing: '0.3px',
});

const dotStyle = (color) => ({
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#fff',
    opacity: 0.8,
    flexShrink: 0,
});

const SpeakerBadge = ({ speaker, speakerLabel, speakerColor, size = 'small' }) => {
    if (!speaker) return null;

    const label = speakerLabel || speaker;
    const color = speakerColor || '#8B5CF6';

    if (size === 'mini') {
        return (
            <span style={{
                ...badgeStyle(color),
                padding: '1px 5px',
                fontSize: '9px',
                borderRadius: '8px',
            }}>
                <span style={dotStyle(color)} />
                {speaker.replace('Speaker ', '')}
            </span>
        );
    }

    return (
        <span style={badgeStyle(color)}>
            <span style={dotStyle(color)} />
            {label}
        </span>
    );
};

/**
 * 화자 목록 패널 — 식별된 화자들의 요약 표시
 */
const SpeakerLegend = ({ speakers = [] }) => {
    if (!speakers || speakers.length === 0) return null;

    return (
        <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            padding: '8px 12px',
            background: 'rgba(139, 92, 246, 0.08)',
            borderRadius: '8px',
            border: '1px solid rgba(139, 92, 246, 0.15)',
            marginBottom: '8px',
        }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary, #999)', marginRight: '4px', fontWeight: 500 }}>
                🎤 화자:
            </span>
            {speakers.map((s, i) => (
                <SpeakerBadge
                    key={i}
                    speaker={s.id}
                    speakerLabel={s.label}
                    speakerColor={s.color}
                />
            ))}
        </div>
    );
};

export { SpeakerBadge, SpeakerLegend };
export default SpeakerBadge;
