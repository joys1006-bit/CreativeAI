const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

ffmpeg.setFfmpegPath(ffmpegPath);

/**
 * 동영상에서 오디오를 추출합니다.
 */
function extractAudio(videoPath, audioPath) {
    return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
            .toFormat('wav')
            .audioCodec('pcm_s16le')
            .audioFrequency(16000)
            .audioChannels(1)
            .on('end', () => {
                console.log('Audio extraction finished');
                resolve();
            })
            .on('error', (err) => {
                console.error('Error during audio extraction:', err);
                reject(err);
            })
            .save(audioPath);
    });
}

module.exports = { extractAudio };
