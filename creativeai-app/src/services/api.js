const API_BASE_URL = 'http://localhost:8080/api'

class ApiService {
    constructor() {
        this.baseURL = API_BASE_URL
        this.maxRetries = 3
        this.retryDelay = 1000
    }

    /**
     * 재시도 로직이 포함된 fetch
     */
    async fetchWithRetry(url, options = {}, retries = this.maxRetries) {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.message || `HTTP ${response.status}`)
            }

            return await response.json()
        } catch (error) {
            if (retries > 0 && this.isRetryableError(error)) {
                await this.delay(this.retryDelay)
                return this.fetchWithRetry(url, options, retries - 1)
            }
            throw error
        }
    }

    /**
     * 재시도 가능한 에러인지 확인
     */
    isRetryableError(error) {
        return error.message.includes('NetworkError') ||
            error.message.includes('Failed to fetch') ||
            error.message.includes('503')
    }

    /**
     * 지연 함수
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    // ========== Emoji API ==========

    async getEmojiStyles() {
        return this.fetchWithRetry(`${this.baseURL}/emoji/styles`)
    }

    async generateEmoji(imageData, styleId, generationType = 'single') {
        return this.fetchWithRetry(`${this.baseURL}/emoji/generate`, {
            method: 'POST',
            body: JSON.stringify({
                imageData,
                styleId,
                generationType
            })
        })
    }

    async getEmojiGenerationStatus(id) {
        return this.fetchWithRetry(`${this.baseURL}/emoji/generation/${id}`)
    }

    // ========== Avatar API ==========

    async getAvatarStyles() {
        return this.fetchWithRetry(`${this.baseURL}/avatar/styles`)
    }

    async generateAvatar(imageData, styleId) {
        return this.fetchWithRetry(`${this.baseURL}/avatar/generate`, {
            method: 'POST',
            body: JSON.stringify({
                imageData,
                styleId
            })
        })
    }

    async getAvatarGenerationStatus(id) {
        return this.fetchWithRetry(`${this.baseURL}/avatar/generation/${id}`)
    }

    // ========== Creations API ==========

    async getPopularCreations() {
        return this.fetchWithRetry(`${this.baseURL}/creations/popular`)
    }

    // ========== Marketplace API ==========

    async getMarketplaceItems() {
        return this.fetchWithRetry(`${this.baseURL}/marketplace/items`)
    }

    // ========== Health Check ==========

    async healthCheck() {
        return this.fetchWithRetry(`${this.baseURL}/health`)
    }
}
const apiService = new ApiService()

export default apiService
