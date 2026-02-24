import { motion } from 'framer-motion';
import './PremiumButton.css';

const PremiumButton = ({
    children,
    onClick,
    variant = 'primary',
    className = '',
    type = 'button',
    disabled = false,
    fullWidth = false
}) => {
    return (
        <motion.button
            type={type}
            className={`premium-btn btn-${variant} ${fullWidth ? 'w-full' : ''} ${className}`}
            onClick={onClick}
            disabled={disabled}
            whileHover={{ scale: 1.03, boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}
            whileTap={{ scale: 0.97 }}
        >
            <span className="btn-content">{children}</span>
            <div className="btn-shine"></div>
        </motion.button>
    );
};

export default PremiumButton;
