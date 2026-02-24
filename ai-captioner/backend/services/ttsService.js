/**
 * [AI Engineer 담당] TTS 서비스
 * - Google Gemini TTS API를 활용한 텍스트→음성 변환
 * - 다국어 지원 (ko, en, ja, zh)
 * - 보이스 프로필 선택
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const VOICE_PROFILES = [
    { id: 'ko-female-1', name: '서연 (여성)', lang: 'ko', gender: 'female', description: '차분하고 전문적인 한국어 여성 목소리' },
    { id: 'ko-male-1', name: '민준 (남성)', lang: 'ko', gender: 'male', description: '깊고 안정적인 한국어 남성 목소리' },
    { id: 'ko-female-2', name: '하늘 (여성)', lang: 'ko', gender: 'female', description: '밝고 활기찬 한국어 여성 목소리' },
    { id: 'en-female-1', name: 'Emma (Female)', lang: 'en', gender: 'female', description: 'Professional English female voice' },
    { id: 'en-male-1', name: 'James (Male)', lang: 'en', gender: 'male', description: 'Deep English male voice' },
    { id: 'ja-female-1', name: 'さくら (女性)', lang: 'ja', gender: 'female', description: '落ち着いた日本語女性の声' },
    { id: 'zh-female-1', name: '小雨 (女性)', lang: 'zh', gender: 'female', description: '温柔的中文女性声音' },
];

/**
 * 보이스 프로필 목록 반환
 */
function getVoiceProfiles(lang = null) {
    if (lang) return VOICE_PROFILES.filter(v => v.lang === lang);
    return VOICE_PROFILES;
}

/**
 * Gemini를 사용한 TTS-like 발음 가이드 생성
 * (실제 오디오 TTS는 Google Cloud TTS API 또는 Web Speech API로 처리)
 */
async function generateSpeechGuide(text, voiceId = 'ko-female-1') {
    const voice = VOICE_PROFILES.find(v => v.id === voiceId) || VOICE_PROFILES[0];

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const prompt = `다음 텍스트를 ${voice.name} 스타일의 자연스러운 나레이션으로 읽을 때의 SSML 마크업을 생성해주세요.
텍스트: "${text}"
- 적절한 pause, emphasis, prosody를 추가하세요
- 자연스러운 억양과 속도를 반영하세요`;

        const result = await model.generateContent(prompt);
        const ssml = result.response.text();

        logger.info(`[TTS] Speech guide generated for voice: ${voiceId}`);
        return { ssml, voice, text };
    } catch (err) {
        logger.error('[TTS] Speech guide generation failed', err);
        throw err;
    }
}

/**
 * Web Speech API용 매개변수 생성
 * (프론트엔드에서 SpeechSynthesis API로 사용)
 */
function getSpeechParams(voiceId = 'ko-female-1') {
    const voice = VOICE_PROFILES.find(v => v.id === voiceId) || VOICE_PROFILES[0];
    return {
        lang: voice.lang === 'ko' ? 'ko-KR' : voice.lang === 'en' ? 'en-US' : voice.lang === 'ja' ? 'ja-JP' : 'zh-CN',
        rate: 1.0,
        pitch: voice.gender === 'female' ? 1.1 : 0.9,
        volume: 1.0,
        voiceProfile: voice,
    };
}

module.exports = { getVoiceProfiles, generateSpeechGuide, getSpeechParams };
