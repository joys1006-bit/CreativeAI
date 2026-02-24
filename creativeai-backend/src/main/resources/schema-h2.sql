-- H2 Compatible Schema for CreativeAI (Minimalist & Robust)
DROP ALL OBJECTS;

CREATE TABLE styles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    emoji VARCHAR(20),
    configuration CLOB,
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
    user_id BIGINT,
    provider VARCHAR(50),
    provider_user_id VARCHAR(255),
    email VARCHAR(100),
    name VARCHAR(100),
    avatar_url VARCHAR(255),
    raw_data CLOB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE refresh_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    token_hash VARCHAR(255),
    device_info VARCHAR(255),
    ip_address VARCHAR(45),
    expires_at TIMESTAMP,
    is_revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE creations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    creation_type VARCHAR(50),
    style_id BIGINT,
    title VARCHAR(255),
    description VARCHAR(255),
    prompt CLOB,
    status VARCHAR(20),
    progress INT DEFAULT 0,
    credit_cost INT DEFAULT 0,
    price DECIMAL(19, 2),
    is_for_sale BOOLEAN DEFAULT FALSE,
    like_count INT DEFAULT 0,
    metadata CLOB,
    processing_started_at TIMESTAMP,
    processing_completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    error_message CLOB,
    input_data CLOB
);

CREATE TABLE creation_files (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    creation_id BIGINT,
    file_type VARCHAR(50),
    variation_index INT,
    file_path VARCHAR(255),
    file_url CLOB,
    thumbnail_url VARCHAR(255),
    file_size BIGINT,
    mime_type VARCHAR(100),
    width INT,
    height INT,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE marketplace_orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    buyer_id BIGINT,
    creation_id BIGINT,
    amount DECIMAL(19, 2),
    status VARCHAR(20) DEFAULT 'PENDING',
    payment_method VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE creator_earnings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    creator_id BIGINT,
    order_id BIGINT,
    total_amount DECIMAL(19, 2),
    commission_rate DECIMAL(5, 2),
    net_earning DECIMAL(19, 2),
    status VARCHAR(20) DEFAULT 'PENDING',
    available_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE settlements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    creator_id BIGINT,
    amount DECIMAL(19, 2),
    status VARCHAR(20) DEFAULT 'REQUESTED',
    bank_info CLOB,
    settled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE partners (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    company_name VARCHAR(255),
    business_registration_number VARCHAR(100),
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE api_keys (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    partner_id BIGINT,
    key_string VARCHAR(255) UNIQUE,
    name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_subscriptions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNIQUE,
    tier VARCHAR(20) DEFAULT 'BASIC',
    starts_at TIMESTAMP,
    ends_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
