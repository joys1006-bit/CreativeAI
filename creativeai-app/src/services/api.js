const API_BASE_URL = 'http://localhost:9090/api';

/**
 * ============================================
 * API 서비스 클래스
 * ============================================
 * 
 * 기능:
 * - HTTP 요청 헬퍼 (재시도, 토큰 자동 첨부)
 * - 인증 API (signup, login, logout, refresh)
 * - 스타일/생성 API
 * - 사용자 API
 */
class ApiService {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    // ============================================
    // 토큰 관리
    // ============================================

    /**
     * 저장된 Access Token 가져오기
     */
    getAccessToken() {
        try {
            const storage = JSON.parse(localStorage.getItem('creativeai-storage') || '{}');
            return storage.state?.accessToken || null;
        } catch {
            return null;
        }
    }

    /**
     * HTTP 요청 헬퍼 (재시도 + 토큰 자동 첨부)
     */
    async fetchWithRetry(url, options = {}, retries = 3) {
        const token = this.getAccessToken();

        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...options.headers,
            },
            ...options,
        };

        // 디버그 로그
        console.log('[API] Request URL:', url);
        console.log('[API] Method:', options.method || 'GET');
        console.log('[API] Token:', token ? 'Present' : 'None');

        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(url, defaultOptions);

                console.log('[API] Response Status:', response.status);

                if (!response.ok) {
                    const error = await response.json().catch(() => ({ message: response.statusText }));
                    console.error('[API] Error:', error);
                    throw new Error(error.message || `HTTP ${response.status}`);
                }

                return await response.json();
            } catch (error) {
                if (i === retries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }
    }

    // ============================================
    // 인증 API
    // ============================================

    /**
     * 회원가입
     * @param {string} email - 이메일
     * @param {string} password - 비밀번호
     * @param {string} username - 사용자명
     */
    async signup(email, password, username) {
        return await this.fetchWithRetry(`${this.baseURL}/auth/signup`, {
            method: 'POST',
            body: JSON.stringify({ email, password, username })
        });
    }

    /**
     * 로그인
     * @param {string} email - 이메일
     * @param {string} password - 비밀번호
     */
    async login(email, password) {
        return await this.fetchWithRetry(`${this.baseURL}/auth/login`, {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    }

    /**
     * 로그아웃
     * @param {string} refreshToken - 리프레시 토큰
     */
    async logout(refreshToken) {
        return await this.fetchWithRetry(`${this.baseURL}/auth/logout`, {
            method: 'POST',
            body: JSON.stringify({ refreshToken })
        });
    }

    /**
     * 토큰 갱신
     * @param {string} refreshToken - 리프레시 토큰
     */
    async refreshToken(refreshToken) {
        return await this.fetchWithRetry(`${this.baseURL}/auth/refresh`, {
            method: 'POST',
            body: JSON.stringify({ refreshToken })
        });
    }

    /**
     * 현재 사용자 정보 조회
     */
    async getCurrentUser() {
        return await this.fetchWithRetry(`${this.baseURL}/auth/me`);
    }

    /**
     * 이메일 중복 확인
     * @param {string} email - 확인할 이메일
     */
    async checkEmail(email) {
        return await this.fetchWithRetry(`${this.baseURL}/auth/check-email?email=${encodeURIComponent(email)}`);
    }

    // ============================================
    // 스타일/콘텐츠 API
    // ============================================

    /**
     * 스타일 목록 조회
     */
    async getStyles(category = null) {
        const url = category
            ? `${this.baseURL}/styles?category=${category}`
            : `${this.baseURL}/styles`;

        const result = await this.fetchWithRetry(url);
        return result.data || [];
    }

    /**
     * 이모지 스타일 조회
     */
    async getEmojiStyles() {
        const result = await this.fetchWithRetry(`${this.baseURL}/emoji/styles`);
        return result.data || [];
    }

    /**
     * 아바타 스타일 조회
     */
    async getAvatarStyles() {
        const result = await this.fetchWithRetry(`${this.baseURL}/avatar/styles`);
        return result.data || [];
    }

    /**
     * 인기 창작물 조회
     */
    async getPopularCreations(limit = 10) {
        const result = await this.fetchWithRetry(`${this.baseURL}/creations/popular?limit=${limit}`);
        return result.data || [];
    }

    /**
     * 마켓플레이스 아이템 조회
     */
    async getMarketplaceItems(category = null, limit = 20) {
        const url = category
            ? `${this.baseURL}/marketplace?category=${category}&limit=${limit}`
            : `${this.baseURL}/marketplace?limit=${limit}`;
        const result = await this.fetchWithRetry(url);
        return result.data || [];
    }

    // ============================================
    // 생성 API
    // ============================================

    /**
     * 이모지 생성 시작
     */
    async generateEmoji(imageData, styleId, generationType = 'single', userId = 1) {
        const result = await this.fetchWithRetry(`${this.baseURL}/emoji/generate`, {
            method: 'POST',
            body: JSON.stringify({
                imageData,
                styleId,
                generationType,
                userId
            })
        });

        return result.data;
    }

    /**
     * 아바타 생성 시작
     */
    async generateAvatar(imageData, styleId, userId = 1) {
        const result = await this.fetchWithRetry(`${this.baseURL}/avatar/generate`, {
            method: 'POST',
            body: JSON.stringify({
                imageData,
                styleId,
                userId
            })
        });

        return result.data;
    }

    /**
     * 사진 편집
     */
    async editPhoto(imageData, operation, params = {}) {
        const result = await this.fetchWithRetry(`${this.baseURL}/photo-editor/edit`, {
            method: 'POST',
            body: JSON.stringify({
                imageData,
                operation,
                params
            })
        });
        return result;
    }

    /**
     * 뷰티 필터 적용
     */
    async applyBeautyFilter(imageData, filterType, intensity) {
        const result = await this.fetchWithRetry(`${this.baseURL}/beauty-filter/apply`, {
            method: 'POST',
            body: JSON.stringify({
                imageData,
                filterType,
                intensity
            })
        });
        return result;
    }

    /**
     * 생성 상태 조회 (폴링용)
     */
    async getGenerationStatus(id, type = 'emoji') {
        const endpoint = type === 'emoji'
            ? `${this.baseURL}/emoji/generation/${id}`
            : `${this.baseURL}/avatar/generation/${id}`;

        const result = await this.fetchWithRetry(endpoint);
        return result.data;
    }

    /**
     * 폴링 헬퍼 - 생성 완료까지 대기
     */
    async pollGenerationStatus(id, type = 'emoji', onProgress = null) {
        return new Promise((resolve, reject) => {
            const poll = async () => {
                try {
                    const status = await this.getGenerationStatus(id, type);

                    // 진행률 콜백 호출
                    if (onProgress) {
                        onProgress(status.progress);
                    }

                    // 완료 상태 확인
                    if (status.status === 'completed') {
                        resolve(status);
                    } else if (status.status === 'failed') {
                        reject(new Error('Generation failed'));
                    } else {
                        // 계속 폴링
                        setTimeout(poll, 1000);
                    }
                } catch (error) {
                    reject(error);
                }
            };

            poll();
        });
    }

    // ============================================
    // 사용자 API
    // ============================================

    /**
     * 사용자 정보 조회
     */
    async getUser(userId) {
        const result = await this.fetchWithRetry(`${this.baseURL}/users/${userId}`);
        return result.data;
    }

    /**
     * 내 프로필 수정
     * @param {string} username - 새 사용자명 (옵션)
     * @param {string} avatarUrl - 새 프로필 이미지 URL (옵션)
     */
    async updateCurrentUser(username, avatarUrl) {
        const result = await this.fetchWithRetry(`${this.baseURL}/users/me`, {
            method: 'PUT',
            body: JSON.stringify({ username, avatarUrl })
        });
        return result.data;
    }

    /**
     * 사용자 창작물 목록
     */
    async getUserCreations(userId, limit = 20, offset = 0) {
        const result = await this.fetchWithRetry(
            `${this.baseURL}/users/${userId}/creations?limit=${limit}&offset=${offset}`
        );
        return result.data || [];
    }

    /**
     * 내 창작물 목록 (인증 필요)
     */
    async getMyCreations(limit = 20, offset = 0) {
        const result = await this.fetchWithRetry(
            `${this.baseURL}/creations/my?limit=${limit}&offset=${offset}`
        );
        return result.data || [];
    }

    /**
     * 크레딧 잔액 조회
     */
    async getCreditBalance(userId) {
        const result = await this.fetchWithRetry(`${this.baseURL}/credits/balance/${userId}`);
        return result.data;
    }

    /**
     * Health check
     */
    async healthCheck() {
        return await this.fetchWithRetry(`${this.baseURL}/health`);
    }
}

export const apiService = new ApiService();
export default apiService;
