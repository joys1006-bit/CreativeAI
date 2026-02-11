const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Configuration
// In production, we might need a way to set API Key if .env is not present.
// For now, we assume .env is copied or we use a fallback.
const API_KEY = process.env.GOOGLE_API_KEY || "YOUR_API_KEY_HERE";
const genAI = new GoogleGenerativeAI(API_KEY);

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic.replace('app.asar', 'app.asar.unpacked'));

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            webSecurity: false // Allow loading local files (for video preview)
        },
        titleBarStyle: 'hidden',
        titleBarOverlay: {
            color: '#121212',
            symbolColor: '#ffffff',
            height: 40
        }
    });

    const isDev = !app.isPackaged;
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    // Open external links in browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// --- Backend Logic Ported to Main Process ---

ipcMain.handle('process-video', async (event, videoPath) => {
    const jobId = uuidv4();
    const tempDir = app.getPath('temp');
    const audioPath = path.join(tempDir, `${jobId}.wav`);

    try {
        mainWindow.webContents.send('processing-progress', { status: 'extracting', percent: 0 });

        // 1. Extract Audio
        await extractAudio(videoPath, audioPath);
        mainWindow.webContents.send('processing-progress', { status: 'analyzing', percent: 30 });

        // 2. Parallel AI & Waveform
        const [geminiResult, waveformData] = await Promise.all([
            transcribeWithGemini(audioPath),
            generateWaveform(audioPath, 20)
        ]);

        mainWindow.webContents.send('processing-progress', { status: 'completed', percent: 100 });

        // Clean up temp file
        fs.unlink(audioPath, (err) => { if (err) console.error("Temp file delete error:", err); });

        return {
            jobId,
            status: 'COMPLETED',
            segments: geminiResult.segments,
            summary: geminiResult.summary,
            keywords: geminiResult.keywords,
            waveform: waveformData
        };

    } catch (error) {
        console.error('Processing failed:', error);
        return { status: 'FAILED', error: error.message };
    }
});

function extractAudio(videoPath, audioPath) {
    return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
            .toFormat('wav')
            .audioCodec('pcm_s16le')
            .audioFrequency(16000)
            .audioChannels(1)
            .on('end', resolve)
            .on('error', reject)
            .save(audioPath);
    });
}

function generateWaveform(audioPath, samplesPerSecond) {
    return new Promise((resolve, reject) => {
        fs.readFile(audioPath, (err, buffer) => {
            if (err) return reject(err);

            // Robust parsing (same logic as robust backend service)
            if (buffer.length < 12 || buffer.toString('utf8', 0, 4) !== 'RIFF') return reject(new Error('Invalid WAV'));

            let pos = 12;
            let dataOffset = -1;
            let dataSize = 0;
            let sampleRate = 16000;
            let bitsPerSample = 16;
            let fmtParsed = false;

            while (pos < buffer.length) {
                const chunkId = buffer.toString('utf8', pos, pos + 4);
                const chunkSize = buffer.readUInt32LE(pos + 4);
                pos += 8;

                if (chunkId === 'fmt ') {
                    sampleRate = buffer.readUInt32LE(pos + 4);
                    bitsPerSample = buffer.readUInt16LE(pos + 14);
                    fmtParsed = true;
                } else if (chunkId === 'data') {
                    dataOffset = pos;
                    dataSize = chunkSize;
                    break;
                }
                pos += chunkSize;
            }

            if (!fmtParsed || dataOffset === -1) return reject(new Error('WAV parse failed'));

            const bytesPerSample = bitsPerSample / 8;
            const totalSamples = Math.floor(dataSize / bytesPerSample);
            const step = Math.floor(sampleRate / samplesPerSecond);
            const waveform = [];

            for (let i = 0; i < totalSamples; i += step) {
                let maxVal = 0;
                for (let j = 0; j < step && (i + j) < totalSamples; j++) {
                    const offset = dataOffset + (i + j) * bytesPerSample;
                    if (offset + 2 > buffer.length) break;
                    const val = buffer.readInt16LE(offset);
                    if (Math.abs(val) > maxVal) maxVal = Math.abs(val);
                }
                waveform.push(maxVal / 32768.0);
            }
            resolve(waveform);
        });
    });
}

async function transcribeWithGemini(audioPath) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Use flash for speed
    const audioData = fs.readFileSync(audioPath);
    const audioBase64 = audioData.toString('base64');

    const prompt = `
    Analyze this audio for business context.
    Return STRICT JSON:
    {
        "segments": [{ "start": 0.0, "end": 2.5, "text": "..." }],
        "summary": "3-sentence summary",
        "keywords": ["key1", "key2", "key3", "key4", "key5"]
    }
    Timestamps accurate to 0.01s. No markdown.
    `;

    const result = await model.generateContent([
        prompt,
        { inlineData: { data: audioBase64, mimeType: "audio/wav" } }
    ]);

    let text = result.response.text();
    const jsonStartIndex = text.indexOf('{');
    const jsonEndIndex = text.lastIndexOf('}');
    if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
        text = text.substring(jsonStartIndex, jsonEndIndex + 1);
    }

    try {
        return JSON.parse(text);
    } catch (e) {
        console.error("Gemini JSON Parse Error:", e);
        return { segments: [], summary: "Error parsing AI response", keywords: [] };
    }
}
