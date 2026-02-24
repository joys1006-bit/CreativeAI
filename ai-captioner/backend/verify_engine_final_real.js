require('dotenv').config();
const { transcribeWithGemini } = require('./services/geminiService');

async function testReal() {
    // Using one of the existing wav files in uploads/
    const audioPath = 'uploads/91844bc3-21f4-4631-8dc7-972bd0e325c5.wav';
    console.log("=== AI 엔진 실무 정밀 검증 시작 ===");
    console.log(`Target: ${audioPath}`);

    try {
        const result = await transcribeWithGemini(audioPath, 'ko');
        console.log("=== 검증 결과 ===");
        console.log("Status:", result.summary.startsWith('AI 엔진 오류') ? 'FAILED' : 'SUCCESS');
        console.log("Summary:", result.summary);
        console.log("Segments count:", result.segments.length);
        if (result.segments.length > 0) {
            console.log("Sample Segment:", result.segments[0].text);
        }
    } catch (e) {
        console.error("Critical Engine Failure during verification:", e);
    }
}

testReal();
