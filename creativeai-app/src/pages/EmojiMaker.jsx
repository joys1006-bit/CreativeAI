import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import apiService from '../services/api'
import useStore from '../store/store'
import './EmojiMaker.css'

function EmojiMaker() {
    const navigate = useNavigate()
    const [step, setStep] = useState('input') // 'input', 'style', 'generating'
    const [styles, setStyles] = useState([])
    const [progress, setProgress] = useState(0)

    // Zustand 스토어 사용
    const currentWork = useStore((state) => state.currentWork)
    const setCurrentWork = useStore((state) => state.setCurrentWork)
    const clearCurrentWork = useStore((state) => state.clearCurrentWork)
    const addToHistory = useStore((state) => state.addToHistory)
    const useCredits = useStore((state) => state.useCredits)
    const setError = useStore((state) => state.setError)

    const { uploadedImage, selectedStyle, generationId } = currentWork

    const setUploadedImage = (image) => setCurrentWork({ uploadedImage: image })
    const setSelectedStyle = (style) => setCurrentWork({ selectedStyle: style })
    const setGenerationId = (id) => setCurrentWork({ generationId: id })

    useEffect(() => {
        loadStyles()
    }, [])

    useEffect(() => {
        if (step === 'generating' && generationId) {
            checkGenerationStatus()
        }
    }, [step, generationId])

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
        try {
            setStep('generating')
            setProgress(0)

            const response = await apiService.generateEmoji({
                imageData: uploadedImage,
                prompt: null,
                styleId: selectedStyle,
                generationType: 'single'
            })

            if (response.success) {
                setGenerationId(response.data.id)
            }
        } catch (err) {
            console.error('생성 실패:', err)
            alert('이모티콘 생성에 실패했습니다.')
            setStep('style')
        }
    }

    const checkGenerationStatus = async () => {
        try {
            const response = await apiService.getGenerationStatus(generationId)

            if (response.success) {
                const data = response.data
                setProgress(data.progress)

                if (data.status === 'completed') {
                    // 히스토리에 저장
                    addToHistory({
                        type: 'emoji',
                        style: selectedStyle,
                        result: data.result,
                        image: uploadedImage,
                    })

                    // 크레딧 차감 (단일 생성: 10 크레딧)
                    useCredits(10)

                    // 완료되면 결과 페이지로 이동
                    setTimeout(() => {
                        navigate('/result', { state: { result: data.result } })
                        clearCurrentWork()
                    }, 500)
                } else if (data.status === 'processing') {
                    // 1초 후 다시 체크
                    setTimeout(checkGenerationStatus, 1000)
                } else if (data.status === 'failed') {
                    setError('이모티콘 생성에 실패했습니다.')
                    setStep('style')
                }
            }
        } catch (err) {
            console.error('상태 조회 실패:', err)
            setError('상태 조회에 실패했습니다.')
        }
    }

    return (
        <div className="emoji-maker">
            <header className="header">
                <button className="back-btn" onClick={() => navigate(-1)}>←</button>
                <h2>이모티콘 만들기</h2>
                <div></div>
            </header>

            <main className="content">
                {step === 'input' && (
                    <div className="input-options">
                        <h3>어떻게 만들까요?</h3>

                        <label htmlFor="photo-upload" className="option-card">
                            <div className="option-icon">📷</div>
                            <div className="option-text">
                                <div className="option-title">사진으로 만들기</div>
                                <div className="option-subtitle">갤러리에서 선택</div>
                            </div>
                        </label>
                        <input
                            id="photo-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            style={{ display: 'none' }}
                        />

                        <button className="option-card" onClick={() => alert('텍스트 입력 기능은 곧 출시됩니다!')}>
                            <div className="option-icon">✍️</div>
                            <div className="option-text">
                                <div className="option-title">텍스트로 만들기</div>
                                <div className="option-subtitle">설명을 입력하세요</div>
                            </div>
                        </button>

                        <button className="option-card" onClick={() => alert('리믹스 기능은 곧 출시됩니다!')}>
                            <div className="option-icon">🔄</div>
                            <div className="option-text">
                                <div className="option-title">기존 리믹스하기</div>
                                <div className="option-subtitle">인기 이모티콘 변형</div>
                            </div>
                        </button>
                    </div>
                )}

                {step === 'style' && (
                    <div className="style-selection">
                        {uploadedImage && (
                            <div className="uploaded-preview">
                                <img src={uploadedImage} alt="Uploaded" />
                            </div>
                        )}

                        <h3>스타일 선택</h3>
                        <div className="style-grid">
                            {styles.map(style => (
                                <div
                                    key={style.id}
                                    className={`style-card ${selectedStyle === style.id ? 'active' : ''}`}
                                    onClick={() => setSelectedStyle(style.id)}
                                >
                                    <div className="style-preview">{style.emoji}</div>
                                    <div className="style-name">{style.name}</div>
                                </div>
                            ))}
                        </div>

                        <div className="generation-options">
                            <h4>생성 옵션</h4>
                            <label className="radio-option">
                                <input type="radio" name="genType" value="single" defaultChecked />
                                <span>단일 (10 크레딧)</span>
                            </label>
                            <label className="radio-option">
                                <input type="radio" name="genType" value="pack8" />
                                <span>팩 8개 (50 크레딧)</span>
                            </label>
                        </div>

                        <button className="btn-primary" onClick={handleGenerate}>생성하기</button>
                    </div>
                )}

                {step === 'generating' && (
                    <div className="generating-container">
                        <div className="loading-animation">
                            <div className="spinner"></div>
                        </div>
                        <h2>이모티콘 생성 중...</h2>
                        <p>AI가 열심히 만들고 있어요!</p>
                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                        </div>
                        <div className="progress-text">{progress}%</div>
                        <p className="time-estimate">예상 시간: <span>{Math.max(1, 3 - Math.floor(progress / 33))}초</span></p>
                    </div>
                )}
            </main>
        </div>
    )
}

export default EmojiMaker
