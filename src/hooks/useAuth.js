import { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../lib/constants';
import { appLogger } from '../lib/logger';

const USER_KEY = 'prompt_builder_user';
const TOKEN_KEY = 'prompt_builder_token';

/**
 * useAuth — 认证状态管理 hook
 * 
 * 状态：currentUser, authToken, authView, authForm, authLoading, authError,
 *       showChangePassword, changePasswordForm
 * 
 * 方法：authFetch, handleLogin, handleRegister, handleLogout, handleChangePassword
 * 
 * 外部依赖：setSuccessMessage（修改密码成功后需要显示提示）
 */
export function useAuth({ setSuccessMessage, setDataLoaded }) {
  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(USER_KEY);
      if (saved) return JSON.parse(saved);
    }
    return null;
  });
  const [authToken, setAuthToken] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  });
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'
  const [authForm, setAuthForm] = useState({ username: '', password: '' });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [changePasswordForm, setChangePasswordForm] = useState({ oldPassword: '', newPassword: '' });

  // 持久化认证信息
  useEffect(() => {
    if (currentUser && authToken) {
      localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
      localStorage.setItem(TOKEN_KEY, authToken);
    } else {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
    }
  }, [currentUser, authToken]);

  // 带 Token 的 fetch 封装（自动记录失败请求到日志）
  const authFetch = useCallback((url, options = {}) => {
    const headers = { ...options.headers };
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
    if (!headers['Content-Type'] && options.body) headers['Content-Type'] = 'application/json';
    const method = options.method || 'GET';
    const promise = fetch(url, { ...options, headers });
    promise.catch(err => {
      appLogger.error('network', `${method} ${url} 网络错误`, err.message);
    });
    return promise;
  }, [authToken]);

  // 登录处理
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!authForm.username.trim() || !authForm.password.trim()) { setAuthError('请输入用户名和密码'); return; }
    setAuthLoading(true); setAuthError('');
    try {
      const res = await fetch(`${API_BASE}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: authForm.username.trim(), password: authForm.password }) });
      const data = await res.json();
      if (!res.ok) { setAuthError(data.error || '登录失败'); return; }
      setAuthToken(data.token); setCurrentUser({ username: data.username });
    } catch { setAuthError('网络错误，请检查服务是否启动'); }
    finally { setAuthLoading(false); }
  };

  // 注册处理
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!authForm.username.trim() || !authForm.password.trim()) { setAuthError('请输入用户名和密码'); return; }
    setAuthLoading(true); setAuthError('');
    try {
      const res = await fetch(`${API_BASE}/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: authForm.username.trim(), password: authForm.password }) });
      const data = await res.json();
      if (!res.ok) { setAuthError(data.error || '注册失败'); return; }
      setAuthToken(data.token); setCurrentUser({ username: data.username });
    } catch { setAuthError('网络错误，请检查服务是否启动'); }
    finally { setAuthLoading(false); }
  };

  // 登出
  const handleLogout = () => {
    setCurrentUser(null);
    setAuthToken(null);
    setAuthForm({ username: '', password: '' });
    setAuthError('');
    setDataLoaded(false);
  };

  // 修改密码
  const handleChangePassword = async () => {
    if (!changePasswordForm.oldPassword || !changePasswordForm.newPassword) { setAuthError('请填写完整'); return; }
    try {
      const res = await authFetch(`${API_BASE}/change-password`, { method: 'POST', body: JSON.stringify(changePasswordForm) });
      const data = await res.json();
      if (!res.ok) { setAuthError(data.error || '修改失败'); return; }
      setAuthError(''); setShowChangePassword(false); setChangePasswordForm({ oldPassword: '', newPassword: '' });
      setSuccessMessage('✅ 密码修改成功！');
    } catch { setAuthError('网络错误'); }
  };

  // 验证已有 token
  useEffect(() => {
    if (authToken) {
      fetch(`${API_BASE}/me`, { headers: { 'Authorization': `Bearer ${authToken}` } })
        .then(res => { if (!res.ok) { setCurrentUser(null); setAuthToken(null); } })
        .catch(() => { /* network error, ignore */ });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    currentUser, setCurrentUser,
    authToken, setAuthToken,
    authView, setAuthView,
    authForm, setAuthForm,
    authLoading,
    authError, setAuthError,
    showChangePassword, setShowChangePassword,
    changePasswordForm, setChangePasswordForm,
    authFetch,
    handleLogin,
    handleRegister,
    handleLogout,
    handleChangePassword,
  };
}
