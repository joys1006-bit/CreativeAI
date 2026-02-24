import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * [CDO 담당] 숏폼 템플릿 갤러리
 * - 9:16, 16:9, 1:1, 4:5 비율 프리셋
 * - YouTube/TikTok/Instagram/Shorts 템플릿
 * - 자막 + 영상 레이아웃 프리셋
 */

const TEMPLATES = [
    {
        id: 'youtube-standard',
        name: 'YouTube 표준',
        category: 'landscape',
        ratio: '16:9',
        width: 1920, height: 1080,
        subtitleStyle: { fontSize: 28, position: 'bottom', bold: true, bgColor: 'rgba(0,0,0,0.75)', color: '#FFFFFF' },
        icon: '📺',
        preview: '#dc2626',
    },
    {
        id: 'youtube-shorts',
        name: 'YouTube Shorts',
        category: 'portrait',
        ratio: '9:16',
        width: 1080, height: 1920,
        subtitleStyle: { fontSize: 36, position: 'center', bold: true, bgColor: 'transparent', color: '#FFFFFF', shadow: true },
        icon: '📱',
        preview: '#dc2626',
    },
    {
        id: 'tiktok',
        name: 'TikTok',
        category: 'portrait',
        ratio: '9:16',
        width: 1080, height: 1920,
        subtitleStyle: { fontSize: 34, position: 'center', bold: true, bgColor: 'transparent', color: '#FFD700', shadow: true },
        icon: '🎵',
        preview: '#000000',
    },
    {
        id: 'instagram-reel',
        name: 'Instagram 릴스',
        category: 'portrait',
        ratio: '9:16',
        width: 1080, height: 1920,
        subtitleStyle: { fontSize: 32, position: 'bottom', bold: false, bgColor: 'rgba(0,0,0,0.5)', color: '#FFFFFF' },
        icon: '📸',
        preview: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)',
    },
    {
        id: 'instagram-post',
        name: 'Instagram 포스트',
        category: 'square',
        ratio: '1:1',
        width: 1080, height: 1080,
        subtitleStyle: { fontSize: 26, position: 'bottom', bold: true, bgColor: 'rgba(0,0,0,0.6)', color: '#FFFFFF' },
        icon: '📷',
        preview: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)',
    },
    {
        id: 'cinema-wide',
        name: '시네마 와이드',
        category: 'landscape',
        ratio: '21:9',
        width: 2560, height: 1080,
        subtitleStyle: { fontSize: 24, position: 'bottom', bold: false, bgColor: 'transparent', color: '#E0E0E0', shadow: true, italic: true },
        icon: '🎬',
        preview: '#1a1a2e',
    },
];

const CATEGORIES = [
    { id: 'all', label: '전체' },
    { id: 'portrait', label: '세로 (9:16)' },
    { id: 'landscape', label: '가로 (16:9)' },
    { id: 'square', label: '정사각 (1:1)' },
];

const TemplateGallery = ({ isVisible, onClose, onApplyTemplate }) => {
    const [activeCategory, setActiveCategory] = useState('all');

    const filtered = activeCategory === 'all'
        ? TEMPLATES
        : TEMPLATES.filter(t => t.category === activeCategory);

    const handleApply = useCallback((template) => {
        onApplyTemplate?.({
            subtitleStyle: template.subtitleStyle,
            exportWidth: template.width,
            exportHeight: template.height,
            templateName: template.name,
        });
    }, [onApplyTemplate]);

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="template-gallery"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
            >
                <div className="style-panel-header">
                    <h3>📐 숏폼 템플릿</h3>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                {/* 카테고리 탭 */}
                <div className="template-categories">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            className={`template-cat-btn ${activeCategory === cat.id ? 'active' : ''}`}
                            onClick={() => setActiveCategory(cat.id)}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* 템플릿 그리드 */}
                <div className="template-grid">
                    {filtered.map(template => {
                        const aspectW = parseInt(template.ratio.split(':')[0]);
                        const aspectH = parseInt(template.ratio.split(':')[1]);
                        const maxH = 120;
                        const displayW = (aspectW / aspectH) * maxH;

                        return (
                            <motion.button
                                key={template.id}
                                className="template-card"
                                onClick={() => handleApply(template)}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                            >
                                <div
                                    className="template-preview"
                                    style={{
                                        width: `${Math.min(displayW, 140)}px`,
                                        height: `${maxH}px`,
                                        background: template.preview,
                                        borderRadius: '6px',
                                    }}
                                >
                                    <span className="template-icon">{template.icon}</span>
                                    <span className="template-ratio">{template.ratio}</span>
                                </div>
                                <div className="template-info">
                                    <span className="template-name">{template.name}</span>
                                    <span className="template-resolution">{template.width}×{template.height}</span>
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default TemplateGallery;
