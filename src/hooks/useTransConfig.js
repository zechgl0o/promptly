import { useState, useEffect } from 'react';
import { migrateTransConfig } from '../lib/parser';

const STORAGE_KEY = 'prompt_builder_trans_config';

/**
 * useTransConfig — 翻译配置管理 hook
 * 
 * 状态：transConfig, expandedApiId, confirmDeleteApiId
 * 
 * 副作用：自动持久化 transConfig 到 localStorage
 */
export function useTransConfig() {
  const [transConfig, setTransConfig] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return migrateTransConfig(JSON.parse(saved));
    }
    return { activeProvider: 'google', customApis: [] };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transConfig));
  }, [transConfig]);

  const [expandedApiId, setExpandedApiId] = useState(null);
  const [confirmDeleteApiId, setConfirmDeleteApiId] = useState(null);

  return {
    transConfig, setTransConfig,
    expandedApiId, setExpandedApiId,
    confirmDeleteApiId, setConfirmDeleteApiId,
  };
}
