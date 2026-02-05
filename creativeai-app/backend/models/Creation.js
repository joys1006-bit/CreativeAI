const db = require('../config/database');

/**
 * Creation 모델
 */
class Creation {
    /**
     * 새 창작물 생성
     */
    static async create(creationData) {
        const { user_id, creation_type, style_id, title, description, prompt, credit_cost, metadata } = creationData;

        const result = await db.query(
            `INSERT INTO creations 
             (user_id, creation_type, style_id, title, description, prompt, status, progress, credit_cost, metadata) 
             VALUES (?, ?, ?, ?, ?, ?, 'pending', 0, ?, ?)`,
            [user_id, creation_type, style_id, title, description, prompt, credit_cost, JSON.stringify(metadata || {})]
        );

        return result.insertId;
    }

    /**
     * ID로 창작물 조회
     */
    static async findById(id) {
        const [creation] = await db.query(
            `SELECT c.*, s.name as style_name, s.emoji as style_emoji, u.username
             FROM creations c
             LEFT JOIN styles s ON c.style_id = s.id
             LEFT JOIN users u ON c.user_id = u.id
             WHERE c.id = ?`,
            [id]
        );
        return creation;
    }

    /**
     * 사용자의 창작물 목록 조회
     */
    static async findByUserId(userId, limit = 20, offset = 0) {
        return await db.query(
            `SELECT c.*, s.name as style_name, s.emoji as style_emoji,
                    (SELECT COUNT(*) FROM creation_files cf WHERE cf.creation_id = c.id AND cf.file_type = 'result_image') as file_count
             FROM creations c
             LEFT JOIN styles s ON c.style_id = s.id
             WHERE c.user_id = ?
             ORDER BY c.created_at DESC
             LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );
    }

    /**
     * 창작물 상태 및 진행률 업데이트
     */
    static async updateProgress(id, progress, status = null) {
        const updates = { progress };

        if (status) {
            updates.status = status;
            if (status === 'processing') {
                updates.processing_started_at = new Date();
            } else if (status === 'completed' || status === 'failed') {
                updates.processing_completed_at = new Date();
            }
        }

        const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(updates), id];

        await db.query(
            `UPDATE creations SET ${fields} WHERE id = ?`,
            values
        );
    }

    /**
     * 파일 추가
     */
    static async addFile(creationId, fileData) {
        const { file_type, variation_index, file_path, file_url, thumbnail_url, file_size, mime_type, width, height, is_primary } = fileData;

        const result = await db.query(
            `INSERT INTO creation_files 
             (creation_id, file_type, variation_index, file_path, file_url, thumbnail_url, file_size, mime_type, width, height, is_primary) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [creationId, file_type, variation_index, file_path, file_url, thumbnail_url, file_size, mime_type, width, height, is_primary || false]
        );

        return result.insertId;
    }

    /**
     * 창작물의 파일 목록 조회
     */
    static async getFiles(creationId) {
        return await db.query(
            `SELECT * FROM creation_files 
             WHERE creation_id = ? 
             ORDER BY variation_index ASC, created_at ASC`,
            [creationId]
        );
    }

    /**
     * 히스토리 기록
     */
    static async addHistory(userId, creationId, actionType, parameters = null) {
        await db.query(
            `INSERT INTO generation_history (user_id, creation_id, action_type, parameters) 
             VALUES (?, ?, ?, ?)`,
            [userId, creationId, actionType, JSON.stringify(parameters || {})]
        );
    }

    /**
     * 사용자별 통계
     */
    static async getStats(userId) {
        const [[totalCreations]] = await db.query(
            'SELECT COUNT(*) as count FROM creations WHERE user_id = ?',
            [userId]
        );

        const [[completedCreations]] = await db.query(
            'SELECT COUNT(*) as count FROM creations WHERE user_id = ? AND status = "completed"',
            [userId]
        );

        const typeStats = await db.query(
            `SELECT creation_type, COUNT(*) as count 
             FROM creations 
             WHERE user_id = ? 
             GROUP BY creation_type`,
            [userId]
        );

        return {
            total: totalCreations.count,
            completed: completedCreations.count,
            by_type: typeStats
        };
    }
}

module.exports = Creation;
