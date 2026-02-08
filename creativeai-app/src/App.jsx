import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import './styles/common.css' // Import Common Styles
import { useStore } from './store/store'

// Pages
import Onboarding from './pages/Onboarding'
import Home from './pages/Home'
import EmojiMaker from './pages/EmojiMaker'
import BeautyFilter from './pages/BeautyFilter'
import Result from './pages/Result'
import History from './pages/History'
import AvatarMaker from './pages/AvatarMaker'
import PhotoEditor from './pages/PhotoEditor'
import Login from './pages/Login'
import Signup from './pages/Signup'
import LoginCallback from './pages/LoginCallback'
import MyPage from './pages/MyPage'
import Marketplace from './pages/Marketplace'

/**
 * ============================================
 * PrivateRoute 컴포넌트
 * ============================================
 * 인증이 필요한 페이지를 보호하는 래퍼 컴포넌트
 */
function PrivateRoute({ children }) {
    const isAuthenticated = useStore((state) => state.isAuthenticated)

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    return children
}

function App() {
    const hasSeenOnboarding = useStore((state) => state.hasSeenOnboarding)
    const setHasSeenOnboarding = useStore((state) => state.setHasSeenOnboarding)
    const isAuthenticated = useStore((state) => state.isAuthenticated)

    return (
        <BrowserRouter>
            <Routes>
                {/* 공개 경로 */}
                <Route
                    path="/"
                    element={
                        hasSeenOnboarding ?
                            <Navigate to="/home" replace /> :
                            <Onboarding onComplete={() => setHasSeenOnboarding(true)} />
                    }
                />

                {/* 인증 페이지 (이미 로그인한 경우 홈으로 리다이렉트) */}
                <Route
                    path="/login"
                    element={
                        isAuthenticated ?
                            <Navigate to="/home" replace /> :
                            <Login />
                    }
                />
                <Route
                    path="/signup"
                    element={
                        isAuthenticated ?
                            <Navigate to="/home" replace /> :
                            <Signup />
                    }
                />

                {/* OAuth 콜백 */}
                <Route path="/login/callback" element={<LoginCallback />} />

                {/* 메인 페이지 (인증 없이 접근 가능) */}
                <Route path="/home" element={<Home />} />

                {/* 마켓플레이스 (전문 디자인 적용) */}
                <Route path="/marketplace" element={<Marketplace />} />

                {/* 보호된 페이지 (인증 필요) */}
                <Route path="/emoji-maker" element={
                    <PrivateRoute><EmojiMaker /></PrivateRoute>
                } />
                <Route path="/beauty-filter" element={
                    <PrivateRoute><BeautyFilter /></PrivateRoute>
                } />
                <Route path="/result" element={
                    <PrivateRoute><Result /></PrivateRoute>
                } />
                <Route path="/history" element={
                    <PrivateRoute><History /></PrivateRoute>
                } />
                <Route path="/avatar-maker" element={
                    <PrivateRoute><AvatarMaker /></PrivateRoute>
                } />
                <Route path="/photo-editor" element={
                    <PrivateRoute><PhotoEditor /></PrivateRoute>
                } />
                <Route path="/mypage" element={
                    <PrivateRoute><MyPage /></PrivateRoute>
                } />
            </Routes>
        </BrowserRouter>
    )
}

export default App
