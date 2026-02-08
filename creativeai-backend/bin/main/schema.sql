-- Disable foreign key checks to allow dropping tables with dependencies
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS credit_transactions;
DROP TABLE IF EXISTS generation_history;
DROP TABLE IF EXISTS user_oauth_accounts;
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS creation_files;
DROP TABLE IF EXISTS creations;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS styles;

CREATE TABLE styles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    emoji VARCHAR(20),
    configuration TEXT, -- JSON
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    avatar_url VARCHAR(255),
    total_credits INT DEFAULT 100,
    email_verified BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'active',
    auth_provider VARCHAR(50) DEFAULT 'local',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

CREATE TABLE user_oauth_accounts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    provider VARCHAR(50) NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    name VARCHAR(100),
    avatar_url VARCHAR(255),
    raw_data TEXT, -- JSON
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_provider_user (provider, provider_user_id)
);

CREATE TABLE refresh_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    device_info TEXT,
    ip_address VARCHAR(45),
    expires_at TIMESTAMP NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE creations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    creation_type VARCHAR(50) NOT NULL,
    style_id BIGINT,
    title VARCHAR(255),
    description TEXT,
    prompt LONGTEXT,
    status VARCHAR(20) NOT NULL,
    progress INT DEFAULT 0,
    credit_cost INT DEFAULT 0,
    price DECIMAL(19, 2),
    is_for_sale BOOLEAN DEFAULT FALSE,
    like_count INT DEFAULT 0,
    metadata LONGTEXT, -- JSON
    processing_started_at TIMESTAMP,
    processing_completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,
    input_data LONGTEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE creation_files (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    creation_id BIGINT NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    variation_index INT,
    file_path VARCHAR(255) NOT NULL,
    file_url LONGTEXT NOT NULL,
    thumbnail_url VARCHAR(255),
    file_size BIGINT,
    mime_type VARCHAR(100),
    width INT,
    height INT,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creation_id) REFERENCES creations(id) ON DELETE CASCADE
);

SET FOREIGN_KEY_CHECKS = 1;
