const db = require('../config/database');

/**
 * User 모델
 */
class User {
    /**
     * ID로 사용자 조회
     */
    static async findById(id) {
        const [user] = await db.query(
            'SELECT id, email, username, avatar_url, total_credits, email_verified, created_at, last_login, status FROM users WHERE id = ?',
            [id]
        );
        return user;
    }

    /**
     * 이메일로 사용자 조회
     */
    static async findByEmail(email) {
        const [user] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        return user;
    }

    /**
     * 새 사용자 생성
     */
    static async create(userData) {
        const { email, password_hash, username } = userData;
        const result = await db.query(
            `INSERT INTO users (email, password_hash, username, total_credits) 
             VALUES (?, ?, ?, ?)`,
            [email, password_hash, username, process.env.SIGNUP_BONUS_CREDITS || 100]
        );

        // 회원가입 보너스 크레딧 거래 기록
        await db.query(
            `INSERT INTO credit_transactions 
             (user_id, transaction_type, amount, balance_after, description) 
             VALUES (?, 'reward', ?, ?, '회원가입 보너스')`,
            [result.insertId, process.env.SIGNUP_BONUS_CREDITS || 100, process.env.SIGNUP_BONUS_CREDITS || 100]
        );

        return result.insertId;
    }

    /**
     * 사용자 크레딧 차감 (트랜잭션)
     */
    static async useCredits(userId, amount, referenceType, referenceId) {
        return await db.transaction(async (conn) => {
            // 잔액 확인 및 락
            const [user] = await conn.query(
                'SELECT total_credits FROM users WHERE id = ? FOR UPDATE',
                [userId]
            );

            if (!user || user.total_credits < amount) {
                throw new Error('크레딧이 부족합니다');
            }

            // 크레딧 차감
            await conn.query(
                'UPDATE users SET total_credits = total_credits - ? WHERE id = ?',
                [amount, userId]
            );

            // 거래 기록
            await conn.query(
                `INSERT INTO credit_transactions 
                 (user_id, transaction_type, amount, balance_after, reference_type, reference_id, description) 
                 VALUES (?, 'usage', ?, ?, ?, ?, ?)`,
                [userId, -amount, user.total_credits - amount, referenceType, referenceId, `${referenceType} 생성`]
            );

            return user.total_credits - amount;
        });
    }

    /**
     * 사용자 정보 업데이트
     */
    static async update(id, updates) {
        const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(updates), id];

        await db.query(
            `UPDATE users SET ${fields} WHERE id = ?`,
            values
        );
    }

    /**
     * 마지막 로그인 시간 업데이트
     */
    static async updateLastLogin(id) {
        await db.query(
            'UPDATE users SET last_login = NOW() WHERE id = ?',
            [id]
        );
    }
}

module.exports = User;
