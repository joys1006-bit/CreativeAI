import React, { useState, useCallback, useEffect } from 'react';

/**
 * 자막 검색 + 찾기/바꾸기 패널
 * - Ctrl+F로 토글
 * - 실시간 검색 하이라이트
 * - 일괄 바꾸기 지원
 */
const SubtitleSearch = ({ isVisible, onClose, captions, onUpdateCaption, onSeek, syncOffset = 0 }) => {
    const [searchText, setSearchText] = useState('');
    const [replaceText, setReplaceText] = useState('');
    const [matchIndices, setMatchIndices] = useState([]);
    const [currentMatch, setCurrentMatch] = useState(0);
    const [showReplace, setShowReplace] = useState(false);

    // 검색 수행
    useEffect(() => {
        if (!searchText.trim()) {
            setMatchIndices([]);
            setCurrentMatch(0);
            return;
        }
        const matches = [];
        captions.forEach((cap, idx) => {
            if (cap.text.toLowerCase().includes(searchText.toLowerCase())) {
                matches.push(idx);
            }
        });
        setMatchIndices(matches);
        setCurrentMatch(0);
    }, [searchText, captions]);

    // 이전/다음 매치 이동
    const goToMatch = useCallback((direction) => {
        if (matchIndices.length === 0) return;
        let next = currentMatch + direction;
        if (next < 0) next = matchIndices.length - 1;
        if (next >= matchIndices.length) next = 0;
        setCurrentMatch(next);
        const cap = captions[matchIndices[next]];
        if (cap && onSeek) onSeek(cap.start + syncOffset);
    }, [matchIndices, currentMatch, captions, onSeek, syncOffset]);

    // 현재 매치 바꾸기
    const replaceCurrent = useCallback(() => {
        if (matchIndices.length === 0 || !searchText) return;
        const idx = matchIndices[currentMatch];
        const cap = captions[idx];
        const newText = cap.text.replace(new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), replaceText);
        onUpdateCaption(cap.id || idx, newText);
    }, [matchIndices, currentMatch, captions, searchText, replaceText, onUpdateCaption]);

    // 전체 바꾸기
    const replaceAll = useCallback(() => {
        if (matchIndices.length === 0 || !searchText) return;
        matchIndices.forEach(idx => {
            const cap = captions[idx];
            const newText = cap.text.replace(new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), replaceText);
            onUpdateCaption(cap.id || idx, newText);
        });
    }, [matchIndices, captions, searchText, replaceText, onUpdateCaption]);

    // Enter로 다음 매치 이동
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            goToMatch(e.shiftKey ? -1 : 1);
        }
        if (e.key === 'Escape') onClose();
    };

    if (!isVisible) return null;

    const S = {
        panel: {
            position: 'absolute',
            top: '8px',
            right: '12px',
            zIndex: 50,
            background: '#1e1e38',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '14px',
            padding: '14px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
            minWidth: '340px',
            fontFamily: "'Pretendard', sans-serif",
        },
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px',
        },
        title: {
            fontSize: '13px',
            fontWeight: 700,
            color: '#e2e2f0',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
        },
        closeBtn: {
            background: 'none',
            border: 'none',
            color: '#6b6b8a',
            fontSize: '16px',
            cursor: 'pointer',
            padding: '4px',
        },
        row: {
            display: 'flex',
            gap: '6px',
            marginBottom: '8px',
            alignItems: 'center',
        },
        input: {
            flex: 1,
            padding: '8px 12px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px',
            color: '#e2e2f0',
            fontSize: '13px',
            outline: 'none',
        },
        btn: {
            padding: '8px 12px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px',
            color: '#c0c0d8',
            fontSize: '12px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s ease',
        },
        btnPrimary: {
            padding: '8px 12px',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
            border: '1px solid rgba(139,92,246,0.3)',
            borderRadius: '10px',
            color: '#fff',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
        },
        matchInfo: {
            fontSize: '11px',
            color: '#6b6b8a',
            whiteSpace: 'nowrap',
            minWidth: '60px',
            textAlign: 'center',
        },
        toggleReplace: {
            fontSize: '11px',
            color: '#8b8ba7',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px 0',
            textDecoration: 'underline',
        },
    };

    return (
        <div style={S.panel}>
            <div style={S.header}>
                <span style={S.title}>🔍 자막 검색</span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button style={S.toggleReplace} onClick={() => setShowReplace(!showReplace)}>
                        {showReplace ? '바꾸기 숨기기' : '바꾸기 열기'}
                    </button>
                    <button style={S.closeBtn} onClick={onClose}>✕</button>
                </div>
            </div>

            {/* 검색 행 */}
            <div style={S.row}>
                <input
                    style={S.input}
                    placeholder="검색어 입력..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus
                />
                <span style={S.matchInfo}>
                    {matchIndices.length > 0
                        ? `${currentMatch + 1}/${matchIndices.length}`
                        : searchText ? '0건' : ''
                    }
                </span>
                <button style={S.btn} onClick={() => goToMatch(-1)} title="이전 (Shift+Enter)">▲</button>
                <button style={S.btn} onClick={() => goToMatch(1)} title="다음 (Enter)">▼</button>
            </div>

            {/* 바꾸기 행 */}
            {showReplace && (
                <>
                    <div style={S.row}>
                        <input
                            style={S.input}
                            placeholder="바꿀 텍스트..."
                            value={replaceText}
                            onChange={(e) => setReplaceText(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <button style={S.btn} onClick={replaceCurrent} title="현재 매치만 바꾸기">바꾸기</button>
                        <button style={S.btnPrimary} onClick={replaceAll} title="전체 바꾸기">
                            전체 ({matchIndices.length})
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default SubtitleSearch;
