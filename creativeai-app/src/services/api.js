const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

class ApiService {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    /**
     * HTTP 요청 헬퍼 (재시도 포함)
     */
    async fetchWithRetry(url, options = {}, retries = 3) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(url, defaultOptions);

                if (!response.ok) {
                    const error = await response.json().catch(() => ({ message: response.statusText }));
                    throw new Error(error.message || `HTTP ${response.status}`);
                }

                return await response.json();
            } catch (error) {
                if (i === retries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }
    }

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

    /**
     * 사용자 정보 조회
     */
    async getUser(userId) {
        const result = await this.fetchWithRetry(`${this.baseURL}/users/${userId}`);
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
