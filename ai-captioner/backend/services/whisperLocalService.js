const { pipeline } = require('@xenova/transformers');
const fs = require('fs');
const wavefile = require('wavefile');

// Singleton to hold the model in memory
let transcriber = null;

async function getTranscriber() {
    if (!transcriber) {
        console.log("[WhisperLocal] Loading model 'Xenova/whisper-base'...");
        // quantized: true by default, uses int8 weights for smaller size/faster inference
        transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-base');
        console.log("[WhisperLocal] Model loaded.");
    }
    return transcriber;
}

/**
 * Transcribes audio using local Whisper model.
 * @param {string} audioPath - Absolute path to the WAV file (must be 16kHz mono).
 * @returns {Promise<Array>} - Array of segments with start, end, text.
 */
async function transcribeWithLocalWhisper(audioPath) {
    try {
        const transcriber = await getTranscriber();

        console.log(`[WhisperLocal] Transcribing: ${audioPath}`);

        // Explicitly read and process the WAV file
        // Transformers.js expects Float32Array for audio input
        const buffer = fs.readFileSync(audioPath);
        const wav = new wavefile.WaveFile(buffer);

        // Convert to 16kHz mono Float32
        wav.toBitDepth('32f');
        wav.toSampleRate(16000); // Ensure 16kHz

        let audioData = wav.getSamples();
        if (Array.isArray(audioData)) {
            // If stereo, take first channel. But we forced mono in ffmpeg, so it should be one.
            if (audioData.length > 1) {
                console.log("[WhisperLocal] Stereo detected, using channel 0");
                audioData = audioData[0];
            }
        }

        // Ensure it's a Float32Array
        // wav.getSamples() with 32f returns Float64Array in some versions, or Float32Array. 
        // transformers.js wants Float32Array.
        const audioTensor = new Float32Array(audioData);

        const output = await transcriber(audioTensor, {
            chunk_length_s: 30,
            stride_length_s: 5,
            language: 'korean', // Force Korean
            task: 'transcribe',
            return_timestamps: true // Request timestamps
        });

        // Output format: { text: "...", chunks: [ { timestamp: [start, end], text: "..." } ] }
        console.log(`[WhisperLocal] Raw output text length: ${output.text.length}`);

        const segments = (output.chunks || []).map(chunk => ({
            start: chunk.timestamp[0],
            end: chunk.timestamp[1] || chunk.timestamp[0] + 1.0,
            text: chunk.text.trim(),
            confidence: 0.9
        }));

        return segments;

    } catch (error) {
        console.error("[WhisperLocal] Error:", error);
        throw error;
    }
}

module.exports = { transcribeWithLocalWhisper };
