const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * GET /api/credits/transactions/:userId
 * 사용자의 크레딧 거래 내역
 */
router.get('/transactions/:userId', async (req, res) => {
    try {
        const { limit = 50, offset = 0 } = req.query;

        const transactions = await db.query(
            `SELECT * FROM credit_transactions 
             WHERE user_id = ? 
             ORDER BY created_at DESC 
             LIMIT ? OFFSET ?`,
            [parseInt(req.params.userId), parseInt(limit), parseInt(offset)]
        );

        res.json({
            success: true,
            data: transactions,
            count: transactions.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '거래 내역 조회 실패',
            error: error.message
        });
    }
});

/**
 * GET /api/credits/balance/:userId
 * 현재 크레딧 잔액
 */
router.get('/balance/:userId', async (req, res) => {
    try {
        const User = require('../models/User');
        const user = await User.findById(parseInt(req.params.userId));

        if (!user) {
            return res.status(404).json({
                success: false,
                message: '사용자를 찾을 수 없습니다'
            });
        }

        res.json({
            success: true,
            data: {
                user_id: user.id,
                total_credits: user.total_credits
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '잔액 조회 실패',
            error: error.message
        });
    }
});

module.exports = router;
