const API_BASE_URL = 'http://localhost:8080/api'

class ApiClient {
    async get(endpoint) {
        const response = await fetch(`${API_BASE_URL}${endpoint}`)
        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`)
        }
        return response.json()
    }

    async post(endpoint, data) {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })
        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`)
        }
        return response.json()
    }
}

const api = new ApiClient()

// API 함수들
export const apiService = {
    // 헬스 체크
    healthCheck: () => api.get('/health'),

    // 이모티콘 스타일 목록
    getEmojiStyles: () => api.get('/emoji/styles'),

    // 인기 크리에이션
    getPopularCreations: () => api.get('/creations/popular'),

    // 마켓플레이스 아이템
    getMarketplaceItems: () => api.get('/marketplace/items'),

    // 이모티콘 생성
    generateEmoji: (data) => api.post('/emoji/generate', data),

    // 생성 상태 조회
    getGenerationStatus: (id) => api.get(`/emoji/generation/${id}`),
}

export default apiService
