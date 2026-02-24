import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import apiService from '../services/api'
import useStore from '../store/store'
import './AvatarMaker.css'

function AvatarMaker() {
    const navigate = useNavigate()
    const [step, setStep] = useState('input')
    const [styles, setStyles] = useState([])
    const [selectedStyle, setSelectedStyle] = useState(null)
    const [uploadedImage, setUploadedImage] = useState(null)
    const [generating, setGenerating] = useState(false)
    const [progress, setProgress] = useState(0)

    const deductCredits = useStore((state) => state.useCredits)

    useEffect(() => {
        loadStyles()
    }, [])

    const loadStyles = async () => {
        try {
            const response = await apiService.getAvatarStyles()
            if (response.success) {
                setStyles(response.data)
                if (response.data.length > 0) {
                    setSelectedStyle(response.data[0].id)
                }
            }
        } catch (err) {
            console.error('Avatar style loading failed:', err)
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
        if (!uploadedImage || !selectedStyle) {
            alert('이미지와 스타일을 선택해주세요!')
            return
        }

        try {
            setGenerating(true)
            setProgress(0)

            // 1. 생성 요청
            const initialResponse = await apiService.generateAvatar(uploadedImage, selectedStyle)
            const generationId = initialResponse.id

            // 2. 폴링으로 상태 확인
            const finalResult = await apiService.pollGenerationStatus(
                generationId,
                'avatar',
                (currentProgress) => setProgress(currentProgress)
            )

            // 3. 완료 처리
            deductCredits(20)
            navigate('/result', {
                state: {
                    result: {
                        ...finalResult,
                        style_name: styles.find(s => s.id === selectedStyle)?.name,
                        created_at: new Date().toISOString()
                    }
                }
            })

        } catch (error) {
            console.error('Avatar generation failed:', error)
            alert('아바타 생성에 실패했습니다. 다시 시도해주세요.')
        } finally {
            setGenerating(false)
        }
    }

    const pageVariants = {
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 }
    }

    return (
        <div className="avatar-maker">
            <header className="header glass-effect">
                <motion.button
                    className="back-btn"
                    onClick={() => navigate(-1)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >←</motion.button>
                <h2>AI 아바타 만들기</h2>
                <div style={{ width: 40 }}></div>
            </header>

            <AnimatePresence mode="wait">
                {step === 'input' && (
                    <motion.main
                        className="content"
                        key="input"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                    >
                        <div className="input-section">
                            <h3>어떻게 만들까요?</h3>

                            <motion.label
                                htmlFor="avatar-upload"
                                className="upload-card glass-card"
                                whileHover={{ scale: 1.02, y: -5 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className="upload-icon">📷</div>
                                <div className="upload-text">
                                    <div className="upload-title">사진으로 만들기</div>
                                    <div className="upload-subtitle">갤러리에서 선택</div>
                                </div>
                            </motion.label>
                            <input
                                id="avatar-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                style={{ display: 'none' }}
                            />

                            <div className="info-box glass-card">
                                <h4>💡 팁</h4>
                                <ul>
                                    <li>정면을 바라보는 사진이 좋아요</li>
                                    <li>밝은 곳에서 찍은 사진을 사용하세요</li>
                                    <li>얼굴이 크게 나온 사진이 효과적이에요</li>
                                </ul>
                            </div>
                        </div>
                    </motion.main>
                )}

                {step === 'style' && !generating && (
                    <motion.main
                        className="content"
                        key="style"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                    >
                        <div className="style-section">
                            {uploadedImage && (
                                <div className="preview-image glass-card">
                                    <img src={uploadedImage} alt="Uploaded" />
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
                                        <div className="style-desc">{style.description}</div>
                                    </motion.div>
                                ))}
                            </div>

                            <motion.button
                                className="btn-generate btn-large"
                                onClick={handleGenerate}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <span className="btn-icon">✨</span>
                                아바타 생성하기 (20 크레딧)
                            </motion.button>
                        </div>
                    </motion.main>
                )}

                {generating && (
                    <motion.main
                        className="generating-section"
                        key="generating"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                    >
                        <div className="loading-animation">
                            <motion.div
                                className="avatar-spinner"
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                            />
                        </div>
                        <h2>AI 아바타 생성 중...</h2>
                        <p>당신만의 특별한 아바타를 만들고 있어요!</p>
                        <div className="progress-bar glass-card">
                            <motion.div
                                className="progress-fill"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                            />
                        </div>
                        <div className="progress-text">{progress}%</div>
                    </motion.main>
                )}
            </AnimatePresence>
        </div>
    )
}

export default AvatarMaker
