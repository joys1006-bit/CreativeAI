/**
 * [AI Engineer 담당] 번역 서비스
 * - Gemini API를 활용한 자막 실시간 다국어 번역
 * - ko/en/ja/zh 4개국어 지원
 * - 이중 자막 생성
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('./logger');

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const LANGUAGE_MAP = {
    ko: '한국어',
    en: '영어',
    ja: '일본어',
    zh: '중국어 (간체)',
};

/**
 * 자막 배열 번역
 * @param {Array} segments - [{start, end, text, ...}]
 * @param {string} sourceLang - 원본 언어 (ko, en, ja, zh)
 * @param {string} targetLang - 목표 언어
 * @returns {Promise<Array>} - 번역된 세그먼트 배열 (원본 포함)
 */
async function translateSegments(segments, sourceLang = 'ko', targetLang = 'en') {
    if (!segments || segments.length === 0) return [];
    if (sourceLang === targetLang) return segments;

    const sourceLabel = LANGUAGE_MAP[sourceLang] || sourceLang;
    const targetLabel = LANGUAGE_MAP[targetLang] || targetLang;

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        // 배치 번역 (한 번의 API 호출로 전체 번역)
        const textsToTranslate = segments.map((s, i) => `[${i}] ${s.text}`).join('\n');

        const prompt = `다음 ${sourceLabel} 자막을 ${targetLabel}로 번역해주세요.

규칙:
1. 각 줄의 [번호]를 유지하세요
2. 자연스럽고 정확한 번역을 하세요
3. 자막 맥락을 고려하여 일관된 번역을 유지하세요
4. 번호와 번역만 출력하세요 (추가 설명 없이)

자막:
${textsToTranslate}`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // 응답 파싱
        const translatedTexts = {};
        const lines = responseText.trim().split('\n');
        for (const line of lines) {
            const match = line.match(/\[(\d+)\]\s*(.+)/);
            if (match) {
                translatedTexts[parseInt(match[1])] = match[2].trim();
            }
        }

        // 원본 세그먼트에 번역 추가
        const translatedSegments = segments.map((seg, i) => ({
            ...seg,
            translatedText: translatedTexts[i] || seg.text,
            originalText: seg.text,
            targetLang,
        }));

        logger.info(`[Translation] Translated ${segments.length} segments: ${sourceLabel} → ${targetLabel}`);
        return translatedSegments;

    } catch (err) {
        logger.error('[Translation] Failed', err);
        throw err;
    }
}

/**
 * 사용 가능한 언어 목록
 */
function getSupportedLanguages() {
    return Object.entries(LANGUAGE_MAP).map(([code, name]) => ({ code, name }));
}

module.exports = { translateSegments, getSupportedLanguages };
