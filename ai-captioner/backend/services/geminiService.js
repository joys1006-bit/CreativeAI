const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

/**
 * Gemini 1.5 Pro/Flash를 사용하여 오디오 파일로부터 자막을 생성합니다.
 * 감성 분석 및 다국어 지원이 추가되었습니다.
 */
async function transcribeWithGemini(audioPath, targetLanguage = 'ko', retryCount = 0) {
    const MAX_RETRIES = 3;
    const INITIAL_RETRY_DELAY = 2000;

    const languageMap = {
        'ko': 'KOREAN (한국어)',
        'en': 'ENGLISH (영어)',
        'ja': 'JAPANESE (일본어)',
        'zh': 'CHINESE (중국어)'
    };

    const targetLangFull = languageMap[targetLanguage] || 'KOREAN (한국어)';

    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: {
            role: "system",
            parts: [{ text: `당신은 세계 최고의 멀티미디어 AI 전문가입니다. 오디오를 분석하여 정확한 자막, 요약, 핵심 키워드, 그리고 화자의 감성(Sentiment)을 추출합니다. 모든 출력은 ${targetLangFull}로 작성하며, 반드시 유효한 JSON 형식이어야 합니다.` }]
        }
    });

    try {
        const audioData = fs.readFileSync(audioPath);
        const audioBase64 = audioData.toString('base64');

        const prompt = `
        이 오디오를 분석하여 다음 구조의 JSON 객체로 출력하세요.
        
        대상 언어: ${targetLangFull}
        
        요구사항:
        1. **segments**: 3-5초 단위의 정밀한 자막 세그먼트 (start, end, text). 텍스트는 축자 전사를 원칙으로 하되 대상 언어로 자연스럽게 번역/교정하세요.
        2. **summary**: 전체 오디오의 핵심 내용을 관통하는 2-3문장의 상세 요약.
        3. **keywords**: 오디오의 주제를 나타내는 핵심 태그 5개.
        4. **sentiment**: 화자의 목소리 톤과 내용을 바탕으로 한 감성 분석 결과 한 줄.
        5. **sentimentScore**: 화자의 긍정도/열정도를 0.0(부정/조용)에서 1.0(긍정/에너지) 사이의 수치로 산출.
        
        JSON 구조:
        {
            "segments": [
                { "start": 0.0, "end": 2.5, "text": "..." }
            ],
            "summary": "...",
            "keywords": ["...", "..."],
            "sentiment": "...",
            "sentimentScore": 0.85
        }
        `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: audioBase64,
                    mimeType: "audio/wav"
                }
            }
        ]);

        const response = await result.response;
        let text = response.text();

        const jsonStartIndex = text.indexOf('{');
        const jsonEndIndex = text.lastIndexOf('}');
        if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
            text = text.substring(jsonStartIndex, jsonEndIndex + 1);
        }

        const data = JSON.parse(text);
        return {
            segments: data.segments || [],
            summary: data.summary || "요약 불가",
            keywords: data.keywords || [],
            sentiment: data.sentiment || "분석 완료"
        };

    } catch (e) {
        if ((e.status === 503 || e.status === 429) && retryCount < MAX_RETRIES) {
            const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
            await new Promise(resolve => setTimeout(resolve, delay));
            return transcribeWithGemini(audioPath, targetLanguage, retryCount + 1);
        }

        console.error("Failed Gemini process:", e);
        return {
            segments: [],
            summary: `오류 발생: ${e.message}`,
            keywords: [],
            sentiment: "분석 실패"
        };
    }
}

module.exports = { transcribeWithGemini };
