import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * 세션 저장/복원 (IndexedDB + localStorage) 관리 커스텀 훅
 * 담당: 프론트엔드 개발자 (L4)
 * 설계: 프론트엔드 아키텍트 (L6)
 */
const useSession = ({
    captions,
    syncOffset,
    subtitleStyle,
    subtitlePos,
    overlayImage,
    status,
    file,
    setCaptions,
    setSyncOffset,
    setSubtitleStyle,
    setSubtitlePos,
    setOverlayImage,
    setStatus,
    setFile,
    setPreviewUrl,
}) => {
    const saveTimerRef = useRef(null);

    // === IndexedDB 헬퍼 (비디오 파일 저장용) ===
    const openDB = useCallback(() => {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open('AICaptionerSession', 1);
            req.onupgradeneeded = () => {
                const db = req.result;
                if (!db.objectStoreNames.contains('files')) {
                    db.createObjectStore('files');
                }
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }, []);

    const saveFileToDB = useCallback(async (key, fileData) => {
        try {
            const db = await openDB();
            const tx = db.transaction('files', 'readwrite');
            tx.objectStore('files').put(fileData, key);
        } catch (e) { console.warn('IndexedDB 저장 실패:', e); }
    }, [openDB]);

    const getFileFromDB = useCallback(async (key) => {
        try {
            const db = await openDB();
            return new Promise((resolve) => {
                const tx = db.transaction('files', 'readonly');
                const req = tx.objectStore('files').get(key);
                req.onsuccess = () => resolve(req.result || null);
                req.onerror = () => resolve(null);
            });
        } catch (e) { return null; }
    }, [openDB]);

    // === 자동 저장 (3초 디바운스) ===
    useEffect(() => {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            try {
                const sessionData = {
                    captions,
                    syncOffset,
                    subtitleStyle,
                    subtitlePos,
                    overlayImage,
                    status,
                    fileName: file?.name || null,
                    savedAt: Date.now(),
                };
                localStorage.setItem('ai-captioner-session', JSON.stringify(sessionData));
            } catch (e) { console.warn('세션 저장 실패:', e); }
        }, 3000);
        return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
    }, [captions, syncOffset, subtitleStyle, subtitlePos, overlayImage, status, file]);

    // 비디오 파일 변경 시 IndexedDB에 저장
    useEffect(() => {
        if (file) saveFileToDB('currentVideo', file);
    }, [file, saveFileToDB]);

    // === 세션 복원 (앱 시작 시 1회) ===
    useEffect(() => {
        const restore = async () => {
            try {
                const raw = localStorage.getItem('ai-captioner-session');
                if (!raw) return;

                const session = JSON.parse(raw);
                // 24시간 이내 세션만 복원
                if (Date.now() - session.savedAt > 24 * 60 * 60 * 1000) {
                    localStorage.removeItem('ai-captioner-session');
                    return;
                }

                // 자막 & 설정 복원
                if (session.captions?.length > 0) setCaptions(session.captions);
                if (session.syncOffset != null) setSyncOffset(session.syncOffset);
                if (session.subtitleStyle) setSubtitleStyle(session.subtitleStyle);
                if (session.subtitlePos) setSubtitlePos(session.subtitlePos);
                if (session.overlayImage) setOverlayImage(session.overlayImage);
                if (session.status && session.status !== 'idle') setStatus(session.status);

                // 비디오 파일 복원
                const savedFile = await getFileFromDB('currentVideo');
                if (savedFile && session.fileName) {
                    const restoredFile = new File([savedFile], session.fileName, { type: savedFile.type });
                    setFile(restoredFile);
                    setPreviewUrl(URL.createObjectURL(restoredFile));
                    console.log(`✅ 세션 복원: "${session.fileName}", 자막 ${session.captions?.length || 0}개`);
                }
            } catch (e) { console.warn('세션 복원 실패:', e); }
        };
        restore();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // === 자막 자동 저장 (localStorage 백업) ===
    useEffect(() => {
        if (captions.length > 0 && file) {
            const data = { captions, fileName: file.name, savedAt: Date.now() };
            localStorage.setItem('ai-captioner-autosave', JSON.stringify(data));
        }
    }, [captions, file]);

    // === 자동 복원 로그 ===
    useEffect(() => {
        try {
            const saved = localStorage.getItem('ai-captioner-autosave');
            if (saved) {
                const data = JSON.parse(saved);
                if (data.captions?.length > 0 && Date.now() - data.savedAt < 24 * 60 * 60 * 1000) {
                    console.log(`[AutoSave] 복원 가능: ${data.fileName}, ${data.captions.length}개 자막`);
                }
            }
        } catch (e) { /* ignore */ }
    }, []);
};

export default useSession;
