import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Onboarding.css'

const slides = [
    {
        emoji: '🎨',
        title: '나만의 이모티콘 만들기',
        description: '사진 한 장으로 3초 만에\nAI가 이모티콘을 만들어드려요'
    },
    {
        emoji: '✨',
        title: 'AI 뷰티 필터',
        description: '자연스럽고 예쁘게\n과하지 않은 보정'
    },
    {
        emoji: '🛍️',
        title: '크리에이터가 되어보세요',
        description: '작품을 판매하고\n수익을 창출하세요'
    }
]

function Onboarding({ onComplete }) {
    const [currentSlide, setCurrentSlide] = useState(0)
    const navigate = useNavigate()

    const handleNext = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(currentSlide + 1)
        } else {
            onComplete()
            navigate('/home')
        }
    }

    return (
        <div className="onboarding">
            <div className="onboarding-content">
                <div className="slide-animation">
                    <div className="emoji-large">{slides[currentSlide].emoji}</div>
                </div>

                <h1>{slides[currentSlide].title}</h1>
                <p>{slides[currentSlide].description}</p>

                <div className="dots">
                    {slides.map((_, index) => (
                        <span
                            key={index}
                            className={`dot ${index === currentSlide ? 'active' : ''}`}
                        />
                    ))}
                </div>

                <button className="btn-primary" onClick={handleNext}>
                    {currentSlide < slides.length - 1 ? '다음' : '시작하기'}
                </button>
            </div>
        </div>
    )
}

export default Onboarding
