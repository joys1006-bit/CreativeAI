import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * [CDO 담당] 자막 스타일 패널
 * - 폰트, 크기, 색상, 배경, 위치, 그림자 설정
 * - 실시간 프리뷰 반영
 * - Vrew 스타일 프리셋 지원
 */

const FONT_OPTIONS = [
    { label: 'Pretendard', value: "'Pretendard', sans-serif" },
    { label: 'Noto Sans KR', value: "'Noto Sans KR', sans-serif" },
    { label: 'Outfit', value: "'Outfit', sans-serif" },
    { label: 'Arial', value: "Arial, sans-serif" },
    { label: '맑은 고딕', value: "'Malgun Gothic', sans-serif" },
];

const PRESETS = [
    {
        name: '기본',
        style: { fontFamily: "'Pretendard', sans-serif", fontSize: 24, color: '#FFFFFF', bgColor: 'rgba(0,0,0,0.6)', position: 'bottom', shadow: true, bold: false, italic: false }
    },
    {
        name: 'YouTube',
        style: { fontFamily: "'Noto Sans KR', sans-serif", fontSize: 28, color: '#FFFFFF', bgColor: 'rgba(0,0,0,0.8)', position: 'bottom', shadow: true, bold: true, italic: false }
    },
    {
        name: 'TikTok',
        style: { fontFamily: "'Outfit', sans-serif", fontSize: 32, color: '#FFD700', bgColor: 'transparent', position: 'center', shadow: true, bold: true, italic: false }
    },
    {
        name: '시네마',
        style: { fontFamily: "Arial, sans-serif", fontSize: 20, color: '#E0E0E0', bgColor: 'transparent', position: 'bottom', shadow: true, bold: false, italic: true }
    },
    {
        name: '뉴스',
        style: { fontFamily: "'Pretendard', sans-serif", fontSize: 22, color: '#FFFFFF', bgColor: 'rgba(0, 100, 200, 0.85)', position: 'bottom', shadow: false, bold: true, italic: false }
    },
];

const SubtitleStylePanel = ({ style, onStyleChange, isVisible, onClose }) => {
    const [activeSection, setActiveSection] = useState('presets');

    if (!isVisible) return null;

    const updateStyle = (key, value) => {
        onStyleChange({ ...style, [key]: value });
    };

    const applyPreset = (preset) => {
        onStyleChange({ ...preset.style });
    };

    return (
        <AnimatePresence>
            <motion.div
                className="style-panel"
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 300, opacity: 0 }}
                transition={{ type: 'spring', damping: 25 }}
            >
                <div className="style-panel-header">
                    <h3>자막 스타일</h3>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                {/* 탭 */}
                <div className="style-tabs">
                    <button
                        className={`style-tab ${activeSection === 'presets' ? 'active' : ''}`}
                        onClick={() => setActiveSection('presets')}
                    >프리셋</button>
                    <button
                        className={`style-tab ${activeSection === 'custom' ? 'active' : ''}`}
                        onClick={() => setActiveSection('custom')}
                    >사용자 정의</button>
                </div>

                {/* 프리셋 섹션 */}
                {activeSection === 'presets' && (
                    <div className="style-section">
                        <div className="preset-grid">
                            {PRESETS.map((preset) => (
                                <button
                                    key={preset.name}
                                    className="preset-card"
                                    onClick={() => applyPreset(preset)}
                                >
                                    <div
                                        className="preset-preview"
                                        style={{
                                            fontFamily: preset.style.fontFamily,
                                            fontSize: `${Math.min(preset.style.fontSize * 0.5, 16)}px`,
                                            color: preset.style.color,
                                            background: preset.style.bgColor,
                                            fontWeight: preset.style.bold ? 700 : 400,
                                            fontStyle: preset.style.italic ? 'italic' : 'normal',
                                            textShadow: preset.style.shadow ? '2px 2px 4px rgba(0,0,0,0.8)' : 'none',
                                            padding: '6px 10px',
                                            borderRadius: '4px',
                                            textAlign: 'center',
                                        }}
                                    >
                                        안녕하세요
                                    </div>
                                    <span className="preset-name">{preset.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* 사용자 정의 섹션 */}
                {activeSection === 'custom' && (
                    <div className="style-section">
                        {/* 폰트 */}
                        <div className="style-row">
                            <label>폰트</label>
                            <select
                                value={style.fontFamily}
                                onChange={(e) => updateStyle('fontFamily', e.target.value)}
                            >
                                {FONT_OPTIONS.map(f => (
                                    <option key={f.value} value={f.value}>{f.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* 크기 */}
                        <div className="style-row">
                            <label>크기</label>
                            <div className="slider-group">
                                <input
                                    type="range" min="12" max="72"
                                    value={style.fontSize}
                                    onChange={(e) => updateStyle('fontSize', parseInt(e.target.value))}
                                />
                                <span className="slider-value">{style.fontSize}px</span>
                            </div>
                        </div>

                        {/* 텍스트 색상 */}
                        <div className="style-row">
                            <label>글자 색</label>
                            <div className="color-picker-group">
                                <input
                                    type="color"
                                    value={style.color}
                                    onChange={(e) => updateStyle('color', e.target.value)}
                                />
                                <span>{style.color}</span>
                            </div>
                        </div>

                        {/* 배경 색상 */}
                        <div className="style-row">
                            <label>배경 색</label>
                            <div className="color-picker-group">
                                <input
                                    type="color"
                                    value={style.bgColor === 'transparent' ? '#000000' : style.bgColor.replace(/rgba?\([^)]+\)/, '#000000')}
                                    onChange={(e) => {
                                        const hex = e.target.value;
                                        const r = parseInt(hex.substr(1, 2), 16);
                                        const g = parseInt(hex.substr(3, 2), 16);
                                        const b = parseInt(hex.substr(5, 2), 16);
                                        updateStyle('bgColor', `rgba(${r},${g},${b},0.7)`);
                                    }}
                                />
                                <button
                                    className={`toggle-btn ${style.bgColor === 'transparent' ? 'active' : ''}`}
                                    onClick={() => updateStyle('bgColor', style.bgColor === 'transparent' ? 'rgba(0,0,0,0.6)' : 'transparent')}
                                >
                                    {style.bgColor === 'transparent' ? '없음' : '있음'}
                                </button>
                            </div>
                        </div>

                        {/* 위치 */}
                        <div className="style-row">
                            <label>위치</label>
                            <div className="position-group">
                                {['top', 'center', 'bottom'].map(pos => (
                                    <button
                                        key={pos}
                                        className={`pos-btn ${style.position === pos ? 'active' : ''}`}
                                        onClick={() => updateStyle('position', pos)}
                                    >
                                        {pos === 'top' ? '상단' : pos === 'center' ? '중앙' : '하단'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 스타일 옵션 */}
                        <div className="style-row">
                            <label>옵션</label>
                            <div className="option-group">
                                <button
                                    className={`opt-btn ${style.bold ? 'active' : ''}`}
                                    onClick={() => updateStyle('bold', !style.bold)}
                                >
                                    <strong>B</strong>
                                </button>
                                <button
                                    className={`opt-btn ${style.italic ? 'active' : ''}`}
                                    onClick={() => updateStyle('italic', !style.italic)}
                                >
                                    <em>I</em>
                                </button>
                                <button
                                    className={`opt-btn ${style.shadow ? 'active' : ''}`}
                                    onClick={() => updateStyle('shadow', !style.shadow)}
                                >
                                    S
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 실시간 프리뷰 */}
                <div className="style-preview-area">
                    <div className="preview-label">미리보기</div>
                    <div className="preview-screen">
                        <div
                            className="preview-subtitle"
                            style={{
                                fontFamily: style.fontFamily,
                                fontSize: `${Math.min(style.fontSize, 28)}px`,
                                color: style.color,
                                background: style.bgColor,
                                fontWeight: style.bold ? 700 : 400,
                                fontStyle: style.italic ? 'italic' : 'normal',
                                textShadow: style.shadow ? '2px 2px 4px rgba(0,0,0,0.8)' : 'none',
                                alignSelf: style.position === 'top' ? 'flex-start' : style.position === 'center' ? 'center' : 'flex-end',
                                padding: '6px 14px',
                                borderRadius: '4px',
                            }}
                        >
                            AI Captioner PRO 자막 미리보기
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default SubtitleStylePanel;
