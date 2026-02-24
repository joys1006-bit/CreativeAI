import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * ============================================
 * Zustand 상태 관리 스토어
 * ============================================
 * 
 * 관리 항목:
 * - 사용자 인증 상태 (로그인, 토큰)
 * - 크레딧 정보
 * - 생성 히스토리
 * - 현재 작업 상태
 */
const useStore = create(
    persist(
        (set) => ({
            // ============================================
            // 인증 상태
            // ============================================
            user: null,                    // 사용자 정보 { id, email, username, avatarUrl }
            accessToken: null,             // JWT Access Token
            refreshToken: null,            // JWT Refresh Token
            isAuthenticated: false,        // 로그인 여부

            // ============================================
            // 앱 상태
            // ============================================
            hasSeenOnboarding: false,
            credits: 100,

            // ============================================
            // 생성 히스토리
            // ============================================
            history: [],

            // ============================================
            // 현재 작업 상태
            // ============================================
            currentWork: {
                uploadedImage: null,
                selectedStyle: 'kakao',
                generationId: null,
            },

            // ============================================
            // 마켓플레이스 및 정산 상태 (사업 기획 고도화)
            // ============================================
            earnings: [],                  // 수익 내역
            settlements: [],               // 정산 요청 내역
            subscription: null,            // 현재 구독 정보

            // ============================================
            // UI 상태
            // ============================================
            isLoading: false,
            error: null,

            // ============================================
            // 인증 관련 액션
            // ============================================

            /**
             * 로그인 처리
             * @param {Object} user - 사용자 정보
             * @param {string} accessToken - JWT Access Token
             * @param {string} refreshToken - JWT Refresh Token
             */
            login: (user, accessToken, refreshToken) => set({
                user,
                accessToken,
                refreshToken,
                isAuthenticated: true,
                credits: user.credits || 100  // 서버에서 받은 크레딧으로 동기화
            }),

            /**
             * 로그아웃 처리
             */
            logout: () => set({
                user: null,
                accessToken: null,
                refreshToken: null,
                isAuthenticated: false
            }),

            /**
             * 토큰 갱신
             */
            updateTokens: (accessToken, refreshToken) => set({
                accessToken,
                refreshToken
            }),

            /**
             * 사용자 정보 업데이트
             */
            updateUser: (userUpdates) => set((state) => ({
                user: state.user ? { ...state.user, ...userUpdates } : null
            })),

            // ============================================
            // 기존 액션들
            // ============================================
            setHasSeenOnboarding: (value) => set({ hasSeenOnboarding: value }),

            setCredits: (credits) => set({ credits }),

            useCredits: (amount) => set((state) => ({
                credits: Math.max(0, state.credits - amount)
            })),

            addToHistory: (item) => set((state) => ({
                history: [
                    {
                        ...item,
                        id: Date.now(),
                        timestamp: new Date().toISOString(),
                    },
                    ...state.history
                ]
            })),

            removeFromHistory: (id) => set((state) => ({
                history: state.history.filter(item => item.id !== id)
            })),

            clearHistory: () => set({ history: [] }),

            setCurrentWork: (work) => set((state) => ({
                currentWork: { ...state.currentWork, ...work }
            })),

            clearCurrentWork: () => set({
                currentWork: {
                    uploadedImage: null,
                    selectedStyle: 'kakao',
                    generationId: null,
                }
            }),

            setLoading: (isLoading) => set({ isLoading }),

            setError: (error) => set({ error }),

            clearError: () => set({ error: null }),

            // ============================================
            // 정산 및 구독 관련 액션
            // ============================================
            setEarnings: (earnings) => set({ earnings }),
            setSettlements: (settlements) => set({ settlements }),
            setSubscription: (subscription) => set({ subscription }),

            updateEarningStatus: (earningId, newStatus) => set((state) => ({
                earnings: state.earnings.map(e => e.id === earningId ? { ...e, status: newStatus } : e)
            })),
        }),
        {
            name: 'creativeai-storage',
            // 영속화할 상태 지정 (토큰 포함)
            partialize: (state) => ({
                hasSeenOnboarding: state.hasSeenOnboarding,
                credits: state.credits,
                history: state.history,
                user: state.user,
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
)

export { useStore }
export default useStore
