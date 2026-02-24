const fs = require('fs');
const path = require('path');

/**
 * Seconds를 SRT 타임스탬프 포맷(HH:MM:SS,mmm)으로 변환합니다.
 */
function formatSRTTime(seconds) {
    const date = new Date(seconds * 1000);
    const hh = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const mm = String(date.getUTCMinutes()).padStart(2, '0');
    const ss = String(date.getUTCSeconds()).padStart(2, '0');
    const ms = String(date.getUTCMilliseconds()).padStart(3, '0');
    return `${hh}:${mm}:${ss},${ms}`;
}

/**
 * 세그먼트 배열을 SRT 문자열로 변환합니다.
 */
function generateSRTContent(segments) {
    return segments.map((seg, index) => {
        const start = formatSRTTime(seg.start);
        const end = formatSRTTime(seg.end);
        return `${index + 1}\n${start} --> ${end}\n${seg.text}\n`;
    }).join('\n');
}

/**
 * SRT 파일을 생성하고 경로를 반환합니다.
 */
function createSRTFile(jobId, segments, uploadDir) {
    const srtContent = generateSRTContent(segments);
    const srtPath = path.join(uploadDir, `${jobId}.srt`);
    fs.writeFileSync(srtPath, srtContent, 'utf8');
    return srtPath;
}

module.exports = { createSRTFile, generateSRTContent };
