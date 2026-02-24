import { motion } from 'framer-motion';
import './GlassCard.css';

const GlassCard = ({
    children,
    className = '',
    hover = true,
    onClick,
    delay = 0,
    style = {}
}) => {
    return (
        <motion.div
            className={`glass-card ${className}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: delay }}
            whileHover={hover ? { scale: 1.02, y: -5 } : {}}
            whileTap={hover ? { scale: 0.98 } : {}}
            onClick={onClick}
            style={style}
        >
            {children}
        </motion.div>
    );
};

export default GlassCard;
