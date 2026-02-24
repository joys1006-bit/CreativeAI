import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * [CDO 담당] 드래그 & 드롭 파일 업로드
 * - 전체 화면 드롭존
 * - 영상/오디오 파일 필터링
 * - 시각적 피드백 (호버/드롭 애니메이션)
 */

const ACCEPTED_TYPES = [
    'video/mp4', 'video/avi', 'video/mov', 'video/mkv', 'video/webm', 'video/quicktime',
    'audio/mpeg', 'audio/wav', 'audio/aac', 'audio/flac', 'audio/ogg', 'audio/mp3',
];

const ACCEPTED_EXTENSIONS = [
    '.mp4', '.avi', '.mov', '.mkv', '.webm', '.wmv',
    '.mp3', '.wav', '.aac', '.flac', '.ogg',
];

const DropZone = ({ onFileDrop, children, disabled = false }) => {
    const [isDragging, setIsDragging] = useState(false);
    const dragCounter = useRef(0);

    const isValidFile = (file) => {
        if (ACCEPTED_TYPES.includes(file.type)) return true;
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        return ACCEPTED_EXTENSIONS.includes(ext);
    };

    const handleDragEnter = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current++;
        if (!disabled) setIsDragging(true);
    }, [disabled]);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current--;
        if (dragCounter.current === 0) setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        dragCounter.current = 0;

        if (disabled) return;

        const files = [...e.dataTransfer.files];
        const validFile = files.find(isValidFile);

        if (validFile) {
            onFileDrop?.(validFile);
        }
    }, [disabled, onFileDrop]);

    return (
        <div
            className="dropzone-wrapper"
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            {children}

            <AnimatePresence>
                {isDragging && (
                    <motion.div
                        className="dropzone-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="dropzone-content"
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.8 }}
                        >
                            <div className="dropzone-icon">📁</div>
                            <h3 className="dropzone-title">파일을 여기에 놓으세요</h3>
                            <p className="dropzone-hint">MP4, AVI, MOV, MKV, WebM, MP3, WAV 등</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DropZone;
