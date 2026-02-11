require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { extractAudio } = require('./services/audioService');
const { transcribeWithGemini } = require('./services/geminiService');
const { generateWaveform } = require('./services/waveformService');

const app = express();
const port = 8000;

app.use(cors());
app.use(express.json());

const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage });

const jobs = new Map();

app.get('/', (req, res) => res.send('AI Captioner Node Backend is running'));

app.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded');

    const jobId = uuidv4();
    const videoPath = req.file.path;
    const audioPath = path.join(UPLOAD_DIR, `${jobId}.wav`);

    const job = {
        jobId,
        filename: req.file.originalname,
        status: 'PROCESSING',
        segments: []
    };
    jobs.set(jobId, job);

    // 비동기 처리 착수
    processTranscription(jobId, videoPath, audioPath);

    res.json(job);
});

async function processTranscription(jobId, videoPath, audioPath) {
    const job = jobs.get(jobId);
    try {
        // 1. 오디오 추출
        console.log(`[${jobId}] Step 1: Extracting Audio...`);
        await extractAudio(videoPath, audioPath);

        // 2. Parallel Processing: Gemini AI & Waveform Generation
        console.log(`[${jobId}] Step 2: Running AI & Waveform Analysis...`);

        const [geminiResult, waveformData] = await Promise.all([
            transcribeWithGemini(audioPath),
            generateWaveform(audioPath, 20) // 20 samples/sec for UI (approx 1 sample every 50ms)
        ]);

        job.segments = geminiResult.segments;
        job.summary = geminiResult.summary;
        job.keywords = geminiResult.keywords;
        job.waveform = waveformData;

        job.status = 'COMPLETED';
        console.log(`[${jobId}] Transcription & Analysis Completed!`);
    } catch (error) {
        console.error(`[${jobId}] Error:`, error);
        job.status = 'FAILED';
    }
}

app.get('/status/:jobId', (req, res) => {
    const job = jobs.get(req.params.jobId);
    if (!job) return res.status(404).send('Job not found');
    res.json(job);
});

const server = app.listen(port, () => {
    console.log(`[AI Captioner] Backend listening at http://localhost:${port}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`[CRITICAL] Port ${port} is already in use. Please kill the other process or change the port.`);
    } else {
        console.error('[CRITICAL] Server error:', err);
    }
    process.exit(1);
});
