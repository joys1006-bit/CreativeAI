import React from 'react';
import { motion } from 'framer-motion';

/**
 * 프로그레스 오버레이 컴포넌트
 * 업로드 → 오디오 추출 → AI 분석 → 교정 단계별 진행률 표시
 */
const STAGES = [
    { key: 'uploading', label: '📤 영상 업로드 중...', percent: 15 },
    { key: 'extracting', label: '🎵 오디오 추출 중...', percent: 30 },
    { key: 'transcribing', label: '🧠 Whisper AI 분석 중...', percent: 55 },
    { key: 'correcting', label: '✍️ Gemini 텍스트 교정 중...', percent: 80 },
    { key: 'finalizing', label: '📝 자막 최종 정리 중...', percent: 95 }
];

const ProgressOverlay = ({ status, progress }) => {
    // status: 'uploading' | 'processing' 일 때만 표시
    if (status !== 'uploading' && status !== 'processing') return null;

    // progress 객체에서 현재 단계 결정
    const currentStage = progress?.stage || (status === 'uploading' ? 'uploading' : 'transcribing');
    const stageIndex = STAGES.findIndex(s => s.key === currentStage);
    const currentPercent = stageIndex >= 0 ? STAGES[stageIndex].percent : 20;
    const currentLabel = stageIndex >= 0 ? STAGES[stageIndex].label : '⏳ 처리 중...';

    return (
        <motion.div
            className="progress-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="progress-card">
                {/* 단계 인디케이터 */}
                <div className="progress-stages">
                    {STAGES.map((stage, idx) => (
                        <div
                            key={stage.key}
                            className={`progress-stage-dot ${idx <= stageIndex ? 'active' : ''} ${idx === stageIndex ? 'current' : ''}`}
                        >
                            <div className="dot-circle" />
                            <span className="dot-label">{stage.label.split(' ').slice(1).join(' ').replace('...', '')}</span>
                        </div>
                    ))}
                </div>

                {/* 프로그레스 바 */}
                <div className="progress-bar-container">
                    <motion.div
                        className="progress-bar-fill"
                        initial={{ width: '0%' }}
                        animate={{ width: `${currentPercent}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                </div>

                {/* 현재 단계 라벨 */}
                <motion.p
                    className="progress-label"
                    key={currentLabel}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {currentLabel}
                </motion.p>

                {/* 펄스 스피너 */}
                <div className="progress-spinner">
                    <motion.div
                        className="spinner-ring"
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                    />
                </div>
            </div>
        </motion.div>
    );
};

export default ProgressOverlay;
