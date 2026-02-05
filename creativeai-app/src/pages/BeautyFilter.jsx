import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import apiService from '../services/api'
import './BeautyFilter.css'

function BeautyFilter() {
    const navigate = useNavigate()
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const [stream, setStream] = useState(null)
    const [cameraActive, setCameraActive] = useState(false)
    const [filters, setFilters] = useState({
        brightness: 50,
        eyeSize: 30,
        noseSlim: 20,
        jawline: 25,
    })
    const [autoBeauty, setAutoBeauty] = useState(false)

    useEffect(() => {
        startCamera()
        return () => {
            stopCamera()
        }
    }, [])

    useEffect(() => {
        if (cameraActive && videoRef.current) {
            applyFilters()
        }
    }, [filters, cameraActive])

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: 1280, height: 720 },
                audio: false
            })
            setStream(mediaStream)
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream
                setCameraActive(true)
            }
        } catch (err) {
            console.error('카메라 접근 실패:', err)
            // 배포 환경/http 에서는 카메라 접근이 제한될 수 있음
            // alert('카메라에 접근할 수 없습니다. 권한을 확인해주세요.')
        }
    }

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop())
        }
    }

    const applyFilters = () => {
        if (!videoRef.current || !canvasRef.current) return

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        const video = videoRef.current

        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        const drawFrame = () => {
            if (!cameraActive) return

            ctx.filter = `brightness(${100 + (filters.brightness - 50)}%)`
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

            requestAnimationFrame(drawFrame)
        }

        drawFrame()
    }

    const handleFilterChange = (filterName, value) => {
        setFilters(prev => ({ ...prev, [filterName]: parseInt(value) }))
    }

    const capturePhoto = () => {
        if (!canvasRef.current) return

        const canvas = canvasRef.current
        const imageData = canvas.toDataURL('image/png')

        // 이모티콘 메이커로 이동
        navigate('/emoji-maker', { state: { capturedImage: imageData } })
    }

    const handleAutoBeauty = (checked) => {
        setAutoBeauty(checked)
        if (checked) {
            setFilters({
                brightness: 60,
                eyeSize: 40,
                noseSlim: 35,
                jawline: 40,
            })
        } else {
            setFilters({
                brightness: 50,
                eyeSize: 30,
                noseSlim: 20,
                jawline: 25,
            })
        }
    }

    const handleSaveToServer = async () => {
        if (!canvasRef.current) return

        const canvas = canvasRef.current
        const imageData = canvas.toDataURL('image/png')

        try {
            // 백엔드에 뷰티 필터 적용 및 저장 요청
            // 현재 설정된 필터 값을 기반으로 요청
            const filterType = autoBeauty ? 'auto_beauty' : 'custom'
            const intensity = filters.brightness // 대표값으로 사용

            const result = await apiService.applyBeautyFilter(imageData, filterType, intensity)

            if (result.status === 'completed' || result.resultImageUrl) {
                alert('갤러리에 저장되었습니다!')
            } else {
                alert('저장 중입니다..')
            }
        } catch (error) {
            console.error('Save failed:', error)
            alert('저장에 실패했습니다.')
        }
    }

    return (
        <div className="beauty-filter">
            <header className="header">
                <button className="back-btn" onClick={() => navigate(-1)}>←</button>
                <h2>뷰티 필터</h2>
                <button className="icon-btn">⚙️</button>
            </header>

            <main className="content">
                <div className="camera-preview">
                    {cameraActive ? (
                        <>
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                style={{ display: 'none' }}
                            />
                            <canvas ref={canvasRef} className="camera-canvas" />
                        </>
                    ) : (
                        <div className="preview-placeholder">
                            <p>📸 카메라 시작 중...</p>
                        </div>
                    )}
                </div>

                <div className="filter-controls">
                    <div className="auto-beauty">
                        <label className="toggle-switch">
                            <span>원터치 뷰티</span>
                            <input
                                type="checkbox"
                                checked={autoBeauty}
                                onChange={(e) => handleAutoBeauty(e.target.checked)}
                            />
                            <span className="slider"></span>
                        </label>
                    </div>

                    <div className="slider-control">
                        <label>피부 보정</label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={filters.brightness}
                            onChange={(e) => handleFilterChange('brightness', e.target.value)}
                            className="beauty-slider"
                        />
                        <span className="slider-value">{filters.brightness}</span>
                    </div>

                    <div className="slider-control">
                        <label>눈 크기</label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={filters.eyeSize}
                            onChange={(e) => handleFilterChange('eyeSize', e.target.value)}
                            className="beauty-slider"
                        />
                        <span className="slider-value">{filters.eyeSize}</span>
                    </div>

                    <div className="slider-control">
                        <label>코 라인</label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={filters.noseSlim}
                            onChange={(e) => handleFilterChange('noseSlim', e.target.value)}
                            className="beauty-slider"
                        />
                        <span className="slider-value">{filters.noseSlim}</span>
                    </div>

                    <div className="slider-control">
                        <label>턱선</label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={filters.jawline}
                            onChange={(e) => handleFilterChange('jawline', e.target.value)}
                            className="beauty-slider"
                        />
                        <span className="slider-value">{filters.jawline}</span>
                    </div>
                </div>

                <div className="filter-tabs">
                    <button className="filter-tab active">기본</button>
                    <button className="filter-tab">메이크업</button>
                    <button className="filter-tab">필터</button>
                </div>

                <div className="camera-actions">
                    <button className="camera-btn" onClick={capturePhoto}>📸 촬영</button>
                    <button className="camera-btn" onClick={handleSaveToServer}>💾 저장</button>
                    <button className="camera-btn" onClick={() => navigate('/emoji-maker')}>🖼️ 갤러리</button>
                </div>
            </main>
        </div>
    )
}

export default BeautyFilter
