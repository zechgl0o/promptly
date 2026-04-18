// ================= 前端日志系统 =================

const LOG_STORAGE_KEY = 'promptly_app_logs';
const LOG_MAX_ENTRIES = 200;

export const appLogger = {
  _getLogs() {
    try { return JSON.parse(localStorage.getItem(LOG_STORAGE_KEY) || '[]'); } catch { return []; }
  },
  _save(logs) {
    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logs.slice(-LOG_MAX_ENTRIES)));
  },
  _write(level, source, message, detail) {
    const entry = { ts: new Date().toISOString(), level, source, message, detail: detail || '' };
    const logs = this._getLogs();
    logs.push(entry);
    this._save(logs);
    if (level === 'error') console.error(`[Promptly:${source}]`, message, detail || '');
    else if (level === 'warn') console.warn(`[Promptly:${source}]`, message, detail || '');
    else console.log(`[Promptly:${source}]`, message, detail || '');
  },
  info(source, message, detail) { this._write('info', source, message, detail); },
  warn(source, message, detail) { this._write('warn', source, message, detail); },
  error(source, message, detail) { this._write('error', source, message, detail); },
  getRecent(count = 50) { const logs = this._getLogs(); return logs.slice(-count); },
  clear() { localStorage.removeItem(LOG_STORAGE_KEY); },
};

// 全局错误捕获
if (typeof window !== 'undefined') {
  window.onerror = (msg, source, lineno, colno, error) => {
    appLogger.error('global', String(msg), `${source}:${lineno}:${colno} ${error?.stack || ''}`);
    return false;
  };
  window.addEventListener('unhandledrejection', (e) => {
    appLogger.error('promise', e.reason?.message || String(e.reason), e.reason?.stack || '');
  });
}
