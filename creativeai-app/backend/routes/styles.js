const express = require('express');
const router = express.Router();
const Style = require('../models/Style');

/**
 * GET /api/styles
 * 모든 스타일 조회
 */
router.get('/', async (req, res) => {
    try {
        const { category } = req.query;
        const styles = await Style.findAll(category);

        res.json({
            success: true,
            data: styles,
            count: styles.length
        });
    } catch (error) {
        console.error('Styles fetch error:', error);
        res.status(500).json({
            success: false,
            message: '스타일 조회 실패',
            error: error.message
        });
    }
});

/**
 * GET /api/styles/:id
 * 특정 스타일 조회
 */
router.get('/:id', async (req, res) => {
    try {
        const style = await Style.findById(parseInt(req.params.id));

        if (!style) {
            return res.status(404).json({
                success: false,
                message: '스타일을 찾을 수 없습니다'
            });
        }

        res.json({
            success: true,
            data: style
        });
    } catch (error) {
        console.error('Style fetch error:', error);
        res.status(500).json({
            success: false,
            message: '스타일 조회 실패',
            error: error.message
        });
    }
});

/**
 * GET /api/styles/category/:category
 * 카테고리별 스타일 조회
 */
router.get('/category/:category', async (req, res) => {
    try {
        const styles = await Style.findByCategory(req.params.category);

        res.json({
            success: true,
            data: styles,
            count: styles.length
        });
    } catch (error) {
        console.error('Styles by category error:', error);
        res.status(500).json({
            success: false,
            message: '카테고리별 스타일 조회 실패',
            error: error.message
        });
    }
});

module.exports = router;
