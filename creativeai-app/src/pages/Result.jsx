import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import GlassCard from '../components/GlassCard'
import PremiumButton from '../components/PremiumButton'
import './Result.css'

function Result() {
    const navigate = useNavigate()
    const location = useLocation()
    const result = location.state?.result
    const [selectedImage, setSelectedImage] = useState(0)

    const files = result?.files || []
    const primaryFile = files.find(f => f.is_primary) || files[0]

    const handleDownload = async () => {
        if (!files[selectedImage]) return
        try {
            const response = await fetch(files[selectedImage].file_url)
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `creativeai-${Date.now()}.png`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error('Download error:', error)
        }
    }

    const handleShare = async () => {
        if (!files[selectedImage]) return
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'CreativeAI',
                    text: 'AI로 만든 내 작품!',
                    url: files[selectedImage].file_url
                })
            } catch (error) {
                console.error('Share error:', error)
            }
        }
    }

    if (!result || files.length === 0) {
        return (
            <div className="result-container">
                <header className="home-header">
                    <PremiumButton variant="outline" onClick={() => navigate('/home')}>←</PremiumButton>
                    <h2>결과 없음</h2>
                    <div style={{ width: 40 }}></div>
                </header>
                <main className="content center-content">
                    <GlassCard className="empty-state-card" hover={false}>
                        <p>생성된 이미지를 찾을 수 없습니다.</p>
                        <PremiumButton className="mt-4" onClick={() => navigate('/emoji-maker')}>
                            다시 생성하기
                        </PremiumButton>
                    </GlassCard>
                </main>
            </div>
        )
    }

    return (
        <div className="result-container">
            <header className="home-header">
                <motion.button
                    className="back-btn-modern"
                    onClick={() => navigate('/home')}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >←</motion.button>
                <h2 className="page-title">Creative Result</h2>
                <div style={{ width: 40 }}></div>
            </header>

            <main className="result-content">
                <AnimatePresence mode="wait">
                    <GlassCard
                        key={selectedImage}
                        className="main-preview-card"
                        hover={false}
                        delay={0.1}
                    >
                        <motion.img
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            src={files[selectedImage]?.file_url || primaryFile?.file_url}
                            alt="Generated AI Art"
                            className="main-result-image"
                        />
                    </GlassCard>
                </AnimatePresence>

                {files.length > 1 && (
                    <div className="variations-section">
                        <h4 className="section-subtitle">Variations</h4>
                        <div className="variation-grid">
                            {files.map((file, index) => (
                                <motion.div
                                    key={index}
                                    className={`variation-item ${selectedImage === index ? 'active' : ''}`}
                                    onClick={() => setSelectedImage(index)}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <img
                                        src={file.thumbnail_url || file.file_url}
                                        alt={`Variation ${index + 1}`}
                                        className="variation-thumb"
                                    />
                                    {selectedImage === index && (
                                        <motion.div
                                            className="active-indicator"
                                            layoutId="active-indicator"
                                        />
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="info-grid">
                    <GlassCard className="info-item-card" hover={false} delay={0.2}>
                        <span className="info-label">Style</span>
                        <span className="info-value">{result.style_name || 'AI Premium'}</span>
                    </GlassCard>
                    <GlassCard className="info-item-card" hover={false} delay={0.3}>
                        <span className="info-label">Created</span>
                        <span className="info-value">{new Date(result.created_at).toLocaleDateString()}</span>
                    </GlassCard>
                </div>

                <div className="fixed-action-bar">
                    <PremiumButton
                        variant="outline"
                        onClick={() => navigate('/emoji-maker')}
                        className="flex-1"
                    >
                        🔄 Redo
                    </PremiumButton>
                    <PremiumButton
                        variant="primary"
                        onClick={handleDownload}
                        className="flex-2"
                    >
                        💾 Save to Gallery
                    </PremiumButton>
                    <PremiumButton
                        variant="accent"
                        onClick={handleShare}
                        className="btn-icon-only"
                    >
                        📤
                    </PremiumButton>
                </div>
            </main>
        </div>
    )
}

export default Result
