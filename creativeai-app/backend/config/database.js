const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * MySQL 데이터베이스 연결 풀 설정
 */
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'creativeai_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    // MySQL 8.0+ 권장 설정
    charset: 'utf8mb4',
    timezone: '+00:00'
});

/**
 * 데이터베이스 연결 테스트
 */
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ MySQL 데이터베이스 연결 성공!');
        console.log(`   - Host: ${process.env.DB_HOST}`);
        console.log(`   - Database: ${process.env.DB_NAME}`);
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ MySQL 연결 실패:', error.message);
        return false;
    }
}

/**
 * 쿼리 실행 헬퍼 함수
 * @param {string} sql - SQL 쿼리
 * @param {Array} params - 파라미터 배열
 * @returns {Promise} 쿼리 결과
 */
async function query(sql, params = []) {
    try {
        const [results] = await pool.execute(sql, params);
        return results;
    } catch (error) {
        console.error('Query Error:', error.message);
        throw error;
    }
}

/**
 * 트랜잭션 실행 헬퍼 함수
 * @param {Function} callback - 트랜잭션 콜백 함수
 * @returns {Promise} 트랜잭션 결과
 */
async function transaction(callback) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const result = await callback(connection);
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

/**
 * 데이터베이스 연결 종료
 */
async function closePool() {
    try {
        await pool.end();
        console.log('데이터베이스 연결 풀 종료');
    } catch (error) {
        console.error('연결 풀 종료 중 오류:', error);
    }
}

module.exports = {
    pool,
    query,
    transaction,
    testConnection,
    closePool
};
