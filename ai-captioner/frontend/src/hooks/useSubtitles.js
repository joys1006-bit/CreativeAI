import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * 자막 CRUD 및 Undo/Redo 히스토리를 관리하는 커스텀 훅
 * 담당: 프론트엔드 개발자 (L4)
 * 설계: 프론트엔드 아키텍트 (L6)
 */
const useSubtitles = (addToast) => {
    // --- 상태: 자막 데이터 ---
    const [captions, setCaptions] = useState([]);

    // --- 상태: Undo/Redo 히스토리 ---
    const [captionHistory, setCaptionHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // --- Ref ---
    const historyDebounceRef = useRef(null);
    const historyRef = useRef({ captionHistory: [], historyIndex: -1 });

    // 히스토리 ref 동기화
    useEffect(() => {
        historyRef.current = { captionHistory, historyIndex };
    }, [captionHistory, historyIndex]);

    // === 히스토리 관리 ===
    const pushHistory = useCallback((newCaptions) => {
        if (historyDebounceRef.current) clearTimeout(historyDebounceRef.current);
        historyDebounceRef.current = setTimeout(() => {
            const { captionHistory: hist, historyIndex: idx } = historyRef.current;
            const sliced = hist.slice(0, idx + 1);
            const newHistory = [...sliced, JSON.parse(JSON.stringify(newCaptions))];
            setCaptionHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
        }, 500);
    }, []);

    const handleUndo = useCallback(() => {
        if (historyRef.current.historyIndex > 0) {
            const prevIndex = historyRef.current.historyIndex - 1;
            setHistoryIndex(prevIndex);
            setCaptions(JSON.parse(JSON.stringify(historyRef.current.captionHistory[prevIndex])));
            addToast('되돌리기 완료', 'info');
        }
    }, [addToast]);

    const handleRedo = useCallback(() => {
        const { captionHistory: hist, historyIndex: idx } = historyRef.current;
        if (idx < hist.length - 1) {
            const nextIndex = idx + 1;
            setHistoryIndex(nextIndex);
            setCaptions(JSON.parse(JSON.stringify(hist[nextIndex])));
            addToast('다시하기 완료', 'info');
        }
    }, [addToast]);

    // === 자막 CRUD ===
    const updateCaption = useCallback((id, newText) => {
        setCaptions(prev => prev.map((c, idx) => (c.id === id || idx === id) ? { ...c, text: newText } : c));
        setCaptions(current => { pushHistory(current); return current; });
    }, [pushHistory]);

    const updateCaptionTiming = useCallback((index, newStart, newEnd) => {
        setCaptions(prev => prev.map((c, i) => i === index ? { ...c, start: Math.round(newStart * 100) / 100, end: Math.round(newEnd * 100) / 100 } : c));
    }, []);

    const deleteCaption = useCallback((index) => {
        setCaptions(prev => prev.filter((_, i) => i !== index));
        setTimeout(() => { setCaptions(current => { pushHistory(current); return current; }); }, 0);
        addToast('자막이 삭제되었습니다', 'info');
    }, [pushHistory, addToast]);

    const addCaption = useCallback((currentTime, duration) => {
        const newStart = currentTime;
        const newEnd = Math.min(currentTime + 3, duration || currentTime + 3);
        const newSegment = { id: `seg_new_${Date.now()}`, start: newStart, end: newEnd, text: '새 자막', confidence: 1.0 };
        setCaptions(prev => [...prev, newSegment].sort((a, b) => a.start - b.start));
        setTimeout(() => { setCaptions(current => { pushHistory(current); return current; }); }, 0);
        addToast('새 자막이 추가되었습니다', 'success');
    }, [pushHistory, addToast]);

    const mergeCaptions = useCallback((currentTime, syncOffset) => {
        if (captions.length < 2) return addToast('합칠 자막이 부족합니다', 'warning');
        const currentIdx = captions.findIndex(c => currentTime >= c.start + syncOffset && currentTime <= c.end + syncOffset);
        if (currentIdx === -1 || currentIdx >= captions.length - 1) {
            return addToast('합칠 위치를 찾을 수 없습니다. 재생 바를 자막 위에 놓아주세요.', 'warning');
        }
        const current = captions[currentIdx];
        const next = captions[currentIdx + 1];
        const merged = { ...current, end: next.end, text: current.text + ' ' + next.text };
        setCaptions(prev => { const u = [...prev]; u[currentIdx] = merged; u.splice(currentIdx + 1, 1); return u; });
        setTimeout(() => { setCaptions(current => { pushHistory(current); return current; }); }, 0);
        addToast('자막 2개가 합쳐졌습니다', 'success');
    }, [captions, pushHistory, addToast]);

    const splitCaption = useCallback((currentTime, syncOffset) => {
        const currentIdx = captions.findIndex(c => currentTime >= c.start + syncOffset && currentTime <= c.end + syncOffset);
        if (currentIdx === -1) return addToast('분할할 자막을 찾을 수 없습니다. 재생 바를 자막 위에 놓아주세요.', 'warning');

        const cap = captions[currentIdx];
        const splitTime = currentTime - syncOffset;
        if (splitTime <= cap.start + 0.1 || splitTime >= cap.end - 0.1) {
            return addToast('분할 지점이 자막의 시작/끝에 너무 가깝습니다.', 'warning');
        }

        // 텍스트 중간 지점에서 분할
        const text = cap.text;
        const mid = Math.floor(text.length / 2);
        const spaceIdx = text.indexOf(' ', mid);
        const splitIdx = spaceIdx !== -1 ? spaceIdx : mid;

        const first = { ...cap, end: splitTime, text: text.substring(0, splitIdx).trim(), id: `seg_split_a_${Date.now()}` };
        const second = { ...cap, start: splitTime, text: text.substring(splitIdx).trim(), id: `seg_split_b_${Date.now()}` };

        setCaptions(prev => {
            const u = [...prev];
            u.splice(currentIdx, 1, first, second);
            return u;
        });
        setTimeout(() => { setCaptions(current => { pushHistory(current); return current; }); }, 0);
        addToast('자막이 분할되었습니다', 'success');
    }, [captions, pushHistory, addToast]);

    // === 히스토리 초기화 (AI 분석 완료 시 사용) ===
    const initializeHistory = useCallback((segments) => {
        setCaptionHistory([JSON.parse(JSON.stringify(segments))]);
        setHistoryIndex(0);
    }, []);

    return {
        // 상태
        captions,
        setCaptions,
        captionHistory,
        historyIndex,
        // Undo/Redo
        handleUndo,
        handleRedo,
        pushHistory,
        initializeHistory,
        // CRUD
        updateCaption,
        updateCaptionTiming,
        deleteCaption,
        addCaption,
        mergeCaptions,
        splitCaption,
    };
};

export default useSubtitles;
