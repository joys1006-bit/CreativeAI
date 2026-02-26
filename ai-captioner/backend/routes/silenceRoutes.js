/**
 * 무음 감지/제거 API 라우트 모듈
 * 담당: 백엔드 개발자 (L4)
 * 설계: 백엔드 아키텍트 (L6)
 */
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { detectSilence, removeSilence } = require('../services/silenceDetector');

module.exports = (jobs, saveJobs, logger, UPLOAD_DIR, port) => {
    // 무음 구간 감지
    router.get('/detect/:jobId', async (req, res) => {
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

    // 무음 구간 제거
    router.post('/remove', async (req, res) => {
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

    return router;
};
