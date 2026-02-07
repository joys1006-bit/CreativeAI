-- 1. Add Marketplace Columns
ALTER TABLE creations ADD COLUMN price DECIMAL(10,2) NULL;
ALTER TABLE creations ADD COLUMN is_for_sale BOOLEAN DEFAULT FALSE;
ALTER TABLE creations ADD COLUMN like_count INT DEFAULT 0;

-- 2. Insert Sample Users (if not exist)
INSERT IGNORE INTO users (id, username, email, password_hash, status, total_credits) VALUES
(1, 'demo_user', 'demo@example.com', 'hash123', 'active', 1000),
(2, 'artist_kim', 'kim@example.com', 'hash123', 'active', 500),
(3, 'pixel_master', 'pixel@example.com', 'hash123', 'active', 300);

-- 3. Insert Sample Creations (Marketplace Items)
INSERT INTO creations (user_id, style_id, creation_type, title, status, credit_cost, is_for_sale, price, like_count, created_at)
VALUES 
(2, 1, 'emoji', 'Cute Cat 3D', 'completed', 10, TRUE, 100.00, 52, NOW()),
(2, 1, 'emoji', 'Laughing Dog', 'completed', 10, TRUE, 150.00, 120, NOW()),
(3, 2, 'avatar', 'Cyberpunk Hero', 'completed', 20, TRUE, 500.00, 340, NOW()),
(3, 2, 'avatar', 'Space Warrior', 'completed', 20, TRUE, 450.00, 210, NOW()),
(1, 1, 'emoji', 'Happy Sun', 'completed', 10, FALSE, NULL, 45, NOW()),
(2, 3, 'emoji', 'Cool Sunglasses', 'completed', 10, TRUE, 80.00, 15, NOW()),
(3, 3, 'avatar', 'Fantasy Elf', 'completed', 20, TRUE, 300.00, 88, NOW()),
(2, 1, 'emoji', 'Sad Raincloud', 'completed', 10, TRUE, 50.00, 5, NOW()),
(1, 2, 'emoji', 'Party Popper', 'completed', 10, FALSE, NULL, 99, NOW()),
(3, 1, 'avatar', 'Neon City', 'completed', 20, TRUE, 1000.00, 500, NOW());
