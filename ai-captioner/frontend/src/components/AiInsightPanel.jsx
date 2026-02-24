import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * AI 분석 결과 사이드바 패널
 * - 요약(summary), 키워드(keywords), 감정 분석(sentiment/sentimentScore)
 * - 하이라이트 구간 표시 및 클릭 시 해당 시간 이동
 */
const AiInsightPanel = ({ analysis, onSeek, isVisible, onToggle }) => {
    if (!analysis) return null;

    const { summary, keywords, sentiment, sentimentScore, highlights } = analysis;

    // 감정 점수에 따른 색상 결정
    const getSentimentColor = (score) => {
        if (score >= 0.7) return 'var(--accent-green)';
        if (score >= 0.4) return 'var(--accent-orange)';
        return 'var(--accent-red)';
    };

    const getSentimentEmoji = (score) => {
        if (score >= 0.7) return '😊';
        if (score >= 0.4) return '😐';
        return '😔';
    };

    const formatTime = (s) => {
        if (!s || isNaN(s)) return '00:00';
        return new Date(s * 1000).toISOString().substr(14, 5);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="insight-panel"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 300, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                    <div className="insight-header">
                        <h3>🧠 AI 분석 결과</h3>
                        <button className="insight-close" onClick={onToggle}>✕</button>
                    </div>

                    <div className="insight-content">
                        {/* 요약 */}
                        <motion.div
                            className="insight-section"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <h4>📋 요약</h4>
                            <p className="insight-summary">{summary || '요약 정보가 없습니다.'}</p>
                        </motion.div>

                        {/* 감정 분석 */}
                        <motion.div
                            className="insight-section"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <h4>💭 감정 분석</h4>
                            <div className="sentiment-display">
                                <span className="sentiment-emoji">{getSentimentEmoji(sentimentScore || 0.5)}</span>
                                <div className="sentiment-bar-wrap">
                                    <div
                                        className="sentiment-bar-fill"
                                        style={{
                                            width: `${(sentimentScore || 0.5) * 100}%`,
                                            background: getSentimentColor(sentimentScore || 0.5)
                                        }}
                                    />
                                </div>
                                <span className="sentiment-score">{((sentimentScore || 0.5) * 100).toFixed(0)}%</span>
                            </div>
                            <p className="sentiment-text">{sentiment || '분석 완료'}</p>
                        </motion.div>

                        {/* 키워드 */}
                        {keywords && keywords.length > 0 && (
                            <motion.div
                                className="insight-section"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <h4>🏷️ 키워드</h4>
                                <div className="keyword-tags">
                                    {keywords.map((kw, i) => (
                                        <span key={i} className="keyword-tag">#{kw}</span>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* 하이라이트 */}
                        {highlights && highlights.length > 0 && (
                            <motion.div
                                className="insight-section"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <h4>⭐ 하이라이트</h4>
                                <div className="highlight-list">
                                    {highlights.map((hl, i) => (
                                        <div
                                            key={i}
                                            className="highlight-item"
                                            onClick={() => onSeek(hl.start)}
                                        >
                                            <span className="highlight-time">{formatTime(hl.start)}</span>
                                            <span className="highlight-text">{hl.text}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AiInsightPanel;
