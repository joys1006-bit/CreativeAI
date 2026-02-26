/**
 * TTS 및 번역 API 라우트 모듈
 * 담당: 백엔드 개발자 (L4)
 * 설계: 백엔드 아키텍트 (L6)
 */
const express = require('express');
const router = express.Router();
const { getVoiceProfiles, getSpeechParams } = require('../services/ttsService');
const { translateSegments, getSupportedLanguages } = require('../services/translationService');

module.exports = (jobs, saveJobs, logger) => {
    // === TTS API ===
    router.get('/voices', (req, res) => {
        const lang = req.query.lang || null;
        res.json({ voices: getVoiceProfiles(lang) });
    });

    router.get('/params/:voiceId', (req, res) => {
        const params = getSpeechParams(req.params.voiceId);
        res.json(params);
    });

    // === 번역 API ===
    router.get('/translate/languages', (req, res) => {
        res.json({ languages: getSupportedLanguages() });
    });

    router.post('/translate', async (req, res) => {
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

    return router;
};
