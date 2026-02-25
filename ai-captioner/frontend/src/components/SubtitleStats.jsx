import React, { useMemo } from 'react';

/**
 * 자막 통계 대시보드
 * - 총 자막 수, 글자 수, 말하기 속도(WPM), 음성 점유율
 */
const SubtitleStats = ({ captions, duration, isVisible, syncOffset = 0 }) => {
    const stats = useMemo(() => {
        if (!captions || captions.length === 0) return null;

        const totalChars = captions.reduce((sum, c) => sum + c.text.length, 0);
        const totalWords = captions.reduce((sum, c) => sum + c.text.split(/\s+/).filter(Boolean).length, 0);
        const totalSpeechTime = captions.reduce((sum, c) => sum + (c.end - c.start), 0);
        const avgConfidence = captions.reduce((sum, c) => sum + (c.confidence || 0.8), 0) / captions.length;
        const speechRatio = duration > 0 ? (totalSpeechTime / duration * 100) : 0;
        const wpm = totalSpeechTime > 0 ? Math.round(totalWords / (totalSpeechTime / 60)) : 0;
        const cpm = totalSpeechTime > 0 ? Math.round(totalChars / (totalSpeechTime / 60)) : 0;
        const avgSegLen = totalSpeechTime / captions.length;

        return {
            count: captions.length,
            totalChars,
            totalWords,
            totalSpeechTime: totalSpeechTime.toFixed(1),
            speechRatio: speechRatio.toFixed(1),
            wpm,
            cpm,
            avgConfidence: (avgConfidence * 100).toFixed(0),
            avgSegLen: avgSegLen.toFixed(1),
        };
    }, [captions, duration]);

    if (!isVisible || !stats) return null;

    const S = {
        panel: {
            position: 'absolute',
            top: '50px',
            right: '12px',
            zIndex: 45,
            background: '#1e1e38',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            padding: '18px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
            minWidth: '280px',
            fontFamily: "'Pretendard', sans-serif",
        },
        title: {
            fontSize: '14px',
            fontWeight: 700,
            color: '#e2e2f0',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
        },
        grid: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
        },
        card: {
            background: 'rgba(255,255,255,0.04)',
            borderRadius: '12px',
            padding: '12px',
            textAlign: 'center',
        },
        value: {
            fontSize: '20px',
            fontWeight: 800,
            color: '#a78bfa',
            fontFamily: "'JetBrains Mono', monospace",
        },
        label: {
            fontSize: '10.5px',
            color: '#6b6b8a',
            fontWeight: 600,
            letterSpacing: '0.5px',
            marginTop: '4px',
        },
    };

    const cards = [
        { value: stats.count, label: '총 자막' },
        { value: stats.totalChars, label: '총 글자 수' },
        { value: `${stats.wpm}`, label: 'WPM (단어/분)' },
        { value: `${stats.cpm}`, label: 'CPM (글자/분)' },
        { value: `${stats.speechRatio}%`, label: '음성 점유율' },
        { value: `${stats.avgConfidence}%`, label: '평균 정확도' },
        { value: `${stats.avgSegLen}s`, label: '평균 길이' },
        { value: `${stats.totalSpeechTime}s`, label: '총 발화 시간' },
    ];

    return (
        <div style={S.panel}>
            <div style={S.title}>📊 자막 통계</div>
            <div style={S.grid}>
                {cards.map((c, i) => (
                    <div key={i} style={S.card}>
                        <div style={S.value}>{c.value}</div>
                        <div style={S.label}>{c.label}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SubtitleStats;
