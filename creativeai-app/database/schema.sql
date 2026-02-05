-- ============================================
-- CreativeAI Database Schema
-- MySQL 8.0+
-- ============================================

-- 데이터베이스 생성
CREATE DATABASE IF NOT EXISTS creativeai_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE creativeai_db;

-- ============================================
-- 1. users (사용자 테이블)
-- ============================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(500),
    total_credits INT NOT NULL DEFAULT 100,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    refresh_token TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login DATETIME,
    status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
    INDEX idx_email (email),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. styles (스타일 테이블)
-- ============================================
CREATE TABLE styles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    category ENUM('emoji', 'avatar', 'filter', 'edit') NOT NULL,
    description TEXT,
    emoji VARCHAR(10),
    configuration JSON,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_active (is_active),
    INDEX idx_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. creations (창작물 테이블)
-- ============================================
CREATE TABLE creations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    creation_type ENUM('emoji', 'avatar', 'beauty_filter', 'photo_edit') NOT NULL,
    style_id INT,
    title VARCHAR(200),
    description TEXT,
    prompt TEXT,
    status ENUM('pending', 'processing', 'completed', 'failed') NOT NULL DEFAULT 'pending',
    progress INT NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    credit_cost INT NOT NULL DEFAULT 0,
    metadata JSON,
    processing_started_at DATETIME,
    processing_completed_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (style_id) REFERENCES styles(id) ON DELETE SET NULL,
    INDEX idx_user_created (user_id, created_at DESC),
    INDEX idx_status (status),
    INDEX idx_type (creation_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. creation_files (파일 테이블)
-- ============================================
CREATE TABLE creation_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    creation_id INT NOT NULL,
    file_type ENUM('original_image', 'result_image', 'thumbnail', 'intermediate') NOT NULL,
    variation_index INT DEFAULT NULL COMMENT '팩 생성 시 변형 인덱스 (0-7)',
    file_path VARCHAR(500) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    file_size BIGINT COMMENT '파일 크기 (bytes)',
    mime_type VARCHAR(100),
    width INT,
    height INT,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creation_id) REFERENCES creations(id) ON DELETE CASCADE,
    INDEX idx_creation_type (creation_id, file_type),
    INDEX idx_variation (creation_id, variation_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. credit_transactions (크레딧 거래 테이블)
-- ============================================
CREATE TABLE credit_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    transaction_type ENUM('purchase', 'usage', 'refund', 'reward') NOT NULL,
    amount INT NOT NULL COMMENT '+ (충전) 또는 - (사용)',
    balance_after INT NOT NULL COMMENT '거래 후 잔액',
    reference_type VARCHAR(50) COMMENT '참조 타입 (creation, payment 등)',
    reference_id INT COMMENT '참조 ID',
    description TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_created (user_id, created_at DESC),
    INDEX idx_type (transaction_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. generation_history (생성 히스토리 테이블)
-- ============================================
CREATE TABLE generation_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    creation_id INT,
    action_type ENUM('create', 'view', 'download', 'share', 'delete') NOT NULL,
    parameters JSON,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (creation_id) REFERENCES creations(id) ON DELETE SET NULL,
    INDEX idx_user_created (user_id, created_at DESC),
    INDEX idx_creation_action (creation_id, action_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
