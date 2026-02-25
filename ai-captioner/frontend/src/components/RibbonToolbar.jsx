import React, { useState } from 'react';

/**
 * [CPO 담당] 리본 툴바 — Vrew 수준 프리미엄 디자인
 * - 인라인 스타일 기반 (CSS specificity 문제 원천 차단)
 * - 호버/활성 상태 포함
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
    const [hoveredBtn, setHoveredBtn] = useState(null);

    const tabs = [
        { id: 'home', label: '홈', icon: '🏠' },
        { id: 'edit', label: '편집', icon: '✏️' },
        { id: 'subtitle', label: '자막', icon: '💬' },
        { id: 'ai', label: 'AI', icon: '🤖' },
        { id: 'export', label: '내보내기', icon: '📤' },
    ];

    /* ── 프리미엄 인라인 스타일 ── */
    const S = {
        toolbar: {
            display: 'flex',
            flexDirection: 'column',
            background: '#1a1a2e',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            flexShrink: 0,
            fontFamily: "'Pretendard', 'Inter', -apple-system, sans-serif",
        },
        /* 탭 행 */
        tabRow: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'stretch',
            gap: '2px',
            padding: '0 20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: '#16162a',
        },
        tab: (isActive) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '12px 22px',
            cursor: 'pointer',
            fontSize: '13.5px',
            fontWeight: isActive ? 700 : 500,
            letterSpacing: '0.3px',
            color: isActive ? '#a78bfa' : '#8b8ba7',
            border: 'none',
            background: isActive ? 'rgba(167, 139, 250, 0.08)' : 'transparent',
            borderBottom: isActive ? '2.5px solid #a78bfa' : '2.5px solid transparent',
            borderRadius: 0,
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
        }),
        /* 도구 패널 */
        content: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            padding: '12px 20px',
            minHeight: '72px',
            background: '#1e1e38',
        },
        group: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '4px',
            width: '100%',
        },
        divider: {
            width: '1px',
            height: '46px',
            background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.1), transparent)',
            margin: '0 20px',
            flexShrink: 0,
        },
        section: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '6px',
        },
        sectionLabel: {
            fontSize: '10.5px',
            color: '#6b6b8a',
            textTransform: 'uppercase',
            letterSpacing: '1.2px',
            fontWeight: 700,
            paddingLeft: '4px',
            whiteSpace: 'nowrap',
            lineHeight: 1,
        },
        buttonRow: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '8px',
        },
        /* 기본 버튼 */
        btn: (id) => ({
            display: 'inline-flex',
            alignItems: 'center',
            gap: '7px',
            padding: '9px 16px',
            background: hoveredBtn === id ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
            border: '1px solid ' + (hoveredBtn === id ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.08)'),
            color: '#e2e2f0',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
            height: '38px',
            boxSizing: 'border-box',
            transform: hoveredBtn === id ? 'translateY(-1px)' : 'none',
            boxShadow: hoveredBtn === id ? '0 4px 12px rgba(0,0,0,0.3)' : 'none',
        }),
        /* 주요 버튼 */
        btnPrimary: (id) => ({
            display: 'inline-flex',
            alignItems: 'center',
            gap: '7px',
            padding: '9px 18px',
            background: hoveredBtn === id
                ? 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)'
                : 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
            border: '1px solid rgba(167,139,250,0.3)',
            color: '#fff',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600,
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
            height: '38px',
            boxSizing: 'border-box',
            boxShadow: hoveredBtn === id
                ? '0 6px 20px rgba(139, 92, 246, 0.5)'
                : '0 2px 8px rgba(139, 92, 246, 0.3)',
            transform: hoveredBtn === id ? 'translateY(-1px)' : 'none',
        }),
        /* 미니 버튼 */
        miniBtn: (id) => ({
            padding: '5px 10px',
            background: hoveredBtn === id ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
            border: '1px solid ' + (hoveredBtn === id ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.08)'),
            color: '#a0a0c0',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 500,
            transition: 'all 0.15s ease',
        }),
        syncValue: {
            fontSize: '13px',
            color: '#a78bfa',
            fontWeight: 700,
            minWidth: '50px',
            textAlign: 'center',
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        },
        icon: {
            fontSize: '16px',
            flexShrink: 0,
            lineHeight: 1,
        },
        select: {
            padding: '8px 12px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#e2e2f0',
            borderRadius: '10px',
            fontSize: '12.5px',
            cursor: 'pointer',
            height: '38px',
            outline: 'none',
        },
        disabledOverlay: {
            opacity: 0.4,
            pointerEvents: 'none',
        },
    };

    /* 호버 핸들러 생성 */
    const hoverProps = (id) => ({
        onMouseEnter: () => setHoveredBtn(id),
        onMouseLeave: () => setHoveredBtn(null),
    });

    return (
        <div style={S.toolbar}>
            {/* ── 탭 행 ── */}
            <div style={S.tabRow}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        style={S.tab(activeTab === tab.id)}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <span style={{ fontSize: '14px' }}>{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── 도구 패널 ── */}
            <div style={S.content}>
                {/* ===== 홈 탭 ===== */}
                {activeTab === 'home' && (
                    <div style={S.group}>
                        <div style={S.section}>
                            <span style={S.sectionLabel}>파일</span>
                            <div style={S.buttonRow}>
                                <button style={S.btn('file')} onClick={onSelectFile} disabled={isProcessing} {...hoverProps('file')}>
                                    <span style={S.icon}>📂</span><span>영상 불러오기</span>
                                </button>
                            </div>
                        </div>
                        <div style={S.divider} />
                        <div style={S.section}>
                            <span style={S.sectionLabel}>AI 엔진</span>
                            <div style={S.buttonRow}>
                                <button
                                    style={{ ...S.btnPrimary('ai-auto'), ...(!hasFile || isProcessing ? S.disabledOverlay : {}) }}
                                    onClick={onStartAnalysis}
                                    disabled={!hasFile || isProcessing}
                                    {...hoverProps('ai-auto')}
                                >
                                    <span style={S.icon}>🤖</span><span>AI 자동 자막</span>
                                </button>
                                <button
                                    style={{ ...S.btn('ai-insight'), ...(!hasCaptions ? S.disabledOverlay : {}) }}
                                    onClick={onToggleInsight}
                                    disabled={!hasCaptions}
                                    {...hoverProps('ai-insight')}
                                >
                                    <span style={S.icon}>{showInsight ? '📊' : '📈'}</span><span>AI 분석</span>
                                </button>
                            </div>
                        </div>
                        <div style={S.divider} />
                        <div style={S.section}>
                            <span style={S.sectionLabel}>무음 처리</span>
                            <div style={S.buttonRow}>
                                <button
                                    style={{ ...S.btn('silence-detect'), ...(!hasFile || isProcessing ? S.disabledOverlay : {}) }}
                                    onClick={onDetectSilence}
                                    disabled={!hasFile || isProcessing}
                                    {...hoverProps('silence-detect')}
                                >
                                    <span style={S.icon}>🔇</span><span>무음 탐지</span>
                                </button>
                                {silenceCount > 0 && (
                                    <button style={S.btn('silence-remove')} onClick={onRemoveSilence} {...hoverProps('silence-remove')}>
                                        <span style={S.icon}>✂️</span><span>무음 제거 ({silenceCount})</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ===== 편집 탭 ===== */}
                {activeTab === 'edit' && (
                    <div style={S.group}>
                        <div style={S.section}>
                            <span style={S.sectionLabel}>실행 취소</span>
                            <div style={S.buttonRow}>
                                <button style={{ ...S.btn('undo'), ...(!canUndo ? S.disabledOverlay : {}) }} onClick={onUndo} disabled={!canUndo} {...hoverProps('undo')}>
                                    <span style={S.icon}>↩️</span><span>되돌리기</span>
                                </button>
                                <button style={{ ...S.btn('redo'), ...(!canRedo ? S.disabledOverlay : {}) }} onClick={onRedo} disabled={!canRedo} {...hoverProps('redo')}>
                                    <span style={S.icon}>↪️</span><span>다시하기</span>
                                </button>
                            </div>
                        </div>
                        <div style={S.divider} />
                        <div style={S.section}>
                            <span style={S.sectionLabel}>자막 스타일</span>
                            <div style={S.buttonRow}>
                                <button style={{ ...S.btn('style'), ...(!hasCaptions ? S.disabledOverlay : {}) }} onClick={onToggleStylePanel} disabled={!hasCaptions} {...hoverProps('style')}>
                                    <span style={S.icon}>🎨</span><span>스타일 편집</span>
                                </button>
                                <button style={S.btn('template')} onClick={onToggleTemplate} {...hoverProps('template')}>
                                    <span style={S.icon}>📐</span><span>숏폼 템플릿</span>
                                </button>
                            </div>
                        </div>
                        <div style={S.divider} />
                        <div style={S.section}>
                            <span style={S.sectionLabel}>싱크 조절</span>
                            <div style={S.buttonRow}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <button style={S.miniBtn('sync-minus')} onClick={() => setSyncOffset(prev => prev - 0.1)} {...hoverProps('sync-minus')}>-0.1s</button>
                                    <span style={S.syncValue}>{syncOffset >= 0 ? '+' : ''}{syncOffset.toFixed(1)}s</span>
                                    <button style={S.miniBtn('sync-plus')} onClick={() => setSyncOffset(prev => prev + 0.1)} {...hoverProps('sync-plus')}>+0.1s</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ===== 자막 탭 ===== */}
                {activeTab === 'subtitle' && (
                    <div style={S.group}>
                        <div style={S.section}>
                            <span style={S.sectionLabel}>자막 편집</span>
                            <div style={S.buttonRow}>
                                <button style={{ ...S.btn('add-cap'), ...(!hasFile ? S.disabledOverlay : {}) }} onClick={onAddCaption} disabled={!hasFile} {...hoverProps('add-cap')}>
                                    <span style={S.icon}>➕</span><span>자막 추가</span>
                                </button>
                                <button style={{ ...S.btn('split-cap'), ...(!hasCaptions ? S.disabledOverlay : {}) }} onClick={onSplitCaption} disabled={!hasCaptions} {...hoverProps('split-cap')}>
                                    <span style={S.icon}>✂️</span><span>분할</span>
                                </button>
                                <button style={{ ...S.btn('merge-cap'), ...(!hasCaptions ? S.disabledOverlay : {}) }} onClick={onMergeCaptions} disabled={!hasCaptions} {...hoverProps('merge-cap')}>
                                    <span style={S.icon}>🔗</span><span>합치기</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ===== AI 탭 ===== */}
                {activeTab === 'ai' && (
                    <div style={S.group}>
                        <div style={S.section}>
                            <span style={S.sectionLabel}>AI 음성</span>
                            <div style={S.buttonRow}>
                                <button style={{ ...S.btn('tts'), ...(!hasCaptions ? S.disabledOverlay : {}) }} onClick={onToggleTts} disabled={!hasCaptions} {...hoverProps('tts')}>
                                    <span style={S.icon}>🔊</span><span>TTS 음성</span>
                                </button>
                            </div>
                        </div>
                        <div style={S.divider} />
                        <div style={S.section}>
                            <span style={S.sectionLabel}>번역</span>
                            <div style={S.buttonRow}>
                                <select
                                    style={S.select}
                                    value={targetLang}
                                    onChange={(e) => setTargetLang(e.target.value)}
                                >
                                    <option value="en">🇺🇸 영어</option>
                                    <option value="ja">🇯🇵 일본어</option>
                                    <option value="zh">🇨🇳 중국어</option>
                                    <option value="ko">🇰🇷 한국어</option>
                                </select>
                                <button
                                    style={{ ...S.btnPrimary('translate'), ...(!hasCaptions ? S.disabledOverlay : {}) }}
                                    onClick={() => onTranslate(targetLang)}
                                    disabled={!hasCaptions}
                                    {...hoverProps('translate')}
                                >
                                    <span style={S.icon}>🌐</span><span>번역하기</span>
                                </button>
                                {hasTranslation && (
                                    <span style={{ marginLeft: '6px', fontSize: '16px', filter: 'drop-shadow(0 0 4px #10b981)' }}>✅</span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ===== 내보내기 탭 ===== */}
                {activeTab === 'export' && (
                    <div style={S.group}>
                        <div style={S.section}>
                            <span style={S.sectionLabel}>내보내기</span>
                            <div style={S.buttonRow}>
                                <button
                                    style={{ ...S.btnPrimary('export-video'), ...(!hasCaptions || isProcessing ? S.disabledOverlay : {}) }}
                                    onClick={onExportVideo}
                                    disabled={!hasCaptions || isProcessing}
                                    {...hoverProps('export-video')}
                                >
                                    <span style={S.icon}>🎬</span><span>영상 내보내기</span>
                                </button>
                                <button
                                    style={{ ...S.btn('export-srt'), ...(!hasCaptions ? S.disabledOverlay : {}) }}
                                    onClick={onExportSRT}
                                    disabled={!hasCaptions}
                                    {...hoverProps('export-srt')}
                                >
                                    <span style={S.icon}>📄</span><span>SRT 저장</span>
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
