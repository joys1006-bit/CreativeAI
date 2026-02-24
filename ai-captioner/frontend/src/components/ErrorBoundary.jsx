import React from 'react';

/**
 * [CSO 담당] 에러 바운더리
 * - React Error Boundary 패턴
 * - 크래시 복구 UI
 * - 에러 로깅
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
        console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    }

    handleReload = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary">
                    <div className="error-content">
                        <div className="error-icon">⚠️</div>
                        <h2 className="error-title">앗! 문제가 발생했습니다</h2>
                        <p className="error-message">
                            걱정하지 마세요 — 데이터는 안전합니다.
                            <br />아래 버튼을 눌러 복구하세요.
                        </p>
                        {this.state.error && (
                            <details className="error-details">
                                <summary>기술적 세부 사항</summary>
                                <pre>{this.state.error.toString()}</pre>
                                {this.state.errorInfo && (
                                    <pre>{this.state.errorInfo.componentStack}</pre>
                                )}
                            </details>
                        )}
                        <div className="error-actions">
                            <button className="error-btn primary" onClick={this.handleReload}>
                                🔄 복구하기
                            </button>
                            <button className="error-btn" onClick={() => window.location.reload()}>
                                🔃 페이지 새로고침
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
