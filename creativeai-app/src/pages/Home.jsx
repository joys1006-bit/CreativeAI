import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import GlassCard from '../components/GlassCard'
import PremiumButton from '../components/PremiumButton'
import useStore from '../store/store'
import apiService from '../services/api'
import './Home.css'

const Home = () => {
    const navigate = useNavigate()
    const user = useStore((state) => state.user)
    const [trendingWorks, setTrendingWorks] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const trending = await apiService.getPopularCreations()
                setTrendingWorks(trending)
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
            {/* Header Area */}
            <header className="home-header">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <h1 className="greeting-title">
                        안녕하세요, <span className="highlight-text">{user?.username || '크리에이터'}</span>님! 👋
                    </h1>
                    <p className="greeting-subtitle">오늘은 어떤 영감을 표현해볼까요?</p>
                </motion.div>
                <motion.div
                    className="coin-badge-premium"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                >
                    <span className="diamond-icon">💎</span>
                    <span className="coin-count">{user?.credits?.toLocaleString() || 0}</span>
                </motion.div>
            </header>

            {/* Feature Selection Scope */}
            <section className="features-section">
                <div className="features-grid">
                    {FEATURES.map((feature, index) => (
                        <GlassCard
                            key={feature.id}
                            className="feature-card-wrapper"
                            delay={index * 0.1}
                            onClick={() => navigate(feature.path)}
                            style={{
                                background: `linear-gradient(135deg, ${feature.color}15, ${feature.color}05)`,
                                borderColor: `${feature.color}30`
                            }}
                        >
                            <div className="feature-content">
                                <div className="feature-icon-box" style={{ backgroundColor: `${feature.color}20` }}>
                                    <span className="feature-emoji">{feature.icon}</span>
                                </div>
                                <div className="feature-info">
                                    <h3>{feature.title}</h3>
                                    <p>{feature.subtitle}</p>
                                </div>
                                <div className="feature-arrow" style={{ color: feature.color }}>→</div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            </section>

            {/* Trending Content Area */}
            <section className="content-section">
                <div className="section-header">
                    <h2>🔥 실시간 인기 작품</h2>
                    <button className="see-all-btn">전체보기</button>
                </div>
                <div className="horizontal-scroll-container">
                    {loading ? (
                        <div className="shimmer-loader">데이터를 불러오는 중...</div>
                    ) : trendingWorks.length > 0 ? (
                        trendingWorks.map((work) => (
                            <div key={work.id} className="modern-work-card">
                                <div className="work-image-wrapper">
                                    <img src={work.imageUrl} alt={work.title} loading="lazy" />
                                    <div className="work-like-badge">
                                        <span className="heart">❤️</span> {work.likes}
                                    </div>
                                </div>
                                <div className="work-meta">
                                    <span className="work-title">{work.title}</span>
                                    <span className="work-creator">by @{work.creator}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <GlassCard className="empty-state-card" hover={false}>
                            <p>첫 번째 작품의 주인공이 되어보세요! 🚀</p>
                        </GlassCard>
                    )}
                </div>
            </section>

            {/* Marketplace Engagement */}
            <section className="content-section marketplace-promo">
                <div className="section-header">
                    <h2>🛍️ 마켓플레이스</h2>
                </div>
                <GlassCard className="marketplace-banner-modern" hover={false}>
                    <div className="banner-visual"></div>
                    <div className="banner-text-content">
                        <h3>프리미엄 디자인 에셋</h3>
                        <p>전문가들이 제작한 고퀄리티 스타일로 작품의 품격을 높이세요.</p>
                        <PremiumButton
                            variant="primary"
                            onClick={() => navigate('/marketplace')}
                            className="mt-4"
                        >
                            상점 입장하기
                        </PremiumButton>
                    </div>
                </GlassCard>
            </section>
            <Navbar />
        </div>
    )
}

export default Home
