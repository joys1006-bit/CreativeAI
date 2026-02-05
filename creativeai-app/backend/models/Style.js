const db = require('../config/database');

/**
 * Style 모델
 */
class Style {
    /**
     * 모든 스타일 조회
     */
    static async findAll(category = null) {
        let query = 'SELECT * FROM styles WHERE is_active = TRUE';
        const params = [];

        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }

        query += ' ORDER BY sort_order ASC, created_at DESC';

        return await db.query(query, params);
    }

    /**
     * ID로 스타일 조회
     */
    static async findById(id) {
        const [style] = await db.query(
            'SELECT * FROM styles WHERE id = ?',
            [id]
        );
        return style;
    }

    /**
     * 카테고리별 스타일 조회
     */
    static async findByCategory(category) {
        return await db.query(
            'SELECT * FROM styles WHERE category = ? AND is_active = TRUE ORDER BY sort_order ASC',
            [category]
        );
    }

    /**
     * 새 스타일 생성
     */
    static async create(styleData) {
        const { name, category, description, emoji, configuration, sort_order } = styleData;
        const result = await db.query(
            `INSERT INTO styles (name, category, description, emoji, configuration, sort_order) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [name, category, description, emoji, JSON.stringify(configuration), sort_order || 0]
        );
        return result.insertId;
    }

    /**
     * 스타일 업데이트
     */
    static async update(id, updates) {
        const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(updates), id];

        await db.query(
            `UPDATE styles SET ${fields} WHERE id = ?`,
            values
        );
    }

    /**
     * 스타일 활성화/비활성화
     */
    static async toggleActive(id, isActive) {
        await db.query(
            'UPDATE styles SET is_active = ? WHERE id = ?',
            [isActive, id]
        );
    }
}

module.exports = Style;
