/**
 * 내보내기 API 라우트 모듈 (영상 내보내기, 클립, 로고)
 * 담당: 백엔드 개발자 (L4)
 * 설계: 백엔드 아키텍트 (L6)
 */
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const { createSRTFile } = require('../services/subtitleService');

module.exports = (jobs, saveJobs, logger, upload, UPLOAD_DIR, port) => {
    // 동영상 내보내기 (자막 포함)
    router.post('/video', async (req, res) => {
        const { jobId, withSubtitles, format = 'mp4' } = req.body;
        const job = jobs[jobId];
        if (!job) return res.status(404).json({ error: 'Job not found' });

        const inputPath = path.join(UPLOAD_DIR, `${jobId}${path.extname(job.fileName)}`);
        const outputPath = path.join(UPLOAD_DIR, `export_${jobId}_${Date.now()}.${format}`);

        logger.audit('USER', 'VIDEO_EXPORT_START', { jobId, withSubtitles });

        let command = ffmpeg(inputPath);

        if (withSubtitles && job.segments.length > 0) {
            try {
                const srtPath = createSRTFile(jobId, job.segments, UPLOAD_DIR);
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

    // 클립 내보내기
    router.post('/clip', (req, res) => {
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

    // 로고 업로드
    router.post('/logo', upload.single('logo'), (req, res) => {
        if (!req.file) return res.status(400).send('No logo uploaded');
        res.json({ logoName: req.file.filename });
    });

    return router;
};
