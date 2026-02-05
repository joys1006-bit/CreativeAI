const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/database');

// 환경 변수 로드
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// 미들웨어
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 라우터
const stylesRouter = require('./routes/styles');
const emojiRouter = require('./routes/emoji');
const avatarRouter = require('./routes/avatar');
const usersRouter = require('./routes/users');
const creditsRouter = require('./routes/credits');

// API 라우트
app.use('/api/styles', stylesRouter);
app.use('/api/emoji', emojiRouter);
app.use('/api/avatar', avatarRouter);
app.use('/api/users', usersRouter);
app.use('/api/credits', creditsRouter);

// Health check
app.get('/api/health', async (req, res) => {
    try {
        await db.testConnection();
        res.json({
            status: 'OK',
            message: 'CreativeAI API is running',
            database: 'Connected'
        });
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            message: 'Database connection failed',
            error: error.message
        });
    }
});

// 404 핸들러
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

// 에러 핸들러
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
    });
});

// 서버 시작
app.listen(PORT, async () => {
    console.log(`🚀 CreativeAI API Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);

    // 데이터베이스 연결 테스트
    const connected = await db.testConnection();
    if (!connected) {
        console.warn('⚠️  Database not connected. Some features may not work.');
    }
});

module.exports = app;
