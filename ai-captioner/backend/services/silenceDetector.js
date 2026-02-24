/**
 * [AI Engineer 담당] 무음 구간 감지 서비스
 * - FFmpeg silencedetect 필터 활용
 * - 무음 구간 리스트 반환
 * - 무음 제거 후 새 영상 생성
 */
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');

/**
 * 무음 구간 감지
 * @param {string} filePath - 오디오/비디오 파일 경로
 * @param {number} threshold - 무음 감지 임계값 (dB, 기본 -30)
 * @param {number} minDuration - 최소 무음 길이 (초, 기본 0.5)
 * @returns {Promise<Array<{start: number, end: number, duration: number}>>}
 */
function detectSilence(filePath, threshold = -30, minDuration = 0.5) {
    return new Promise((resolve, reject) => {
        const silenceSegments = [];
        let currentStart = null;

        ffmpeg(filePath)
            .audioFilters(`silencedetect=noise=${threshold}dB:d=${minDuration}`)
            .format('null')
            .output('-')
            .on('stderr', (line) => {
                // silence_start 파싱
                const startMatch = line.match(/silence_start:\s*([\d.]+)/);
                if (startMatch) {
                    currentStart = parseFloat(startMatch[1]);
                }

                // silence_end 파싱
                const endMatch = line.match(/silence_end:\s*([\d.]+)/);
                if (endMatch && currentStart !== null) {
                    const end = parseFloat(endMatch[1]);
                    silenceSegments.push({
                        start: currentStart,
                        end: end,
                        duration: parseFloat((end - currentStart).toFixed(3))
                    });
                    currentStart = null;
                }
            })
            .on('end', () => {
                logger.info(`[SilenceDetector] Found ${silenceSegments.length} silent segments`);
                resolve(silenceSegments);
            })
            .on('error', (err) => {
                logger.error('[SilenceDetector] Detection failed', err);
                reject(err);
            })
            .run();
    });
}

/**
 * 무음 구간 제거 후 새 영상 생성
 * @param {string} inputPath - 원본 파일
 * @param {Array} silenceSegments - 제거할 무음 구간 배열
 * @param {string} outputDir - 출력 디렉토리
 * @returns {Promise<string>} - 출력 파일 경로
 */
async function removeSilence(inputPath, silenceSegments, outputDir) {
    if (!silenceSegments || silenceSegments.length === 0) {
        logger.info('[SilenceDetector] No silence to remove');
        return inputPath;
    }

    // 유지할 구간 계산 (무음이 아닌 구간)
    const keepSegments = [];
    let lastEnd = 0;

    // 시간순 정렬
    const sorted = [...silenceSegments].sort((a, b) => a.start - b.start);

    for (const seg of sorted) {
        if (seg.start > lastEnd) {
            keepSegments.push({ start: lastEnd, end: seg.start });
        }
        lastEnd = seg.end;
    }

    // 마지막 구간 추가 (영상 끝까지)
    // 전체 길이는 FFprobe로 가져옴
    const duration = await getVideoDuration(inputPath);
    if (lastEnd < duration) {
        keepSegments.push({ start: lastEnd, end: duration });
    }

    if (keepSegments.length === 0) {
        throw new Error('제거 후 남은 구간이 없습니다');
    }

    // 각 구간을 임시 파일로 추출 후 concat
    const tempFiles = [];
    const outputPath = path.join(outputDir, `silenceremoved_${Date.now()}.mp4`);

    try {
        for (let i = 0; i < keepSegments.length; i++) {
            const seg = keepSegments[i];
            const tempPath = path.join(outputDir, `_temp_seg_${i}.mp4`);
            tempFiles.push(tempPath);

            await new Promise((resolve, reject) => {
                ffmpeg(inputPath)
                    .setStartTime(seg.start)
                    .setDuration(seg.end - seg.start)
                    .output(tempPath)
                    .on('end', resolve)
                    .on('error', reject)
                    .run();
            });
        }

        // concat 리스트 파일 생성
        const concatListPath = path.join(outputDir, `_concat_list_${Date.now()}.txt`);
        const concatContent = tempFiles.map(f => `file '${f.replace(/\\/g, '/')}'`).join('\n');
        fs.writeFileSync(concatListPath, concatContent);

        await new Promise((resolve, reject) => {
            ffmpeg()
                .input(concatListPath)
                .inputOptions(['-f', 'concat', '-safe', '0'])
                .outputOptions(['-c', 'copy'])
                .output(outputPath)
                .on('end', resolve)
                .on('error', reject)
                .run();
        });

        // 임시 파일 정리
        [...tempFiles, concatListPath].forEach(f => {
            try { fs.unlinkSync(f); } catch (_) { }
        });

        logger.info(`[SilenceDetector] Silence removed. Output: ${outputPath}`);
        return outputPath;

    } catch (err) {
        // 실패 시 임시 파일 정리
        tempFiles.forEach(f => {
            try { fs.unlinkSync(f); } catch (_) { }
        });
        throw err;
    }
}

function getVideoDuration(filePath) {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) return reject(err);
            resolve(metadata.format.duration || 0);
        });
    });
}

module.exports = { detectSilence, removeSilence };
