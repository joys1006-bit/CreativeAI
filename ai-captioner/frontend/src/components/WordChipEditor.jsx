import React, { useRef, useEffect, useState, useCallback } from 'react';

/**
 * 워드칩 에디터 컴포넌트
 * - 자막 편집, 삭제, 분할 버튼
 * - 스마트 스크롤: 재생 중 자동 추적, 일시정지 시 수동 스크롤
 * - FIX: 자동 스크롤 시 onScroll 이벤트 무시하여 악순환 방지
 */
const WordChipEditor = ({ captions, currentTime, syncOffset, onSeek, onUpdateCaption, onDeleteCaption, onMergeCaptions, onSplitCaption, status, isPlaying }) => {
    const listRef = useRef(null);
    const lastScrollTime = useRef(0);
    const [userScrolling, setUserScrolling] = useState(false);
    const [autoTrack, setAutoTrack] = useState(true);
    const userScrollTimeout = useRef(null);
    const isAutoScrolling = useRef(false); // 자동 스크롤 중 플래그

    const formatTime = (s) => new Date(s * 1000).toISOString().substr(14, 5);

    // 현재 활성 자막 인덱스 찾기
    const activeIndex = captions.findIndex(cap => {
        const start = cap.start + syncOffset;
        const end = cap.end + syncOffset;
        return currentTime >= start && currentTime <= end;
    });

    /* 사용자 수동 스크롤 감지 — 자동 스크롤 중에는 무시! */
    const handleUserScroll = useCallback(() => {
        if (isAutoScrolling.current) return; // 자동 스크롤에 의한 이벤트 무시
        if (!isPlaying) return; // 일시정지 중에는 자유 스크롤

        setUserScrolling(true);
        if (userScrollTimeout.current) clearTimeout(userScrollTimeout.current);
        userScrollTimeout.current = setTimeout(() => setUserScrolling(false), 3000);
    }, [isPlaying]);

    /* 재생 시작하면 userScrolling 초기화 */
    useEffect(() => {
        if (isPlaying) {
            setUserScrolling(false);
            if (userScrollTimeout.current) clearTimeout(userScrollTimeout.current);
        }
    }, [isPlaying]);

    /* 스마트 자동 스크롤: DOM data-active 속성 기반 */
    useEffect(() => {
        if (!autoTrack || !isPlaying || userScrolling) return;
        if (activeIndex < 0 || !listRef.current) return;

        const now = Date.now();
        if (now - lastScrollTime.current < 400) return;

        // DOM에서 직접 활성 요소 찾기 (ref 의존 제거)
        const activeEl = listRef.current.querySelector(`[data-chip-index="${activeIndex}"]`);
        if (!activeEl) return;

        const container = listRef.current;
        const containerRect = container.getBoundingClientRect();
        const chipRect = activeEl.getBoundingClientRect();

        // 활성 자막이 화면 밖에 있으면 스크롤
        const isOutOfView = chipRect.top < containerRect.top + 10 || chipRect.bottom > containerRect.bottom - 10;
        if (isOutOfView) {
            isAutoScrolling.current = true;
            activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            lastScrollTime.current = now;

            // 스크롤 완료 후 플래그 해제
            setTimeout(() => {
                isAutoScrolling.current = false;
            }, 600);
        }
    }, [currentTime, activeIndex, isPlaying, userScrolling, autoTrack]);

    useEffect(() => {
        return () => {
            if (userScrollTimeout.current) clearTimeout(userScrollTimeout.current);
        };
    }, []);

    return (
        <div className="editor-container">
            <div className="editor-header">
                <h3>편집 스크립트</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                        onClick={() => setAutoTrack(prev => !prev)}
                        style={{
                            fontSize: '10px',
                            color: autoTrack ? '#10b981' : '#6b6b8a',
                            background: autoTrack ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                            padding: '3px 10px',
                            borderRadius: '10px',
                            fontWeight: 600,
                            letterSpacing: '0.3px',
                            border: autoTrack ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.08)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                        }}
                        title={autoTrack ? '자동 추적 끄기' : '자동 추적 켜기'}
                    >
                        {autoTrack ? '● 자동 추적' : '○ 추적 꺼짐'}
                    </button>
                    <span className="segment-count">{captions.length}개의 블록</span>
                </div>
            </div>

            <div className="chip-list" ref={listRef} onScroll={handleUserScroll}>
                {status === 'processing' || status === 'uploading' ? (
                    <div className="editor-loading">
                        <div className="spinner" />
                        <p>AI가 자막을 생성하는 중입니다...</p>
                    </div>
                ) : captions.length > 0 ? (
                    <>
                        {captions.map((cap, idx) => {
                            const start = cap.start + syncOffset;
                            const end = cap.end + syncOffset;
                            const isActive = idx === activeIndex;

                            return (
                                <div
                                    key={cap.id || idx}
                                    data-chip-index={idx}
                                    className={`chip-item ${isActive ? 'active' : ''}`}
                                    onClick={() => onSeek(start)}
                                    style={{
                                        transition: 'background 0.2s ease, border-color 0.2s ease',
                                    }}
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
                                </div>
                            );
                        })}
                    </>
                ) : (
                    <div className="editor-empty">
                        <p style={{ opacity: 0.6 }}>
                            홈 탭에서 영상을 불러오고 AI 자동 자막을 실행하세요
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WordChipEditor;
