import React, { useState, useEffect, useCallback } from 'react';

/**
 * ProjectManager — 프로젝트 저장/불러오기/삭제 관리
 * localStorage에 프로젝트 목록을 저장, 각 프로젝트는 자막+설정 포함
 */
const ProjectManager = ({ isVisible, onClose, captions, syncOffset, subtitleStyle, onLoadProject }) => {
    const [projects, setProjects] = useState([]);
    const [newName, setNewName] = useState('');

    const STORAGE_KEY = 'ai-captioner-projects';

    // 프로젝트 목록 로드
    useEffect(() => {
        if (!isVisible) return;
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            setProjects(raw ? JSON.parse(raw) : []);
        } catch { setProjects([]); }
    }, [isVisible]);

    // 현재 작업을 프로젝트로 저장
    const handleSave = useCallback(() => {
        if (!newName.trim()) return;
        const project = {
            id: `proj_${Date.now()}`,
            name: newName.trim(),
            captions,
            syncOffset,
            subtitleStyle,
            captionCount: captions.length,
            savedAt: Date.now(),
        };
        const updated = [project, ...projects];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setProjects(updated);
        setNewName('');
    }, [newName, captions, syncOffset, subtitleStyle, projects]);

    // 프로젝트 불러오기
    const handleLoad = useCallback((project) => {
        onLoadProject?.(project);
        onClose();
    }, [onLoadProject, onClose]);

    // 프로젝트 삭제
    const handleDelete = useCallback((id) => {
        const updated = projects.filter(p => p.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        setProjects(updated);
    }, [projects]);

    if (!isVisible) return null;

    const formatDate = (ts) => {
        const d = new Date(ts);
        return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    const S = {
        overlay: {
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
            zIndex: 1500, display: 'flex', alignItems: 'center', justifyContent: 'center',
        },
        modal: {
            background: 'linear-gradient(145deg, #1e1e2e, #16213e)',
            borderRadius: '16px', border: '1px solid rgba(139,92,246,0.3)',
            padding: '28px', maxWidth: '520px', width: '90%',
            boxShadow: '0 24px 80px rgba(139,92,246,0.15)',
            maxHeight: '75vh', display: 'flex', flexDirection: 'column',
        },
        header: {
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '20px',
        },
        title: { fontSize: '18px', fontWeight: 700, color: '#fff' },
        closeBtn: {
            background: 'none', border: 'none', color: '#888',
            fontSize: '18px', cursor: 'pointer',
        },
        saveRow: {
            display: 'flex', gap: '8px', marginBottom: '20px',
        },
        input: {
            flex: 1, padding: '10px 14px', borderRadius: '8px',
            border: '1px solid rgba(139,92,246,0.3)', background: 'rgba(255,255,255,0.05)',
            color: '#fff', fontSize: '13px', outline: 'none',
        },
        saveBtn: {
            padding: '10px 20px', borderRadius: '8px', border: 'none',
            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            whiteSpace: 'nowrap',
        },
        list: {
            flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px',
        },
        item: {
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 14px', borderRadius: '10px',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
            transition: 'all 0.2s',
        },
        itemInfo: { flex: 1, cursor: 'pointer' },
        itemName: { fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '2px' },
        itemMeta: { fontSize: '11px', color: '#8b8ba7' },
        loadBtn: {
            padding: '6px 14px', borderRadius: '6px', border: 'none',
            background: 'rgba(139,92,246,0.2)', color: '#a78bfa',
            fontSize: '12px', fontWeight: 600, cursor: 'pointer', marginRight: '6px',
        },
        delBtn: {
            padding: '6px 10px', borderRadius: '6px', border: 'none',
            background: 'rgba(239,68,68,0.15)', color: '#ef4444',
            fontSize: '12px', cursor: 'pointer',
        },
        empty: {
            textAlign: 'center', color: '#555', fontSize: '13px',
            padding: '30px 0',
        },
    };

    return (
        <div style={S.overlay} onClick={onClose}>
            <div style={S.modal} onClick={e => e.stopPropagation()}>
                <div style={S.header}>
                    <span style={S.title}>📁 프로젝트 매니저</span>
                    <button style={S.closeBtn} onClick={onClose}>✕</button>
                </div>

                {/* 현재 작업 저장 */}
                <div style={S.saveRow}>
                    <input
                        style={S.input}
                        placeholder="프로젝트 이름을 입력하세요"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSave()}
                    />
                    <button style={S.saveBtn} onClick={handleSave} disabled={!newName.trim()}>
                        💾 저장
                    </button>
                </div>

                {/* 프로젝트 목록 */}
                <div style={S.list}>
                    {projects.length === 0 ? (
                        <div style={S.empty}>저장된 프로젝트가 없습니다</div>
                    ) : (
                        projects.map(proj => (
                            <div key={proj.id} style={S.item}>
                                <div style={S.itemInfo} onClick={() => handleLoad(proj)}>
                                    <div style={S.itemName}>{proj.name}</div>
                                    <div style={S.itemMeta}>
                                        📝 자막 {proj.captionCount}개 • {formatDate(proj.savedAt)}
                                    </div>
                                </div>
                                <div>
                                    <button style={S.loadBtn} onClick={() => handleLoad(proj)}>불러오기</button>
                                    <button style={S.delBtn} onClick={() => handleDelete(proj.id)}>🗑</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectManager;
