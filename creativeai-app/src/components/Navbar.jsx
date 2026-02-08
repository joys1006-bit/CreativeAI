import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Navbar.css';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="bottom-nav">
            <NavButton
                icon="🏠"
                label="홈"
                active={isActive('/home')}
                onClick={() => navigate('/home')}
            />
            <NavButton
                icon="📜"
                label="히스토리"
                active={isActive('/history')}
                onClick={() => navigate('/history')}
            />

            <div className="create-btn-wrapper">
                <motion.button
                    className="create-btn"
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => navigate('/emoji-maker')}
                >
                    <span className="nav-icon">➕</span>
                </motion.button>
            </div>

            <NavButton
                icon="🛍️"
                label="마켓"
                active={isActive('/marketplace')}
                onClick={() => navigate('/marketplace')}
            />
            <NavButton
                icon="👤"
                label="MY"
                active={isActive('/mypage')}
                onClick={() => navigate('/mypage')}
            />
        </nav>
    );
};

const NavButton = ({ icon, label, active, onClick }) => {
    return (
        <motion.button
            className={`nav-item ${active ? 'active' : ''}`}
            onClick={onClick}
            whileTap={{ scale: 0.8 }}
        >
            <span className="nav-icon">{icon}</span>
            <span className="nav-label">{label}</span>
        </motion.button>
    );
};

export default Navbar;
