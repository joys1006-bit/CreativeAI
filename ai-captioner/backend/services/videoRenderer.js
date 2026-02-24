const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

/**
 * Renders a video from the script and audio files.
 * @param {Array} script - Array of {text, duration, visual}
 * @param {Array} audioPaths - Array of paths to audio files
 * @param {string} jobId - UUID for the job
 * @param {string} uploadDir - Directory to save files
 * @returns {Promise<string>} Path to the final video file
 */
async function renderVideo(script, audioPaths, jobId, uploadDir) {
    const segmentPaths = [];

    // 1. Create individual video segments (Text + Audio)
    for (let i = 0; i < script.length; i++) {
        const segment = script[i];
        const audioPath = audioPaths[i];
        const segmentPath = path.join(uploadDir, `${jobId}_seg_${i}.mp4`);

        await new Promise((resolve, reject) => {
            ffmpeg()
                .input('color=c=black:s=1080x1920')
                .inputFormat('lavfi')
                .input(audioPath)
                .outputOptions([
                    '-c:v libx264',
                    '-t', segment.duration.toString(),
                    '-pix_fmt yuv420p',
                    '-vf', `drawtext=text='${segment.text.replace(/:/g, '\\:').replace(/'/g, '')}':fontcolor=white:fontsize=64:x=(w-text_w)/2:y=(h-text_h)/2:box=1:boxcolor=black@0.5:boxborderw=5`,
                    '-c:a aac',
                    '-shortest' // Stop when audio ends (or duration)
                ])
                .save(segmentPath)
                .on('end', () => resolve())
                .on('error', (err) => reject(err));
        });
        segmentPaths.push(segmentPath);
    }

    // 2. Concatenate segments
    const finalVideoPath = path.join(uploadDir, `${jobId}.mp4`);
    const listPath = path.join(uploadDir, `${jobId}_list.txt`);

    const fileContent = segmentPaths.map(p => `file '${p.replace(/\\/g, '/')}'`).join('\n');
    fs.writeFileSync(listPath, fileContent);

    await new Promise((resolve, reject) => {
        ffmpeg()
            .input(listPath)
            .inputOptions(['-f concat', '-safe 0'])
            .outputOptions(['-c copy'])
            .save(finalVideoPath)
            .on('end', () => {
                // Cleanup temp segments
                segmentPaths.forEach(p => fs.unlinkSync(p));
                fs.unlinkSync(listPath);
                resolve();
            })
            .on('error', (err) => reject(err));
    });

    return finalVideoPath;
}

module.exports = { renderVideo };
