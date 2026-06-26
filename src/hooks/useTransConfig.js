import { useState, useEffect } from 'react';
import { createDefaultAiConfig, migrateTransConfigToAiConfig, normalizeAiConfig } from '../lib/parser';

const AI_CONFIG_KEY = 'promptly_ai_config';
const APP_SETTINGS_KEY = 'promptly_app_settings';
const DEFAULT_APP_SETTINGS = {
  maxWorkspaceTabs: 10,
};

/**
 * useTransConfig — AI 配置 + 应用设置管理 hook
 * 
 * 状态：aiConfig, appSettings
 * 
 * aiConfig: { providers: [], translationProviderId, conversionProviderId }
 * appSettings: { maxWorkspaceTabs }
 */
export function useTransConfig() {
  const [aiConfig, setAiConfig] = useState(() => {
    if (typeof window !== 'undefined') {
      // 先尝试读取新格式
      const savedNew = localStorage.getItem(AI_CONFIG_KEY);
      if (savedNew) {
        try { return normalizeAiConfig(JSON.parse(savedNew)); } catch { /* fall through */ }
      }
      // 兼容旧格式
      const savedOld = localStorage.getItem('prompt_builder_trans_config');
      if (savedOld) {
        try {
          const old = JSON.parse(savedOld);
          return migrateTransConfigToAiConfig(old);
        } catch { /* fall through */ }
      }
    }
    return createDefaultAiConfig();
  });

  const [appSettings, setAppSettings] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(APP_SETTINGS_KEY);
      if (saved) {
        try { return { ...DEFAULT_APP_SETTINGS, ...JSON.parse(saved) }; } catch { /* fall through */ }
      }
    }
    return { ...DEFAULT_APP_SETTINGS };
  });

  useEffect(() => {
    localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(aiConfig));
  }, [aiConfig]);

  useEffect(() => {
    localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(appSettings));
  }, [appSettings]);

  // 兼容旧代码的派生属性
  const transConfig = {
    activeProvider: aiConfig.translationProviderId,
    customApis: aiConfig.providers.map(p => ({
      id: p.id,
      name: p.name,
      apiBase: p.apiBase,
      apiKey: p.apiKey,
      modelName: p.modelName,
      modelListUrl: p.modelListUrl,
      apiPageUrl: p.apiPageUrl,
    })),
  };

  const setTransConfig = (updater) => {
    // 兼容旧格式的 setTransConfig 调用
    setAiConfig(prev => {
      const oldCompat = {
        activeProvider: prev.translationProviderId,
        customApis: prev.providers.map(p => ({
          id: p.id, name: p.name, apiBase: p.apiBase, apiKey: p.apiKey, modelName: p.modelName, modelListUrl: p.modelListUrl, apiPageUrl: p.apiPageUrl,
        })),
      };
      const nextCompat = typeof updater === 'function' ? updater(oldCompat) : updater;
      // 合并回新格式
      const providerMap = new Map(prev.providers.map(p => [p.id, p]));
      const newProviders = (nextCompat.customApis || []).map(api => {
        const existing = providerMap.get(api.id);
        return {
          id: api.id,
          name: api.name || '自定义 API',
          apiBase: api.apiBase || '',
          apiKey: api.apiKey || '',
          modelName: api.modelName || '',
          isPreset: existing?.isPreset || false,
          presetKey: existing?.presetKey || null,
          modelListUrl: api.modelListUrl || existing?.modelListUrl || '',
          apiPageUrl: api.apiPageUrl || existing?.apiPageUrl || '',
        };
      });
      return {
        ...prev,
        providers: newProviders,
        translationProviderId: nextCompat.activeProvider || prev.translationProviderId,
      };
    });
  };

  // AI 提供商 CRUD
  const addProvider = (provider) => {
    setAiConfig(prev => ({
      ...prev,
      providers: [...prev.providers, { ...provider, id: provider.id }],
    }));
  };

  const updateProvider = (id, updates) => {
    setAiConfig(prev => ({
      ...prev,
      providers: prev.providers.map(p => p.id === id ? { ...p, ...updates } : p),
    }));
  };

  const deleteProvider = (id) => {
    setAiConfig(prev => ({
      ...prev,
      providers: prev.providers.filter(p => p.id !== id),
      translationProviderId: prev.translationProviderId === id ? 'google' : prev.translationProviderId,
      conversionProviderId: prev.conversionProviderId === id ? null : prev.conversionProviderId,
    }));
  };

  const setTranslationProviderId = (id) => {
    setAiConfig(prev => ({ ...prev, translationProviderId: id }));
  };

  const setConversionProviderId = (id) => {
    setAiConfig(prev => ({ ...prev, conversionProviderId: id }));
  };

  // 应用设置
  const updateAppSettings = (updates) => {
    setAppSettings(prev => ({ ...prev, ...updates }));
  };

  // 保留旧的 state（TransConfigModal 兼容）
  const [expandedApiId, setExpandedApiId] = useState(null);
  const [confirmDeleteApiId, setConfirmDeleteApiId] = useState(null);

  return {
    // 新 API
    aiConfig, setAiConfig,
    appSettings, setAppSettings, updateAppSettings,
    addProvider, updateProvider, deleteProvider,
    setTranslationProviderId, setConversionProviderId,
    // 兼容旧 API
    transConfig, setTransConfig,
    expandedApiId, setExpandedApiId,
    confirmDeleteApiId, setConfirmDeleteApiId,
  };
}
