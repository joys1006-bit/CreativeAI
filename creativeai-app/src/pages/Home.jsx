import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../store/store'
import apiService from '../services/api'
import './Home.css'

function Home() {
    const navigate = useNavigate()
    const credits = useStore((state) => state.credits)
    const [popularCreations, setPopularCreations] = useState([])
    const [marketplaceItems, setMarketplaceItems] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            await new Promise(resolve => setTimeout(resolve, 800)) // 최소 로딩 시간 보장

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
        } catch (err) {
            console.error('데이터 로드 실패:', err)
        } finally {
            setLoading(false)
        }
    }

    // 애니메이션 설정
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    }

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 100,
                damping: 10
            }
        }
    }

    if (loading) {
        return (
            <div className="loading-container" style={{ height: '100vh' }}>
                <div className="spinner"></div>
                <p>로딩 중...</p>
            </div>
        )
    }
        )
}

return (
    <div className="home">
        <header className="header glass-effect">
            <div className="logo">CreativeAI</div>
            <div className="header-icons">
                <motion.div
                    className="credits-badge"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    💎 {credits}
                </motion.div>
                <button className="icon-btn">🔔</button>
                <button className="icon-btn">⚙️</button>
            </div>
        </header>

        <motion.main
            className="content"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.section className="greeting" variants={itemVariants}>
                <h2>안녕하세요, 크리에이터님! 👋</h2>
                <p>오늘은 어떤 멋진 작품을 만들어볼까요?</p>
            </motion.section>

            <motion.section className="quick-menu" variants={itemVariants}>
                <MenuCard
                    title="이모티콘"
                    subtitle="나만의 이모지"
                    emoji="🎨"
                    color="var(--primary-gradient)"
                    onClick={() => navigate('/emoji-maker')}
                />
                <MenuCard
                    title="뷰티 필터"
                    subtitle="실시간 보정"
                    emoji="✨"
                    color="var(--accent-gradient)"
                    onClick={() => navigate('/beauty-filter')}
                />
                <MenuCard
                    title="AI 아바타"
                    subtitle="부캐 만들기"
                    emoji="🧚"
                    color="linear-gradient(135deg, #00b894, #55efc4)"
                    onClick={() => navigate('/avatar-maker')}
                />
                <MenuCard
                    title="사진 편집"
                    subtitle="전문가 터치"
                    emoji="📸"
                    color="linear-gradient(135deg, #fdcb6e, #ffeaa7)"
                    onClick={() => navigate('/photo-editor')}
                />
            </motion.section>

            <motion.section className="section" variants={itemVariants}>
                <div className="section-header">
                    <h3>🔥 실시간 인기 작품</h3>
                    <span className="more-link">더보기 &gt;</span>
                </div>
                <div className="popular-grid">
                    {popularCreations.map(creation => (
                        <motion.div
                            key={creation.id}
                            className="creation-card glass-card"
                            whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="creation-image">{creation.emoji}</div>
                            <div className="creation-info">
                                <div className="creation-title">{creation.title}</div>
                                <div className="creation-likes">❤️ {creation.likes}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.section>

            <motion.section className="section" variants={itemVariants}>
                <div className="section-header">
                    <h3>🛍️ 마켓플레이스</h3>
                    <span className="more-link">더보기 &gt;</span>
                </div>
                <div className="marketplace-preview">
                    {marketplaceItems.map(item => (
                        <motion.div
                            key={item.id}
                            className="marketplace-card glass-card"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <div className="marketplace-image">{item.emoji}</div>
                            <div className="marketplace-title">{item.title}</div>
                            <div className="marketplace-price">₩{item.price.toLocaleString()}</div>
                        </motion.div>
                    ))}
                </div>
            </motion.section>
        </motion.main>

        <nav className="bottom-nav">
            <NavButton icon="🏠" label="홈" active />
            <NavButton icon="📜" label="히스토리" onClick={() => navigate('/history')} />
            <div className="create-btn-wrapper">
                <motion.button
                    className="create-btn"
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => navigate('/emoji-maker')}
                >
                    <span className="nav-icon">➕</span>
                </motion.button>
            </div>
            <NavButton icon="🛍️" label="마켓" />
            <NavButton icon="👤" label="MY" />
        </nav>
    </div>
)
}

function MenuCard({ title, subtitle, emoji, color, onClick }) {
    return (
        <motion.div
            className="menu-card"
            style={{ background: color }}
            onClick={onClick}
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.95 }}
        >
            <div className="menu-icon">{emoji}</div>
            <div className="menu-texts">
                <div className="menu-title">{title}</div>
                <div className="menu-subtitle">{subtitle}</div>
            </div>
        </motion.div>
    )
}

function NavButton({ icon, label, active, onClick }) {
    return (
        <motion.button
            className={`nav-item ${active ? 'active' : ''}`}
            onClick={onClick}
            whileTap={{ scale: 0.8 }}
        >
            <span className="nav-icon">{icon}</span>
            <span className="nav-label">{label}</span>
        </motion.button>
    )
}

export default Home
