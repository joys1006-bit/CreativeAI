import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store/store';
import apiService from '../services/api';

/**
 * ============================================
 * OAuth2 로그인 콜백 페이지
 * ============================================
 * 
 * 기능:
 * - 백엔드에서 리다이렉트된 URL의 토큰 파싱
 * - 토큰 저장 및 로그인 상태 업데이트
 * - 홈 화면으로 이동
 */
function LoginCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useStore();

    useEffect(() => {
        const processLogin = async () => {
            const accessToken = searchParams.get('accessToken');
            const refreshToken = searchParams.get('refreshToken');

            if (accessToken && refreshToken) {
                try {
                    // 1. 토큰 저장 (임시로 로컬 스토리지에 먼저 저장하여 API 호출 시 사용되도록 함)
                    // useStore의 login 함수가 처리를 해주지만, getCurrentUser 호출을 위해 필요할 수 있음

                    // 2. 사용자 정보 조회
                    // 토큰이 있으면 apiService가 자동으로 헤더에 첨부함 (store 업데이트 전이라도 수동으로 주입 필요할 수 있음)
                    // 여기서는 store.getState().login()을 호출하면 store가 업데이트되므로 이후 호출은 문제 없음

                    // 사용자 정보 조회는 login 액션 내부에서 처리하지 않고 별도로 가져와야 함
                    // 또는 백엔드에서 user 정보를 쿼리 파라미터로 넘겨주지 않았으므로 직접 조회

                    // 임시로 토큰을 localStorage에 저장하여 apiService가 인식하게 함 (store persist와 별개로)
                    // 하지만 store.login()이 persist를 처리하므로, 일단 store 업데이트

                    // 사용자 정보 가져오기 위해 임시 토큰 설정 (apiService는 localStorage의 creativeai-storage를 읽음)
                    // 하지만 Zustand Persist가 저장하기 전에는 읽을 수 없음.
                    // 따라서 apiService.fetchWithRetry에 토큰을 직접 넘기거나, 
                    // 일단 토큰만으로 로그인 처리를 하고, 이어서 사용자 정보를 가져와서 업데이트

                    // 3. Store 업데이트 (토큰만 먼저)
                    login(null, accessToken, refreshToken);

                    // 4. 사용자 정보 상세 조회
                    const userResponse = await apiService.getCurrentUser();
                    if (userResponse.success) {
                        login(userResponse.data, accessToken, refreshToken);
                        navigate('/home');
                    } else {
                        throw new Error('사용자 정보 조회 실패');
                    }

                } catch (error) {
                    console.error('OAuth login processing error:', error);
                    navigate('/login?error=oauth_failed');
                }
            } else {
                navigate('/login?error=no_tokens');
            }
        };

        processLogin();
    }, [searchParams, navigate, login]);

    return (
        <div className="login-callback">
            <div className="loading-container">
                <div className="spinner"></div>
                <p>로그인 처리 중...</p>
            </div>
            <style>{`
                .login-callback {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    background: #f0f2f5;
                    font-family: 'Pretendard', sans-serif;
                }
                .loading-container {
                    text-align: center;
                    background: white;
                    padding: 40px;
                    border-radius: 20px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                }
                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #667eea;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 20px;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

export default LoginCallback;
