import { useNavigate } from 'react-router-dom'
import useStore from '../store/store'
import './History.css'

function History() {
    const navigate = useNavigate()
    const history = useStore((state) => state.history)
    const removeFromHistory = useStore((state) => state.removeFromHistory)
    const clearHistory = useStore((state) => state.clearHistory)

    const handleDelete = (id) => {
        if (window.confirm('이 항목을 삭제하시겠습니까?')) {
            removeFromHistory(id)
        }
    }

    const handleClearAll = () => {
        if (window.confirm('모든 히스토리를 삭제하시겠습니까?')) {
            clearHistory()
        }
    }

    const formatDate = (timestamp) => {
        const date = new Date(timestamp)
        const now = new Date()
        const diff = now - date
        const minutes = Math.floor(diff / 60000)
        const hours = Math.floor(diff / 3600000)
        const days = Math.floor(diff / 86400000)

        if (minutes < 1) return '방금 전'
        if (minutes < 60) return `${minutes}분 전`
        if (hours < 24) return `${hours}시간 전`
        if (days < 7) return `${days}일 전`

        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const groupByDate = (items) => {
        const groups = {}
        items.forEach(item => {
            const date = new Date(item.timestamp)
            const key = date.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
            if (!groups[key]) {
                groups[key] = []
            }
            groups[key].push(item)
        })
        return groups
    }

    const groupedHistory = groupByDate(history)

    return (
        <div className="history-page">
            <header className="header">
                <button className="back-btn" onClick={() => navigate(-1)}>←</button>
                <h2>생성 히스토리</h2>
                {history.length > 0 && (
                    <button className="clear-btn" onClick={handleClearAll}>
                        전체 삭제
                    </button>
                )}
            </header>

            <main className="content">
                {history.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📭</div>
                        <h3>아직 생성한 작품이 없어요</h3>
                        <p>이모티콘이나 아바타를 만들어보세요!</p>
                        <button className="btn-primary" onClick={() => navigate('/home')}>
                            홈으로 가기
                        </button>
                    </div>
                ) : (
                    <div className="history-list">
                        {Object.entries(groupedHistory).map(([date, items]) => (
                            <div key={date} className="history-group">
                                <h3 className="group-date">{date}</h3>
                                <div className="history-items">
                                    {items.map((item) => (
                                        <div key={item.id} className="history-item">
                                            <div className="item-preview">
                                                {item.result?.emoji && (
                                                    <div className="emoji-result">{item.result.emoji}</div>
                                                )}
                                                {item.image && (
                                                    <img src={item.image} alt="Original" />
                                                )}
                                            </div>
                                            <div className="item-info">
                                                <div className="item-type">
                                                    {item.type === 'emoji' && '🎨 이모티콘'}
                                                    {item.type === 'avatar' && '🎭 아바타'}
                                                </div>
                                                <div className="item-style">{item.style}</div>
                                                <div className="item-time">{formatDate(item.timestamp)}</div>
                                            </div>
                                            <div className="item-actions">
                                                <button
                                                    className="btn-icon"
                                                    onClick={() => navigate('/result', { state: { result: item.result } })}
                                                    title="다시 보기"
                                                >
                                                    👁️
                                                </button>
                                                <button
                                                    className="btn-icon delete"
                                                    onClick={() => handleDelete(item.id)}
                                                    title="삭제"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}

export default History
