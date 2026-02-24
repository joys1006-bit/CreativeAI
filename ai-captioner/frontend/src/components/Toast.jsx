import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * 토스트 알림 컴포넌트
 * - 성공/실패/정보 타입에 따른 아이콘 및 색상 분기
 * - 자동 소멸(3초) + Framer Motion 슬라이드 애니메이션
 */
const Toast = ({ toasts, onRemove }) => {
    const typeConfig = {
        success: { icon: '✅', color: 'var(--accent-green)' },
        error: { icon: '❌', color: 'var(--accent-red)' },
        info: { icon: 'ℹ️', color: 'var(--primary-light)' },
        warning: { icon: '⚠️', color: 'var(--accent-orange)' }
    };

    return (
        <div className="toast-container">
            <AnimatePresence>
                {toasts.map(toast => {
                    const config = typeConfig[toast.type] || typeConfig.info;
                    return (
                        <motion.div
                            key={toast.id}
                            className="toast-item"
                            initial={{ opacity: 0, x: 100, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 100, scale: 0.9 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            onClick={() => onRemove(toast.id)}
                            style={{ borderLeftColor: config.color }}
                        >
                            <span className="toast-icon">{config.icon}</span>
                            <span className="toast-message">{toast.message}</span>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};

export default Toast;
