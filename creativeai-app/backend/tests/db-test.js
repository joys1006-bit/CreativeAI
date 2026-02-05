const db = require('../config/database');

/**
 * 데이터베이스 연결 및 기본 데이터 확인 테스트
 */
async function testDatabase() {
    console.log('🔍 CreativeAI 데이터베이스 테스트 시작...\n');

    try {
        // 1. 연결 테스트
        console.log('1️⃣ 데이터베이스 연결 테스트...');
        const isConnected = await db.testConnection();

        if (!isConnected) {
            console.error('❌ 데이터베이스 연결 실패!');
            console.log('\n💡 해결 방법:');
            console.log('   1. MySQL 서비스가 실행 중인지 확인하세요');
            console.log('   2. .env 파일의 DB_PASSWORD가 올바른지 확인하세요');
            console.log('   3. database/schema.sql이 실행되었는지 확인하세요');
            process.exit(1);
        }

        console.log('');

        // 2. 테이블 존재 확인
        console.log('2️⃣ 테이블 존재 확인...');
        const tables = await db.query('SHOW TABLES');
        console.log(`   ✅ 테이블 ${tables.length}개 발견:`);
        tables.forEach(table => {
            const tableName = Object.values(table)[0];
            console.log(`      - ${tableName}`);
        });
        console.log('');

        // 3. 스타일 데이터 확인
        console.log('3️⃣ 스타일 데이터 확인...');
        const styles = await db.query('SELECT category, COUNT(*) as count FROM styles GROUP BY category');
        console.log(`   ✅ 스타일 데이터:`);
        styles.forEach(row => {
            console.log(`      - ${row.category}: ${row.count}개`);
        });

        const totalStyles = await db.query('SELECT COUNT(*) as total FROM styles');
        console.log(`   📊 총 스타일: ${totalStyles[0].total}개`);
        console.log('');

        // 4. 사용자 데이터 확인
        console.log('4️⃣ 사용자 데이터 확인...');
        const users = await db.query('SELECT COUNT(*) as total FROM users');
        console.log(`   ✅ 사용자: ${users[0].total}명`);
        console.log('');

        // 5. 창작물 데이터 확인
        console.log('5️⃣ 창작물 데이터 확인...');
        const creations = await db.query('SELECT COUNT(*) as total FROM creations');
        console.log(`   ✅ 창작물: ${creations[0].total}개`);
        console.log('');

        // 6. 크레딧 트랜잭션 테스트
        console.log('6️⃣ 크레딧 트랜잭션 테스트...');
        const transactions = await db.query(`
            SELECT 
                transaction_type,
                COUNT(*) as count,
                SUM(amount) as total_amount
            FROM credit_transactions
            GROUP BY transaction_type
        `);
        console.log('   ✅ 거래 내역:');
        transactions.forEach(row => {
            console.log(`      - ${row.transaction_type}: ${row.count}건 (합계: ${row.total_amount})`);
        });
        console.log('');

        // 7. 샘플 쿼리 테스트 (JOIN)
        console.log('7️⃣ 복합 쿼리 테스트 (JOIN)...');
        const sampleData = await db.query(`
            SELECT 
                c.id,
                c.creation_type,
                s.name as style_name,
                u.username,
                c.status,
                COUNT(cf.id) as file_count
            FROM creations c
            LEFT JOIN styles s ON c.style_id = s.id
            LEFT JOIN users u ON c.user_id = u.id
            LEFT JOIN creation_files cf ON c.id = cf.creation_id
            GROUP BY c.id
            LIMIT 5
        `);

        if (sampleData.length > 0) {
            console.log('   ✅ 샘플 창작물:');
            sampleData.forEach(row => {
                console.log(`      - ${row.username}의 ${row.style_name} ${row.creation_type} (파일: ${row.file_count}개)`);
            });
        } else {
            console.log('   ℹ️  샘플 데이터 없음 (정상)');
        }
        console.log('');

        // 8. 인덱스 확인
        console.log('8️⃣ 인덱스 확인...');
        const indexes = await db.query(`
            SELECT 
                TABLE_NAME,
                COUNT(DISTINCT INDEX_NAME) as index_count
            FROM INFORMATION_SCHEMA.STATISTICS
            WHERE TABLE_SCHEMA = ?
            GROUP BY TABLE_NAME
        `, [process.env.DB_NAME || 'creativeai_db']);

        console.log('   ✅ 테이블별 인덱스:');
        indexes.forEach(row => {
            console.log(`      - ${row.TABLE_NAME}: ${row.index_count}개`);
        });
        console.log('');

        // 최종 결과
        console.log('═'.repeat(50));
        console.log('✅ 모든 테스트 통과!');
        console.log('═'.repeat(50));
        console.log('\n📊 데이터베이스 요약:');
        console.log(`   - 테이블: ${tables.length}개`);
        console.log(`   - 스타일: ${totalStyles[0].total}개`);
        console.log(`   - 사용자: ${users[0].total}명`);
        console.log(`   - 창작물: ${creations[0].total}개`);
        console.log('\n🎉 CreativeAI 데이터베이스가 정상적으로 설정되었습니다!\n');

    } catch (error) {
        console.error('\n❌ 테스트 중 오류 발생:');
        console.error(error.message);
        console.error('\n💡 오류 해결:');
        console.error('   1. database/schema.sql이 실행되었는지 확인');
        console.error('   2. database/seeds.sql이 실행되었는지 확인');
        console.error('   3. MySQL 서버가 정상 작동 중인지 확인');
    } finally {
        // 연결 풀 종료
        await db.closePool();
        process.exit(0);
    }
}

// 테스트 실행
testDatabase();
