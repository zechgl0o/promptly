// ================= localStorage 统一封装 =================

const STORAGE_KEYS = {
  USER: 'prompt_builder_user',
  TOKEN: 'prompt_builder_token',
  THEME: 'prompt_builder_theme',
  TRANS_CONFIG: 'prompt_builder_trans_config',
  COLLAPSED_FOLDERS: 'promptly_collapsed_folders',
  COLLAPSED_PRESET_FOLDERS: 'promptly_collapsed_preset_folders',
  APP_LOGS: 'promptly_app_logs',
};

export const storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('[storage] 写入失败:', key, e);
    }
  },

  remove(key) {
    localStorage.removeItem(key);
  },

  // 便捷方法
  getUser() { return this.get(STORAGE_KEYS.USER); },
  setUser(user) { user ? this.set(STORAGE_KEYS.USER, user) : this.remove(STORAGE_KEYS.USER); },

  getToken() { return localStorage.getItem(STORAGE_KEYS.TOKEN); },
  setToken(token) { token ? localStorage.setItem(STORAGE_KEYS.TOKEN, token) : localStorage.removeItem(STORAGE_KEYS.TOKEN); },

  getTheme() {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  },
  setTheme(isDark) { localStorage.setItem(STORAGE_KEYS.THEME, isDark ? 'dark' : 'light'); },

  getTransConfig() { return this.get(STORAGE_KEYS.TRANS_CONFIG); },
  setTransConfig(config) { this.set(STORAGE_KEYS.TRANS_CONFIG, config); },

  getCollapsedFolders() { return this.get(STORAGE_KEYS.COLLAPSED_FOLDERS, []); },
  setCollapsedFolders(ids) { this.set(STORAGE_KEYS.COLLAPSED_FOLDERS, ids); },

  getCollapsedPresetFolders() { return this.get(STORAGE_KEYS.COLLAPSED_PRESET_FOLDERS, []); },
  setCollapsedPresetFolders(ids) { this.set(STORAGE_KEYS.COLLAPSED_PRESET_FOLDERS, ids); },

  clearAuth() {
    this.remove(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
  },
};

export { STORAGE_KEYS };
