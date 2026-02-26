/**
 * 자막 CRUD API 라우트 모듈
 * 담당: 백엔드 개발자 (L4)
 * 설계: 백엔드 아키텍트 (L6)
 */
const express = require('express');
const router = express.Router();

module.exports = (jobs, saveJobs, logger) => {
    // 자막 수정 (전체 자막 배열 업데이트)
    router.patch('/:jobId', (req, res) => {
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
    router.post('/:jobId/add', (req, res) => {
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
    router.delete('/:jobId/:index', (req, res) => {
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
    router.post('/:jobId/merge', (req, res) => {
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

    return router;
};
