import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import './styles/common.css' // Import Common Styles
import useStore from './store/store'

// Pages
import Onboarding from './pages/Onboarding'
import Home from './pages/Home'
import EmojiMaker from './pages/EmojiMaker'
import BeautyFilter from './pages/BeautyFilter'
import Result from './pages/Result'
import History from './pages/History'
import AvatarMaker from './pages/AvatarMaker'
import PhotoEditor from './pages/PhotoEditor'

function App() {
    const hasSeenOnboarding = useStore((state) => state.hasSeenOnboarding)
    const setHasSeenOnboarding = useStore((state) => state.setHasSeenOnboarding)

    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/"
                    element={
                        hasSeenOnboarding ?
                            <Navigate to="/home" replace /> :
                            <Onboarding onComplete={() => setHasSeenOnboarding(true)} />
                    }
                />
                <Route path="/home" element={<Home />} />
                <Route path="/emoji-maker" element={<EmojiMaker />} />
                <Route path="/beauty-filter" element={<BeautyFilter />} />
                <Route path="/result" element={<Result />} />
                <Route path="/history" element={<History />} />
                <Route path="/avatar-maker" element={<AvatarMaker />} />
                <Route path="/photo-editor" element={<PhotoEditor />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
