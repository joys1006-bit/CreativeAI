import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * [CPO 담당] TTS 패널
 * - 자막 텍스트를 AI 음성으로 변환
 * - 보이스 선택 및 미리 듣기
 * - Web Speech API 활용
 */

const VOICES = [
    { id: 'ko-female-1', name: '서연 (여성)', lang: 'ko-KR', pitch: 1.1, rate: 1.0 },
    { id: 'ko-male-1', name: '민준 (남성)', lang: 'ko-KR', pitch: 0.9, rate: 1.0 },
    { id: 'ko-female-2', name: '하늘 (여성)', lang: 'ko-KR', pitch: 1.2, rate: 1.05 },
    { id: 'en-female-1', name: 'Emma (Female)', lang: 'en-US', pitch: 1.1, rate: 1.0 },
    { id: 'en-male-1', name: 'James (Male)', lang: 'en-US', pitch: 0.85, rate: 0.95 },
    { id: 'ja-female-1', name: 'さくら (女性)', lang: 'ja-JP', pitch: 1.15, rate: 1.0 },
    { id: 'zh-female-1', name: '小雨 (女性)', lang: 'zh-CN', pitch: 1.1, rate: 1.0 },
];

const TtsPanel = ({ isVisible, onClose, captions = [], currentCaption }) => {
    const [selectedVoice, setSelectedVoice] = useState(VOICES[0]);
    const [speaking, setSpeaking] = useState(false);
    const [rate, setRate] = useState(1.0);
    const [pitch, setPitch] = useState(1.0);

    useEffect(() => {
        return () => window.speechSynthesis?.cancel();
    }, []);

    const speak = useCallback((text) => {
        if (!text || !window.speechSynthesis) return;
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = selectedVoice.lang;
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = 1;

        utterance.onstart = () => setSpeaking(true);
        utterance.onend = () => setSpeaking(false);
        utterance.onerror = () => setSpeaking(false);

        // 시스템 보이스 매칭 시도
        const voices = window.speechSynthesis.getVoices();
        const match = voices.find(v => v.lang === selectedVoice.lang);
        if (match) utterance.voice = match;

        window.speechSynthesis.speak(utterance);
    }, [selectedVoice, rate, pitch]);

    const speakAll = useCallback(() => {
        if (captions.length === 0) return;
        const allText = captions.map(c => c.text).join('. ');
        speak(allText);
    }, [captions, speak]);

    const stop = () => {
        window.speechSynthesis?.cancel();
        setSpeaking(false);
    };

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="tts-panel"
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 300, opacity: 0 }}
                transition={{ type: 'spring', damping: 25 }}
            >
                <div className="style-panel-header">
                    <h3>🔊 AI 음성 (TTS)</h3>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                {/* 보이스 선택 */}
                <div className="tts-section">
                    <label className="tts-label">보이스 선택</label>
                    <div className="voice-grid">
                        {VOICES.map(voice => (
                            <button
                                key={voice.id}
                                className={`voice-card ${selectedVoice.id === voice.id ? 'active' : ''}`}
                                onClick={() => setSelectedVoice(voice)}
                            >
                                <span className="voice-name">{voice.name}</span>
                                <span className="voice-lang">{voice.lang.split('-')[0].toUpperCase()}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 음성 설정 */}
                <div className="tts-section">
                    <label className="tts-label">속도</label>
                    <div className="slider-group">
                        <input
                            type="range" min="0.5" max="2.0" step="0.1"
                            value={rate}
                            onChange={e => setRate(parseFloat(e.target.value))}
                        />
                        <span className="slider-value">{rate.toFixed(1)}x</span>
                    </div>

                    <label className="tts-label" style={{ marginTop: 10 }}>높낮이</label>
                    <div className="slider-group">
                        <input
                            type="range" min="0.5" max="2.0" step="0.1"
                            value={pitch}
                            onChange={e => setPitch(parseFloat(e.target.value))}
                        />
                        <span className="slider-value">{pitch.toFixed(1)}</span>
                    </div>
                </div>

                {/* 미리 듣기 */}
                <div className="tts-section">
                    <label className="tts-label">미리 듣기</label>
                    {currentCaption ? (
                        <div className="tts-preview-box">
                            <p className="tts-preview-text">{currentCaption.text}</p>
                            <div className="tts-actions">
                                <button
                                    className={`tts-btn ${speaking ? 'speaking' : ''}`}
                                    onClick={() => speaking ? stop() : speak(currentCaption.text)}
                                >
                                    {speaking ? '⏹ 정지' : '▶ 현재 자막'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="tts-empty">재생 바를 자막 위에 놓으면 미리 들을 수 있습니다</p>
                    )}
                </div>

                <div className="tts-section">
                    <button
                        className="tts-btn full"
                        onClick={() => speaking ? stop() : speakAll()}
                        disabled={captions.length === 0}
                    >
                        {speaking ? '⏹ 정지' : '🔊 전체 자막 읽기'}
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default TtsPanel;
