import React from 'react';

/**
 * [CPO 담당] 리본 툴바
 * - 홈/편집/자막/내보내기 4탭
 * - 자막 분할/스타일/무음 감지 버튼 추가
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
}) => {
    const isProcessing = status === 'processing' || status === 'uploading';

    const tabs = [
        { id: 'home', label: '홈' },
        { id: 'edit', label: '편집' },
        { id: 'subtitle', label: '자막' },
        { id: 'export', label: '내보내기' },
    ];

    return (
        <div className="ribbon-toolbar">
            {/* 탭 헤더 */}
            <div className="ribbon-tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`ribbon-tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* 탭 컨텐츠 */}
            <div className="ribbon-content">
                {activeTab === 'home' && (
                    <div className="ribbon-group">
                        <div className="tool-section">
                            <span className="section-label">파일</span>
                            <button className="tool-btn" onClick={onSelectFile} disabled={isProcessing}>
                                <span className="tool-icon">📂</span>
                                <span>영상 불러오기</span>
                            </button>
                        </div>
                        <div className="ribbon-divider" />
                        <div className="tool-section">
                            <span className="section-label">AI 엔진</span>
                            <button className="tool-btn primary" onClick={onStartAnalysis} disabled={!hasFile || isProcessing}>
                                <span className="tool-icon">🤖</span>
                                <span>AI 자동 자막</span>
                            </button>
                            <button className="tool-btn" onClick={onToggleInsight} disabled={!hasCaptions}>
                                <span className="tool-icon">{showInsight ? '📊' : '📈'}</span>
                                <span>AI 분석</span>
                            </button>
                        </div>
                        <div className="ribbon-divider" />
                        <div className="tool-section">
                            <span className="section-label">무음 처리</span>
                            <button className="tool-btn" onClick={onDetectSilence} disabled={!hasFile || isProcessing}>
                                <span className="tool-icon">🔇</span>
                                <span>무음 탐지</span>
                            </button>
                            {silenceCount > 0 && (
                                <button className="tool-btn warning" onClick={onRemoveSilence}>
                                    <span className="tool-icon">✂️</span>
                                    <span>무음 제거 ({silenceCount})</span>
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'edit' && (
                    <div className="ribbon-group">
                        <div className="tool-section">
                            <span className="section-label">실행 취소</span>
                            <button className="tool-btn" onClick={onUndo} disabled={!canUndo}>
                                <span className="tool-icon">↩️</span>
                                <span>되돌리기</span>
                            </button>
                            <button className="tool-btn" onClick={onRedo} disabled={!canRedo}>
                                <span className="tool-icon">↪️</span>
                                <span>다시하기</span>
                            </button>
                        </div>
                        <div className="ribbon-divider" />
                        <div className="tool-section">
                            <span className="section-label">자막 스타일</span>
                            <button className="tool-btn" onClick={onToggleStylePanel} disabled={!hasCaptions}>
                                <span className="tool-icon">🎨</span>
                                <span>스타일 편집</span>
                            </button>
                        </div>
                        <div className="ribbon-divider" />
                        <div className="tool-section">
                            <span className="section-label">싱크 조절</span>
                            <div className="sync-control">
                                <button className="mini-btn" onClick={() => setSyncOffset(prev => prev - 0.1)}>-0.1s</button>
                                <span className="sync-value">{syncOffset >= 0 ? '+' : ''}{syncOffset.toFixed(1)}s</span>
                                <button className="mini-btn" onClick={() => setSyncOffset(prev => prev + 0.1)}>+0.1s</button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'subtitle' && (
                    <div className="ribbon-group">
                        <div className="tool-section">
                            <span className="section-label">자막 편집</span>
                            <button className="tool-btn" onClick={onAddCaption} disabled={!hasFile}>
                                <span className="tool-icon">➕</span>
                                <span>자막 추가</span>
                            </button>
                            <button className="tool-btn" onClick={onSplitCaption} disabled={!hasCaptions}>
                                <span className="tool-icon">✂️</span>
                                <span>분할</span>
                            </button>
                            <button className="tool-btn" onClick={onMergeCaptions} disabled={!hasCaptions}>
                                <span className="tool-icon">🔗</span>
                                <span>합치기</span>
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'export' && (
                    <div className="ribbon-group">
                        <div className="tool-section">
                            <span className="section-label">내보내기</span>
                            <button className="tool-btn primary" onClick={onExportVideo} disabled={!hasCaptions || isProcessing}>
                                <span className="tool-icon">🎬</span>
                                <span>영상 내보내기</span>
                            </button>
                            <button className="tool-btn" onClick={onExportSRT} disabled={!hasCaptions}>
                                <span className="tool-icon">📄</span>
                                <span>SRT 저장</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RibbonToolbar;
