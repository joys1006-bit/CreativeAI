const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

/**
 * Gemini 1.5 Pro를 사용하여 오디오 파일로부터 자막을 생성합니다.
 * 재시도 로직 및 정교한 프롬프트를 포함합니다.
 */
async function transcribeWithGemini(audioPath, retryCount = 0) {
    const MAX_RETRIES = 3;
    const INITIAL_RETRY_DELAY = 2000; // 2초

    console.log(`[Gemini] Attempt ${retryCount + 1}: Using API Key:`, process.env.GOOGLE_API_KEY ? "EXISTS" : "MISSING");

    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: {
            role: "system",
            parts: [{ text: "당신은 전문 한국어 자막가입니다. 당신은 오직 한국어로만 말하고 작성합니다. 오디오에서 외국어가 들리더라도 이를 한국어로 해석하여 전사하거나 즉시 한국어로 번역해야 합니다. 모든 출력은 반드시 유효한 JSON 형식이어야 합니다. 요약과 키워드 또한 한국어로 작성하십시오." }]
        }
    });

    try {
        const audioData = fs.readFileSync(audioPath);
        const audioBase64 = audioData.toString('base64');

        const prompt = `
        이 오디오를 분석하여 JSON 객체로 출력하세요.
        
        대상 언어: KOREAN (한국어)
        입력 오디오: 한국어 중심 (외국어일 경우 한국어로 번역)
        
        핵심 지침: **축자 전사 (받아쓰기)**
        - 화자가 말한 모든 단어를 하나도 빠짐없이 전사하세요.
        - "segments" 필드에서 가급적 내용을 요약하지 마십시오.
        - 문장의 흐름상 필요한 추임새나 작은 단어도 생략하지 마십시오.
        - 내용이 길다면 필요한 만큼 많은 세그먼트를 생성하세요.
        
        요구사항:
        1. **Segments**: 전체 대사. 가독성을 위해 세그먼트당 최대 3-5초.
        2. **Timestamps**: 정밀한 시작/종료 시간 (0.01초 단위).
        3. **Summary**: 전체 내용에 대한 명확하고 상세한 한국어 요약.
        4. **Keywords**: 핵심 키워드 3-5개 (한국어).
        
        JSON 구조:
        {
            "segments": [
                { "start": 0.0, "end": 2.5, "text": "안녕하세요, 오늘 우리는 AI에 대해 이야기해 볼 겁니다." },
                { "start": 2.5, "end": 5.1, "text": "지금 보시는 화면은 실제 작동하는 예시입니다." }
            ],
            "summary": "전체 내용을 요약한 한국어 텍스트",
            "keywords": ["AI", "자막", "자동화"]
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
        console.log("Gemini Raw Response:", text);

        // Robust JSON extraction
        const jsonStartIndex = text.indexOf('{');
        const jsonEndIndex = text.lastIndexOf('}');

        if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
            text = text.substring(jsonStartIndex, jsonEndIndex + 1);
        }

        const data = JSON.parse(text);
        if (Array.isArray(data)) {
            return { segments: data, summary: "요약 정보가 없습니다.", keywords: [] };
        }
        return data;

    } catch (e) {
        // 503 (Service Unavailable) 또는 429 (Too Many Requests) 처리
        if ((e.status === 503 || e.status === 429) && retryCount < MAX_RETRIES) {
            const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
            console.warn(`[Gemini] Error ${e.status}. Retrying in ${delay}ms... (Retry ${retryCount + 1}/${MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return transcribeWithGemini(audioPath, retryCount + 1);
        }

        console.error("Failed Gemini process:", e);
        return { segments: [], summary: `오류 발생: ${e.message}`, keywords: [] };
    }
}

module.exports = { transcribeWithGemini };
