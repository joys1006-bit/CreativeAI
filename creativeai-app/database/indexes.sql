-- ============================================
-- CreativeAI Database Indexes
-- 추가 성능 최적화 인덱스
-- ============================================

USE creativeai_db;

-- ============================================
-- Users 테이블 추가 인덱스
-- ============================================

-- 활성 사용자만 조회 시 성능 최적화
CREATE INDEX idx_users_active ON users(status) WHERE status = 'active';

-- 최근 로그인 사용자 조회
CREATE INDEX idx_users_last_login ON users(last_login DESC) WHERE last_login IS NOT NULL;

-- ============================================
-- Creations 테이블 추가 인덱스
-- ============================================

-- 처리 중인 작업 조회 최적화
CREATE INDEX idx_creations_processing ON creations(status, processing_started_at) 
WHERE status IN ('processing', 'pending');

-- 사용자별 완료된 작업 조회 (히스토리 페이지용)
CREATE INDEX idx_creations_completed ON creations(user_id, status, created_at DESC) 
WHERE status = 'completed';

-- 타입별 통계 조회
CREATE INDEX idx_creations_type_status ON creations(creation_type, status);

-- ============================================
-- Creation Files 테이블 추가 인덱스
-- ============================================

-- 주요 결과 이미지 조회
CREATE INDEX idx_files_primary ON creation_files(creation_id, is_primary) 
WHERE is_primary = TRUE;

-- 특정 파일 타입 조회
CREATE INDEX idx_files_type_url ON creation_files(file_type, created_at DESC);

-- ============================================
-- Generation History 테이블 추가 인덱스
-- ============================================

-- 사용자 활동 분석용
CREATE INDEX idx_history_user_action ON generation_history(user_id, action_type, created_at DESC);

-- 최근 활동 조회
CREATE INDEX idx_history_recent ON generation_history(created_at DESC) WHERE action_type = 'create';

-- ============================================
-- 복합 인덱스 (조회 성능 최적화)
-- ============================================

-- 사용자의 특정 타입 창작물 조회
CREATE INDEX idx_creations_user_type_date ON creations(user_id, creation_type, created_at DESC);

-- 스타일별 통계
CREATE INDEX idx_creations_style_status ON creations(style_id, status, created_at DESC) 
WHERE style_id IS NOT NULL;
