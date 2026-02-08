import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import apiService from '../services/api';
import { useStore } from '../store/store';
import './MyPage.css';

const MyPage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [creations, setCreations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        username: '',
        avatarUrl: ''
    });

    const logout = useStore((state) => state.logout);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const userData = await apiService.getCurrentUser();
            setUser(userData.data);
            setFormData({
                username: userData.data.username,
                avatarUrl: userData.data.avatarUrl || ''
            });

            const creationsData = await apiService.getMyCreations();
            setCreations(creationsData.data || []);
        } catch (error) {
            console.error("Failed to fetch profile:", error);
            if (error.message.includes("401")) {
                logout(); // 토큰 만료시 로그아웃
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            const refreshToken = JSON.parse(localStorage.getItem('creativeai-storage'))?.state?.refreshToken;
            if (refreshToken) {
                await apiService.logout(refreshToken);
            }
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            logout();
            navigate('/login');
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            const updatedUser = await apiService.updateCurrentUser(formData.username, formData.avatarUrl);
            setUser(updatedUser.data);
            setIsEditing(false);
            alert('프로필이 업데이트되었습니다.');
        } catch (error) {
            console.error("Update failed:", error);
            alert('업데이트 실패: ' + error.message);
        }
    };

    // Tab state
    const [activeTab, setActiveTab] = useState('creations');

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="my-page-container">
            <Navbar />

            <div className="profile-wrapper">
                {/* Profile Header Card */}
                <div className="profile-card glass-panel">
                    {/* Cover Image */}
                    <div className="profile-cover">
                        <div className="cover-gradient"></div>
                    </div>

                    {/* Profile Content */}
                    <div className="profile-content">
                        {/* Avatar & Edit */}
                        <div className="profile-main">
                            <div className="avatar-container">
                                <img
                                    src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${user?.username}&background=random`}
                                    alt="Profile"
                                    className="profile-avatar"
                                />
                                <button
                                    className="btn-icon-edit"
                                    onClick={() => setIsEditing(true)}
                                    title="Edit Profile"
                                >
                                    ✏️
                                </button>
                            </div>

                            <div className="user-info">
                                <h1 className="user-name">{user?.username}</h1>
                                <p className="user-email">{user?.email}</p>
                            </div>

                            <div className="user-actions">
                                <button className="btn-primary" onClick={() => setIsEditing(true)}>
                                    프로필 편집
                                </button>
                                <button className="btn-secondary" onClick={handleLogout}>
                                    로그아웃
                                </button>
                            </div>
                        </div>

                        {/* Stats Row */}
                        <div className="stats-row">
                            <div className="stat-box">
                                <span className="stat-number">🪙 {user?.credits}</span>
                                <span className="stat-label">Credits</span>
                            </div>
                            <div className="stat-box">
                                <span className="stat-number">{creations.length}</span>
                                <span className="stat-label">Creations</span>
                            </div>
                            <div className="stat-box">
                                <span className="stat-number">0</span>
                                <span className="stat-label">Likes</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Tabs */}
                <div className="content-section">
                    <div className="tabs-header">
                        <button
                            className={`tab-btn ${activeTab === 'creations' ? 'active' : ''}`}
                            onClick={() => setActiveTab('creations')}
                        >
                            🎨 내 작품
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'likes' ? 'active' : ''}`}
                            onClick={() => setActiveTab('likes')}
                        >
                            ❤️ 좋아요
                        </button>
                    </div>

                    <div className="tab-content">
                        {activeTab === 'creations' && (
                            creations.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">🎨</div>
                                    <p>아직 만들어진 작품이 없어요.</p>
                                    <button className="btn-create" onClick={() => navigate('/emoji-maker')}>
                                        첫 작품 만들기
                                    </button>
                                </div>
                            ) : (
                                <div className="creations-grid">
                                    {creations.map((item) => (
                                        <div key={item.id} className="creation-card">
                                            <div className="card-image-wrapper">
                                                <img
                                                    src={item.imageUrl || `https://picsum.photos/seed/${item.id}/300/300`}
                                                    alt={item.type}
                                                    className="creation-image"
                                                />
                                                <div className="card-overlay">
                                                    <span className="creation-badge">{item.type}</span>
                                                    <span className="creation-likes">❤️ {item.likes || 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}
                        {activeTab === 'likes' && (
                            <div className="empty-state">
                                <div className="empty-icon">❤️</div>
                                <p>좋아요한 작품이 없습니다.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Profile Modal */}
            {isEditing && (
                <div className="modal-overlay" onClick={() => setIsEditing(false)}>
                    <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>프로필 편집</h2>
                            <button className="btn-close" onClick={() => setIsEditing(false)}>✕</button>
                        </div>
                        <form onSubmit={handleUpdateProfile}>
                            <div className="form-group">
                                <label className="form-label">사용자명</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">프로필 이미지 URL</label>
                                <input
                                    type="url"
                                    className="form-input"
                                    value={formData.avatarUrl}
                                    onChange={e => setFormData({ ...formData, avatarUrl: e.target.value })}
                                    placeholder="https://"
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setIsEditing(false)}>
                                    취소
                                </button>
                                <button type="submit" className="btn-save">
                                    저장하기
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyPage;
