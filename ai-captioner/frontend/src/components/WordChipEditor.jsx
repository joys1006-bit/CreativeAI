import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * 워드칩 에디터 컴포넌트
 * - 자막 편집, 삭제, 분할 버튼
 * - 자동 스크롤 (throttled)
 */
const WordChipEditor = ({ captions, currentTime, syncOffset, onSeek, onUpdateCaption, onDeleteCaption, onMergeCaptions, onSplitCaption, status }) => {
    const activeChipRef = useRef(null);
    const listRef = useRef(null);
    const lastScrollTime = useRef(0);

    const formatTime = (s) => new Date(s * 1000).toISOString().substr(14, 5);

    useEffect(() => {
        const now = Date.now();
        if (now - lastScrollTime.current < 500) return;
        if (activeChipRef.current && listRef.current) {
            const container = listRef.current;
            const chip = activeChipRef.current;
            const containerRect = container.getBoundingClientRect();
            const chipRect = chip.getBoundingClientRect();
            if (chipRect.top < containerRect.top || chipRect.bottom > containerRect.bottom) {
                chip.scrollIntoView({ behavior: 'smooth', block: 'center' });
                lastScrollTime.current = now;
            }
        }
    }, [currentTime, captions]);

    return (
        <div className="editor-container">
            <div className="editor-header">
                <h3>편집 스크립트</h3>
                <span className="segment-count">{captions.length}개의 블록</span>
            </div>

            <div className="chip-list" ref={listRef}>
                {status === 'processing' || status === 'uploading' ? (
                    <div className="editor-loading">
                        <div className="spinner" />
                        <p>AI가 자막을 생성하는 중입니다...</p>
                    </div>
                ) : captions.length > 0 ? (
                    <AnimatePresence>
                        {captions.map((cap, idx) => {
                            const start = cap.start + syncOffset;
                            const end = cap.end + syncOffset;
                            const isActive = currentTime >= start && currentTime <= end;

                            return (
                                <motion.div
                                    key={cap.id || idx}
                                    ref={isActive ? activeChipRef : null}
                                    className={`chip-item ${isActive ? 'active' : ''}`}
                                    onClick={() => onSeek(start)}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -100 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="chip-metadata">
                                        <span className="chip-index">#{idx + 1}</span>
                                        <span className="chip-time">{formatTime(start)}</span>
                                        <span className="chip-duration">{(end - start).toFixed(1)}s</span>
                                        <div
                                            className="confidence-indicator"
                                            style={{ background: (cap.confidence || 0.8) >= 0.8 ? 'var(--accent-green)' : 'var(--accent-orange)' }}
                                        />
                                        {/* 액션 버튼들 */}
                                        <div className="chip-actions">
                                            {onSplitCaption && (
                                                <button
                                                    className="chip-action-btn"
                                                    onClick={(e) => { e.stopPropagation(); onSeek(start + (end - start) / 2); setTimeout(() => onSplitCaption(), 50); }}
                                                    title="자막 분할"
                                                >✂️</button>
                                            )}
                                            {onDeleteCaption && (
                                                <button
                                                    className="chip-delete-btn"
                                                    onClick={(e) => { e.stopPropagation(); onDeleteCaption(idx); }}
                                                    title="자막 삭제"
                                                >🗑️</button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="chip-content">
                                        <textarea
                                            className="chip-textarea"
                                            value={cap.text}
                                            onChange={(e) => onUpdateCaption(cap.id || idx, e.target.value)}
                                            spellCheck={false}
                                            rows={Math.max(1, Math.ceil(cap.text.length / 30))}
                                        />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                ) : (
                    <div className="editor-empty">
                        <motion.p animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }}>
                            홈 탭에서 영상을 불러오고 AI 자동 자막을 실행하세요
                        </motion.p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WordChipEditor;
