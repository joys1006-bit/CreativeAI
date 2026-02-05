-- ============================================
-- CreativeAI Database Seed Data
-- 초기 데이터 삽입
-- ============================================

USE creativeai_db;

-- ============================================
-- 1. 스타일 데이터 (Emoji Styles)
-- ============================================

INSERT INTO styles (name, category, description, emoji, configuration, is_active, sort_order) VALUES
-- Emoji 스타일
('카카오톡', 'emoji', '귀여운 카카오 스타일 이모티콘', '😊', '{"style": "kakao", "mood": "cute"}', TRUE, 1),
('라인', 'emoji', '심플하고 귀여운 라인 스타일', '😄', '{"style": "line", "mood": "simple"}', TRUE, 2),
('애플', 'emoji', '애플 기본 이모지 스타일', '🍎', '{"style": "apple", "mood": "classic"}', TRUE, 3),
('네온', 'emoji', '화려한 네온 이펙트', '✨', '{"style": "neon", "effect": "glow"}', TRUE, 4),
('미니멀', 'emoji', '심플한 미니멀 디자인', '⚪', '{"style": "minimal", "mood": "clean"}', TRUE, 5),
('레트로', 'emoji', '복고풍 픽셀 스타일', '👾', '{"style": "retro", "mood": "vintage"}', TRUE, 6),

-- Avatar 스타일
('애니메이션', 'avatar', '일본 애니메이션 스타일', '🎨', '{"style": "anime", "detail": "high"}', TRUE, 10),
('3D 캐릭터', 'avatar', '입체감 있는 3D 모델', '🎲', '{"style": "3d", "render": "realistic"}', TRUE, 11),
('픽셀아트', 'avatar', '레트로 픽셀 스타일', '👾', '{"style": "pixel", "resolution": "low"}', TRUE, 12),
('카툰', 'avatar', '만화 캐릭터 스타일', '🎭', '{"style": "cartoon", "mood": "playful"}', TRUE, 13),
('사실적', 'avatar', '실제 사진 같은 스타일', '📸', '{"style": "realistic", "detail": "ultra"}', TRUE, 14),
('판타지', 'avatar', '판타지 세계관', '🧙', '{"style": "fantasy", "mood": "magical"}', TRUE, 15),

-- Filter 스타일 (Beauty Filter)
('내추럴', 'filter', '자연스러운 보정', '🌸', '{"brightness": 55, "smoothness": 30}', TRUE, 20),
('글램', 'filter', '화려한 메이크업 효과', '💄', '{"brightness": 65, "contrast": 120}', TRUE, 21),
('청순', 'filter', '맑고 깨끗한 느낌', '🌼', '{"brightness": 60, "clarity": 110}', TRUE, 22),

-- Edit 스타일 (Photo Editor Presets)
('빈티지', 'edit', '빈티지 필름 느낌', '📷', '{"saturation": 80, "warmth": 120}', TRUE, 30),
('흑백', 'edit', '클래식 흑백 사진', '⚫', '{"saturation": 0, "contrast": 130}', TRUE, 31),
('세피아', 'edit', '따뜻한 세피아 톤', '🟤', '{"sepia": 100, "warmth": 115}', TRUE, 32),
('비비드', 'edit', '선명하고 생생한 색감', '🌈', '{"saturation": 150, "vibrance": 130}', TRUE, 33);

-- ============================================
-- 2. 테스트 사용자 데이터 (선택사항)
-- ============================================

INSERT INTO users (email, password_hash, username, total_credits, email_verified, status) VALUES
('test@creativeai.com', '$2b$10$YourHashedPasswordHere', '테스트유저', 100, TRUE, 'active'),
('admin@creativeai.com', '$2b$10$YourHashedPasswordHere', '관리자', 9999, TRUE, 'active');

-- ============================================
-- 3. 샘플 창작물 데이터 (선택사항 - 데모용)
-- ============================================

-- 테스트 사용자의 샘플 이모지 생성
INSERT INTO creations (user_id, creation_type, style_id, title, status, progress, credit_cost, metadata, processing_started_at, processing_completed_at) VALUES
(1, 'emoji', 1, '내 첫 이모지', 'completed', 100, 10, '{"generationType": "single", "originalImage": true}', NOW() - INTERVAL 1 HOUR, NOW() - INTERVAL 55 MINUTE);

-- 샘플 결과 파일
INSERT INTO creation_files (creation_id, file_type, file_path, file_url, file_size, mime_type, width, height, is_primary) VALUES
(1, 'original_image', '/uploads/originals/sample1.jpg', 'https://example.com/originals/sample1.jpg', 102400, 'image/jpeg', 800, 800, FALSE),
(1, 'result_image', '/uploads/results/emoji1.png', 'https://example.com/results/emoji1.png', 51200, 'image/png', 512, 512, TRUE),
(1, 'thumbnail', '/uploads/thumbnails/emoji1_thumb.png', 'https://example.com/thumbnails/emoji1_thumb.png', 10240, 'image/png', 128, 128, FALSE);

-- 샘플 크레딧 거래
INSERT INTO credit_transactions (user_id, transaction_type, amount, balance_after, reference_type, reference_id, description) VALUES
(1, 'reward', 100, 100, 'signup', NULL, '회원가입 보너스'),
(1, 'usage', -10, 90, 'creation', 1, '이모지 생성');

-- 샘플 히스토리
INSERT INTO generation_history (user_id, creation_id, action_type, parameters) VALUES
(1, 1, 'create', '{"style": "kakao", "generationType": "single"}'),
(1, 1, 'view', NULL);

-- ============================================
-- 완료 메시지
-- ============================================

SELECT 'Database seeding completed!' AS status;
SELECT COUNT(*) AS total_styles FROM styles;
SELECT COUNT(*) AS total_users FROM users;
SELECT COUNT(*) AS total_creations FROM creations;
