import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 상태 관리 스토어
const useStore = create(
    persist(
        (set, get) => ({
            // 사용자 상태
            hasSeenOnboarding: false,
            credits: 100,
            
            // 생성 히스토리
            history: [],
            
            // 현재 작업 상태
            currentWork: {
                uploadedImage: null,
                selectedStyle: 'kakao',
                generationId: null,
            },
            
            // UI 상태
            isLoading: false,
            error: null,
            
            // Actions
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
        }),
        {
            name: 'creativeai-storage',
            partialize: (state) => ({
                hasSeenOnboarding: state.hasSeenOnboarding,
                credits: state.credits,
                history: state.history,
            }),
        }
    )
)

export default useStore
