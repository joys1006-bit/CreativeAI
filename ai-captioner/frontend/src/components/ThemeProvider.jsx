import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

/**
 * [CDO 담당] 테마 시스템
 * - 다크/라이트 테마 토글
 * - localStorage 영구 저장
 * - CSS 변수 동적 전환
 */

const ThemeContext = createContext();

const THEMES = {
    dark: {
        '--bg': '#0d0d0f',
        '--bg-surface': '#18181b',
        '--bg-elevated': '#1f1f23',
        '--bg-hover': '#27272a',
        '--text': '#fafafa',
        '--text-secondary': '#a1a1aa',
        '--text-dim': '#71717a',
        '--border': '#27272a',
        '--border-light': '#3f3f46',
        '--primary': '#6366f1',
        '--primary-light': '#818cf8',
        '--primary-dark': '#4f46e5',
        '--accent-green': '#22c55e',
        '--accent-orange': '#f59e0b',
        '--accent-red': '#ef4444',
        '--accent-blue': '#3b82f6',
        '--shadow-sm': '0 1px 3px rgba(0,0,0,0.4)',
        '--shadow-md': '0 4px 12px rgba(0,0,0,0.5)',
        '--shadow-lg': '0 8px 24px rgba(0,0,0,0.6)',
        '--glass': 'rgba(255,255,255,0.03)',
        '--glass-border': 'rgba(255,255,255,0.06)',
    },
    light: {
        '--bg': '#f8f9fa',
        '--bg-surface': '#ffffff',
        '--bg-elevated': '#f1f3f5',
        '--bg-hover': '#e9ecef',
        '--text': '#212529',
        '--text-secondary': '#495057',
        '--text-dim': '#868e96',
        '--border': '#dee2e6',
        '--border-light': '#e9ecef',
        '--primary': '#6366f1',
        '--primary-light': '#818cf8',
        '--primary-dark': '#4f46e5',
        '--accent-green': '#22c55e',
        '--accent-orange': '#f59e0b',
        '--accent-red': '#ef4444',
        '--accent-blue': '#3b82f6',
        '--shadow-sm': '0 1px 3px rgba(0,0,0,0.08)',
        '--shadow-md': '0 4px 12px rgba(0,0,0,0.1)',
        '--shadow-lg': '0 8px 24px rgba(0,0,0,0.12)',
        '--glass': 'rgba(0,0,0,0.02)',
        '--glass-border': 'rgba(0,0,0,0.06)',
    }
};

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        try {
            return localStorage.getItem('captioner-theme') || 'dark';
        } catch {
            return 'dark';
        }
    });

    // CSS 변수 적용
    useEffect(() => {
        const root = document.documentElement;
        const vars = THEMES[theme];
        Object.entries(vars).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });
        document.body.setAttribute('data-theme', theme);
        try {
            localStorage.setItem('captioner-theme', theme);
        } catch { }
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be within ThemeProvider');
    return context;
};

/**
 * 테마 토글 버튼 컴포넌트
 */
export const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();
    return (
        <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? '라이트 모드' : '다크 모드'}
        >
            {theme === 'dark' ? '☀️' : '🌙'}
        </button>
    );
};
