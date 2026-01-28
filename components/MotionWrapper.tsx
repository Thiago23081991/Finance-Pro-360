import { motion } from 'framer-motion';
import React from 'react';

interface MotionWrapperProps {
    children: React.ReactNode;
    className?: string;
    delay?: number;
}

export const MotionWrapper: React.FC<MotionWrapperProps> = ({ children, className = "", delay = 0 }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10, filter: 'blur(5px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(5px)' }}
            transition={{ duration: 0.4, ease: "easeOut", delay }}
            className={className}
        >
            {children}
        </motion.div>
    );
};
