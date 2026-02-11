const fs = require('fs');

/**
 * WAV 파일에서 파형 데이터를 추출합니다.
 * Low-level binary processing을 통해 외부 라이브러리 없이 구현합니다.
 * @param {string} audioPath - WAV 파일 경로
 * @param {number} samplesPerSecond - 초당 추출할 샘플 수 (기본값: 100)
 * @returns {Promise<number[]>} - 0.0 ~ 1.0 사이로 정규화된 파형 배열
 */
function generateWaveform(audioPath, samplesPerSecond = 100) {
    return new Promise((resolve, reject) => {
        fs.readFile(audioPath, (err, buffer) => {
            if (err) return reject(err);

            // 1. Basic RIFF Header Validation
            if (buffer.length < 12 ||
                buffer.toString('utf8', 0, 4) !== 'RIFF' ||
                buffer.toString('utf8', 8, 12) !== 'WAVE') {
                return reject(new Error('Invalid WAV header'));
            }

            let pos = 12;
            let fmtParsed = false;
            let channels = 1;
            let sampleRate = 16000;
            let bitsPerSample = 16;
            let dataOffset = -1;
            let dataSize = 0;

            // 2. Chunk Iteration
            while (pos < buffer.length) {
                // Read Chunk ID and Size
                const chunkId = buffer.toString('utf8', pos, pos + 4);
                const chunkSize = buffer.readUInt32LE(pos + 4);
                pos += 8;

                if (chunkId === 'fmt ') {
                    const formatTag = buffer.readUInt16LE(pos); // 1 = PCM
                    channels = buffer.readUInt16LE(pos + 2);
                    sampleRate = buffer.readUInt32LE(pos + 4);
                    bitsPerSample = buffer.readUInt16LE(pos + 14);
                    fmtParsed = true;
                } else if (chunkId === 'data') {
                    dataOffset = pos;
                    dataSize = chunkSize;
                    // We found data, stop iterating to parse data
                    break;
                }

                // Move to next chunk
                pos += chunkSize;
            }

            if (!fmtParsed) return reject(new Error('WAV fmt chunk not found'));
            if (dataOffset === -1) return reject(new Error('WAV data chunk not found'));
            if (bitsPerSample !== 16) return reject(new Error(`Unsupported bit depth: ${bitsPerSample}. Only 16-bit supported.`));

            // 3. Waveform Generation
            const bytesPerSample = bitsPerSample / 8;
            const totalSamples = Math.floor(dataSize / bytesPerSample);
            const step = Math.floor(sampleRate / samplesPerSecond);
            const waveform = [];

            for (let i = 0; i < totalSamples; i += step) {
                let maxVal = 0;
                for (let j = 0; j < step && (i + j) < totalSamples; j++) {
                    const offset = dataOffset + (i + j) * bytesPerSample; // Correct offset usage

                    // Safety check for buffer bounds
                    if (offset + 2 > buffer.length) break;

                    const val = buffer.readInt16LE(offset);
                    if (Math.abs(val) > maxVal) {
                        maxVal = Math.abs(val);
                    }
                }
                waveform.push(maxVal / 32768.0);
            }

            resolve(waveform);
        });
    });
}

module.exports = { generateWaveform };
