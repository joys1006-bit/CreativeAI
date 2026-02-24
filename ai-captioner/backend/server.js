require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { extractAudio } = require('./services/audioService');
const { transcribeWithGemini, correctTextWithGemini } = require('./services/geminiService');
const { generateWaveform } = require('./services/waveformService');
const { transcribeWithLocalWhisper } = require('./services/whisperLocalService');
const { transcribeWithWhisper } = require('./services/whisper_service_wrapper'); // assuming we wrap the python call for clarity
const logger = require('./services/logger');
const ffmpeg = require('fluent-ffmpeg');
const { detectSilence, removeSilence } = require('./services/silenceDetector');
const { getVoiceProfiles, getSpeechParams } = require('./services/ttsService');
const { translateSegments, getSupportedLanguages } = require('./services/translationService');



// ... (existing code)



// 24h Automatic Job Cleanup Scheduler
// ... (rest of file)
// Resource Cleanup on Exit
const cleanupAndExit = () => {
    logger.info("[System] Shutting down. Cleaning up temporary resources...");
    // Future: Add logic to kill orphan subprocesses if any
    process.exit(0);
};
process.on('SIGINT', cleanupAndExit);
process.on('SIGTERM', cleanupAndExit);

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

const { createSRTFile } = require('./services/subtitleService');

app.post('/export-video', async (req, res) => {
    const { jobId, withSubtitles, format = 'mp4' } = req.body;
    const job = jobs[jobId];
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const inputPath = path.join(UPLOAD_DIR, `${jobId}${path.extname(job.fileName)}`);
    const outputPath = path.join(UPLOAD_DIR, `export_${jobId}_${Date.now()}.${format}`);

    logger.audit('USER', 'VIDEO_EXPORT_START', { jobId, withSubtitles });

    let command = ffmpeg(inputPath);

    if (withSubtitles && job.segments.length > 0) {
        try {
            // STEP 1: Generate temporary SRT file for FFmpeg
            const srtPath = createSRTFile(jobId, job.segments, UPLOAD_DIR);

            // STEP 2: Apply Subtitles Filter (Hard-coding)
            // Note: FFmpeg 'subtitles' filter requires escaped path for Windows
            const escapedSrtPath = srtPath.replace(/\\/g, '/').replace(/:/g, '\\:');
            command = command.videoFilters(`subtitles='${escapedSrtPath}':force_style='FontSize=20,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=3'`);

            logger.info(`[Export] Subtitles enabled for Job ${jobId}. Using SRT: ${srtPath}`);
        } catch (err) {
            logger.error("[Export] Failed to prepare subtitles.", err);
        }
    }

    command
        .output(outputPath)
        .on('start', (cmd) => logger.info(`[FFmpeg] Command: ${cmd}`))
        .on('progress', (progress) => {
            if (progress.percent) logger.info(`[Export ${jobId}] Progress: ${progress.percent.toFixed(1)}%`);
        })
        .on('end', () => {
            logger.audit('SYSTEM', 'VIDEO_EXPORT_COMPLETE', { jobId, outputPath });
            res.json({
                downloadUrl: `http://localhost:${port}/uploads/${path.basename(outputPath)}`,
                fileName: `export_${job.fileName}`
            });
        })
        .on('error', (err) => {
            logger.error(`[Export ${jobId}] Failed.`, err);
            res.status(500).json({ error: "내보내기 중 오류가 발생했습니다: " + err.message });
        })
        .run();
});

app.post('/export-clip', (req, res) => {
    const { jobId, start, end, logoName } = req.body;
    const job = jobs[jobId];
    if (!job) return res.status(404).send('Job not found');

    const inputPath = path.join(UPLOAD_DIR, `${jobId}${path.extname(job.fileName)}`);
    const outputPath = path.join(UPLOAD_DIR, `clip_${jobId}_${Date.now()}.mp4`);
    const logoPath = logoName ? path.join(UPLOAD_DIR, logoName) : null;

    logger.audit('USER', 'CLIP_EXPORT', { jobId, start, end, hasLogo: !!logoPath });

    let command = ffmpeg(inputPath).setStartTime(start).setDuration(end - start);

    if (logoPath && fs.existsSync(logoPath)) {
        command = command.input(logoPath).complexFilter([{ filter: 'overlay', options: { x: 'main_w-overlay_w-10', y: '10' } }]);
    }

    command.output(outputPath)
        .on('end', () => res.json({ clipUrl: `http://localhost:${port}/uploads/${path.basename(outputPath)}` }))
        .on('error', (err) => {
            logger.error("Clip creation failed.", err);
            res.status(500).send("클립 생성 실패: " + err.message);
        }).run();
});

app.post('/upload-logo', upload.single('logo'), (req, res) => {
    if (!req.file) return res.status(400).send('No logo uploaded');
    res.json({ logoName: req.file.filename });
});

app.get('/stats', (req, res) => {
    try {
        const jobEntries = Object.values(jobs || {});
        const totalProjects = jobEntries.length;
        const completedProjects = jobEntries.filter(j => j.status === 'COMPLETED').length;
        const totalSegments = jobEntries.reduce((acc, j) => acc + (j.segments?.length || 0), 0);

        let totalScore = 0;
        let scoreCount = 0;
        jobEntries.forEach(j => {
            if (j.sentimentScore !== undefined) {
                totalScore += j.sentimentScore;
                scoreCount++;
            }
        });
        const avgScore = scoreCount > 0 ? (totalScore / scoreCount).toFixed(2) : "0.50";

        res.json({
            totalProjects,
            completedProjects,
            totalSegments,
            avgSentiment: avgScore,
            uptime: process.uptime()
        });
    } catch (e) {
        logger.error("Stats calculation failed", e);
        res.status(500).json({ error: "통계 계산 중 오류가 발생했습니다." });
    }
});

app.use('/uploads', express.static(UPLOAD_DIR));

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
        highlights: [],
        waveform: [],
        progress: { stage: 'uploading', updatedAt: Date.now() },
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

// transcribeWithWhisper removed - now imported from ./services/whisper_service_wrapper.js

async function processTranscription(jobId, videoPath, audioPath, targetLanguage) {
    const job = jobs[jobId];
    if (!job) return;

    try {
        job.status = 'PROCESSING';
        job.progress = { stage: 'extracting', updatedAt: Date.now() };
        saveJobs();
        logger.info(`[Job ${jobId}] Phase 2: AI Intelligence Analysis (Gemini 2.0)`);
        job.progress = { stage: 'transcribing', updatedAt: Date.now() };

        // Parallel Execution: Whisper (Local Python Process) + Gemini (Context) + Waveform
        const [whisperSegments, geminiData, waveformData] = await Promise.all([
            transcribeWithWhisper(audioPath).catch(err => {
                logger.error("Local Python Whisper Failed", err);
                return [];
            }),
            transcribeWithGemini(audioPath, targetLanguage).catch(err => {
                logger.error("Gemini Failed", err);
                return { segments: [], summary: "AI 분석 실패", keywords: [], sentiment: "분석 실패" };
            }),
            generateWaveform(audioPath, 20).catch(err => [])
        ]);

        if (whisperSegments.length > 0) {
            logger.info(`[Job ${jobId}] Using Whisper segments (${whisperSegments.length}). Starting Gemini text correction...`);
            job.progress = { stage: 'correcting', updatedAt: Date.now() };
            // Phase 3: Gemini corrects only the text, Whisper timing stays
            job.segments = await correctTextWithGemini(audioPath, whisperSegments, targetLanguage).catch(err => {
                logger.error("Gemini Text Correction Failed, using raw Whisper text", err);
                return whisperSegments;
            });
        } else {
            logger.warn(`[Job ${jobId}] Whisper returned 0 segments. Fallback to Gemini.`);
            job.segments = geminiData.segments;
        }
        job.progress = { stage: 'finalizing', updatedAt: Date.now() };

        job.summary = geminiData.summary;
        job.keywords = geminiData.keywords;
        job.sentiment = geminiData.sentiment;
        job.sentimentScore = geminiData.sentimentScore || 0.5;
        job.highlights = geminiData.highlights || [];
        job.waveform = waveformData;

        // Critical: Mark as FAILED if segments are empty despite AI success response
        if (job.segments.length === 0) {
            job.status = 'FAILED';
            job.error = "Whisper AI가 자막을 생성하지 못했습니다. 오디오를 확인해 주세요.";
        } else {
            job.status = 'COMPLETED';
        }

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

// ===== 자막 CRUD API =====

// 자막 수정 (전체 자막 배열 업데이트)
app.patch('/subtitle/:jobId', (req, res) => {
    const job = jobs[req.params.jobId];
    if (!job) return res.status(404).json({ error: 'Job not found' });
    const { segments } = req.body;
    if (!Array.isArray(segments)) return res.status(400).json({ error: 'segments 배열이 필요합니다' });
    job.segments = segments;
    saveJobs();
    logger.audit('USER', 'SUBTITLE_UPDATE', { jobId: req.params.jobId, segmentCount: segments.length });
    res.json({ success: true, segmentCount: segments.length });
});

// 자막 추가
app.post('/subtitle/:jobId/add', (req, res) => {
    const job = jobs[req.params.jobId];
    if (!job) return res.status(404).json({ error: 'Job not found' });
    const { start, end, text } = req.body;
    if (start === undefined || end === undefined || !text) {
        return res.status(400).json({ error: 'start, end, text가 필요합니다' });
    }
    const newSegment = { start, end, text, confidence: 1.0, id: `seg_${Date.now()}` };
    job.segments.push(newSegment);
    job.segments.sort((a, b) => a.start - b.start);
    saveJobs();
    logger.audit('USER', 'SUBTITLE_ADD', { jobId: req.params.jobId });
    res.json({ success: true, segment: newSegment });
});

// 자막 삭제
app.delete('/subtitle/:jobId/:index', (req, res) => {
    const job = jobs[req.params.jobId];
    if (!job) return res.status(404).json({ error: 'Job not found' });
    const index = parseInt(req.params.index);
    if (isNaN(index) || index < 0 || index >= job.segments.length) {
        return res.status(400).json({ error: '유효하지 않은 인덱스입니다' });
    }
    job.segments.splice(index, 1);
    saveJobs();
    logger.audit('USER', 'SUBTITLE_DELETE', { jobId: req.params.jobId, index });
    res.json({ success: true, remaining: job.segments.length });
});

// 자막 합치기
app.post('/subtitle/:jobId/merge', (req, res) => {
    const job = jobs[req.params.jobId];
    if (!job) return res.status(404).json({ error: 'Job not found' });
    const { indexA, indexB } = req.body;
    if (indexA === undefined || indexB === undefined) {
        return res.status(400).json({ error: 'indexA, indexB가 필요합니다' });
    }
    const a = Math.min(indexA, indexB);
    const b = Math.max(indexA, indexB);
    if (a < 0 || b >= job.segments.length) {
        return res.status(400).json({ error: '유효하지 않은 인덱스입니다' });
    }
    const segA = job.segments[a];
    const segB = job.segments[b];
    segA.end = segB.end;
    segA.text = segA.text + ' ' + segB.text;
    job.segments.splice(b, 1);
    saveJobs();
    logger.audit('USER', 'SUBTITLE_MERGE', { jobId: req.params.jobId, indexA: a, indexB: b });
    res.json({ success: true, merged: segA });
});

// ===== 진행 상태 API =====
app.get('/progress/:jobId', (req, res) => {
    const job = jobs[req.params.jobId];
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json({
        status: job.status,
        stage: job.progress?.stage || 'uploading',
        updatedAt: job.progress?.updatedAt || Date.now()
    });
});

// ===== 무음 감지/제거 API =====
app.get('/silence-detect/:jobId', async (req, res) => {
    const job = jobs[req.params.jobId];
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const audioPath = path.join(UPLOAD_DIR, `${req.params.jobId}.wav`);
    if (!fs.existsSync(audioPath)) {
        return res.status(400).json({ error: '오디오 파일을 찾을 수 없습니다' });
    }

    try {
        const silenceSegments = await detectSilence(audioPath, -30, 0.5);
        logger.audit('AI_ENGINE', 'SILENCE_DETECT', { jobId: req.params.jobId, count: silenceSegments.length });
        res.json({ silenceSegments });
    } catch (err) {
        logger.error('[SilenceDetect] Failed', err);
        res.status(500).json({ error: '무음 감지 실패: ' + err.message });
    }
});

app.post('/remove-silence', async (req, res) => {
    const { jobId, silenceSegments } = req.body;
    const job = jobs[jobId];
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const inputPath = path.join(UPLOAD_DIR, `${jobId}${path.extname(job.fileName)}`);
    if (!fs.existsSync(inputPath)) {
        return res.status(400).json({ error: '원본 파일을 찾을 수 없습니다' });
    }

    try {
        const outputPath = await removeSilence(inputPath, silenceSegments, UPLOAD_DIR);
        logger.audit('AI_ENGINE', 'SILENCE_REMOVE', { jobId, removedCount: silenceSegments.length });
        res.json({
            downloadUrl: `http://localhost:${port}/uploads/${path.basename(outputPath)}`,
            fileName: `silence_removed_${job.fileName}`
        });
    } catch (err) {
        logger.error('[SilenceRemove] Failed', err);
        res.status(500).json({ error: '무음 제거 실패: ' + err.message });
    }
});

// ===== TTS API =====
app.get('/tts/voices', (req, res) => {
    const lang = req.query.lang || null;
    res.json({ voices: getVoiceProfiles(lang) });
});

app.get('/tts/params/:voiceId', (req, res) => {
    const params = getSpeechParams(req.params.voiceId);
    res.json(params);
});

// ===== 번역 API =====
app.get('/translate/languages', (req, res) => {
    res.json({ languages: getSupportedLanguages() });
});

app.post('/translate', async (req, res) => {
    const { jobId, targetLang } = req.body;
    const job = jobs[jobId];
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (!job.segments || job.segments.length === 0) {
        return res.status(400).json({ error: '번역할 자막이 없습니다' });
    }

    try {
        const translated = await translateSegments(job.segments, 'ko', targetLang);
        logger.audit('AI_ENGINE', 'TRANSLATE', { jobId, targetLang, count: translated.length });
        res.json({ segments: translated });
    } catch (err) {
        logger.error('[Translate] Failed', err);
        res.status(500).json({ error: '번역 실패: ' + err.message });
    }
});

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
            const srtPath = path.join(UPLOAD_DIR, `${jobId}.srt`);
            [videoPath, audioPath, srtPath].forEach(p => {
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
