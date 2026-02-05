-- Insert emoji styles
INSERT INTO styles (name, category, description, emoji, configuration, is_active, sort_order) VALUES
('Kawaii', 'emoji', 'Cute Japanese style emoji', '🎀', '{"style": "kawaii", "mood": "cute"}', TRUE, 1),
('Line Art', 'emoji', 'Simple line art style', '✏️', '{"style": "line", "mood": "simple"}', TRUE, 2),
('3D Cartoon', 'emoji', '3D cartoon style emoji', '🎨', '{"style": "3d", "mood": "fun"}', TRUE, 3),
('Watercolor', 'emoji', 'Soft watercolor style', '🌊', '{"style": "watercolor", "mood": "soft"}', TRUE, 4),
('Pixel Art', 'emoji', 'Retro pixel art style', '👾', '{"style": "pixel", "mood": "retro"}', TRUE, 5),
('Emoji Pack', 'emoji', 'Full emoji pack', '📦', '{"style": "pack", "count": 8}', TRUE, 6);

-- Insert avatar styles
INSERT INTO styles (name, category, description, emoji, configuration, is_active, sort_order) VALUES
('Animation', 'avatar', 'Animated cartoon style', '🎬', '{"style": "animation", "mood": "bright"}', TRUE, 1),
('3D Character', 'avatar', '3D rendered character', '🎲', '{"style": "3d", "quality": "high"}', TRUE, 2),
('Pixel Avatar', 'avatar', 'Retro pixel avatar', '🕹️', '{"style": "pixel", "size": "32x32"}', TRUE, 3),
('Cartoon', 'avatar', 'Classic cartoon style', '🎭', '{"style": "cartoon", "mood": "fun"}', TRUE, 4),
('Realistic', 'avatar', 'Photorealistic style', '📸', '{"style": "realistic", "detail": "high"}', TRUE, 5),
('Fantasy', 'avatar', 'Fantasy character style', '🧙', '{"style": "fantasy", "theme": "magic"}', TRUE, 6);

-- Insert filter styles
INSERT INTO styles (name, category, description, emoji, configuration, is_active, sort_order) VALUES
('Beauty', 'filter', 'Skin smoothing and enhancement', '✨', '{"smooth": 0.5, "brightness": 1.2}', TRUE, 1),
('Vintage', 'filter', 'Vintage film effect', '📷', '{"sepia": 0.3, "grain": 0.2}', TRUE, 2),
('Dramatic', 'filter', 'High contrast dramatic', '🎬', '{"contrast": 1.5, "saturation": 1.3}', TRUE, 3);

-- Insert edit styles
INSERT INTO styles (name, category, description, emoji, configuration, is_active, sort_order) VALUES
('Background Remove', 'edit', 'AI-powered background removal', '🎭', '{"method": "ai", "precision": "high"}', TRUE, 1),
('Upscale', 'edit', 'AI image upscaling', '🔍', '{"scale": 2, "model": "esrgan"}', TRUE, 2);

