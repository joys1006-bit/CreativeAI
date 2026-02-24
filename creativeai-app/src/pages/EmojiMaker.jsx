import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import apiService from '../services/api'
import useStore from '../store/store'
import GlassCard from '../components/GlassCard'
import PremiumButton from '../components/PremiumButton'
import './EmojiMaker.css'

function EmojiMaker() {
    const navigate = useNavigate()
    const [step, setStep] = useState('input') // 'input', 'style', 'generating'
    const [styles, setStyles] = useState([])
    const [selectedStyle, setSelectedStyle] = useState(null)
    const [uploadedImage, setUploadedImage] = useState(null)
    const [progress, setProgress] = useState(0)

    // Zustand Store
    const deductCredits = useStore((state) => state.useCredits)

    useEffect(() => {
        loadStyles()
    }, [])

    const loadStyles = async () => {
        try {
            const response = await apiService.getEmojiStyles()
            if (response.success) {
                setStyles(response.data)
                if (response.data.length > 0) {
                    setSelectedStyle(response.data[0].id)
                }
            }
        } catch (err) {
            console.error('Style loading failed:', err)
        }
    }

    const handleImageUpload = (e) => {
        const file = e.target.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (event) => {
                setUploadedImage(event.target.result)
                setStep('style')
            }
            reader.readAsDataURL(file)
        }
    }

    const handleGenerate = async () => {
        if (!selectedStyle || !uploadedImage) {
            alert('이미지와 스타일을 선택해주세요!')
            return
        }

        try {
            setStep('generating')
            setProgress(0)

            // 1. 생성 요청 (실제 백엔드 AI 모델 호출)
            console.log('[Emoji] Starting generation with style:', selectedStyle);
            const initialResponse = await apiService.generateEmoji(uploadedImage, selectedStyle)
            const generationId = initialResponse.id

            // 2. 폴링으로 상태 확인 (실시간 진행률 갱신)
            const finalResult = await apiService.pollGenerationStatus(
                generationId,
                'emoji',
                (currentProgress) => {
                    setProgress(currentProgress)
                }
            )

            // 3. 완료 시 결과 페이지로 이동 (카드 소진 및 결과 전달)
            deductCredits(10)
            navigate('/result', {
                state: {
                    result: {
                        ...finalResult,
                        style_name: styles.find(s => s.id === selectedStyle)?.name,
                        created_at: new Date().toISOString()
                    }
                }
            })

        } catch (err) {
            console.error('Emoji generation failed:', err)
            // setError 없이 알림만 함
            alert('이모지 생성 중 오류가 발생했습니다.')
            setStep('style')
        }
    }

    return (
        <div className="emoji-maker-container">
            <header className="home-header">
                <motion.button
                    className="back-btn-modern"
                    onClick={() => navigate(-1)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >←</motion.button>
                <h2 className="page-title">Emoji Lab</h2>
                <div style={{ width: 40 }}></div>
            </header>

            <AnimatePresence mode="wait">
                {step === 'input' && (
                    <motion.main
                        className="maker-content"
                        key="input"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <div className="input-options">
                            <h3 className="section-title">새로운 영감의 시작</h3>

                            <label htmlFor="photo-upload" className="full-width-label">
                                <GlassCard className="option-card-premium" delay={0.1}>
                                    <div className="option-visual photo-mode">📷</div>
                                    <div className="option-info">
                                        <h4>사진으로 만들기</h4>
                                        <p>당신의 얼굴이나 사물을 AI 이모티콘으로 변환합니다.</p>
                                    </div>
                                    <div className="arrow-indicator">→</div>
                                </GlassCard>
                            </label>
                            <input
                                id="photo-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                style={{ display: 'none' }}
                            />

                            <div onClick={() => alert('Coming soon!')} className="full-width-label">
                                <GlassCard className="option-card-premium" delay={0.2}>
                                    <div className="option-visual text-mode">✍️</div>
                                    <div className="option-info">
                                        <h4>텍스트로 만들기</h4>
                                        <p>상상 속의 이미지를 글로 적어보세요.</p>
                                    </div>
                                    <div className="arrow-indicator">→</div>
                                </GlassCard>
                            </div>
                        </div>
                    </motion.main>
                )}

                {step === 'style' && (
                    <motion.main
                        className="maker-content"
                        key="style"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        {uploadedImage && (
                            <GlassCard className="preview-showcase" hover={false} delay={0.1}>
                                <img src={uploadedImage} alt="Preview" className="showcase-img" />
                                <button className="close-btn-mini" onClick={() => setUploadedImage(null)}>✕</button>
                            </GlassCard>
                        )}

                        <h3 className="section-title">스타일 큐레이션</h3>
                        <div className="premium-style-grid">
                            {styles.map((style, idx) => (
                                <GlassCard
                                    key={style.id}
                                    className={`style-pick-card ${selectedStyle === style.id ? 'active' : ''}`}
                                    onClick={() => setSelectedStyle(style.id)}
                                    delay={idx * 0.05}
                                >
                                    <div className="style-emoji-large">{style.emoji}</div>
                                    <span className="style-label-small">{style.name}</span>
                                </GlassCard>
                            ))}
                        </div>

                        <div className="creation-footer">
                            <PremiumButton
                                variant="primary"
                                onClick={handleGenerate}
                                disabled={!selectedStyle}
                                fullWidth
                            >
                                ✨ AI 이모티콘 생성하기 (10💎)
                            </PremiumButton>
                        </div>
                    </motion.main>
                )}

                {step === 'generating' && (
                    <motion.main
                        className="maker-content center-focus"
                        key="generating"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div className="ai-brain-animation">
                            <motion.div
                                className="core-icon"
                                animate={{
                                    scale: [1, 1.1, 1],
                                    filter: ["hue-rotate(0deg)", "hue-rotate(90deg)", "hue-rotate(0deg)"]
                                }}
                                transition={{ repeat: Infinity, duration: 3 }}
                            >
                                🧪
                            </motion.div>
                            <div className="orbit-decoration"></div>
                        </div>
                        <h2 className="generating-title">AI가 당신의 상상을 그리는 중...</h2>

                        <div className="premium-progress-wrapper">
                            <div className="progress-track">
                                <motion.div
                                    className="progress-glow"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                />
                            </div>
                            <span className="progress-percent">{progress}%</span>
                        </div>
                    </motion.main>
                )}
            </AnimatePresence>
        </div>
    )
}

export default EmojiMaker
