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

const jobs = {}; // Use plain object for easier JSON serialization

app.get('/', (req, res) => res.send('AI Captioner Pro Backend - Operational 🚀'));

app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).send('No file uploaded');

    const jobId = uuidv4();
    const videoPath = req.file.path;
    const audioPath = path.join(UPLOAD_DIR, `${jobId}.wav`);
    const targetLanguage = req.body.language || 'ko';

    const job = {
        jobId,
        fileName: req.file.originalname,
        status: 'PENDING',
        segments: [],
        summary: '',
        keywords: [],
        sentiment: '',
        waveform: []
    };
    jobs[jobId] = job;

    // Background process orchestration
    console.log(`[Server] Job ${jobId} initiated (Lang: ${targetLanguage})`);

    extractAudio(videoPath, audioPath)
        .then(() => processTranscription(jobId, videoPath, audioPath, targetLanguage))
        .catch(err => {
            console.error(`[Job ${jobId}] Extraction error:`, err);
            job.status = 'FAILED';
            job.error = "오디오 추출 실패";
        });

    res.json({ jobId });
});

async function processTranscription(jobId, videoPath, audioPath, targetLanguage) {
    const job = jobs[jobId];
    if (!job) return;

    try {
        job.status = 'PROCESSING';
        console.log(`[Job ${jobId}] Step 2: Running AI Analysis (${targetLanguage})...`);

        const [geminiResult, waveformData] = await Promise.all([
            transcribeWithGemini(audioPath, targetLanguage),
            generateWaveform(audioPath, 20)
        ]);

        job.segments = geminiResult.segments;
        job.summary = geminiResult.summary;
        job.keywords = geminiResult.keywords;
        job.sentiment = geminiResult.sentiment;
        job.waveform = waveformData;
        job.status = 'COMPLETED';

        console.log(`[Job ${jobId}] Success: Analysis completed.`);
    } catch (error) {
        console.error(`[Job ${jobId}] AI/Waveform Error:`, error);
        job.status = 'FAILED';
        job.error = error.message;
    }
}

app.get('/status/:jobId', (req, res) => {
    const job = jobs[req.params.jobId];
    if (!job) return res.status(404).send('Job not found');
    res.json(job);
});

const server = app.listen(port, () => {
    console.log(`[AI Captioner Pro] Backend listening at http://localhost:${port}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`[CRITICAL] Port ${port} is already in use.`);
    } else {
        console.error('[CRITICAL] Server error:', err);
    }
    process.exit(1);
});
