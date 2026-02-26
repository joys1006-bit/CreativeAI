import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * [CPO 담당] 키보드 숏컷 가이드 모달
 * - 모든 단축키 목록 표시
 * - ? 키로 토글
 * - 카테고리별 정리
 */

const SHORTCUTS = [
    {
        category: '재생',
        items: [
            { keys: ['Space'], desc: '재생/일시정지' },
            { keys: ['←'], desc: '5초 뒤로' },
            { keys: ['→'], desc: '5초 앞으로' },
            { keys: ['Shift', '←'], desc: '1초 뒤로' },
            { keys: ['Shift', '→'], desc: '1초 앞으로' },
        ],
    },
    {
        category: '편집',
        items: [
            { keys: ['Ctrl', 'Z'], desc: '되돌리기' },
            { keys: ['Ctrl', 'Shift', 'Z'], desc: '다시하기' },
            { keys: ['Ctrl', 'S'], desc: 'SRT 저장' },
            { keys: ['Ctrl', 'Shift', 'E'], desc: '영상 내보내기' },
        ],
    },
    {
        category: '자막',
        items: [
            { keys: ['Enter'], desc: '현재 위치에 자막 분할' },
            { keys: ['Delete'], desc: '선택 자막 삭제' },
            { keys: ['Ctrl', 'M'], desc: '선택 자막 합치기' },
        ],
    },
    {
        category: '싱크 조절',
        items: [
            { keys: ['['], desc: '싱크 -0.5초' },
            { keys: [']'], desc: '싱크 +0.5초' },
        ],
    },
    {
        category: '보기',
        items: [
            { keys: ['?'], desc: '단축키 가이드 토글' },
            { keys: ['Ctrl', 'F'], desc: '자막 검색' },
            { keys: ['F11'], desc: '전체화면 토글' },
            { keys: ['Ctrl', 'I'], desc: 'AI 분석 패널 토글' },
            { keys: ['Ctrl', 'T'], desc: '테마 전환' },
        ],
    },
];

const ShortcutGuide = ({ isVisible, onClose }) => {
    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="shortcut-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="shortcut-modal"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="shortcut-header">
                        <h3>⌨️ 키보드 단축키</h3>
                        <button className="close-btn" onClick={onClose}>✕</button>
                    </div>

                    <div className="shortcut-body">
                        {SHORTCUTS.map((group) => (
                            <div key={group.category} className="shortcut-group">
                                <h4 className="shortcut-category">{group.category}</h4>
                                <div className="shortcut-list">
                                    {group.items.map((item, i) => (
                                        <div key={i} className="shortcut-row">
                                            <div className="shortcut-keys">
                                                {item.keys.map((key, j) => (
                                                    <React.Fragment key={j}>
                                                        {j > 0 && <span className="key-plus">+</span>}
                                                        <kbd className="key-badge">{key}</kbd>
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                            <span className="shortcut-desc">{item.desc}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="shortcut-footer">
                        <span>? 키를 눌러 이 창을 열고 닫을 수 있습니다</span>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ShortcutGuide;
