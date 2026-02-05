const express = require('express');
const router = express.Router();
const Creation = require('../models/Creation');
const User = require('../models/User');

/**
 * POST /api/avatar/generate
 * 아바타 생성 시작
 */
router.post('/generate', async (req, res) => {
    try {
        const { imageData, styleId, userId } = req.body;

        const tempUserId = userId || 1;
        const credit_cost = parseInt(process.env.AVATAR_COST || 20);

        // 크레딧 차감
        await User.useCredits(tempUserId, creditCost, 'creation', null);

        // 창작물 생성
        const creationId = await Creation.create({
            user_id: tempUserId,
            creation_type: 'avatar',
            style_id: styleId,
            title: `AI 아바타 - ${new Date().toLocaleDateString()}`,
            prompt: '아바타 생성',
            credit_cost: creditCost,
            metadata: { hasImage: !!imageData }
        });

        // 원본 이미지 저장
        if (imageData) {
            await Creation.addFile(creationId, {
                file_type: 'original_image',
                file_path: '/uploads/originals/avatar_temp.jpg',
                file_url: 'https://example.com/avatar_temp.jpg',
                file_size: 0,
                mime_type: 'image/jpeg',
                is_primary: false
            });
        }

        await Creation.addHistory(tempUserId, creationId, 'create', { styleId });
        await Creation.updateProgress(creationId, 0, 'processing');

        // 생성 시뮬레이션
        setTimeout(async () => {
            try {
                for (let progress = 10; progress <= 100; progress += 10) {
                    await Creation.updateProgress(creationId, progress);
                    await new Promise(resolve => setTimeout(resolve, 300));
                }

                await Creation.addFile(creationId, {
                    file_type: 'result_image',
                    file_path: `/uploads/results/avatar_${creationId}.png`,
                    file_url: `https://example.com/results/avatar_${creationId}.png`,
                    thumbnail_url: `https://example.com/thumbs/avatar_${creationId}.png`,
                    file_size: 102400,
                    mime_type: 'image/png',
                    width: 1024,
                    height: 1024,
                    is_primary: true
                });

                await Creation.updateProgress(creationId, 100, 'completed');
            } catch (error) {
                await Creation.updateProgress(creationId, 0, 'failed');
            }
        }, 1000);

        res.json({
            success: true,
            data: { id: creationId, status: 'processing', progress: 0 },
            message: '아바타 생성이 시작되었습니다'
        });
    } catch (error) {
        console.error('Avatar generation error:', error);
        res.status(500).json({
            success: false,
            message: error.message || '아바타 생성 실패',
            error: error.message
        });
    }
});

/**
 * GET /api/avatar/generation/:id
 * 생성 상태 조회
 */
router.get('/generation/:id', async (req, res) => {
    try {
        const creation = await Creation.findById(parseInt(req.params.id));

        if (!creation) {
            return res.status(404).json({
                success: false,
                message: '생성 작업을 찾을 수 없습니다'
            });
        }

        const files = await Creation.getFiles(creation.id);

        res.json({
            success: true,
            data: {
                id: creation.id,
                status: creation.status,
                progress: creation.progress,
                files: files.filter(f => f.file_type === 'result_image'),
                created_at: creation.created_at
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '상태 조회 실패',
            error: error.message
        });
    }
});

/**
 * GET /api/avatar/styles
 * 아바타 스타일 목록
 */
router.get('/styles', async (req, res) => {
    try {
        const Style = require('../models/Style');
        const styles = await Style.findByCategory('avatar');

        res.json({
            success: true,
            data: styles
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '스타일 조회 실패',
            error: error.message
        });
    }
});

module.exports = router;
