const fs = require('fs');
const logger = require('./logger');

// Lazy initializer to ensure process.env.GOOGLE_API_KEY is loaded
let genAI = null;
let fileManager = null;

function getClients() {
    if (!genAI || !fileManager) {
        const apiKey = (process.env.GOOGLE_API_KEY || "").trim();
        genAI = new GoogleGenerativeAI(apiKey);
        fileManager = new GoogleAIFileManager(apiKey);
    }
    return { genAI, fileManager };
}

/**
 * Gemini 1.5 Pro/Flash를 사용하여 오디오 파일로부터 자막을 생성합니다. (File API 기반)
 */
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/server");

async function transcribeWithGemini(audioPath, targetLanguage = 'ko', retryCount = 0) {
    const { genAI, fileManager } = getClients();
    const MAX_RETRIES = 3;
    const INITIAL_RETRY_DELAY = 2000;
    const MODELS_TO_TRY = [
        "gemini-3-flash",       // Latest (fastest)
        "gemini-3-pro",         // Latest (smartest)
        "gemini-2.5-flash",     // Stable fallback
        "gemini-2.0-flash"      // Legacy fallback
    ];

    const languageMap = {
        'ko': 'KOREAN (한국어)',
        'en': 'ENGLISH (영어)',
        'ja': 'JAPANESE (일본어)',
        'zh': 'CHINESE (중국어)'
    };

    const targetLangFull = languageMap[targetLanguage] || 'KOREAN (한국어)';
    let fileUploadResult = null;

    try {
        console.log(`[AI] Step 1: Uploading file... (${audioPath})`);
        fileUploadResult = await fileManager.uploadFile(audioPath, {
            mimeType: "audio/wav",
            displayName: `Audio_${Date.now()}`
        });

        const name = fileUploadResult.file.name;
        console.log(`[AI] Uploaded: ${name}. Polling status...`);

        // Poll for file status
        let file = await fileManager.getFile(name);
        while (file.state === "PROCESSING") {
            process.stdout.write(".");
            await new Promise((resolve) => setTimeout(resolve, 1500)); // Faster polling
            file = await fileManager.getFile(name);
        }

        if (file.state === "FAILED") {
            throw new Error("Google AI File processing failed.");
        }

        // [IMPORTANT] Safety Margin: Wait 3 seconds even after ACTIVE for global consistency
        process.stdout.write("\n[AI] File ACTIVE. Applying safety delay...");
        await new Promise((resolve) => setTimeout(resolve, 3000));
        console.log(" Ready.");

        let lastError = null;
        for (const modelName of MODELS_TO_TRY) {
            try {
                console.log(`[AI] Speed mode: ${modelName}`);
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    systemInstruction: {
                        role: "system",
                        parts: [{ text: `당신은 초고속 AI 분석기입니다. 모든 데이터는 ${targetLangFull}로, JSON 형식으로만 출력합니다. 군더더기 설명을 생략하고 즉시 핵심만 추출합니다.` }]
                    }
                });

                const prompt = `
                Role: You are a professional stenographer.
                Task: Transcribe the audio exactly as spoken. Do not summarize. Do not polish grammar.
                Language: ${targetLangFull}
                
                Output Format: JSON Only.
                Structure:
                {
                    "segments": [
                        { 
                            "start": 0.0, 
                            "end": 2.5, 
                            "text": "Exact spoken words",
                            "confidence": 0.95
                        }
                    ],
                    "summary": "Brief 1-sentence topic summary",
                    "keywords": ["tag1", "tag2"]
                }
                
                Rules:
                1. Segment length: 2-5 seconds.
                2. **CRITICAL**: 'start' and 'end' MUST be in TOTAL SECONDS (e.g., 2 minutes 30 seconds = 150.0, NOT 2.30).
                3. Example: For a 3-minute audio, the last segment's 'end' should be around 180.0, NOT 3.0.
                4. 'confidence': Estimate based on audio clarity (0.0 to 1.0).
                5. If audio is silent/noise, exclude segment.
                6. Timestamps should be monotonically increasing and cover the entire audio duration.
                `;

                const result = await model.generateContent([
                    {
                        fileData: {
                            mimeType: file.mimeType,
                            fileUri: file.uri
                        }
                    },
                    { text: prompt }
                ]);

                const response = await result.response;
                let text = response.text();

                const jsonStartIndex = text.indexOf('{');
                const jsonEndIndex = text.lastIndexOf('}');
                if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
                    text = text.substring(jsonStartIndex, jsonEndIndex + 1);
                }

                const data = JSON.parse(text);
                console.log(`[AI] Successfully transcribed with ${modelName}`);

                // 타이밍 보정: Gemini가 분.초 형식(2.58=2분58초)으로 반환하는 경우 감지/수정
                let segments = data.segments || [];
                segments = fixMinuteSecondFormat(segments);

                // Cleanup after success
                await fileManager.deleteFile(name).catch(console.error);

                return {
                    segments,
                    summary: data.summary || "요약 불가",
                    keywords: data.keywords || [],
                    sentiment: data.sentiment || "분석 완료",
                    sentimentScore: data.sentimentScore || 0.5,
                    highlights: data.highlights || []
                };

            } catch (e) {
                lastError = e;
                logger.warn(`[AI] Model ${modelName} failed: ${e.message}`, { status: e.status });

                if (e.status === 404 || e.message.includes("not found")) {
                    logger.info(`[AI] Model ${modelName} not available. Trying next...`);
                    continue;
                }

                if ((e.status === 503 || e.status === 429) && retryCount < MAX_RETRIES) {
                    await fileManager.deleteFile(name).catch(() => { });
                    const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
                    logger.info(`[AI] Service busy for ${modelName}. Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return transcribeWithGemini(audioPath, targetLanguage, retryCount + 1);
                }

                logger.info(`[AI] Generic error for ${modelName}. Trying other candidates...`);
                continue;
            }
        }

        // Final cleanup on failure
        if (fileUploadResult) await fileManager.deleteFile(fileUploadResult.file.name).catch(() => { });
        throw lastError;

    } catch (e) {
        console.error("Failed Gemini File API process:", e);
        if (fileUploadResult) await fileManager.deleteFile(fileUploadResult.file.name).catch(() => { });
        return {
            segments: [],
            summary: `AI 엔진 오류: ${e.message}`,
            keywords: [],
            sentiment: "분석 실패",
            sentimentScore: 0.5,
            highlights: []
        };
    }
}

/**
 * Whisper 세그먼트의 텍스트를 Gemini 3로 교정합니다.
 * 타이밍(start/end)은 그대로 유지하고, 텍스트만 정확하게 수정합니다.
 */
async function correctTextWithGemini(audioPath, whisperSegments, targetLanguage = 'ko') {
    const { genAI, fileManager } = getClients();

    const CORRECTION_MODELS = [
        "gemini-3-flash",
        "gemini-2.5-flash",
        "gemini-2.0-flash"
    ];

    const languageMap = {
        'ko': '한국어',
        'en': 'English',
        'ja': '日本語',
        'zh': '中文'
    };
    const lang = languageMap[targetLanguage] || '한국어';

    let fileUploadResult = null;

    try {
        // Upload audio for Gemini to listen
        console.log(`[AI-Correct] Uploading audio for text correction...`);
        fileUploadResult = await fileManager.uploadFile(audioPath, {
            mimeType: "audio/wav",
            displayName: `Correction_${Date.now()}`
        });

        const name = fileUploadResult.file.name;
        let file = await fileManager.getFile(name);
        while (file.state === "PROCESSING") {
            await new Promise(r => setTimeout(r, 1500));
            file = await fileManager.getFile(name);
        }
        if (file.state === "FAILED") throw new Error("File processing failed");
        await new Promise(r => setTimeout(r, 2000)); // Safety delay

        // Build the correction prompt
        const segmentsForPrompt = whisperSegments.map((s, i) =>
            `[${i}] ${s.start.toFixed(2)}s~${s.end.toFixed(2)}s: "${s.text}"`
        ).join('\n');

        const prompt = `
역할: 당신은 대한민국 최고의 영상 자막 교정 전문가이자 국어국문학 박사입니다.
 
 아래는 AI(Whisper)가 자동 생성한 자막 리스트입니다. 오디오 파일을 직접 청취하고 분석하여, 실제 발화 내용과 일치하도록 정밀 교정을 수행하세요.
 
 [자동 생성 자막 리스트]
 ${segmentsForPrompt}
 
 [교정 절대 원칙]
 1. **문맥상 오류 수정**: 주변 문맥을 고려하여 잘못 인식된 단어(동음이의어 포함)를 발화 의도에 맞게 교정하세요.
 2. **표준어 및 맞춤법**: 최신 국립국어원 표준어 규정과 맞춤법, 띄어쓰기를 완벽하게 적용하세요.
 3. **가독성 향상**: 너무 긴 문장은 자막 가독성을 위해 적절한 쉼표나 어휘로 다듬으세요 (단, 발화 내용은 유지).
 4. **타이밍 보존**: 각 세그먼트의 'index'와 '타이밍(start, end)'은 절대 건드리지 마세요. 텍스트만 교정합니다.
 5. **특수문자 처리**: 발화 중의 감탄사, 물음표 등을 문맥에 맞게 적절히 사용하세요.
 
 [출력 가이드]
 - 오직 JSON 배열 포맷으로만 응답하세요.
 - 형식을 엄수하세요: [ { "index": n, "text": "교정 내용" }, ... ]
 - 교정이 필요한 세그먼트만 포함하고, 완벽한 세그먼트는 제외하세요.
 - 교정할 내용이 전혀 없다면 빈 배열 []을 반환하세요.
`;

        let lastError = null;
        for (const modelName of CORRECTION_MODELS) {
            try {
                console.log(`[AI-Correct] Trying ${modelName}...`);
                const model = genAI.getGenerativeModel({ model: modelName });

                const result = await model.generateContent([
                    {
                        fileData: {
                            mimeType: file.mimeType,
                            fileUri: file.uri
                        }
                    },
                    { text: prompt }
                ]);

                const response = await result.response;
                let text = response.text();

                // Extract JSON array
                const arrStart = text.indexOf('[');
                const arrEnd = text.lastIndexOf(']');
                if (arrStart === -1 || arrEnd === -1) {
                    console.log(`[AI-Correct] No corrections needed (no JSON array found).`);
                    await fileManager.deleteFile(name).catch(() => { });
                    return whisperSegments; // Return as-is
                }

                const corrections = JSON.parse(text.substring(arrStart, arrEnd + 1));
                console.log(`[AI-Correct] ${corrections.length} corrections from ${modelName}`);

                // Apply corrections to Whisper segments
                const corrected = [...whisperSegments];
                for (const fix of corrections) {
                    if (fix.index >= 0 && fix.index < corrected.length && fix.text) {
                        console.log(`  [${fix.index}] "${corrected[fix.index].text}" → "${fix.text}"`);
                        corrected[fix.index].text = fix.text;
                    }
                }

                await fileManager.deleteFile(name).catch(() => { });
                return corrected;

            } catch (e) {
                lastError = e;
                logger.warn(`[AI-Correct] ${modelName} failed: ${e.message}`);
                if (e.status === 404 || e.message.includes("not found")) continue;
                if (e.status === 503 || e.status === 429) continue;
                continue;
            }
        }

        // All models failed - return original segments
        if (fileUploadResult) await fileManager.deleteFile(name).catch(() => { });
        logger.error("[AI-Correct] All models failed. Returning uncorrected segments.");
        return whisperSegments;

    } catch (e) {
        console.error("[AI-Correct] Fatal error:", e);
        if (fileUploadResult) await fileManager.deleteFile(fileUploadResult.file.name).catch(() => { });
        return whisperSegments; // Graceful fallback
    }
}

/**
 * Gemini가 분.초(MM.SS) 형식으로 타이밍을 반환하는 경우를 감지하고 총 초 단위로 변환
 * 예: 2.58(2분 58초) → 178초, 1.30(1분 30초) → 90초
 * 
 * 감지 조건:
 * 1. 모든 세그먼트의 소수점 이하가 .00~.59 범위 (초는 0~59)
 * 2. 최대 start 값이 영상 길이(분 단위)에 비해 비정상적으로 작음
 */
function fixMinuteSecondFormat(segments) {
    if (!segments || segments.length < 3) return segments;

    // 소수점 이하가 60 이상인 값이 있으면 이미 초 단위
    const hasOver60Fraction = segments.some(s => {
        const startFrac = Math.round((s.start % 1) * 100);
        const endFrac = Math.round((s.end % 1) * 100);
        return startFrac >= 60 || endFrac >= 60;
    });
    if (hasOver60Fraction) return segments; // 이미 올바른 형식

    // 마지막 세그먼트의 end가 10 미만이고, 세그먼트가 10개 이상이면 분.초 형식으로 판단
    const lastEnd = segments[segments.length - 1].end;
    if (lastEnd >= 10 || segments.length < 10) return segments;

    console.log(`[AI-Fix] 분.초 형식 감지! (lastEnd=${lastEnd}, segments=${segments.length}). 총 초 단위로 변환 중...`);

    return segments.map(s => {
        const startMin = Math.floor(s.start);
        const startSec = Math.round((s.start % 1) * 100);
        const endMin = Math.floor(s.end);
        const endSec = Math.round((s.end % 1) * 100);

        return {
            ...s,
            start: startMin * 60 + startSec,
            end: endMin * 60 + endSec
        };
    });
}

module.exports = { transcribeWithGemini, correctTextWithGemini };
