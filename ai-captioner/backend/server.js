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
const logger = require('./services/logger');

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

const JOBS_FILE = path.join(__dirname, 'jobs.json');
let jobs = {};

// Load jobs from file on start
if (fs.existsSync(JOBS_FILE)) {
    try {
        jobs = JSON.parse(fs.readFileSync(JOBS_FILE, 'utf8'));
        console.log(`[Server] Loaded ${Object.keys(jobs).length} jobs from storage.`);
    } catch (e) {
        logger.error("Failed to load jobs file.", e);
        jobs = {};
    }
}

function saveJobs() {
    try {
        fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2));
    } catch (e) {
        logger.error("Failed to save jobs file.", e);
    }
}

app.get('/', (req, res) => res.send('CreativeAI Insight Backend - Operational 🚀'));

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
        sentimentScore: 0.5,
        waveform: [],
        createdAt: new Date().toISOString()
    };
    jobs[jobId] = job;
    saveJobs();

    logger.audit('SYSTEM', 'UPLOAD_START', { jobId, fileName: req.file.originalname, targetLanguage });

    extractAudio(videoPath, audioPath)
        .then(() => {
            logger.info(`[Job ${jobId}] Audio extraction successful.`);
            processTranscription(jobId, videoPath, audioPath, targetLanguage);
        })
        .catch(err => {
            logger.error(`[Job ${jobId}] Extraction failed.`, err);
            job.status = 'FAILED';
            job.error = "오디오 추출 실패";
            saveJobs();
        });

    res.json({ jobId });
});

async function processTranscription(jobId, videoPath, audioPath, targetLanguage) {
    const job = jobs[jobId];
    if (!job) return;

    try {
        job.status = 'PROCESSING';
        saveJobs();
        logger.info(`[Job ${jobId}] Phase 2: AI Intelligence Analysis started.`, { targetLanguage });

        const [geminiResult, waveformData] = await Promise.all([
            transcribeWithGemini(audioPath, targetLanguage),
            generateWaveform(audioPath, 20)
        ]);

        job.segments = geminiResult.segments;
        job.summary = geminiResult.summary;
        job.keywords = geminiResult.keywords;
        job.sentiment = geminiResult.sentiment;
        job.sentimentScore = geminiResult.sentimentScore || 0.5;
        job.waveform = waveformData;
        job.status = 'COMPLETED';
        saveJobs();

        logger.info(`[Job ${jobId}] Step COMPLETE: Analysis finished.`);
        logger.audit('AI_ENGINE', 'ANALYSIS_FINISH', { jobId, segmentCount: job.segments.length });
    } catch (error) {
        logger.error(`[Job ${jobId}] AI/Waveform Engine Error.`, error);
        job.status = 'FAILED';
        job.error = error.message;
        saveJobs();
    }
}

app.get('/status/:jobId', (req, res) => {
    const job = jobs[req.params.jobId];
    if (!job) return res.status(404).send('Job not found');
    res.json(job);
});

// 24h Automatic Job Cleanup Scheduler
setInterval(() => {
    logger.info("[Cleanup] Scanning for expired jobs (24h+)...");
    const now = Date.now();
    let deletedCount = 0;

    Object.keys(jobs).forEach(jobId => {
        const job = jobs[jobId];
        const createdAt = new Date(job.createdAt || 0).getTime();

        if (now - createdAt > 24 * 60 * 60 * 1000) {
            // Delete files
            const videoPath = path.join(UPLOAD_DIR, `${jobId}${path.extname(job.fileName)}`);
            const audioPath = path.join(UPLOAD_DIR, `${jobId}.wav`);
            [videoPath, audioPath].forEach(p => {
                if (fs.existsSync(p)) fs.unlinkSync(p);
            });

            delete jobs[jobId];
            deletedCount++;
        }
    });

    if (deletedCount > 0) {
        saveJobs();
        logger.info(`[Cleanup] Successfully removed ${deletedCount} expired jobs.`);
    }
}, 60 * 60 * 1000); // Check every hour

app.listen(port, () => {
    logger.info(`CreativeAI Insight Backend listening at http://localhost:${port}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`[CRITICAL] Port ${port} is already in use.`);
    } else {
        console.error('[CRITICAL] Server error:', err);
    }
    process.exit(1);
});
