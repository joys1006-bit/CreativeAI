import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import apiService from '../services/api'
import './PhotoEditor.css'

function PhotoEditor() {
    const navigate = useNavigate()
    const [uploadedImage, setUploadedImage] = useState(null)
    const [tool, setTool] = useState('filter')
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
            }
            reader.readAsDataURL(file)
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

    const handleRemoveBackground = () => {
        alert('배경 제거 기능은 곧 출시됩니다!')
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
                        <img
                            src={uploadedImage}
                            alt="Editing"
                            style={getFilterStyle()}
                            className="editing-image"
                        />
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
                        onClick={() => setTool('filter')}
                    >
                        필터
                    </button>
                    <button
                        className={`tool-tab ${tool === 'adjust' ? 'active' : ''}`}
                        onClick={() => setTool('adjust')}
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
                        <div className="preset-item">
                            <div className="preset-preview">🌅</div>
                            <div className="preset-name">원본</div>
                        </div>
                        <div className="preset-item">
                            <div className="preset-preview">🌆</div>
                            <div className="preset-name">빈티지</div>
                        </div>
                        <div className="preset-item">
                            <div className="preset-preview">🌃</div>
                            <div className="preset-name">흑백</div>
                        </div>
                        <div className="preset-item">
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
                    <div className="ai-tools">
                        <button className="ai-tool-btn" onClick={handleRemoveBackground}>
                            <span className="tool-icon">✂️</span>
                            <span className="tool-name">배경 제거</span>
                        </button>
                        <button className="ai-tool-btn" onClick={() => alert('곧 출시됩니다!')}>
                            <span className="tool-icon">✨</span>
                            <span className="tool-name">화질 개선</span>
                        </button>
                        <button className="ai-tool-btn" onClick={() => alert('곧 출시됩니다!')}>
                            <span className="tool-icon">🎨</span>
                            <span className="tool-name">스타일 변환</span>
                        </button>
                        <button className="ai-tool-btn" onClick={() => alert('곧 출시됩니다!')}>
                            <span className="tool-icon">🔍</span>
                            <span className="tool-name">확대</span>
                        </button>
                    </div>
                )}
            </main>
        </div>
    )
}

export default PhotoEditor
