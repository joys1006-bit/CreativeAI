/**
 * AI Captioner PRO 백엔드 서버
 * 리팩토링: 라우트 모듈 분리 완료
 * 담당: 백엔드 개발자 (L4)
 * 설계: 백엔드 아키텍트 (L6)
 */
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
const { transcribeWithWhisper } = require('./services/whisper_service_wrapper');
const { identifySpeakers } = require('./services/speakerService');
const logger = require('./services/logger');

// === 서버 설정 ===
const app = express();
const port = 8000;

app.use(cors());
app.use(express.json());

// === 업로드 디렉토리 설정 ===
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage });

// === 작업(Job) 데이터 관리 ===
const JOBS_FILE = path.join(__dirname, 'jobs.json');
let jobs = {};

// 서버 시작 시 jobs 파일 로드
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

// === 리소스 정리 ===
const cleanupAndExit = () => {
    logger.info("[System] Shutting down. Cleaning up temporary resources...");
    process.exit(0);
};
process.on('SIGINT', cleanupAndExit);
process.on('SIGTERM', cleanupAndExit);

// === 정적 파일 서빙 ===
app.use('/uploads', express.static(UPLOAD_DIR));
app.get('/', (req, res) => res.send('CreativeAI Insight Backend - Operational 🚀'));

// === 라우트 모듈 등록 ===
const subtitleRoutes = require('./routes/subtitleRoutes')(jobs, saveJobs, logger);
const exportRoutes = require('./routes/exportRoutes')(jobs, saveJobs, logger, upload, UPLOAD_DIR, port);
const silenceRoutes = require('./routes/silenceRoutes')(jobs, saveJobs, logger, UPLOAD_DIR, port);
const ttsRoutes = require('./routes/ttsRoutes')(jobs, saveJobs, logger);

app.use('/subtitle', subtitleRoutes);
app.use('/export', exportRoutes);
app.use('/silence', silenceRoutes);
app.use('/tts', ttsRoutes);

// === 하위 호환 API 경로 (기존 프론트엔드 호환) ===
app.post('/export-video', (req, res) => req.url = '/video' && exportRoutes(req, res));
app.post('/export-clip', (req, res) => req.url = '/clip' && exportRoutes(req, res));
app.post('/upload-logo', upload.single('logo'), (req, res) => {
    if (!req.file) return res.status(400).send('No logo uploaded');
    res.json({ logoName: req.file.filename });
});
app.get('/silence-detect/:jobId', (req, res) => {
    req.url = `/detect/${req.params.jobId}`;
    silenceRoutes(req, res);
});
app.post('/remove-silence', (req, res) => {
    req.url = '/remove';
    silenceRoutes(req, res);
});

// === 화자 분리 API ===
app.post('/speaker-identify', async (req, res) => {
    const { jobId } = req.body;
    const job = jobs[jobId];
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (!job.segments || job.segments.length === 0) {
        return res.status(400).json({ error: '화자 분리할 자막이 없습니다' });
    }

    const audioPath = path.join(UPLOAD_DIR, `${jobId}.wav`);
    if (!fs.existsSync(audioPath)) {
        return res.status(400).json({ error: '오디오 파일을 찾을 수 없습니다' });
    }

    try {
        const result = await identifySpeakers(audioPath, job.segments);
        job.segments = result.segments;
        job.speakers = result.speakers;
        saveJobs();
        res.json({
            segments: result.segments,
            speakers: result.speakers,
            message: `${result.speakers.length}명의 화자가 식별되었습니다.`
        });
    } catch (err) {
        logger.error('[Speaker] API Failed', err);
        res.status(500).json({ error: '화자 분리 실패: ' + err.message });
    }
});

// 번역 라우트 (ttsRoutes에서 분리된 경로 매핑)
app.get('/translate/languages', (req, res) => {
    const { getSupportedLanguages } = require('./services/translationService');
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
        const { translateSegments } = require('./services/translationService');
        const translated = await translateSegments(job.segments, 'ko', targetLang);
        logger.audit('AI_ENGINE', 'TRANSLATE', { jobId, targetLang, count: translated.length });
        res.json({ segments: translated });
    } catch (err) {
        logger.error('[Translate] Failed', err);
        res.status(500).json({ error: '번역 실패: ' + err.message });
    }
});

// === 파일 업로드 & AI 분석 ===
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

// === AI 전사(Transcription) 처리 ===
async function processTranscription(jobId, videoPath, audioPath, targetLanguage) {
    const job = jobs[jobId];
    if (!job) return;

    try {
        job.status = 'PROCESSING';
        job.progress = { stage: 'extracting', updatedAt: Date.now() };
        saveJobs();
        logger.info(`[Job ${jobId}] Phase 2: AI Intelligence Analysis (Gemini 2.0)`);
        job.progress = { stage: 'transcribing', updatedAt: Date.now() };

        // 병렬 실행: Whisper + Gemini + Waveform
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

        // === Gemini 직접 전사를 메인 엔진으로 사용 (Whisper는 fallback) ===
        // Gemini가 오디오를 직접 듣고 2~5초 세그먼트 + 정확한 타이밍을 생성
        if (geminiData.segments && geminiData.segments.length > 0) {
            logger.info(`[Job ${jobId}] ✅ Using GEMINI direct transcription (${geminiData.segments.length} segs)`);
            job.segments = geminiData.segments;
            job.segments.slice(0, 10).forEach((s, i) => {
                logger.info(`  [G${i}] ${(s.start || 0).toFixed(2)}-${(s.end || 0).toFixed(2)}s "${(s.text || '').substring(0, 30)}"`);
            });
        } else if (whisperSegments.length > 0) {
            logger.warn(`[Job ${jobId}] ⚠️ Gemini 0 segs. Falling back to Whisper (${whisperSegments.length} segs)`);
            job.segments = whisperSegments;
        } else {
            logger.warn(`[Job ${jobId}] Whisper returned 0 segments. Fallback to Gemini.`);
            job.segments = geminiData.segments;
        }
        job.progress = { stage: 'finalizing', updatedAt: Date.now() };

        // === 최종 세그먼트 분할 후처리 (Gemini 성공/실패 관계없이 항상 적용) ===
        const MAX_SEG_DURATION = 5; // 최대 5초
        const MAX_SEG_CHARS = 40;   // 최대 40자
        const finalSegments = [];
        for (const seg of job.segments) {
            const dur = seg.end - seg.start;
            const len = (seg.text || '').length;

            if (dur <= MAX_SEG_DURATION && len <= MAX_SEG_CHARS) {
                finalSegments.push(seg);
                continue;
            }

            // 긴 세그먼트 분할
            const text = seg.text || '';
            // 문장 부호 기준 분할 시도
            const parts = text.split(/(?<=[.!?。，,、\n])\s*/).filter(s => s.trim());

            if (parts.length > 1) {
                const partDur = dur / parts.length;
                for (let i = 0; i < parts.length; i++) {
                    finalSegments.push({
                        ...seg,
                        id: finalSegments.length,
                        text: parts[i].trim(),
                        start: seg.start + i * partDur,
                        end: seg.start + (i + 1) * partDur,
                    });
                }
            } else if (len > MAX_SEG_CHARS) {
                // 문장 부호 없으면 글자 수 기준 분할
                const chunkCount = Math.ceil(len / MAX_SEG_CHARS);
                const chunkSize = Math.ceil(len / chunkCount);
                const chunkDur = dur / chunkCount;
                for (let i = 0; i < chunkCount; i++) {
                    const chunkText = text.substring(i * chunkSize, Math.min((i + 1) * chunkSize, len));
                    if (!chunkText.trim()) continue;
                    finalSegments.push({
                        ...seg,
                        id: finalSegments.length,
                        text: chunkText.trim(),
                        start: seg.start + i * chunkDur,
                        end: seg.start + (i + 1) * chunkDur,
                    });
                }
            } else {
                // duration만 긴 경우 (짧은 텍스트) — 분할 대신 duration 캡핑
                // 한국어 기준 1자당 약 0.15초 (빠른 말), 최소 2초
                const cappedDur = Math.max(2, Math.min(MAX_SEG_DURATION, len * 0.15));
                finalSegments.push({
                    ...seg,
                    id: finalSegments.length,
                    end: seg.start + cappedDur,
                });
            }
            logger.info(`[Split] "${text.substring(0, 20)}..." (${dur.toFixed(1)}s) → ${finalSegments.length} parts`);
        }
        // ID 재할당
        finalSegments.forEach((s, i) => { s.id = i; });
        job.segments = finalSegments;
        logger.info(`[Pipeline] Final segment count: ${job.segments.length}`);

        job.summary = geminiData.summary;
        job.keywords = geminiData.keywords;
        job.sentiment = geminiData.sentiment;
        job.sentimentScore = geminiData.sentimentScore || 0.5;
        job.highlights = geminiData.highlights || [];
        job.waveform = waveformData;

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

// === 상태/통계 API ===
app.get('/progress/:jobId', (req, res) => {
    const job = jobs[req.params.jobId];
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json({
        status: job.status,
        stage: job.progress?.stage || 'uploading',
        updatedAt: job.progress?.updatedAt || Date.now()
    });
});

app.get('/status/:jobId', (req, res) => {
    const job = jobs[req.params.jobId];
    if (!job) return res.status(404).send('Job not found');
    res.json(job);
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

// === 24시간 자동 Job 정리 스케줄러 ===
setInterval(() => {
    logger.info("[Cleanup] Scanning for expired jobs (24h+)...");
    const now = Date.now();
    let deletedCount = 0;

    Object.keys(jobs).forEach(jobId => {
        const job = jobs[jobId];
        const createdAt = new Date(job.createdAt || 0).getTime();

        if (now - createdAt > 24 * 60 * 60 * 1000) {
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
}, 60 * 60 * 1000);

// === 서버 시작 ===
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
