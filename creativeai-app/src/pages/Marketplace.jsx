import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../store/store'
import apiService from '../services/api'
import Navbar from '../components/Navbar'
import './Marketplace.css'

function Marketplace() {
    const navigate = useNavigate()
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeCategory, setActiveCategory] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')

    const categories = [
        { id: 'all', name: '전체' },
        { id: 'emoji', name: '이모지' },
        { id: 'avatar', name: '아바타' },
        { id: 'photo', name: '사진' }
    ]

    useEffect(() => {
        const fetchItems = async () => {
            setLoading(true)
            try {
                // apiService.getMarketplaceItems() now returns the array directly
                const data = await apiService.getMarketplaceItems()
                setItems(Array.isArray(data) ? data : [])
            } catch (error) {
                console.error('Failed to fetch marketplace items:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchItems()
    }, [])

    const filteredItems = Array.isArray(items) ? items.filter(item => {
        const matchesCategory = activeCategory === 'all' || item.category?.toLowerCase().includes(activeCategory.toLowerCase())
        const matchesSearch = (item.title || '').toLowerCase().includes(searchQuery.toLowerCase())
        return matchesCategory && matchesSearch
    }) : []

    return (
        <div className="marketplace-page">
            <header className="marketplace-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <span className="back-icon">←</span>
                </button>
                <div className="header-title">Marketplace</div>
                <div className="header-spacer"></div>
            </header>

            <section className="marketplace-hero">
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    Premium AI Assets
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                >
                    AI가 창조한 전 세계 아티스트들의 독창적인 디지털 자산을 만나보세요.
                    나만의 공간을 채울 최고의 이모지, 아바타, 그리고 예술 작품들.
                </motion.p>

                <motion.div
                    className="search-container"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="이름이나 카테고리로 검색해보세요..."
                        className="search-bar"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </motion.div>

                <motion.div
                    className="category-filter"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                >
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            className={`category-btn ${activeCategory === cat.id ? 'active' : ''}`}
                            onClick={() => setActiveCategory(cat.id)}
                        >
                            {cat.name}
                        </button>
                    ))}
                </motion.div>
            </section>

            <main className="marketplace-content">
                {loading ? (
                    <div className="loading-container">
                        <div className="loader"></div>
                        <p>최신 AI 트렌드를 불러오는 중...</p>
                    </div>
                ) : (
                    <motion.div
                        className="items-grid"
                        layout
                    >
                        <AnimatePresence>
                            {filteredItems.map((item, index) => (
                                <MarketplaceCard key={item.id} item={item} index={index} />
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}

                {!loading && filteredItems.length === 0 && (
                    <div className="loading-container">
                        <p>검색 결과가 없습니다. 다른 키워드를 입력해보세요.</p>
                    </div>
                )}
            </main>

            <Navbar />
        </div>
    )
}

function MarketplaceCard({ item, index }) {
    const navigate = useNavigate()
    const { user, credits, setCredits } = useStore()
    const [isBuying, setIsBuying] = useState(false)

    const handleBuy = async (e) => {
        e.stopPropagation()
        if (!user) return navigate('/login')
        if (credits < item.price) return alert('크레딧이 부족합니다.')

        if (!window.confirm(`'${item.title}' 자산을 ${item.price} CR에 구매하시겠습니까?`)) return

        setIsBuying(true)
        try {
            await apiService.placeOrder(user.id, item.id, item.price)
            setCredits(credits - item.price)
            alert('구매가 완료되었습니다! 내 보관함에서 확인하실 수 있습니다.')
        } catch (error) {
            console.error('Purchase failed:', error)
            alert('구매 실패: ' + (error.message || '알 수 없는 오류'))
        } finally {
            setIsBuying(false)
        }
    }

    return (
        <motion.div
            className="marketplace-card"
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
        >
            <div className="card-image-container">
                <img src={item.thumbnailUrl} alt={item.title} className="card-image" loading="lazy" />
                <div className="category-badge">{item.category}</div>
            </div>
            <div className="card-info">
                <h3>{item.title}</h3>
                <div className="author-info">
                    <div className="author-avatar"></div>
                    <span>{item.authorName}</span>
                </div>
                <div className="card-footer">
                    <div className="price-tag">
                        {item.price === 0 ? 'FREE' : `${item.price} CR`}
                    </div>
                    <button
                        className="buy-btn"
                        onClick={handleBuy}
                        disabled={isBuying}
                    >
                        {isBuying ? '처리 중...' : '구매하기'}
                    </button>
                </div>
            </div>
        </motion.div>
    )
}

export default Marketplace
