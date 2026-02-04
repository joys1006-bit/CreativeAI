import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import apiService from '../services/api'
import useStore from '../store/store'
import './EmojiMaker.css'

function EmojiMaker() {
    const navigate = useNavigate()
    const [step, setStep] = useState('input') // 'input', 'style', 'generating'
    const [styles, setStyles] = useState([])
    const [selectedStyle, setSelectedStyle] = useState(null)
    const [uploadedImage, setUploadedImage] = useState(null)
    const [progress, setProgress] = useState(0)
    const [error, setError] = useState(null)
    const [generationId, setGenerationId] = useState(null)

    // Zustand Store
    const addToHistory = useStore((state) => state.addToHistory)
    const useCredits = useStore((state) => state.useCredits)
    const clearCurrentWork = useStore((state) => state.clearCurrentWork)

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
            console.error('스타일 로드 실패:', err)
            setError('스타일 정보를 불러오는데 실패했습니다.')
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
        if (!selectedStyle) {
            alert('스타일을 선택해주세요!')
            return
        }

        try {
            setStep('generating')
            setProgress(0)

            const response = await apiService.generateEmoji(
                uploadedImage || '',
                selectedStyle,
                'single'
            )

            if (response.success) {
                setGenerationId(response.data.id)
                // Start polling
                const pollId = setInterval(async () => {
                    try {
                        const statusRes = await apiService.getEmojiGenerationStatus(response.data.id)
                        if (statusRes.success) {
                            setProgress(statusRes.data.progress)
                            if (statusRes.data.status === 'completed') {
                                clearInterval(pollId)
                                useCredits(10)
                                navigate('/result', { state: { result: statusRes.data } })
                            } else if (statusRes.data.status === 'failed') {
                                clearInterval(pollId)
                                setError('생성 실패')
                                setStep('style')
                            }
                        }
                    } catch (pollErr) {
                        console.error('Polling error', pollErr)
                        clearInterval(pollId)
                        setError('상태 조회 실패')
                        setStep('style')
                    }
                }, 1000)
            } else {
                setError(response.message || '생성 실패')
                setStep('style')
            }
        } catch (err) {
            console.error('Generate error:', err)
            setError('생성 요청 중 오류가 발생했습니다.')
            setStep('style')
        }
    }

    // Animation Variants
    const pageVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 }
    }

    return (
        <div className="emoji-maker">
            <header className="header glass-effect">
                <motion.button
                    className="back-btn"
                    onClick={() => navigate(-1)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >←</motion.button>
                <h2>이모티콘 만들기</h2>
                <div style={{ width: 40 }}></div>
            </header>

            <AnimatePresence mode="wait">
                {step === 'input' && (
                    <motion.main
                        className="content"
                        key="input"
                        variants={pageVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <div className="input-options">
                            <h3>어떻게 만들까요?</h3>

                            <motion.label
                                htmlFor="photo-upload"
                                className="option-card glass-card"
                                whileHover={{ scale: 1.02, y: -5 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className="option-icon">📷</div>
                                <div className="option-text">
                                    <div className="option-title">사진으로 만들기</div>
                                    <div className="option-subtitle">갤러리에서 선택</div>
                                </div>
                            </motion.label>
                            <input
                                id="photo-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                style={{ display: 'none' }}
                            />

                            <motion.button
                                className="option-card glass-card"
                                onClick={() => alert('텍스트 입력 기능은 곧 출시됩니다!')}
                                whileHover={{ scale: 1.02, y: -5 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className="option-icon">✍️</div>
                                <div className="option-text">
                                    <div className="option-title">텍스트로 만들기</div>
                                    <div className="option-subtitle">설명을 입력하세요</div>
                                </div>
                            </motion.button>

                            <motion.button
                                className="option-card glass-card"
                                onClick={() => alert('리믹스 기능은 곧 출시됩니다!')}
                                whileHover={{ scale: 1.02, y: -5 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className="option-icon">🔄</div>
                                <div className="option-text">
                                    <div className="option-title">기존 리믹스하기</div>
                                    <div className="option-subtitle">인기 이모티콘 변형</div>
                                </div>
                            </motion.button>
                        </div>
                    </motion.main>
                )}

                {step === 'style' && (
                    <motion.main
                        className="content"
                        key="style"
                        variants={pageVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        {uploadedImage && (
                            <div className="preview-image-container glass-card">
                                <img src={uploadedImage} alt="Uploaded" className="preview-img" />
                                <button className="remove-btn" onClick={() => setUploadedImage(null)}>✕</button>
                            </div>
                        )}

                        <h3>스타일 선택</h3>
                        <div className="style-grid">
                            {styles.map(style => (
                                <motion.div
                                    key={style.id}
                                    className={`style-card glass-card ${selectedStyle === style.id ? 'active' : ''}`}
                                    onClick={() => setSelectedStyle(style.id)}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    layoutId={`style-${style.id}`}
                                >
                                    <div className="style-emoji">{style.emoji}</div>
                                    <div className="style-name">{style.name}</div>
                                </motion.div>
                            ))}
                        </div>

                        <div className="generation-options glass-card">
                            <h4>생성 옵션</h4>
                            <div className="radio-group">
                                <label className="radio-option">
                                    <input type="radio" name="genType" value="single" defaultChecked />
                                    <span>단일 (10 크레딧)</span>
                                </label>
                                <label className="radio-option">
                                    <input type="radio" name="genType" value="pack8" />
                                    <span>팩 8개 (50 크레딧)</span>
                                </label>
                            </div>
                        </div>

                        <motion.button
                            className="btn-primary btn-large"
                            onClick={handleGenerate}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            disabled={!selectedStyle}
                        >
                            <span className="btn-icon">✨</span>
                            생성하기 (10 크레딧)
                        </motion.button>
                    </motion.main>
                )}

                {step === 'generating' && (
                    <motion.main
                        className="content center-content"
                        key="generating"
                        variants={pageVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <div className="generating-visual">
                            <motion.div
                                className="gen-emoji"
                                animate={{
                                    rotate: [0, 10, -10, 0],
                                    scale: [1, 1.1, 1]
                                }}
                                transition={{ repeat: Infinity, duration: 2 }}
                            >
                                🎨
                            </motion.div>
                            <div className="ripple"></div>
                        </div>
                        <h2>AI가 그림을 그리고 있어요...</h2>
                        <p>잠시만 기다려주세요!</p>

                        <div className="progress-container glass-card">
                            <div className="progress-bar">
                                <motion.div
                                    className="progress-fill"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                />
                            </div>
                            <div className="progress-text">{progress}%</div>
                        </div>
                    </motion.main>
                )}
            </AnimatePresence>
        </div>
    )
}

export default EmojiMaker
