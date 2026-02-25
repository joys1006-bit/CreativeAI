import React from 'react';

/**
 * [CPO 담당] 리본 툴바
 * - 홈/편집/자막/AI/내보내기 5탭
 * - 인라인 스타일 + CSS 병행으로 레이아웃 보장
 */
const RibbonToolbar = ({
    activeTab, setActiveTab,
    onSelectFile, onStartAnalysis, onExportVideo, onExportSRT,
    status, syncOffset, setSyncOffset,
    hasFile, hasCaptions,
    onAddCaption, onMergeCaptions, onSplitCaption,
    onToggleInsight, showInsight,
    onUndo, onRedo, canUndo, canRedo,
    onToggleStylePanel,
    onDetectSilence, onRemoveSilence, silenceCount = 0,
    onToggleTts, onToggleTemplate,
    onTranslate, targetLang, setTargetLang, hasTranslation,
}) => {
    const isProcessing = status === 'processing' || status === 'uploading';

    const tabs = [
        { id: 'home', label: '홈' },
        { id: 'edit', label: '편집' },
        { id: 'subtitle', label: '자막' },
        { id: 'ai', label: 'AI' },
        { id: 'export', label: '내보내기' },
    ];

    /* ── 인라인 스타일 (CSS 미적용 방지) ── */
    const styles = {
        toolbar: {
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
        },
        tabRow: {
            display: 'flex',
            flexDirection: 'row',
            gap: 0,
            padding: '0 16px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-surface)',
        },
        tab: (isActive) => ({
            padding: '10px 20px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
            color: isActive ? 'var(--primary-light)' : 'var(--text-dim)',
            border: 'none',
            background: 'none',
            borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
            borderRadius: 0,
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
        }),
        content: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            padding: '10px 16px',
            minHeight: '60px',
        },
        group: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 0,
            width: '100%',
        },
        divider: {
            width: '1px',
            height: '40px',
            background: 'var(--border)',
            margin: '0 16px',
            flexShrink: 0,
        },
        section: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '4px',
        },
        sectionLabel: {
            fontSize: '10px',
            color: 'var(--text-dim)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontWeight: 600,
            paddingLeft: '2px',
            whiteSpace: 'nowrap',
            lineHeight: 1,
        },
        buttonRow: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '6px',
        },
        btn: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 500,
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
            height: '34px',
            boxSizing: 'border-box',
        },
        btnPrimary: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            background: 'linear-gradient(135deg, var(--primary) 0%, #5b21b6 100%)',
            border: '1px solid transparent',
            color: '#fff',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 500,
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
            height: '34px',
            boxSizing: 'border-box',
            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
        },
        miniBtn: {
            padding: '4px 8px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary, #94a3b8)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '11px',
            transition: 'all 0.15s',
        },
        syncValue: {
            fontSize: '12px',
            color: 'var(--primary-light)',
            fontWeight: 600,
            minWidth: '44px',
            textAlign: 'center',
        },
        icon: {
            fontSize: '16px',
            flexShrink: 0,
        },
        select: {
            padding: '6px 10px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            borderRadius: '8px',
            fontSize: '12px',
            cursor: 'pointer',
        },
    };

    return (
        <div style={styles.toolbar}>
            {/* 탭 행 */}
            <div style={styles.tabRow}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        style={styles.tab(activeTab === tab.id)}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* 도구 패널 */}
            <div style={styles.content}>
                {activeTab === 'home' && (
                    <div style={styles.group}>
                        <div style={styles.section}>
                            <span style={styles.sectionLabel}>파일</span>
                            <div style={styles.buttonRow}>
                                <button style={styles.btn} onClick={onSelectFile} disabled={isProcessing}>
                                    <span style={styles.icon}>📂</span><span>영상 불러오기</span>
                                </button>
                            </div>
                        </div>
                        <div style={styles.divider} />
                        <div style={styles.section}>
                            <span style={styles.sectionLabel}>AI 엔진</span>
                            <div style={styles.buttonRow}>
                                <button style={styles.btnPrimary} onClick={onStartAnalysis} disabled={!hasFile || isProcessing}>
                                    <span style={styles.icon}>🤖</span><span>AI 자동 자막</span>
                                </button>
                                <button style={styles.btn} onClick={onToggleInsight} disabled={!hasCaptions}>
                                    <span style={styles.icon}>{showInsight ? '📊' : '📈'}</span><span>AI 분석</span>
                                </button>
                            </div>
                        </div>
                        <div style={styles.divider} />
                        <div style={styles.section}>
                            <span style={styles.sectionLabel}>무음 처리</span>
                            <div style={styles.buttonRow}>
                                <button style={styles.btn} onClick={onDetectSilence} disabled={!hasFile || isProcessing}>
                                    <span style={styles.icon}>🔇</span><span>무음 탐지</span>
                                </button>
                                {silenceCount > 0 && (
                                    <button style={styles.btn} onClick={onRemoveSilence}>
                                        <span style={styles.icon}>✂️</span><span>무음 제거 ({silenceCount})</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'edit' && (
                    <div style={styles.group}>
                        <div style={styles.section}>
                            <span style={styles.sectionLabel}>실행 취소</span>
                            <div style={styles.buttonRow}>
                                <button style={styles.btn} onClick={onUndo} disabled={!canUndo}>
                                    <span style={styles.icon}>↩️</span><span>되돌리기</span>
                                </button>
                                <button style={styles.btn} onClick={onRedo} disabled={!canRedo}>
                                    <span style={styles.icon}>↪️</span><span>다시하기</span>
                                </button>
                            </div>
                        </div>
                        <div style={styles.divider} />
                        <div style={styles.section}>
                            <span style={styles.sectionLabel}>자막 스타일</span>
                            <div style={styles.buttonRow}>
                                <button style={styles.btn} onClick={onToggleStylePanel} disabled={!hasCaptions}>
                                    <span style={styles.icon}>🎨</span><span>스타일 편집</span>
                                </button>
                                <button style={styles.btn} onClick={onToggleTemplate}>
                                    <span style={styles.icon}>📐</span><span>숏폼 템플릿</span>
                                </button>
                            </div>
                        </div>
                        <div style={styles.divider} />
                        <div style={styles.section}>
                            <span style={styles.sectionLabel}>싱크 조절</span>
                            <div style={styles.buttonRow}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <button style={styles.miniBtn} onClick={() => setSyncOffset(prev => prev - 0.1)}>-0.1s</button>
                                    <span style={styles.syncValue}>{syncOffset >= 0 ? '+' : ''}{syncOffset.toFixed(1)}s</span>
                                    <button style={styles.miniBtn} onClick={() => setSyncOffset(prev => prev + 0.1)}>+0.1s</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'subtitle' && (
                    <div style={styles.group}>
                        <div style={styles.section}>
                            <span style={styles.sectionLabel}>자막 편집</span>
                            <div style={styles.buttonRow}>
                                <button style={styles.btn} onClick={onAddCaption} disabled={!hasFile}>
                                    <span style={styles.icon}>➕</span><span>자막 추가</span>
                                </button>
                                <button style={styles.btn} onClick={onSplitCaption} disabled={!hasCaptions}>
                                    <span style={styles.icon}>✂️</span><span>분할</span>
                                </button>
                                <button style={styles.btn} onClick={onMergeCaptions} disabled={!hasCaptions}>
                                    <span style={styles.icon}>🔗</span><span>합치기</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'ai' && (
                    <div style={styles.group}>
                        <div style={styles.section}>
                            <span style={styles.sectionLabel}>AI 음성</span>
                            <div style={styles.buttonRow}>
                                <button style={styles.btn} onClick={onToggleTts} disabled={!hasCaptions}>
                                    <span style={styles.icon}>🔊</span><span>TTS 음성</span>
                                </button>
                            </div>
                        </div>
                        <div style={styles.divider} />
                        <div style={styles.section}>
                            <span style={styles.sectionLabel}>번역</span>
                            <div style={styles.buttonRow}>
                                <select
                                    style={styles.select}
                                    value={targetLang}
                                    onChange={(e) => setTargetLang(e.target.value)}
                                >
                                    <option value="en">🇺🇸 영어</option>
                                    <option value="ja">🇯🇵 일본어</option>
                                    <option value="zh">🇨🇳 중국어</option>
                                    <option value="ko">🇰🇷 한국어</option>
                                </select>
                                <button style={styles.btnPrimary} onClick={() => onTranslate(targetLang)} disabled={!hasCaptions}>
                                    <span style={styles.icon}>🌐</span><span>번역하기</span>
                                </button>
                                {hasTranslation && (
                                    <span style={{ marginLeft: '4px' }}>✅</span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'export' && (
                    <div style={styles.group}>
                        <div style={styles.section}>
                            <span style={styles.sectionLabel}>내보내기</span>
                            <div style={styles.buttonRow}>
                                <button style={styles.btnPrimary} onClick={onExportVideo} disabled={!hasCaptions || isProcessing}>
                                    <span style={styles.icon}>🎬</span><span>영상 내보내기</span>
                                </button>
                                <button style={styles.btn} onClick={onExportSRT} disabled={!hasCaptions}>
                                    <span style={styles.icon}>📄</span><span>SRT 저장</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RibbonToolbar;
