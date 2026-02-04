import { useNavigate, useLocation } from 'react-router-dom'
import './Result.css'

function Result() {
    const navigate = useNavigate()
    const location = useLocation()
    const result = location.state?.result

    return (
        <div className="result">
            <header className="header">
                <button className="back-btn" onClick={() => navigate('/home')}>←</button>
                <h2>완성! 🎉</h2>
                <div></div>
            </header>

            <main className="content">
                <div className="result-preview">
                    <div className="result-emoji">{result?.emoji || '🎨'}</div>
                </div>

                <div className="edit-tools">
                    <h4>편집 도구</h4>
                    <div className="tool-buttons">
                        <button className="tool-btn">텍스트</button>
                        <button className="tool-btn">색상</button>
                        <button className="tool-btn">배경</button>
                        <button className="tool-btn">크기</button>
                    </div>
                </div>

                <div className="other-versions">
                    <h4>다른 버전 (스와이프)</h4>
                    <div className="version-scroll">
                        {result?.variations?.map((emoji, index) => (
                            <div key={index} className="version-card">
                                <div className="version-preview">{emoji}</div>
                            </div>
                        )) || (
                                <>
                                    <div className="version-card">
                                        <div className="version-preview">🎨</div>
                                    </div>
                                    <div className="version-card">
                                        <div className="version-preview">🎭</div>
                                    </div>
                                    <div className="version-card">
                                        <div className="version-preview">🎪</div>
                                    </div>
                                </>
                            )}
                    </div>
                </div>

                <div className="action-buttons">
                    <button className="btn-secondary" onClick={() => navigate('/emoji-maker')}>
                        🔄 다시생성
                    </button>
                    <button className="btn-primary" onClick={() => alert('저장되었습니다!')}>
                        💾 저장
                    </button>
                    <button className="btn-primary" onClick={() => alert('공유 기능은 곧 출시됩니다!')}>
                        📤 공유
                    </button>
                </div>
            </main>
        </div>
    )
}

export default Result
