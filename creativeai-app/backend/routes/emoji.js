const express = require('express');
const router = express.Router();
const Creation = require('../models/Creation');
const User = require('../models/User');

/**
 * POST /api/emoji/generate
 * 이모지 생성 시작
 */
router.post('/generate', async (req, res) => {
    try {
        const { imageData, styleId, generationType, userId } = req.body;

        // TODO: 실제로는 JWT 토큰에서 userId 추출
        const tempUserId = userId || 1;

        // 크레딧 비용 계산
        const creditCost = generationType === 'pack8'
            ? parseInt(process.env.EMOJI_PACK_COST || 50)
            : parseInt(process.env.EMOJI_SINGLE_COST || 10);

        // 크레딧 차감
        await User.useCredits(tempUserId, creditCost, 'creation', null);

        // 창작물 생성
        const creationId = await Creation.create({
            user_id: tempUserId,
            creation_type: 'emoji',
            style_id: styleId,
            title: `이모지 생성 - ${new Date().toLocaleDateString()}`,
            prompt: imageData ? '이미지 기반' : '텍스트 기반',
            credit_cost: creditCost,
            metadata: {
                generationType,
                hasImage: !!imageData
            }
        });

        // 원본 이미지 저장 (있는 경우)
        if (imageData) {
            // TODO: 실제 파일 저장 로직
            await Creation.addFile(creationId, {
                file_type: 'original_image',
                file_path: '/uploads/originals/temp.jpg',
                file_url: 'https://example.com/temp.jpg',
                file_size: 0,
                mime_type: 'image/jpeg',
                is_primary: false
            });
        }

        // 히스토리 기록
        await Creation.addHistory(tempUserId, creationId, 'create', { styleId, generationType });

        // 처리 시작
        await Creation.updateProgress(creationId, 0, 'processing');

        // TODO: 실제 AI 생성 큐에 넣기
        // 여기서는 시뮬레이션
        setTimeout(async () => {
            try {
                // 진행률 업데이트 시뮬레이션
                for (let progress = 10; progress <= 100; progress += 10) {
                    await Creation.updateProgress(creationId, progress);
                    await new Promise(resolve => setTimeout(resolve, 300));
                }

                // 결과 파일 생성 (시뮬레이션)
                const count = generationType === 'pack8' ? 8 : 1;
                for (let i = 0; i < count; i++) {
                    await Creation.addFile(creationId, {
                        file_type: 'result_image',
                        variation_index: generationType === 'pack8' ? i : null,
                        file_path: `/uploads/results/emoji_${creationId}_${i}.png`,
                        file_url: `https://example.com/results/emoji_${creationId}_${i}.png`,
                        thumbnail_url: `https://example.com/thumbs/emoji_${creationId}_${i}.png`,
                        file_size: 51200,
                        mime_type: 'image/png',
                        width: 512,
                        height: 512,
                        is_primary: i === 0
                    });
                }

                await Creation.updateProgress(creationId, 100, 'completed');
            } catch (error) {
                console.error('Generation simulation error:', error);
                await Creation.updateProgress(creationId, 0, 'failed');
            }
        }, 1000);

        res.json({
            success: true,
            data: {
                id: creationId,
                status: 'processing',
                progress: 0
            },
            message: '이모지 생성이 시작되었습니다'
        });
    } catch (error) {
        console.error('Emoji generation error:', error);
        res.status(500).json({
            success: false,
            message: error.message || '이모지 생성 실패',
            error: error.message
        });
    }
});

/**
 * GET /api/emoji/generation/:id
 * 생성 상태 조회 (폴링용)
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
                creation_type: creation.creation_type,
                style_name: creation.style_name,
                files: files.filter(f => f.file_type === 'result_image'),
                created_at: creation.created_at,
                processing_completed_at: creation.processing_completed_at
            }
        });
    } catch (error) {
        console.error('Generation status error:', error);
        res.status(500).json({
            success: false,
            message: '상태 조회 실패',
            error: error.message
        });
    }
});

/**
 * GET /api/emoji/styles
 * 이모지 스타일 목록
 */
router.get('/styles', async (req, res) => {
    try {
        const Style = require('../models/Style');
        const styles = await Style.findByCategory('emoji');

        res.json({
            success: true,
            data: styles
        });
    } catch (error) {
        console.error('Emoji styles error:', error);
        res.status(500).json({
            success: false,
            message: '스타일 조회 실패',
            error: error.message
        });
    }
});

module.exports = router;
