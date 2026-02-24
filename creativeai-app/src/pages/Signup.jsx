import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStore } from '../store/store';
import apiService from '../services/api';
import './Login.css';  // 로그인과 동일한 스타일 사용

/**
 * ============================================
 * 회원가입 페이지 컴포넌트
 * ============================================
 * 
 * 기능:
 * - 이메일/비밀번호 회원가입
 * - 이메일 중복 확인
 * - Google OAuth 가입
 */
function Signup() {
    const navigate = useNavigate();
    const { login } = useStore();

    // 폼 상태
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [username, setUsername] = useState('');

    // UI 상태
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [emailChecked, setEmailChecked] = useState(false);
    const [emailAvailable, setEmailAvailable] = useState(false);

    /**
     * 이메일 중복 확인
     */
    const checkEmail = async () => {
        if (!email.trim()) {
            setError('이메일을 입력해주세요.');
            return;
        }

        try {
            const response = await apiService.checkEmail(email);
            setEmailChecked(true);
            setEmailAvailable(response.data?.available || false);

            if (!response.data?.available) {
                setError('이미 사용 중인 이메일입니다.');
            } else {
                setError('');
            }
        } catch (err) {
            console.error(err);
            setError('이메일 확인 중 오류가 발생했습니다.');
        }
    };

    /**
     * 회원가입 처리
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // 입력값 검증
        if (!email.trim()) {
            setError('이메일을 입력해주세요.');
            return;
        }
        if (!username.trim()) {
            setError('사용자명을 입력해주세요.');
            return;
        }
        if (password.length < 6) {
            setError('비밀번호는 6자 이상이어야 합니다.');
            return;
        }
        if (password !== confirmPassword) {
            setError('비밀번호가 일치하지 않습니다.');
            return;
        }

        setIsLoading(true);

        try {
            const response = await apiService.signup(email, password, username);

            if (response.success) {
                // 회원가입 성공: 토큰 저장 및 상태 업데이트
                login(response.data.user, response.data.accessToken, response.data.refreshToken);
                navigate('/home');
            } else {
                setError(response.message || '회원가입에 실패했습니다.');
            }
        } catch (err) {
            setError('회원가입 중 오류가 발생했습니다.');
            console.error('Signup error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Google OAuth 가입 처리
     */
    const handleGoogleSignup = () => {
        // 백엔드 OAuth2 Authorization Endpoint (표준 경로)
        window.location.href = 'http://localhost:9090/oauth2/authorization/google';
    };

    return (
        <div className="login-page">
            {/* 배경 */}
            <div className="login-background">
                <div className="gradient-orb orb-1"></div>
                <div className="gradient-orb orb-2"></div>
            </div>

            {/* 회원가입 카드 */}
            <motion.div
                className="login-card glass-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {/* 헤더 */}
                <div className="login-header">
                    <h1>🎨 CreativeAI 가입</h1>
                    <p>AI와 함께 창작을 시작하세요</p>
                </div>

                {/* 에러 메시지 */}
                {error && (
                    <motion.div
                        className="error-message"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        ⚠️ {error}
                    </motion.div>
                )}

                {/* 회원가입 폼 */}
                <form onSubmit={handleSubmit} className="login-form">
                    {/* 이메일 입력 + 중복확인 */}
                    <div className="input-group">
                        <label htmlFor="email">이메일</label>
                        <div className="input-with-button">
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    setEmailChecked(false);
                                }}
                                placeholder="your@email.com"
                                disabled={isLoading}
                                autoComplete="email"
                            />
                            <button
                                type="button"
                                onClick={checkEmail}
                                className="check-button"
                                disabled={isLoading || !email.trim()}
                            >
                                확인
                            </button>
                        </div>
                        {emailChecked && emailAvailable && (
                            <span className="success-text">✅ 사용 가능한 이메일입니다</span>
                        )}
                    </div>

                    {/* 사용자명 입력 */}
                    <div className="input-group">
                        <label htmlFor="username">사용자명</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="닉네임을 입력하세요"
                            disabled={isLoading}
                            autoComplete="username"
                        />
                    </div>

                    {/* 비밀번호 입력 */}
                    <div className="input-group">
                        <label htmlFor="password">비밀번호</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="6자 이상 입력"
                            disabled={isLoading}
                            autoComplete="new-password"
                        />
                    </div>

                    {/* 비밀번호 확인 */}
                    <div className="input-group">
                        <label htmlFor="confirmPassword">비밀번호 확인</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="비밀번호를 다시 입력"
                            disabled={isLoading}
                            autoComplete="new-password"
                        />
                    </div>

                    {/* 가입 버튼 */}
                    <motion.button
                        type="submit"
                        className="login-button primary-button"
                        disabled={isLoading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {isLoading ? (
                            <span className="loading-spinner">⏳</span>
                        ) : (
                            '가입하기'
                        )}
                    </motion.button>
                </form>

                {/* 구분선 */}
                <div className="divider">
                    <span>또는</span>
                </div>

                {/* 소셜 가입 */}
                <div className="social-login">
                    <motion.button
                        type="button"
                        className="google-button"
                        onClick={handleGoogleSignup}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <svg viewBox="0 0 24 24" width="20" height="20">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Google로 가입하기
                    </motion.button>
                </div>

                {/* 로그인 링크 */}
                <div className="signup-link">
                    이미 계정이 있으신가요? <Link to="/login">로그인</Link>
                </div>
            </motion.div>

            {/* 추가 스타일 */}
            <style>{`
        .input-with-button {
          display: flex;
          gap: 8px;
        }
        
        .input-with-button input {
          flex: 1;
        }
        
        .check-button {
          padding: 14px 16px;
          border-radius: 12px;
          border: 1px solid rgba(102, 126, 234, 0.5);
          background: rgba(102, 126, 234, 0.1);
          color: #667eea;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          white-space: nowrap;
        }
        
        .check-button:hover:not(:disabled) {
          background: rgba(102, 126, 234, 0.2);
        }
        
        .check-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .success-text {
          font-size: 13px;
          color: #34d399;
        }
      `}</style>
        </div>
    );
}

export default Signup;
