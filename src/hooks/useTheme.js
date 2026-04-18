import { useState, useEffect } from 'react';

const STORAGE_KEY = 'prompt_builder_theme';

/**
 * useTheme — 主题切换 hook（亮色/暗色/跟随系统）
 * 
 * 状态：isDarkMode
 * 方法：toggleTheme
 * 副作用：自动持久化到 localStorage + 同步 document.documentElement.classList
 */
export function useTheme() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(STORAGE_KEY, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(STORAGE_KEY, 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  return { isDarkMode, setIsDarkMode, toggleTheme };
}
