/**
 * 화자 분리(Speaker Diarization) 서비스
 * Gemini AI를 활용하여 자막 세그먼트에 화자 정보를 추가합니다.
 * 담당: 백엔드 개발자 (L4) / CTO (L7) 기술 검수
 */
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/server");
const logger = require('./logger');

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

// 화자별 기본 색상 팔레트
const SPEAKER_COLORS = [
    '#8B5CF6', // 보라색
    '#F59E0B', // 주황색
    '#10B981', // 녹색
    '#3B82F6', // 파란색
    '#EF4444', // 빨간색
    '#EC4899', // 핑크색
    '#6366F1', // 인디고
    '#14B8A6', // 틸
];

/**
 * 자막 세그먼트에 화자 정보를 추가합니다.
 * @param {string} audioPath - 오디오 파일 경로
 * @param {Array} segments - 기존 자막 세그먼트 배열
 * @returns {Array} 화자가 할당된 세그먼트 배열
 */
async function identifySpeakers(audioPath, segments) {
    if (!segments || segments.length === 0) {
        return segments;
    }

    const { genAI, fileManager } = getClients();
    const MODELS = ["gemini-3-flash", "gemini-2.5-flash", "gemini-2.0-flash"];

    let fileUploadResult = null;

    try {
        // 오디오 파일 업로드
        logger.info(`[Speaker] 화자 분리 시작. 세그먼트 수: ${segments.length}`);
        fileUploadResult = await fileManager.uploadFile(audioPath, {
            mimeType: "audio/wav",
            displayName: `Speaker_${Date.now()}`
        });

        const name = fileUploadResult.file.name;
        let file = await fileManager.getFile(name);
        while (file.state === "PROCESSING") {
            await new Promise(r => setTimeout(r, 1500));
            file = await fileManager.getFile(name);
        }
        if (file.state === "FAILED") throw new Error("파일 처리 실패");
        await new Promise(r => setTimeout(r, 2000)); // 안전 대기

        // 화자 분리 프롬프트 구성
        const segmentsList = segments.map((s, i) =>
            `[${i}] ${s.start.toFixed(2)}s~${s.end.toFixed(2)}s: "${s.text}"`
        ).join('\n');

        const prompt = `
역할: 당신은 전문 음성 분석가입니다. 이 오디오 파일을 청취하고, 각 자막 세그먼트의 화자(speaker)를 식별하세요.

[현재 자막 세그먼트]
${segmentsList}

[분석 규칙]
1. **음색/음높이/말투** 기반으로 서로 다른 화자를 구분하세요.
2. 화자가 1명이면 모든 세그먼트에 "Speaker A"를 할당하세요.
3. 화자가 여러 명이면 "Speaker A", "Speaker B", "Speaker C" ... 순으로 할당하세요.
4. 노래/음악의 경우, 메인 보컬은 "Speaker A", 코러스/백보컬은 "Speaker B"로 구분하세요.
5. 나레이션과 인터뷰이는 별도 화자로 구분하세요.

[출력 형식: JSON만 출력]
{
    "speakers": [
        { "id": "Speaker A", "label": "화자 이름 또는 역할 추정" },
        { "id": "Speaker B", "label": "화자 이름 또는 역할 추정" }
    ],
    "assignments": [
        { "index": 0, "speaker": "Speaker A" },
        { "index": 1, "speaker": "Speaker B" }
    ]
}

- speakers: 식별된 화자 목록 (최대 8명)
- assignments: 각 세그먼트에 대한 화자 할당 (모든 세그먼트 포함 필수)
- label: 가능하면 "남성 나레이터", "여성 인터뷰어", "메인 보컬" 등으로 추정
`;

        let lastError = null;
        for (const modelName of MODELS) {
            try {
                logger.info(`[Speaker] ${modelName}으로 화자 분리 시도...`);
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    generationConfig: { temperature: 0, topP: 1, topK: 1 },
                });

                const result = await model.generateContent([
                    { fileData: { mimeType: file.mimeType, fileUri: file.uri } },
                    { text: prompt }
                ]);

                const response = await result.response;
                let text = response.text();

                // JSON 추출
                const jsonStart = text.indexOf('{');
                const jsonEnd = text.lastIndexOf('}');
                if (jsonStart === -1 || jsonEnd === -1) {
                    throw new Error("화자 분리 JSON 파싱 실패");
                }
                text = text.substring(jsonStart, jsonEnd + 1);
                const data = JSON.parse(text);

                // 화자 정보를 세그먼트에 적용
                const speakerMap = {};
                (data.speakers || []).forEach((s, i) => {
                    speakerMap[s.id] = {
                        id: s.id,
                        label: s.label || s.id,
                        color: SPEAKER_COLORS[i % SPEAKER_COLORS.length]
                    };
                });

                const enrichedSegments = segments.map((seg, i) => {
                    const assignment = (data.assignments || []).find(a => a.index === i);
                    const speakerId = assignment ? assignment.speaker : 'Speaker A';
                    const speakerInfo = speakerMap[speakerId] || {
                        id: speakerId,
                        label: speakerId,
                        color: SPEAKER_COLORS[0]
                    };

                    return {
                        ...seg,
                        speaker: speakerInfo.id,
                        speakerLabel: speakerInfo.label,
                        speakerColor: speakerInfo.color,
                    };
                });

                // 정리
                await fileManager.deleteFile(name).catch(() => { });

                const uniqueSpeakers = Object.values(speakerMap);
                logger.info(`[Speaker] 화자 분리 완료: ${uniqueSpeakers.length}명 식별`);
                logger.audit('AI_ENGINE', 'SPEAKER_DIARIZE', {
                    speakerCount: uniqueSpeakers.length,
                    segmentCount: segments.length
                });

                return {
                    segments: enrichedSegments,
                    speakers: uniqueSpeakers
                };

            } catch (e) {
                lastError = e;
                logger.warn(`[Speaker] ${modelName} 실패: ${e.message}`);
                if (e.status === 404 || e.message.includes("not found")) continue;
                continue;
            }
        }

        // 모든 모델 실패 — 기본 단일 화자로 폴백
        if (fileUploadResult) await fileManager.deleteFile(name).catch(() => { });
        logger.warn("[Speaker] 모든 모델 실패. 단일 화자로 폴백.");
        return fallbackSingleSpeaker(segments);

    } catch (e) {
        logger.error("[Speaker] 치명적 오류:", e);
        if (fileUploadResult) await fileManager.deleteFile(fileUploadResult.file.name).catch(() => { });
        return fallbackSingleSpeaker(segments);
    }
}

/**
 * 폴백: 모든 세그먼트에 단일 화자 할당
 */
function fallbackSingleSpeaker(segments) {
    const defaultSpeaker = {
        id: 'Speaker A',
        label: '화자',
        color: SPEAKER_COLORS[0]
    };

    return {
        segments: segments.map(seg => ({
            ...seg,
            speaker: defaultSpeaker.id,
            speakerLabel: defaultSpeaker.label,
            speakerColor: defaultSpeaker.color,
        })),
        speakers: [defaultSpeaker]
    };
}

module.exports = { identifySpeakers, SPEAKER_COLORS };
