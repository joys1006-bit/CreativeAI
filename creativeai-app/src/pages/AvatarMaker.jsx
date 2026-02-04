import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import apiService from '../services/api'
import useStore from '../store/store'
import './AvatarMaker.css'

function AvatarMaker() {
    const navigate = useNavigate()
    const [step, setStep] = useState('input')
    const [styles, setStyles] = useState([
        { id: 'anime', name: '애니메이션', emoji: '🎨', description: '일본 애니메이션 스타일' },
        { id: '3d', name: '3D 캐릭터', emoji: '🎲', description: '입체감 있는 3D 모델' },
        { id: 'pixel', name: '픽셀아트', emoji: '👾', description: '레트로 픽셀 스타일' },
        { id: 'cartoon', name: '카툰', emoji: '🎭', description: '만화 캐릭터 스타일' },
        { id: 'realistic', name: '사실적', emoji: '📸', description: '실제 사진 같은 스타일' },
        { id: 'fantasy', name: '판타지', emoji: '🧙', description: '판타지 세계관' },
    ])
    const [selectedStyle, setSelectedStyle] = useState('anime')
    const [uploadedImage, setUploadedImage] = useState(null)
    const [generating, setGenerating] = useState(false)
    const [progress, setProgress] = useState(0)

    const addToHistory = useStore((state) => state.addToHistory)
    const useCredits = useStore((state) => state.useCredits)

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

        setGenerating(true)
        setProgress(0)

        result: { emoji: '🎭', variations: ['👨‍🎨', '👩‍🎨', '🧑‍🎨', '👤'] }
    }
})
            }, 500)
        }, 3000)
    }

return (
    <div className="avatar-maker">
        <header className="header">
            <button className="back-btn" onClick={() => navigate(-1)}>←</button>
            <h2>AI 아바타 만들기</h2>
            <div></div>
        </header>

        <main className="content">
            {step === 'input' && (
                <div className="input-section">
                    <h3>어떻게 만들까요?</h3>

                    <label htmlFor="avatar-upload" className="upload-card">
                        <div className="upload-icon">📷</div>
                        <div className="upload-text">
                            <div className="upload-title">사진으로 만들기</div>
                            <div className="upload-subtitle">갤러리에서 선택</div>
                        </div>
                    </label>
                    <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        style={{ display: 'none' }}
                    />

                    <div className="info-box">
                        <h4>💡 팁</h4>
                        <ul>
                            <li>정면을 바라보는 사진이 좋아요</li>
                            <li>밝은 곳에서 찍은 사진을 사용하세요</li>
                            <li>얼굴이 크게 나온 사진이 효과적이에요</li>
                        </ul>
                    </div>
                </div>
            )}

            {step === 'style' && !generating && (
                <div className="style-section">
                    {uploadedImage && (
                        <div className="preview-image">
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
                                <div className="style-emoji">{style.emoji}</div>
                                <div className="style-name">{style.name}</div>
                                <div className="style-desc">{style.description}</div>
                            </div>
                        ))}
                    </div>

                    <button className="btn-generate" onClick={handleGenerate}>
                        아바타 생성하기 (20 크레딧)
                    </button>
                </div>
            )}

            {generating && (
                <div className="generating-section">
                    <div className="loading-animation">
                        <div className="avatar-spinner"></div>
                    </div>
                    <h2>AI 아바타 생성 중...</h2>
                    <p>당신만의 특별한 아바타를 만들고 있어요!</p>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                    </div>
                    <div className="progress-text">{progress}%</div>
                </div>
            )}
        </main>
    </div>
)
}

export default AvatarMaker
