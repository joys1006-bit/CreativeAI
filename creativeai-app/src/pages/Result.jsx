import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState } from 'react'
import './Result.css'

function Result() {
    const navigate = useNavigate()
    const location = useLocation()
    const result = location.state?.result
    const [selectedImage, setSelectedImage] = useState(0)

    // 생성된 파일들
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
            link.download = `creativeai-emoji-${Date.now()}.png`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)
            alert('다운로드가 시작되었습니다!')
        } catch (error) {
            console.error('Download error:', error)
            alert('다운로드 중 오류가 발생했습니다.')
        }
    }

    const handleShare = async () => {
        if (!files[selectedImage]) return

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'CreativeAI 이모티콘',
                    text: 'AI로 만든 내 이모티콘!',
                    url: files[selectedImage].file_url
                })
            } catch (error) {
                console.error('Share error:', error)
            }
        } else {
            // Fallback: URL 복사
            navigator.clipboard.writeText(files[selectedImage].file_url)
            alert('이미지 URL이 복사되었습니다!')
        }
    }

    if (!result || files.length === 0) {
        return (
            <div className="result">
                <header className="header glass-effect">
                    <button className="back-btn" onClick={() => navigate('/home')}>←</button>
                    <h2>결과 없음</h2>
                    <div></div>
                </header>
                <main className="content center-content">
                    <p>생성된 이미지를 찾을 수 없습니다.</p>
                    <button className="btn-primary" onClick={() => navigate('/emoji-maker')}>
                        다시 생성하기
                    </button>
                </main>
            </div>
        )
    }

    return (
        <div className="result">
            <header className="header glass-effect">
                <motion.button
                    className="back-btn"
                    onClick={() => navigate('/home')}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >←</motion.button>
                <h2>완성! 🎉</h2>
                <div style={{ width: 40 }}></div>
            </header>

            <main className="content">
                <motion.div
                    className="result-preview glass-card"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                >
                    <img
                        src={files[selectedImage]?.file_url || primaryFile?.file_url}
                        alt="Generated Emoji"
                        className="result-image"
                        style={{ width: '100%', maxWidth: '400px', borderRadius: '12px' }}
                    />
                </motion.div>

                {files.length > 1 && (
                    <div className="other-versions">
                        <h4>다른 버전 ({files.length}개)</h4>
                        <div className="version-scroll">
                            {files.map((file, index) => (
                                <motion.div
                                    key={index}
                                    className={`version-card ${selectedImage === index ? 'active' : ''}`}
                                    onClick={() => setSelectedImage(index)}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <img
                                        src={file.thumbnail_url || file.file_url}
                                        alt={`Version ${index + 1}`}
                                        className="version-preview"
                                        style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover' }}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="result-info glass-card">
                    <p>스타일: <strong>{result.style_name || '커스텀'}</strong></p>
                    <p>생성 시간: {new Date(result.created_at).toLocaleString('ko-KR')}</p>
                </div>

                <div className="action-buttons">
                    <motion.button
                        className="btn-secondary"
                        onClick={() => navigate('/emoji-maker')}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        🔄 다시생성
                    </motion.button>
                    <motion.button
                        className="btn-primary"
                        onClick={handleDownload}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        💾 다운로드
                    </motion.button>
                    <motion.button
                        className="btn-primary"
                        onClick={handleShare}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        📤 공유
                    </motion.button>
                </div>
            </main>
        </div>
    )
}

export default Result
