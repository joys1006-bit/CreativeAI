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
                console.log(`[AI] Precision mode: ${modelName}`);
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    generationConfig: {
                        temperature: 0,
                        topP: 1,
                        topK: 1,
                    },
                    systemInstruction: {
                        role: "system",
                        parts: [{ text: `당신은 전문 속기사(stenographer)입니다. 오디오에서 들리는 모든 단어를 정확하게 받아적습니다. ${targetLangFull}로 출력하며, JSON 형식만 사용합니다. 들리지 않는 부분은 추측하지 않고, 들리는 그대로만 기록합니다.` }]
                    }
                });

                const prompt = `
당신은 전문 속기사입니다. 이 오디오 파일의 음성을 정확하게 텍스트로 변환하세요.

## 핵심 원칙
- **정확성 최우선**: 들리는 그대로 받아적으세요. 문법 수정이나 의역을 하지 마세요.
- **한국어 특성**: 조사(은/는/이/가), 어미(-요/-어/-지), 축약형(뭐→뭘, 거→걸)을 원음 그대로 기록하세요.
- **가사/노래**: 음악이나 노래가 포함된 경우, 가사를 정확히 받아적으세요.
- **일관성**: 같은 단어는 항상 같은 표기를 사용하세요.

## 출력 언어: ${targetLangFull}

## 출력 형식: JSON만 출력 (마크다운 코드블록 없이)
{
    "segments": [
        { "start": 0.0, "end": 3.2, "text": "정확한 음성 텍스트", "confidence": 0.95 }
    ],
    "summary": "1문장 주제 요약",
    "keywords": ["키워드1", "키워드2"]
}

## 타이밍 규칙 (매우 중요)
1. start, end는 반드시 **총 초(seconds)** 단위입니다. (예: 2분 30초 = 150.0, NOT 2.30)
2. 3분짜리 오디오의 마지막 세그먼트 end는 약 180.0이어야 합니다.
3. 세그먼트 길이: 2~5초
4. 타임스탬프는 단조 증가해야 합니다.
5. 무음/잡음 구간은 제외하세요.
6. confidence: 오디오 명확도 기반 (0.0~1.0)
7. 세그먼트 간 빈 구간(gap)이 없도록, 실제 음성이 있는 모든 구간을 빠짐없이 포함하세요.
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
역할: 당신은 대한민국 최고의 영상 자막 교정 전문가이자 음성/음악 분석 전문가입니다.

아래는 AI(Whisper)가 자동 생성한 자막 리스트입니다. **오디오 파일을 직접 청취**하여 실제 발화/가사와 비교 분석하고, 텍스트와 타이밍을 모두 정밀 보정하세요.

[자동 생성 자막 리스트]
${segmentsForPrompt}

[핵심 교정 원칙]

**A. 타이밍 보정 (가장 중요!)**
1. **전주/간주 감지**: 음악의 전주(인트로), 간주(인터루드), 아웃트로 등 보컬이 없는 구간에 자막이 배치되어 있으면, 실제 보컬이 시작되는 정확한 시점으로 타이밍을 이동하세요.
2. **보컬 시작점 정밀 매칭**: 오디오를 듣고 각 가사/발화가 실제로 시작하는 정확한 초(second)를 판단하세요.
3. **오디오 에너지 분석**: 음성의 에너지(볼륨) 변화를 감지하여, 실제 음성이 시작/종료되는 지점을 정확히 파악하세요.
4. **음소 경계 탐지**: 발화의 첫 음소(첫 자음/모음)가 시작되는 정확한 시간을 start로 사용하세요.
5. **겹침 방지**: 보정 후에도 세그먼트 간 시간이 겹치지 않도록 하세요.
6. **순서 유지**: 세그먼트의 시간 순서는 반드시 유지하세요.
7. **시작 오프셋 보정**: 첫 번째 세그먼트의 start가 실제 첫 음성보다 앞서 있으면, 실제 음성 시작점으로 조정하세요.

**B. 텍스트 교정**
1. 문맥 기반 오류 수정 (동음이의어, 오인식 단어)
2. 한국어 표준어 맞춤법 적용
3. 가독성 향상 (의미 유지)
4. 같은 단어가 반복되면 일관된 표기 사용

[출력 가이드]
- 오직 JSON 배열 포맷으로만 응답하세요.
- 형식: [ { "index": n, "text": "교정 내용", "start": 시작초, "end": 종료초 }, ... ]
- text: 교정된 텍스트 (변경 없으면 원본 그대로)
- start/end: 보정된 타이밍 (초 단위, 소수점 2자리). 타이밍 변경 불필요 시 원본 값 그대로 포함
- **모든 세그먼트를 포함하세요** (교정 여부와 관계없이 전체 배열 반환)
- 전주/간주에 걸린 자막을 올바른 시점으로 이동하는 것이 최우선입니다.
`;

        let lastError = null;
        for (const modelName of CORRECTION_MODELS) {
            try {
                console.log(`[AI-Correct] Trying ${modelName}...`);
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    generationConfig: { temperature: 0, topP: 1, topK: 1 },
                });

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

                // Apply corrections (text + timing) to Whisper segments
                const corrected = [...whisperSegments];
                for (const fix of corrections) {
                    if (fix.index >= 0 && fix.index < corrected.length) {
                        if (fix.text) {
                            console.log(`  [${fix.index}] text: "${corrected[fix.index].text}" → "${fix.text}"`);
                            corrected[fix.index].text = fix.text;
                        }
                        // 타이밍 보정 적용 — 비정상 점프 검증 포함 (self-check 교훈 #3)
                        const originalStart = corrected[fix.index].start;
                        const originalEnd = corrected[fix.index].end;

                        if (fix.start != null && typeof fix.start === 'number') {
                            // 원본 대비 30초 이상 점프하면 비정상 → 원본 유지
                            const drift = Math.abs(fix.start - originalStart);
                            if (drift > 30) {
                                console.log(`  [${fix.index}] ⚠️ start drift ${drift.toFixed(1)}s too large, keeping original ${originalStart.toFixed(2)}s`);
                            } else {
                                console.log(`  [${fix.index}] start: ${originalStart.toFixed(2)}s → ${fix.start.toFixed(2)}s`);
                                corrected[fix.index].start = fix.start;
                            }
                        }
                        if (fix.end != null && typeof fix.end === 'number') {
                            const drift = Math.abs(fix.end - originalEnd);
                            if (drift > 30) {
                                console.log(`  [${fix.index}] ⚠️ end drift ${drift.toFixed(1)}s too large, keeping original ${originalEnd.toFixed(2)}s`);
                            } else {
                                console.log(`  [${fix.index}] end: ${originalEnd.toFixed(2)}s → ${fix.end.toFixed(2)}s`);
                                corrected[fix.index].end = fix.end;
                            }
                        }

                        // 음수 duration 방지: end < start이면 swap
                        if (corrected[fix.index].end < corrected[fix.index].start) {
                            console.log(`  [${fix.index}] ⚠️ negative duration detected, swapping start/end`);
                            const tmp = corrected[fix.index].start;
                            corrected[fix.index].start = corrected[fix.index].end;
                            corrected[fix.index].end = tmp;
                        }
                    }
                }

                // 타이밍 순서 재정렬
                corrected.sort((a, b) => a.start - b.start);

                // 겹침 제거 + 최소 간격 보장 (후처리)
                for (let i = 0; i < corrected.length - 1; i++) {
                    if (corrected[i].end > corrected[i + 1].start) {
                        // 겹치면 이전 세그먼트의 end를 다음 start 직전으로 조정
                        corrected[i].end = corrected[i + 1].start - 0.05;
                        console.log(`  [overlap fix] seg ${i} end adjusted to ${corrected[i].end.toFixed(2)}s`);
                    }
                    // 최소 duration 보장 (0.3초 이하면 0.3초로)
                    if (corrected[i].end - corrected[i].start < 0.3) {
                        corrected[i].end = corrected[i].start + 0.3;
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
