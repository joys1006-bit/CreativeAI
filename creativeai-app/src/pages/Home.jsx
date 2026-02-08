import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import useStore from '../store/store'
import apiService from '../services/api'
import './Home.css'

const Home = () => {
    const navigate = useNavigate()
    const user = useStore((state) => state.user)
    const [trendingWorks, setTrendingWorks] = useState([])
    const [marketplaceItems, setMarketplaceItems] = useState([])
    const [loading, setLoading] = useState(true)

    // Fetch Real Data from Backend
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [trending, marketplace] = await Promise.all([
                    apiService.getPopularCreations(),
                    apiService.getMarketplaceItems()
                ])
                setTrendingWorks(trending)
                setMarketplaceItems(marketplace)
            } catch (error) {
                console.error('Failed to fetch home data:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const FEATURES = [
        { id: 'emoji', title: '이모티콘', subtitle: '나만의 이모지', icon: '🎨', color: '#6C5CE7', path: '/emoji-maker' },
        { id: 'beauty', title: '뷰티 필터', subtitle: '실시간 보정', icon: '✨', color: '#FF7675', path: '/beauty-filter' },
        { id: 'avatar', title: 'AI 아바타', subtitle: '부캐 만들기', icon: '🧚', color: '#00b894', path: '/avatar-maker' },
        { id: 'editor', title: '사진 편집', subtitle: '전문가 터치', icon: '📷', color: '#fdcb6e', path: '/photo-editor' },
    ]

    return (
        <div className="home-container">
            {/* Greeting Section */}
            <header className="home-header">
                <div>
                    <h1 className="greeting-title">
                        안녕하세요, <span className="highlight">{user?.username || '크리에이터'}</span>님! 👋
                    </h1>
                    <p className="greeting-subtitle">오늘은 어떤 멋진 작품을 만들어볼까요?</p>
                </div>
                <div className="coin-badge">
                    <span>💎 {user?.credits || 0}</span>
                </div>
            </header>

            {/* Main Features Grid */}
            <section className="features-section">
                <div className="features-grid">
                    {FEATURES.map((feature, index) => (
                        <motion.div
                            key={feature.id}
                            className="feature-card"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => navigate(feature.path)}
                            style={{
                                background: `linear-gradient(135deg, ${feature.color}, ${feature.color}dd)`
                            }}
                        >
                            <div className="feature-icon-wrapper">
                                <span className="feature-icon">{feature.icon}</span>
                            </div>
                            <div className="feature-text">
                                <h3>{feature.title}</h3>
                                <p>{feature.subtitle}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Trending Section */}
            <section className="content-section">
                <div className="section-header">
                    <h2>🔥 실시간 인기 작품</h2>
                    <span className="see-all">더보기 &gt;</span>
                </div>
                <div className="horizontal-scroll">
                    {loading ? (
                        <div className="loading-placeholder">로딩 중...</div>
                    ) : trendingWorks.length > 0 ? (
                        trendingWorks.map((work) => (
                            <div key={work.id} className="trending-card">
                                <img src={work.imageUrl} alt={work.title} className="trending-image" />
                                <div className="trending-info">
                                    <span className="trending-title">{work.title}</span>
                                    <span className="trending-author">by {work.creator}</span>
                                </div>
                                <div className="trending-badge">
                                    ❤️ {work.likes}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state-home">
                            <p>아직 인기 작품이 없네요!</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Marketplace Teaser */}
            <section className="content-section">
                <div className="section-header">
                    <h2>🛍️ 마켓플레이스</h2>
                    <span className="see-all" onClick={() => navigate('/marketplace')}>더보기 &gt;</span>
                </div>
                <div className="marketplace-banner">
                    <div className="banner-content">
                        <h3>프리미엄 에셋 상점</h3>
                        <p>더 퀄리티 높은 작품을 위한 선택</p>
                        <button className="btn-banner" onClick={() => navigate('/marketplace')}>구경가기</button>
                    </div>
                </div>
                {/* Optional: Show marketplace items if any */}
                {marketplaceItems.length > 0 && (
                    <div className="horizontal-scroll" style={{ marginTop: '16px' }}>
                        {marketplaceItems.map((item) => (
                            <div key={item.id} className="trending-card" onClick={() => navigate('/marketplace')}>
                                <img src={item.thumbnailUrl} alt={item.title} className="trending-image" />
                                <div className="trending-info">
                                    <span className="trending-title">{item.title}</span>
                                    <span className="trending-author">{item.price === 0 ? 'FREE' : `${item.price} CR`}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Bottom Navigation */}
            <Navbar />
        </div>
    )
}

export default Home
