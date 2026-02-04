import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import apiService from '../services/api'
import useStore from '../store/store'
import './Home.css'

function Home() {
    const navigate = useNavigate()
    const [popularCreations, setPopularCreations] = useState([])
    const [marketplaceItems, setMarketplaceItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Zustand 스토어에서 크레딧 가져오기
    const credits = useStore((state) => state.credits)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)

            // 병렬로 데이터 로드
            const [creationsRes, marketplaceRes] = await Promise.all([
                apiService.getPopularCreations(),
                apiService.getMarketplaceItems()
            ])

            if (creationsRes.success) {
                setPopularCreations(creationsRes.data)
            }

            if (marketplaceRes.success) {
                setMarketplaceItems(marketplaceRes.data)
            }

            setLoading(false)
        } catch (err) {
            const handleFeatureClick = (feature) => {
                switch (feature) {
                    case 'emoji':
                        navigate('/emoji-maker')
                        break
                    case 'beauty':
                        navigate('/beauty-filter')
                        break
                    case 'avatar':
                        navigate('/avatar-maker')
                        break
                    case 'edit':
                        navigate('/photo-editor')
                        break
                    default:
                        break
                }
            }

            if (loading) {
                return (
                    <div className="home">
                        <header className="header">
                            <div className="logo">CreativeAI</div>
                        </header>
                        <div className="loading-container">
                            <div className="spinner"></div>
                            <p>데이터 로딩 중...</p>
                        </div>
                    </div>
                )
            }

            if (error) {
                return (
                    <div className="home">
                        <header className="header">
                            <div className="logo">CreativeAI</div>
                        </header>
                        <div className="error-container">
                            <p>❌ {error}</p>
                            <button className="btn-primary" onClick={loadData}>다시 시도</button>
                        </div>
                    </div>
                )
            }

            return (
                <div className="home">
                    <header className="header">
                        <div className="logo">CreativeAI</div>
                        <div className="header-icons">
                            <div className="credits-badge">💎 {credits}</div>
                            <button className="icon-btn" onClick={() => navigate('/history')}>📜</button>
                            <button className="icon-btn">👤</button>
                        </div>
                    </header>

                    <main className="content">
                        <div className="greeting">
                            <h2>안녕하세요! 👋</h2>
                            <p>오늘은 무엇을 만들까요?</p>
                        </div>

                        <div className="quick-menu">
                            <div className="menu-card" onClick={() => handleFeatureClick('emoji')}>
                                <div className="menu-icon">🎨</div>
                                <div className="menu-title">이모티콘</div>
                                <div className="menu-subtitle">만들기</div>
                            </div>
                            <div className="menu-card beauty" onClick={() => handleFeatureClick('beauty')}>
                                <div className="menu-icon">✨</div>
                                <div className="menu-title">뷰티</div>
                                <div className="menu-subtitle">필터</div>
                            </div>
                            <div className="menu-card avatar" onClick={() => handleFeatureClick('avatar')}>
                                <div className="menu-icon">🎭</div>
                                <div className="menu-title">아바타</div>
                                <div className="menu-subtitle">생성</div>
                            </div>
                            <div className="menu-card edit" onClick={() => handleFeatureClick('edit')}>
                                <div className="menu-icon">🖼️</div>
                                <div className="menu-title">사진</div>
                                <div className="menu-subtitle">편집</div>
                            </div>
                        </div>

                        <section className="section">
                            <h3>🔥 인기 크리에이션</h3>
                            <div className="popular-grid">
                                {popularCreations.map(item => (
                                    <div key={item.id} className="creation-card">
                                        <div className="creation-image">{item.emoji}</div>
                                        <div className="creation-info">
                                            <div className="creation-title">{item.title}</div>
                                            <div className="creation-likes">❤️ {item.likes}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="section">
                            <h3>🛍️ 마켓플레이스</h3>
                            <div className="marketplace-preview">
                                {marketplaceItems.map(item => (
                                    <div key={item.id} className="marketplace-card">
                                        <div className="marketplace-image">{item.emoji}</div>
                                        <div className="marketplace-title">{item.title}</div>
                                        <div className="marketplace-price">₩{item.price.toLocaleString()}</div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </main>

                    <nav className="bottom-nav">
                        <button className="nav-item active">
                            <span className="nav-icon">🏠</span>
                            <span className="nav-label">홈</span>
                        </button>
                        <button className="nav-item" onClick={() => navigate('/history')}>
                            <span className="nav-icon">📜</span>
                            <span className="nav-label">히스토리</span>
                        </button>
                        <button className="nav-item create-btn" onClick={() => navigate('/emoji-maker')}>
                            <span className="nav-icon">➕</span>
                        </button>
                        <button className="nav-item">
                            <span className="nav-icon">🛍️</span>
                            <span className="nav-label">마켓</span>
                        </button>
                        <button className="nav-item">
                            <span className="nav-icon">👤</span>
                            <span className="nav-label">MY</span>
                        </button>
                    </nav>
                </div>
            )
        }

        export default Home
