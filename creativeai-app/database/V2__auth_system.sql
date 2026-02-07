-- ============================================
-- CreativeAI 인증 시스템 데이터베이스 마이그레이션
-- 실행 환경: MySQL 8.0+
-- 작성일: 2026-02-07
-- ============================================

USE creativeai_db;

-- ============================================
-- 1. users 테이블 수정
-- 기존 테이블에 OAuth 관련 컬럼 추가
-- ============================================

-- 1-1. auth_provider 컬럼 추가 (인증 제공자: local, google, apple, kakao)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS auth_provider ENUM('local', 'google', 'apple', 'kakao') 
    NOT NULL DEFAULT 'local' COMMENT '인증 제공자' AFTER status;

-- 1-2. password_hash를 NULL 허용으로 변경 (OAuth 사용자는 비밀번호 없음)
ALTER TABLE users
MODIFY COLUMN password_hash VARCHAR(255) NULL COMMENT '비밀번호 해시 (OAuth 사용자는 NULL)';

-- 1-3. 프로필 이미지 URL 컬럼 추가 (없다면)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500) NULL COMMENT '프로필 이미지 URL' AFTER username;


-- ============================================
-- 2. user_oauth_accounts 테이블 생성
-- OAuth 제공자별 계정 정보 저장
-- (한 사용자가 여러 OAuth 계정을 연동할 수 있음)
-- ============================================

CREATE TABLE IF NOT EXISTS user_oauth_accounts (
    -- 기본 키
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '고유 ID',
    
    -- 사용자 연결
    user_id BIGINT NOT NULL COMMENT '연결된 사용자 ID',
    
    -- OAuth 제공자 정보
    provider VARCHAR(20) NOT NULL COMMENT 'OAuth 제공자 (google, apple, kakao)',
    provider_user_id VARCHAR(255) NOT NULL COMMENT 'OAuth 제공자측 사용자 고유 ID',
    
    -- OAuth 사용자 프로필 (캐싱용)
    email VARCHAR(255) COMMENT 'OAuth에서 받아온 이메일',
    name VARCHAR(100) COMMENT 'OAuth에서 받아온 이름',
    avatar_url VARCHAR(500) COMMENT 'OAuth에서 받아온 프로필 이미지',
    
    -- 원본 데이터 백업 (디버깅/분석용)
    raw_data JSON COMMENT 'OAuth 응답 원본 데이터',
    
    -- 시간 정보
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '계정 연동 일시',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '마지막 정보 갱신 일시',
    
    -- 외래 키: 사용자 삭제 시 OAuth 계정도 삭제
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- 유니크 제약: 같은 OAuth 제공자의 같은 계정은 하나만 존재
    UNIQUE KEY uk_provider_user (provider, provider_user_id),
    
    -- 인덱스: 사용자별 OAuth 계정 조회용
    INDEX idx_user_id (user_id)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='OAuth 소셜 로그인 계정 정보';


-- ============================================
-- 3. refresh_tokens 테이블 생성
-- JWT Refresh Token 관리
-- (다중 기기 로그인 및 토큰 무효화 지원)
-- ============================================

CREATE TABLE IF NOT EXISTS refresh_tokens (
    -- 기본 키
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '고유 ID',
    
    -- 사용자 연결
    user_id BIGINT NOT NULL COMMENT '토큰 소유자 ID',
    
    -- 토큰 정보
    token_hash VARCHAR(255) NOT NULL UNIQUE COMMENT 'Refresh Token 해시 (SHA-256)',
    
    -- 기기 정보 (선택)
    device_info VARCHAR(255) COMMENT '기기 정보 (User-Agent 기반)',
    ip_address VARCHAR(45) COMMENT '마지막 접속 IP (IPv6 지원)',
    
    -- 만료 및 상태
    expires_at DATETIME NOT NULL COMMENT '토큰 만료 일시',
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE COMMENT '토큰 무효화 여부 (로그아웃 시 TRUE)',
    
    -- 시간 정보
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '토큰 발급 일시',
    
    -- 외래 키: 사용자 삭제 시 토큰도 삭제
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- 인덱스: 사용자별 토큰 조회용
    INDEX idx_user_id (user_id),
    
    -- 인덱스: 만료된 토큰 정리용
    INDEX idx_expires_at (expires_at)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='JWT Refresh Token 저장소';


-- ============================================
-- 4. 정리 쿼리 (옵션)
-- 만료된 토큰 자동 삭제용 이벤트
-- ============================================

-- 만료 토큰 정리 이벤트 (매일 새벽 3시 실행)
-- 주의: MySQL 이벤트 스케줄러가 활성화되어 있어야 함
DELIMITER //
CREATE EVENT IF NOT EXISTS cleanup_expired_tokens
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_DATE + INTERVAL 1 DAY + INTERVAL 3 HOUR
DO
BEGIN
    -- 만료되었거나 무효화된 토큰 삭제
    DELETE FROM refresh_tokens 
    WHERE expires_at < NOW() OR is_revoked = TRUE;
END //
DELIMITER ;


-- ============================================
-- 완료 메시지
-- ============================================
SELECT '✅ 인증 시스템 테이블 마이그레이션 완료!' AS result;
