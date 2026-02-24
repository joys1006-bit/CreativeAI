import { useState, useEffect } from 'react';
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
    const [isSettling, setIsSettling] = useState(false); // 정산 요청 모달 상태

    // 정산 데이터 상태
    const {
        earnings, setEarnings,
        setSettlements
    } = useStore();

    const [bankInfo, setBankInfo] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        username: '',
        avatarUrl: ''
    });

    const logout = useStore((state) => state.logout);

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const fetchSettlementData = async () => {
        if (!user?.id) return;
        try {
            const earningsData = await apiService.getEarnings(user.id);
            setEarnings(earningsData.data || []);

            const settlementsData = await apiService.getSettlementHistory(user.id);
            setSettlements(settlementsData.data || []);
        } catch (error) {
            console.error("정산 데이터 조회 실패:", error);
        }
    };

    useEffect(() => {
        if (activeTab === 'creator') {
            fetchSettlementData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

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

    const handleSettlementRequest = async (e) => {
        e.preventDefault();
        if (!bankInfo) return alert('계좌 정보를 입력해주세요.');

        try {
            await apiService.requestSettlement(user.id, bankInfo);
            alert('정산 요청이 완료되었습니다.');
            setIsSettling(false);
            fetchSettlementData(); // 데이터 갱신
        } catch (error) {
            alert('정산 요청 실패: ' + error.message);
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
                        <button
                            className={`tab-btn ${activeTab === 'creator' ? 'active' : ''}`}
                            onClick={() => setActiveTab('creator')}
                        >
                            💰 수익 현황
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
                        {activeTab === 'creator' && (
                            <div className="creator-dashboard">
                                <div className="earning-summary glass-panel">
                                    <div className="summary-item">
                                        <span className="label">총 누적 수익</span>
                                        <span className="value">₩ {earnings.reduce((sum, e) => sum + e.netEarning, 0).toLocaleString()}</span>
                                    </div>
                                    <div className="summary-item highlight">
                                        <span className="label">정산 가능 금액</span>
                                        <span className="value">₩ {earnings.filter(e => e.status === 'ELIGIBLE').reduce((sum, e) => sum + e.netEarning, 0).toLocaleString()}</span>
                                    </div>
                                    <button
                                        className="btn-settle"
                                        onClick={() => setIsSettling(true)}
                                        disabled={earnings.filter(e => e.status === 'ELIGIBLE').length === 0}
                                    >
                                        정산 신청하기
                                    </button>
                                </div>

                                <div className="history-section">
                                    <h3>정산 및 수익 내역</h3>
                                    <div className="earnings-list">
                                        {earnings.length === 0 ? (
                                            <p className="no-data">아직 발생한 수익이 없습니다.</p>
                                        ) : (
                                            earnings.map(e => (
                                                <div key={e.id} className="earning-item">
                                                    <div className="earning-info">
                                                        <span className="earning-date">{new Date(e.createdAt).toLocaleDateString()}</span>
                                                        <span className="earning-title">작품 판매 수익</span>
                                                    </div>
                                                    <div className="earning-amount">
                                                        <span className={`status-badge ${e.status.toLowerCase()}`}>{e.status}</span>
                                                        <span className="amount">+ ₩{e.netEarning.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
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

            {/* Settlement Modal */}
            {isSettling && (
                <div className="modal-overlay" onClick={() => setIsSettling(false)}>
                    <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>정산 신청</h2>
                            <button className="btn-close" onClick={() => setIsSettling(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSettlementRequest}>
                            <div className="form-group">
                                <label className="form-label">지급 계좌 정보</label>
                                <textarea
                                    className="form-input"
                                    rows="3"
                                    placeholder="은행명, 계좌번호, 예금주를 입력해주세요."
                                    value={bankInfo}
                                    onChange={e => setBankInfo(e.target.value)}
                                    required
                                />
                                <p className="form-hint">정산은 매월 1일 일괄 지급됩니다.</p>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setIsSettling(false)}>
                                    취소
                                </button>
                                <button type="submit" className="btn-save">
                                    신청하기
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
