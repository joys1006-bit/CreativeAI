import React from 'react';

/**
 * 리본 툴바 컴포넌트
 * - 홈/편집/자막/내보내기 탭별 도구 패널
 * - 버튼 비활성화 상태 관리
 */
const RibbonToolbar = ({
    activeTab, setActiveTab,
    onSelectFile, onStartAnalysis,
    onExportVideo, onExportSRT,
    status, syncOffset, setSyncOffset,
    hasFile, hasCaptions,
    onAddCaption, onMergeCaptions,
    onToggleInsight, showInsight,
    onUndo, onRedo, canUndo, canRedo
}) => {
    const tabs = [
        { id: 'home', label: '홈', icon: '🏠' },
        { id: 'edit', label: '편집', icon: '✂️' },
        { id: 'subtitle', label: '자막', icon: '📝' },
        { id: 'export', label: '내보내기', icon: '📤' }
    ];

    const isProcessing = status === 'uploading' || status === 'processing' || status === 'exporting';

    return (
        <nav className="ribbon-system">
            <div className="tabs-container">
                {tabs.map(tab => (
                    <div
                        key={tab.id}
                        className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <span className="tab-icon">{tab.icon}</span>
                        <span className="tab-label">{tab.label}</span>
                    </div>
                ))}
            </div>

            <div className="toolbar-content">
                {/* ===== 홈 탭 ===== */}
                {activeTab === 'home' && (
                    <div className="tool-group">
                        <div className="tool-item" onClick={onSelectFile}>
                            <span className="tool-icon">📁</span>
                            <span className="tool-label">영상 불러오기</span>
                        </div>
                        <div className="divider" />
                        <div
                            className={`tool-item ${!hasFile || isProcessing ? 'disabled' : ''}`}
                            onClick={hasFile && !isProcessing ? onStartAnalysis : undefined}
                        >
                            <span className="tool-icon">⚡</span>
                            <span className="tool-label">AI 자동 자막</span>
                        </div>
                        <div className="divider" />
                        <div
                            className={`tool-item ${!hasCaptions ? 'disabled' : ''} ${showInsight ? 'tool-active' : ''}`}
                            onClick={hasCaptions ? onToggleInsight : undefined}
                        >
                            <span className="tool-icon">🧠</span>
                            <span className="tool-label">AI 분석</span>
                        </div>
                    </div>
                )}

                {/* ===== 편집 탭 ===== */}
                {activeTab === 'edit' && (
                    <div className="tool-group">
                        <div
                            className={`tool-item ${!canUndo ? 'disabled' : ''}`}
                            onClick={canUndo ? onUndo : undefined}
                        >
                            <span className="tool-icon">↩️</span>
                            <span className="tool-label">되돌리기</span>
                        </div>
                        <div
                            className={`tool-item ${!canRedo ? 'disabled' : ''}`}
                            onClick={canRedo ? onRedo : undefined}
                        >
                            <span className="tool-icon">↪️</span>
                            <span className="tool-label">다시하기</span>
                        </div>
                        <div className="divider" />
                        <div className="tool-item">
                            <span className="tool-icon">🔳</span>
                            <span className="tool-label">자막 스타일</span>
                        </div>
                    </div>
                )}

                {/* ===== 자막 탭 ===== */}
                {activeTab === 'subtitle' && (
                    <div className="tool-group">
                        <div
                            className={`tool-item ${!hasFile ? 'disabled' : ''}`}
                            onClick={hasFile ? onAddCaption : undefined}
                        >
                            <span className="tool-icon">➕</span>
                            <span className="tool-label">자막 추가</span>
                        </div>
                        <div
                            className={`tool-item ${!hasCaptions ? 'disabled' : ''}`}
                            onClick={hasCaptions ? onMergeCaptions : undefined}
                        >
                            <span className="tool-icon">🔗</span>
                            <span className="tool-label">자막 합치기</span>
                        </div>
                        <div className="divider" />
                        <div className="tool-sync-control">
                            <label>싱크 조절 ({syncOffset.toFixed(1)}s)</label>
                            <input
                                type="range" min="-2.0" max="2.0" step="0.1"
                                value={syncOffset}
                                onChange={(e) => setSyncOffset(parseFloat(e.target.value))}
                            />
                        </div>
                    </div>
                )}

                {/* ===== 내보내기 탭 ===== */}
                {activeTab === 'export' && (
                    <div className="tool-group">
                        <div
                            className={`tool-item ${!hasCaptions || isProcessing ? 'disabled' : ''}`}
                            onClick={hasCaptions && !isProcessing ? onExportVideo : undefined}
                        >
                            <span className="tool-icon">🎬</span>
                            <span className="tool-label">영상 내보내기</span>
                        </div>
                        <div
                            className={`tool-item ${!hasCaptions ? 'disabled' : ''}`}
                            onClick={hasCaptions ? onExportSRT : undefined}
                        >
                            <span className="tool-icon">📄</span>
                            <span className="tool-label">SRT 파일 저장</span>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default RibbonToolbar;
