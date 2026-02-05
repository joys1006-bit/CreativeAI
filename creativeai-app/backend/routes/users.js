const express = require('express');
const router = express.Router();
const User = require('../models/User');

/**
 * GET /api/users/:id
 * 사용자 정보 조회
 */
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(parseInt(req.params.id));

        if (!user) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '사용자 조회 실패',
            error: error.message
        });
    }
});

/**
 * GET /api/users/:id/creations
 * 사용자의 창작물 목록
 */
router.get('/:id/creations', async (req, res) => {
    try {
        const Creation = require('../models/Creation');
        const { limit = 20, offset = 0 } = req.query;

        const creations = await Creation.findByUserId(
            parseInt(req.params.id),
            parseInt(limit),
            parseInt(offset)
        );

        res.json({
            success: true,
            data: creations,
            count: creations.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '창작물 목록 조회 실패',
            error: error.message
        });
    }
});

/**
 * GET /api/users/:id/stats
 * 사용자 통계
 */
router.get('/:id/stats', async (req, res) => {
    try {
        const Creation = require('../models/Creation');
        const stats = await Creation.getStats(parseInt(req.params.id));

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '통계 조회 실패',
            error: error.message
        });
    }
});

module.exports = router;
