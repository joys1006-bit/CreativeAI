const { exec } = require('child_process');
const path = require('path');
const logger = require('./logger');

/**
 * Transcribes audio using the local Python Whisper script.
 * @param {string} audioPath - Absolute path to the WAV file.
 * @returns {Promise<Array>} - Array of segments.
 */
function transcribeWithWhisper(audioPath) {
    return new Promise((resolve, reject) => {
        const pythonScript = path.join(__dirname, 'whisper_service.py');
        const command = `python "${pythonScript}" "${audioPath}"`;

        logger.info(`[WhisperWrapper] Starting local Python transcription...`);

        exec(command, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
            if (error) {
                logger.error(`[WhisperWrapper] Exec error: ${error.message}`);
                return reject(error);
            }

            try {
                // Find the JSON part in stdout (in case of other prints)
                const jsonStart = stdout.indexOf('[');
                const jsonEnd = stdout.lastIndexOf(']');

                if (jsonStart === -1 || jsonEnd === -1) {
                    // Check for error object
                    if (stdout.includes('"error"')) {
                        const errObj = JSON.parse(stdout);
                        return reject(new Error(errObj.error));
                    }
                    return reject(new Error("Invalid Whisper output format"));
                }

                const jsonStr = stdout.substring(jsonStart, jsonEnd + 1);
                const segments = JSON.parse(jsonStr);
                logger.info(`[WhisperWrapper] Success! Generated ${segments.length} segments.`);
                resolve(segments);
            } catch (e) {
                logger.error(`[WhisperWrapper] Parse error: ${e.message}. Raw output: ${stdout}`);
                reject(e);
            }
        });
    });
}

module.exports = { transcribeWithWhisper };
