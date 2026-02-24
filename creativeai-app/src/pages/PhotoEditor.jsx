import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import apiService from '../services/api'
import './PhotoEditor.css'

function PhotoEditor() {
    const navigate = useNavigate()
    const [uploadedImage, setUploadedImage] = useState(null)
    const [originalImage, setOriginalImage] = useState(null)
    const [tool, setTool] = useState('filter')
    const [isProcessing, setIsProcessing] = useState(false)
    const [filters, setFilters] = useState({
        brightness: 100,
        contrast: 100,
        saturation: 100,
        blur: 0,
    })
    const fileInputRef = useRef(null)

    const handleImageUpload = (e) => {
        const file = e.target.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (event) => {
                setUploadedImage(event.target.result)
                setOriginalImage(event.target.result)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleReset = () => {
        if (window.confirm('모든 편집 내용을 취소하고 원본으로 되돌릴까요?')) {
            setUploadedImage(originalImage)
            setFilters({
                brightness: 100,
                contrast: 100,
                saturation: 100,
                blur: 0,
            })
        }
    }

    const handleFilterChange = (filterName, value) => {
        setFilters(prev => ({ ...prev, [filterName]: parseInt(value) }))
    }

    const getFilterStyle = () => {
        return {
            filter: `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%) blur(${filters.blur}px)`
        }
    }

    const handleSave = async () => {
        if (!uploadedImage) {
            alert('편집할 이미지가 없습니다.')
            return
        }

        try {
            // 현재 적용된 필터 정보를 파라미터로 전송
            const params = { ...filters }

            // 실제 구현에서는 캔버스에서 이미지를 추출하여 전송해야 하지만,
            // 여기서는 원본 이미지와 파라미터를 보냅니다.
            const result = await apiService.editPhoto(uploadedImage, 'filter_adjust', params)

            if (result.status === 'completed' || result.resultImageUrl) {
                alert('이미지가 성공적으로 저장되었습니다!')
                // 결과 페이지로 이동하거나 다운로드 로직 추가 가능
            } else {
                alert('이미지 저장 중입니다. 잠시 후 확인해주세요.')
            }
        } catch (error) {
            console.error('Save failed:', error)
            alert('저장에 실패했습니다.')
        }
    }

    const [showStylePanel, setShowStylePanel] = useState(false)

    const handleAiEdit = async (operation, style = null) => {
        if (!uploadedImage) {
            alert('먼저 사진을 업로드해주세요.')
            return
        }

        if (operation === 'style_transfer' && !style && !showStylePanel) {
            setShowStylePanel(true)
            return
        }

        setIsProcessing(true)
        try {
            const params = style ? { style } : {}
            const result = await apiService.editPhoto(uploadedImage, operation, params)
            if (result.success && result.data.resultImageUrl) {
                setUploadedImage(result.data.resultImageUrl)
                setShowStylePanel(false)
            }
        } catch (error) {
            console.error('AI Edit failed:', error)
        } finally {
            setIsProcessing(false)
        }
    }

    const aiStyles = [
        { id: 'anime', name: '애니메이션', icon: '🎎' },
        { id: '3d-model', name: '3D 모델', icon: '🧊' },
        { id: 'cinematic', name: '시네마틱', icon: '🎬' },
        { id: 'comic-book', name: '만화책', icon: '📖' },
        { id: 'pixel-art', name: '픽셀 아트', icon: '👾' },
        { id: 'digital-art', name: '디지털 아트', icon: '💻' }
    ]

    const handlePresetClick = (preset) => {
        switch (preset) {
            case 'vintage':
                setFilters({ brightness: 90, contrast: 110, saturation: 70, blur: 0 })
                break
            case 'bw':
                setFilters({ brightness: 100, contrast: 120, saturation: 0, blur: 0 })
                break
            case 'sepia':
                setFilters({ brightness: 100, contrast: 95, saturation: 40, blur: 0 })
                break
            default:
                setFilters({ brightness: 100, contrast: 100, saturation: 100, blur: 0 })
        }
    }

    return (
        <div className="photo-editor">
            <header className="header">
                <button className="back-btn" onClick={() => navigate(-1)}>←</button>
                <h2>사진 편집</h2>
                <button className="save-btn" onClick={handleSave}>저장</button>
            </header>

            <main className="content">
                <div className="editor-canvas">
                    {uploadedImage ? (
                        <div className="editing-image-wrapper">
                            <img
                                src={uploadedImage}
                                alt="Editing"
                                style={getFilterStyle()}
                                className="editing-image"
                            />
                            <div className="canvas-actions">
                                <button className="action-circle-btn" onClick={handleReset} title="원본으로 되돌리기">🔄</button>
                                <button className="action-circle-btn" onClick={() => fileInputRef.current?.click()} title="사진 교체">📷</button>
                            </div>
                            {isProcessing && (
                                <div className="processing-overlay">
                                    <div className="spinner"></div>
                                    <p>AI가 스타일을 입히는 중...</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="upload-placeholder" onClick={() => fileInputRef.current?.click()}>
                            <div className="placeholder-icon">🖼️</div>
                            <p>사진을 선택하세요</p>
                            <button className="btn-upload">갤러리에서 선택</button>
                        </div>
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        style={{ display: 'none' }}
                    />
                </div>

                <div className="tool-tabs">
                    <button
                        className={`tool-tab ${tool === 'filter' ? 'active' : ''}`}
                        onClick={() => { setTool('filter'); setShowStylePanel(false); }}
                    >
                        필터
                    </button>
                    <button
                        className={`tool-tab ${tool === 'adjust' ? 'active' : ''}`}
                        onClick={() => { setTool('adjust'); setShowStylePanel(false); }}
                    >
                        조정
                    </button>
                    <button
                        className={`tool-tab ${tool === 'ai' ? 'active' : ''}`}
                        onClick={() => setTool('ai')}
                    >
                        AI 도구
                    </button>
                </div>

                {tool === 'filter' && (
                    <div className="filter-presets">
                        <div className="preset-item" onClick={() => handlePresetClick('original')}>
                            <div className="preset-preview">🌅</div>
                            <div className="preset-name">원본</div>
                        </div>
                        <div className="preset-item" onClick={() => handlePresetClick('vintage')}>
                            <div className="preset-preview">🌆</div>
                            <div className="preset-name">빈티지</div>
                        </div>
                        <div className="preset-item" onClick={() => handlePresetClick('bw')}>
                            <div className="preset-preview">🌃</div>
                            <div className="preset-name">흑백</div>
                        </div>
                        <div className="preset-item" onClick={() => handlePresetClick('sepia')}>
                            <div className="preset-preview">🌇</div>
                            <div className="preset-name">세피아</div>
                        </div>
                    </div>
                )}

                {tool === 'adjust' && (
                    <div className="adjust-controls">
                        <div className="control-item">
                            <label>밝기</label>
                            <input
                                type="range"
                                min="0"
                                max="200"
                                value={filters.brightness}
                                onChange={(e) => handleFilterChange('brightness', e.target.value)}
                            />
                            <span>{filters.brightness}%</span>
                        </div>
                        <div className="control-item">
                            <label>대비</label>
                            <input
                                type="range"
                                min="0"
                                max="200"
                                value={filters.contrast}
                                onChange={(e) => handleFilterChange('contrast', e.target.value)}
                            />
                            <span>{filters.contrast}%</span>
                        </div>
                        <div className="control-item">
                            <label>채도</label>
                            <input
                                type="range"
                                min="0"
                                max="200"
                                value={filters.saturation}
                                onChange={(e) => handleFilterChange('saturation', e.target.value)}
                            />
                            <span>{filters.saturation}%</span>
                        </div>
                        <div className="control-item">
                            <label>흐림</label>
                            <input
                                type="range"
                                min="0"
                                max="10"
                                value={filters.blur}
                                onChange={(e) => handleFilterChange('blur', e.target.value)}
                            />
                            <span>{filters.blur}px</span>
                        </div>
                    </div>
                )}

                {tool === 'ai' && (
                    <div className="ai-container">
                        <div className="ai-tools">
                            <button className="ai-tool-btn" onClick={() => handleAiEdit('remove_bg')}>
                                <span className="tool-icon">✂️</span>
                                <span className="tool-name">배경 제거</span>
                            </button>
                            <button className={`ai-tool-btn ${showStylePanel ? 'active' : ''}`} onClick={() => handleAiEdit('style_transfer')}>
                                <span className="tool-icon">🎨</span>
                                <span className="tool-name">스타일 변환</span>
                            </button>
                        </div>

                        {showStylePanel && (
                            <div className="style-selection-panel slide-up">
                                <h3>변환할 스타일 선택</h3>
                                <div className="style-grid">
                                    {aiStyles.map(s => (
                                        <button
                                            key={s.id}
                                            className="style-item"
                                            onClick={() => handleAiEdit('style_transfer', s.id)}
                                        >
                                            <span className="style-icon">{s.icon}</span>
                                            <span className="style-name">{s.name}</span>
                                        </button>
                                    ))}
                                </div>
                                <button className="close-panel" onClick={() => setShowStylePanel(false)}>닫기</button>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    )
}

export default PhotoEditor
