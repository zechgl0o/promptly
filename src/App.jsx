import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GripVertical, Plus, Copy, Check, Trash2, Settings2, Eye, EyeOff, Save, Bookmark, X, Clock, FileUp, Database, Loader2, ServerOff, RefreshCw, CheckCircle2, RotateCcw, AlertTriangle, Download, Upload, AlignLeft, LayoutGrid, Palette, Library, FolderPlus, ChevronUp, ChevronDown, CloudOff, Sun, Moon, Languages, Settings, Minus, FileText, LogOut, User, Lock, UserPlus } from 'lucide-react';

// 生成唯一ID
const generateId = () => 'id-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();

// 定义低饱和度可选背景色 
const BG_COLORS = [
  { label: '默认背景', value: 'bg-white' },
  { label: '浅红', value: 'bg-red-100' },
  { label: '浅橙', value: 'bg-orange-100' },
  { label: '浅黄', value: 'bg-amber-100' },
  { label: '浅绿', value: 'bg-green-100' },
  { label: '浅蓝', value: 'bg-blue-100' },
  { label: '浅紫', value: 'bg-purple-100' },
  { label: '浅粉', value: 'bg-pink-100' }
];

const getColorClasses = (colorVal, isDarkMode) => {
  if (!colorVal || colorVal === 'bg-white') return isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200';
  const map = {
    'bg-red-100': isDarkMode ? 'bg-red-950/30 border-red-900/30' : 'bg-red-50 border-red-100',
    'bg-orange-100': isDarkMode ? 'bg-orange-950/30 border-orange-900/30' : 'bg-orange-50 border-orange-100',
    'bg-amber-100': isDarkMode ? 'bg-amber-950/30 border-amber-900/30' : 'bg-amber-50 border-amber-100',
    'bg-green-100': isDarkMode ? 'bg-green-950/30 border-green-900/30' : 'bg-green-50 border-green-100',
    'bg-blue-100': isDarkMode ? 'bg-blue-950/30 border-blue-900/30' : 'bg-blue-50 border-blue-100',
    'bg-purple-100': isDarkMode ? 'bg-purple-950/30 border-purple-900/30' : 'bg-purple-50 border-purple-100',
    'bg-pink-100': isDarkMode ? 'bg-pink-950/30 border-pink-900/30' : 'bg-pink-50 border-pink-100',
  };
  return map[colorVal] || (isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200');
};

const getPickerButtonClasses = (colorVal, isDarkMode) => {
  if (!colorVal || colorVal === 'bg-white') return isDarkMode ? 'bg-zinc-800 border-zinc-600' : 'bg-white border-gray-300';
  const map = {
    'bg-red-100': isDarkMode ? 'bg-red-900/60 border-red-700' : 'bg-red-100 border-red-200',
    'bg-orange-100': isDarkMode ? 'bg-orange-900/60 border-orange-700' : 'bg-orange-100 border-orange-200',
    'bg-amber-100': isDarkMode ? 'bg-amber-900/60 border-amber-700' : 'bg-amber-100 border-amber-200',
    'bg-green-100': isDarkMode ? 'bg-green-900/60 border-green-700' : 'bg-green-100 border-green-200',
    'bg-blue-100': isDarkMode ? 'bg-blue-900/60 border-blue-700' : 'bg-blue-100 border-blue-200',
    'bg-purple-100': isDarkMode ? 'bg-purple-900/60 border-purple-700' : 'bg-purple-100 border-purple-200',
    'bg-pink-100': isDarkMode ? 'bg-pink-900/60 border-pink-700' : 'bg-pink-100 border-pink-200',
  };
  return map[colorVal] || '';
};

const removeGarbage = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/[\u0336\r]/g, '');
};

const cleanDataForStorage = (inputsData) => {
  return inputsData.map(i => ({
    id: i.id || generateId(),
    text: i.text || '',
    title: i.title || '',
    isActive: i.isActive !== false,
    isTextMode: i.isTextMode || false,
    color: i.color || 'bg-white',
    isCollapsed: i.isCollapsed || false,
    showTitle: i.showTitle || false,
    lang: i.lang || 'zh', 
    tags: (i.tags || []).map(t => ({
      id: t.id,
      text: t.text || '',
      rawText: t.rawText || '',
      delimiter: t.delimiter || '',
      isActive: t.isActive !== false
    }))
  }));
};

const parseTextToTags = (text) => {
  const cleanText = removeGarbage(text);
  const tokens = cleanText.split(/([,，。\n]+)/);
  const tags = [];
  let pendingPrefix = '';
  for (let i = 0; i < tokens.length; i += 2) {
    const chunk = tokens[i];
    const delim = tokens[i + 1] || '';
    if (chunk.trim().length > 0) {
      let coreText = chunk.trim();
      let isActive = true;
      const strikeMatch = coreText.match(/^~~([\s\S]*)~~$/);
      if (strikeMatch) {
        isActive = false;
        coreText = strikeMatch[1];
      }
      tags.push({
        id: generateId() + '-' + Math.random().toString(36).substr(2, 5),
        text: coreText,
        rawText: pendingPrefix + chunk,
        delimiter: delim,
        isActive: isActive
      });
      pendingPrefix = '';
    } else {
      pendingPrefix += chunk + delim;
    }
  }
  if (pendingPrefix && tags.length > 0) {
    tags[tags.length - 1].delimiter += pendingPrefix;
  }
  return tags;
};

const syncTextFromTags = (tags) => {
  return tags.map((t, i) => {
    let s = removeGarbage(t.rawText !== undefined ? t.rawText : t.text);
    const match = s.match(/(^\s*)~~([\s\S]*?)~~(\s*$)/);
    const hasStrike = !!match;

    if (t.isActive && hasStrike) {
      s = s.replace(/(^\s*)~~([\s\S]*?)~~(\s*$)/, '$1$2$3');
    } else if (!t.isActive && !hasStrike) {
      const trimMatch = s.match(/(^\s*)([\s\S]*?)(\s*$)/);
      if (trimMatch) {
         s = `${trimMatch[1]}~~${trimMatch[2]}~~${trimMatch[3]}`;
      }
    }
    let d = t.delimiter !== undefined ? t.delimiter : (i < tags.length - 1 ? ', ' : '');
    return s + d;
  }).join('');
};

const sanitizeInputs = (loadedInputs) => {
  return loadedInputs.map(input => {
    const isTextMode = input.isTextMode || false;
    const color = input.color || 'bg-white';
    const isCollapsed = input.isCollapsed || false;
    const showTitle = input.showTitle || false;
    const lang = input.lang || 'zh';
    
    if (input.tags && Array.isArray(input.tags)) {
      const cleanTags = input.tags.map(t => ({
        ...t,
        text: removeGarbage(t.text),
        rawText: removeGarbage(t.rawText)
      }));
      return { ...input, tags: cleanTags, text: removeGarbage(input.text), isTextMode, color, isCollapsed, showTitle, lang, zhCache: null, enCache: null };
    }
    
    const tags = parseTextToTags(input.text);
    return { ...input, tags, text: removeGarbage(input.text), isTextMode, color, isCollapsed, showTitle, lang, zhCache: null, enCache: null };
  });
};

const migrateTransConfig = (config) => {
  if (!config) return { activeProvider: 'google', customApis: [] };
  if (config.provider) { 
    const oldCustomApi = (config.apiBase || config.apiKey || config.modelName) ? {
      id: generateId(), name: '自定义大模型 1', apiBase: config.apiBase || '', apiKey: config.apiKey || '', modelName: config.modelName || ''
    } : null;
    return {
      activeProvider: config.provider === 'google' ? 'google' : (oldCustomApi ? oldCustomApi.id : 'google'),
      customApis: oldCustomApi ? [oldCustomApi] : []
    };
  }
  return config;
};

// ================= 生成默认工作区 =================
const createDefaultWorkspace = (nameIndex) => ({
  id: generateId(),
  name: `工作区 ${nameIndex}`,
  inputs: [
    { id: generateId(), text: '', title: '片段 1', isActive: true, tags: [], isTextMode: false, color: 'bg-white', isCollapsed: false, showTitle: false, lang: 'zh' },
    { id: generateId(), text: '', title: '片段 2', isActive: true, tags: [], isTextMode: false, color: 'bg-white', isCollapsed: false, showTitle: false, lang: 'zh' }
  ],
  separator: '\\n\\n',
  isDirty: false
});

// ================= 常量 =================
const API_BASE = '/api';

export default function App() {
  // ---------------- 认证状态管理 ----------------
  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('prompt_builder_user');
      if (saved) return JSON.parse(saved);
    }
    return null;
  });
  const [authToken, setAuthToken] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('prompt_builder_token') : null;
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
      localStorage.setItem('prompt_builder_user', JSON.stringify(currentUser));
      localStorage.setItem('prompt_builder_token', authToken);
    } else {
      localStorage.removeItem('prompt_builder_user');
      localStorage.removeItem('prompt_builder_token');
    }
  }, [currentUser, authToken]);

  // 带 Token 的 fetch 封装
  const authFetch = useCallback((url, options = {}) => {
    const headers = { ...options.headers };
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
    if (!headers['Content-Type'] && options.body) headers['Content-Type'] = 'application/json';
    return fetch(url, { ...options, headers });
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
  const handleLogout = () => { setCurrentUser(null); setAuthToken(null); setAuthForm({ username: '', password: '' }); setAuthError(''); setDataLoaded(false); };

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
        .catch(() => {});
    }
  }, []);

  // ---------------- 主题状态管理 ----------------
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('prompt_builder_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) { document.documentElement.classList.add('dark'); localStorage.setItem('prompt_builder_theme', 'dark'); } 
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('prompt_builder_theme', 'light'); }
  }, [isDarkMode]);

  // ---------------- 翻译配置管理 ----------------
  const [transConfig, setTransConfig] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('prompt_builder_trans_config');
      if (saved) return migrateTransConfig(JSON.parse(saved));
    }
    return { activeProvider: 'google', customApis: [] };
  });

  useEffect(() => { localStorage.setItem('prompt_builder_trans_config', JSON.stringify(transConfig)); }, [transConfig]);

  const [expandedApiId, setExpandedApiId] = useState(null);
  const [confirmDeleteApiId, setConfirmDeleteApiId] = useState(null);

  // ---------------- 全局与工作区状态管理 ----------------
  const [syncStatus, setSyncStatus] = useState('synced');
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // 多标签页核心状态
  const [workspaces, setWorkspaces] = useState([createDefaultWorkspace(1)]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(workspaces[0].id);
  const [editingWorkspaceId, setEditingWorkspaceId] = useState(null); 
  const [pendingCloseTabId, setPendingCloseTabId] = useState(null); 
  const [isCloseWarningOpen, setIsCloseWarningOpen] = useState(false);
  const [draggedTabId, setDraggedTabId] = useState(null);

  const [savedPrompts, setSavedPrompts] = useState([]);
  const [presets, setPresets] = useState([]);

  // UI 交互状态
  const [draggedId, setDraggedId] = useState(null);
  const [dragEnabledId, setDragEnabledId] = useState(null);
  const [editingTitleId, setEditingTitleId] = useState(null);
  const [editingSavedTitleId, setEditingSavedTitleId] = useState(null); 
  const [editingPresetTitleId, setEditingPresetTitleId] = useState(null); 
  const [copied, setCopied] = useState(false);
  const [copiedDrawerId, setCopiedDrawerId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isPresetDrawerOpen, setIsPresetDrawerOpen] = useState(false); 
  const [isExportModalOpen, setIsExportModalOpen] = useState(false); 
  const [isTransConfigModalOpen, setIsTransConfigModalOpen] = useState(false); 
  const [exportOptions, setExportOptions] = useState({ workspaces: true, snapshots: true, presets: true, settings: true });
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false); 
  const [saveTitle, setSaveTitle] = useState('');
  const [activeColorPickerId, setActiveColorPickerId] = useState(null);
  const [savedCollapseState, setSavedCollapseState] = useState(null);
  
  const [draggedTagId, setDraggedTagId] = useState(null);
  const [dragOverInputId, setDragOverInputId] = useState(null); 
  const [editingTagId, setEditingTagId] = useState(null);
  const clickTimeoutRef = useRef(null);

  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [conflictTarget, setConflictTarget] = useState(null);
  const saveInputRef = useRef(null);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // ---------------- 提取当前活跃工作区的属性 ----------------
  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0];
  const inputs = activeWorkspace.inputs;
  const separator = activeWorkspace.separator;

  const setInputs = (payload) => {
    setWorkspaces(prevWorkspaces => prevWorkspaces.map(w => {
      if (w.id === activeWorkspaceId) {
        const nextInputs = typeof payload === 'function' ? payload(w.inputs) : payload;
        return { ...w, inputs: nextInputs, isDirty: true };
      }
      return w;
    }));
  };
  
  const setSeparator = (payload) => {
    setWorkspaces(prevWorkspaces => prevWorkspaces.map(w => {
      if (w.id === activeWorkspaceId) {
        const nextSeparator = typeof payload === 'function' ? payload(w.separator) : payload;
        return { ...w, separator: nextSeparator, isDirty: true };
      }
      return w;
    }));
  };

  useEffect(() => {
    if (errorMessage) { const timer = setTimeout(() => setErrorMessage(''), 5000); return () => clearTimeout(timer); }
  }, [errorMessage]);

  useEffect(() => {
    if (successMessage) { const timer = setTimeout(() => setSuccessMessage(''), 4000); return () => clearTimeout(timer); }
  }, [successMessage]);

  // 1. 初始化数据加载
  useEffect(() => {
    let isMounted = true;

    const processLoadedWorkspace = (data) => {
      if (data.workspace) {
        if (data.workspace.workspaces && data.workspace.workspaces.length > 0) {
          setWorkspaces(data.workspace.workspaces.map(w => ({ ...w, inputs: sanitizeInputs(w.inputs), isDirty: false })));
          if (data.workspace.activeWorkspaceId) setActiveWorkspaceId(data.workspace.activeWorkspaceId);
        } else if (data.workspace.inputs) {
          const migrated = { ...createDefaultWorkspace(1), inputs: sanitizeInputs(data.workspace.inputs), separator: data.workspace.separator || '\\n\\n', isDirty: false };
          setWorkspaces([migrated]);
          setActiveWorkspaceId(migrated.id);
        }
      }
    };

    const loadLocalData = async () => {
      try {
        const res = await authFetch(`${API_BASE}/data`);
        if (res.ok) {
          const data = await res.json();
          processLoadedWorkspace(data);
          if (data.savedPrompts) setSavedPrompts(data.savedPrompts);
          if (data.presets) setPresets(data.presets);
        } else if (res.status === 401) {
          setCurrentUser(null); setAuthToken(null);
        }
      } catch (e) { console.warn("无法连接到后端服务，将使用初始状态。"); } 
      finally { if (isMounted) setDataLoaded(true); }
    };
    loadLocalData();

    return () => { isMounted = false; };
  }, []);

  // 2. 更新活跃工作区的完整数据（用于加载快照等）
  const updateActiveWorkspace = ({ inputs: newInputs, separator: newSeparator, name, isDirty }) => {
    setWorkspaces(prevWorkspaces => prevWorkspaces.map(w => {
      if (w.id === activeWorkspaceId) {
        return { ...w, inputs: sanitizeInputs(newInputs), separator: newSeparator, name: name || w.name, isDirty: isDirty !== undefined ? isDirty : true };
      }
      return w;
    }));
  };

  // 3. 自动同步工作区到后端
  useEffect(() => {
    if (!dataLoaded) return;

    setSyncStatus('syncing');
    const timer = setTimeout(async () => {
      try {
        const cleanPayload = { 
          workspaces: workspaces.map(w => ({ ...w, inputs: cleanDataForStorage(w.inputs) })), 
          activeWorkspaceId 
        };
        const res = await authFetch(`${API_BASE}/workspace`, { method: 'POST', body: JSON.stringify(cleanPayload) });
        if (!res.ok) throw new Error("Sync failed");
        setSyncStatus('synced');
      } catch (e) { setSyncStatus('error'); }
    }, 1000);
    return () => clearTimeout(timer);
  }, [workspaces, activeWorkspaceId, dataLoaded]);

  // ---------------- 多标签页管理逻辑 ----------------
  const handleAddTab = () => {
    if (workspaces.length >= 5) return;
    const newId = generateId();
    const newWs = { ...createDefaultWorkspace(workspaces.length + 1), id: newId };
    setWorkspaces(prev => [...prev, newWs]);
    setActiveWorkspaceId(newId);
  };

  const executeCloseTab = (id) => {
    const newWorkspaces = workspaces.filter(w => w.id !== id);
    if (newWorkspaces.length === 0) {
      const fallbackWs = createDefaultWorkspace(1);
      setWorkspaces([fallbackWs]);
      setActiveWorkspaceId(fallbackWs.id);
    } else {
      setWorkspaces(newWorkspaces);
      if (activeWorkspaceId === id) setActiveWorkspaceId(newWorkspaces[newWorkspaces.length - 1].id);
    }
    setPendingCloseTabId(null);
  };

  const handleCloseTabClick = (id) => {
    const ws = workspaces.find(w => w.id === id);
    if (!ws) return;
    const isEmpty = ws.inputs.every(i => (i.isTextMode ? !i.text.trim() : (!i.tags || i.tags.length === 0)));
    
    if (ws.isDirty && !isEmpty) {
      setPendingCloseTabId(id);
      setIsCloseWarningOpen(true);
    } else {
      executeCloseTab(id);
    }
  };

  const handleWorkspaceNameChange = (id, newName) => {
    setWorkspaces(prev => prev.map(w => w.id === id ? { ...w, name: newName } : w));
  };

  // ---------------- 智能缓存清理 ----------------
  const invalidateCache = (input) => ({ ...input, zhCache: input.lang === 'en' ? null : input.zhCache, enCache: input.lang === 'zh' ? null : input.enCache });

  // ---------------- 翻译 API 设置操作逻辑 ----------------
  const handleAddCustomApi = () => {
    const newApi = { id: generateId(), name: `接口 ${transConfig.customApis.length + 1}`, apiBase: '', apiKey: '', modelName: '' };
    setTransConfig(prev => ({ ...prev, customApis: [...prev.customApis, newApi], activeProvider: newApi.id }));
    setExpandedApiId(newApi.id);
  };

  const handleUpdateCustomApi = (id, field, value) => {
    setTransConfig(prev => ({ ...prev, customApis: prev.customApis.map(api => api.id === id ? { ...api, [field]: value } : api) }));
  };

  const handleDeleteCustomApi = (id) => {
    setTransConfig(prev => {
      const newApis = prev.customApis.filter(api => api.id !== id);
      return { ...prev, customApis: newApis, activeProvider: prev.activeProvider === id ? 'google' : prev.activeProvider };
    });
    setConfirmDeleteApiId(null);
  };

  const toggleExpandApi = (id) => {
    if (expandedApiId === id) setExpandedApiId(null);
    else { setExpandedApiId(id); setConfirmDeleteApiId(null); }
  };

  const handleSaveTransConfig = () => {
    if (transConfig.activeProvider !== 'google') {
      const activeApi = transConfig.customApis.find(a => a.id === transConfig.activeProvider);
      if (!activeApi || !activeApi.apiBase.trim() || !activeApi.apiKey.trim() || !activeApi.modelName.trim() || !activeApi.name.trim()) {
        setErrorMessage('您当前选中的接口配置不完整，请展开填写补充，或切换至 Google 直连');
        return;
      }
    }
    setIsTransConfigModalOpen(false);
    setExpandedApiId(null);
    setConfirmDeleteApiId(null);
    setSuccessMessage('✅ 翻译设置已保存');
  };

  // ---------------- 翻译核心逻辑 ----------------
  const handleTranslateToggle = async (id) => {
    const inputIndex = inputs.findIndex(i => i.id === id);
    const input = inputs[inputIndex];
    
    if (input.lang === 'en') {
      if (input.zhCache) setInputs(prev => prev.map(i => i.id === id ? { ...i, lang: 'zh', enCache: { text: i.text, tags: i.tags }, text: i.zhCache.text, tags: i.zhCache.tags } : i));
      return;
    }
    if (input.enCache) {
      setInputs(prev => prev.map(i => i.id === id ? { ...i, lang: 'en', zhCache: { text: i.text, tags: i.tags }, text: i.enCache.text, tags: i.enCache.tags } : i));
      return;
    }

    setInputs(prev => prev.map(i => i.id === id ? { ...i, isTranslating: true } : i));
    try {
      const textToTranslate = input.isTextMode ? input.text : syncTextFromTags(input.tags || []);
      let translatedStr = '';
      
      if (transConfig.activeProvider === 'google') {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(textToTranslate)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Google接口限制或网络异常');
        const data = await res.json();
        translatedStr = data[0].map(x => x[0]).join('');
      } else {
        const activeApi = transConfig.customApis.find(a => a.id === transConfig.activeProvider);
        if (!activeApi) throw new Error('未找到选中的自定义接口，请前往设置重新配置');
        const res = await fetch(`${activeApi.apiBase.replace(/\/$/, '')}/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${activeApi.apiKey}` },
          body: JSON.stringify({ model: activeApi.modelName, messages: [{ role: 'system', content: 'You are a professional prompt translator. Translate the given prompt to English. Keep all prompt weights (e.g. (word:1.2)), brackets, and special punctuation intact. Output ONLY the translation result without any quotes or additional explanations.' }, { role: 'user', content: textToTranslate }] })
        });
        if (!res.ok) throw new Error('大模型 API 请求失败，请检查 URL 或 Key 是否正确');
        const data = await res.json();
        translatedStr = data.choices[0].message.content.trim();
      }

      setInputs(prev => prev.map(i => {
        if (i.id !== id) return i;
        return { ...i, isTranslating: false, lang: 'en', zhCache: { text: i.text, tags: i.tags }, text: translatedStr, tags: parseTextToTags(translatedStr) };
      }));
    } catch (err) {
      setErrorMessage('翻译失败: ' + err.message);
      setInputs(prev => prev.map(i => i.id === id ? { ...i, isTranslating: false } : i));
    }
  };

  // ---------------- 预设库操作逻辑 ----------------
  const saveToPresets = async (input) => {
    const presetId = generateId();
    const presetData = cleanDataForStorage([{
      id: presetId, title: input.title || '未命名预设', text: input.text || '', tags: input.tags || [],
      isTextMode: input.isTextMode || false, color: input.color || 'bg-white', isCollapsed: false, showTitle: input.showTitle || false, lang: input.lang || 'zh'
    }])[0];
    presetData.timestamp = Date.now();

    try {
      const newList = [presetData, ...presets];
      setPresets(newList);
      await authFetch(`${API_BASE}/presets`, { method: 'POST', body: JSON.stringify(newList) });
      setSuccessMessage(`✅ 成功存入预设库: ${presetData.title}`);
    } catch (e) { setErrorMessage("保存预设失败"); }
  };

  const insertPreset = (preset) => {
    setInputs(prev => [...prev, {
      id: generateId(), title: preset.title || '预设片段', text: preset.text || '', tags: (preset.tags || []).map(t => ({ ...t, id: generateId() })), 
      isTextMode: preset.isTextMode || false, color: preset.color || 'bg-white', isActive: true, isCollapsed: false, showTitle: preset.showTitle || false, lang: preset.lang || 'zh', zhCache: null, enCache: null
    }]);
    setSuccessMessage(`✅ 已追加预设片段: ${preset.title}`);
  };

  const deletePreset = async (id) => {
    try {
      const newList = presets.filter(p => p.id !== id);
      setPresets(newList);
      await authFetch(`${API_BASE}/presets`, { method: 'POST', body: JSON.stringify(newList) });
    } catch (e) {}
  };

  const updatePresetTitle = async (id, newTitle) => {
    if (!newTitle.trim()) return setEditingPresetTitleId(null);
    try {
      const newList = presets.map(p => p.id === id ? {...p, title: newTitle} : p);
      setPresets(newList);
      await authFetch(`${API_BASE}/presets`, { method: 'POST', body: JSON.stringify(newList) });
      setEditingPresetTitleId(null);
    } catch (e) {}
  };

  // ---------------- 提示词标签拖拽交互逻辑 ----------------
  const handleTagDragStart = (e, inputId, tagId) => { e.stopPropagation(); setDraggedTagId({ inputId, tagId }); if (e.dataTransfer) { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", tagId); } };
  const handleTagDragOver = (e, targetInputId, targetTagId = null) => {
    e.preventDefault(); e.stopPropagation();
    if (!draggedTagId) return;
    const { inputId: sourceInputId, tagId: draggedId } = draggedTagId;
    if (sourceInputId !== targetInputId) { if (dragOverInputId !== targetInputId) setDragOverInputId(targetInputId); return; }
    if (draggedId === targetTagId || targetTagId === null) return;

    setInputs(prev => {
      const inputIndex = prev.findIndex(i => i.id === sourceInputId);
      if (inputIndex === -1) return prev;
      const input = prev[inputIndex];
      const draggedTagIndex = input.tags.findIndex(t => t.id === draggedId);
      const targetTagIndex = input.tags.findIndex(t => t.id === targetTagId);
      if (draggedTagIndex === -1 || targetTagIndex === -1) return prev;
      const newTags = [...input.tags];
      const [draggedTag] = newTags.splice(draggedTagIndex, 1);
      newTags.splice(targetTagIndex, 0, draggedTag);
      const newInputs = [...prev];
      newInputs[inputIndex] = invalidateCache({ ...input, tags: newTags, text: syncTextFromTags(newTags) });
      return newInputs;
    });
  };
  const handleTagDragLeave = (e, targetInputId) => { e.stopPropagation(); if (dragOverInputId === targetInputId) setDragOverInputId(null); };
  const handleTagDrop = (e, targetInputId, targetTagId = null) => {
    e.preventDefault(); e.stopPropagation(); setDragOverInputId(null);
    if (!draggedTagId) return;
    const { inputId: sourceInputId, tagId: draggedId } = draggedTagId;
    if (sourceInputId === targetInputId) { setDraggedTagId(null); return; }

    setInputs(prev => {
      const sourceIndex = prev.findIndex(i => i.id === sourceInputId);
      const targetIndex = prev.findIndex(i => i.id === targetInputId);
      if (sourceIndex === -1 || targetIndex === -1) return prev;
      const sourceInput = prev[sourceIndex];
      const targetInput = prev[targetIndex];
      if (sourceInput.isTextMode || targetInput.isTextMode) return prev;
      const draggedTagIndex = sourceInput.tags.findIndex(t => t.id === draggedId);
      if (draggedTagIndex === -1) return prev;
      const draggedTag = sourceInput.tags[draggedTagIndex];
      const newSourceTags = [...sourceInput.tags];
      newSourceTags.splice(draggedTagIndex, 1);
      const newTargetTags = [...(targetInput.tags || [])];
      if (targetTagId !== null) {
        const targetTagIndex = newTargetTags.findIndex(t => t.id === targetTagId);
        newTargetTags.splice(targetTagIndex === -1 ? newTargetTags.length : targetTagIndex, 0, draggedTag);
      } else newTargetTags.push(draggedTag);

      const newInputs = [...prev];
      newInputs[sourceIndex] = invalidateCache({ ...sourceInput, tags: newSourceTags, text: syncTextFromTags(newSourceTags) });
      newInputs[targetIndex] = invalidateCache({ ...targetInput, tags: newTargetTags, text: syncTextFromTags(newTargetTags) });
      return newInputs;
    });
    setDraggedTagId(null);
  };
  const handleTagDragEnd = (e) => { e.stopPropagation(); setDraggedTagId(null); setDragOverInputId(null); };

  // ---------------- 文本输入与编辑交互逻辑 ----------------
  const addTagsFromText = (inputId, text, appendedDelimiter = '') => {
    const textToParse = text + appendedDelimiter;
    if (!textToParse.trim() && !appendedDelimiter.match(/[\r\n]/)) return; 
    setInputs(prev => prev.map(input => {
      if (input.id !== inputId) return input;
      let newTags = [...(input.tags || [])];
      if (!text.trim() && appendedDelimiter) {
          if (newTags.length > 0) newTags[newTags.length - 1].delimiter += appendedDelimiter;
          return invalidateCache({ ...input, tags: newTags, text: syncTextFromTags(newTags) });
      }
      const parsedTags = parseTextToTags(textToParse);
      if (parsedTags.length > 0) {
          if (newTags.length > 0) {
              const lastTag = newTags[newTags.length - 1];
              if (!lastTag.delimiter || !lastTag.delimiter.match(/[,，。\r\n]/)) lastTag.delimiter = (lastTag.delimiter || '') + ', ';
          }
          newTags.push(...parsedTags);
      } else if (textToParse.trim() === '' && newTags.length > 0) newTags[newTags.length - 1].delimiter += textToParse;
      return invalidateCache({ ...input, tags: newTags, text: syncTextFromTags(newTags) });
    }));
  };

  const handleTagInputKeyDown = (e, inputId) => {
    if (e.key === 'Enter') { e.preventDefault(); addTagsFromText(inputId, e.target.value, ''); e.target.value = ''; } 
    else if (e.key === ',' || e.key === '，' || e.key === '。') { e.preventDefault(); addTagsFromText(inputId, e.target.value, e.key === '。' ? '。' : ','); e.target.value = ''; } 
    else if (e.key === 'Backspace' && e.target.value === '') {
      setInputs(prev => prev.map(input => {
        if (input.id !== inputId || !input.tags || input.tags.length === 0) return input;
        return invalidateCache({ ...input, tags: input.tags.slice(0, -1), text: syncTextFromTags(input.tags.slice(0, -1)) });
      }));
    }
  };

  const handleTagInputPaste = (e, inputId) => { e.preventDefault(); addTagsFromText(inputId, e.clipboardData.getData('text')); };
  const handleTagInputBlur = (e, inputId) => { if (e.target.value.trim()) { addTagsFromText(inputId, e.target.value); e.target.value = ''; } };

  const toggleTagActive = (inputId, tagId) => {
    setInputs(prev => prev.map(input => {
      if (input.id !== inputId) return input;
      const newTags = (input.tags || []).map(t => t.id === tagId ? { ...t, isActive: !t.isActive } : t);
      return invalidateCache({ ...input, tags: newTags, text: syncTextFromTags(newTags) });
    }));
  };

  const removeTag = (inputId, tagId) => {
    setInputs(prev => prev.map(input => {
      if (input.id !== inputId) return input;
      return invalidateCache({ ...input, tags: (input.tags || []).filter(t => t.id !== tagId), text: syncTextFromTags((input.tags || []).filter(t => t.id !== tagId)) });
    }));
  };

  const handleTagClick = (e, inputId, tagId) => {
    e.stopPropagation(); clearTimeout(clickTimeoutRef.current);
    if (e.detail === 1) clickTimeoutRef.current = setTimeout(() => { setEditingTagId(tagId); }, 250);
    else if (e.detail === 2) toggleTagActive(inputId, tagId);
  };

  const handleTagEditComplete = (inputId, tagId, newText) => {
    setEditingTagId(null);
    const trimmed = removeGarbage(newText).trim();
    if (!trimmed) { removeTag(inputId, tagId); return; }
    setInputs(prev => prev.map(input => {
      if (input.id !== inputId) return input;
      const newTags = input.tags.map(t => {
        if (t.id === tagId && t.text !== trimmed) return { ...t, text: trimmed, rawText: t.rawText ? t.rawText.replace(t.text, trimmed) : trimmed };
        return t;
      });
      return invalidateCache({ ...input, tags: newTags, text: syncTextFromTags(newTags) });
    }));
  };

  const toggleInputMode = (id) => {
    setInputs(prev => prev.map(input => {
      if (input.id !== id) return input;
      const newIsTextMode = !input.isTextMode;
      let newTags = input.tags || [];
      let newText = input.text || '';
      if (!newIsTextMode) { newTags = parseTextToTags(newText); newText = syncTextFromTags(newTags); } 
      else newText = syncTextFromTags(newTags);
      return { ...input, isTextMode: newIsTextMode, tags: newTags, text: newText };
    }));
  };

  const isAllCollapsed = inputs.length > 0 && inputs.every(i => i.isCollapsed);
  const toggleAllCollapse = () => {
    if (isAllCollapsed) {
      if (savedCollapseState) { 
        setInputs(prev => prev.map(i => ({ ...i, isCollapsed: savedCollapseState[i.id] !== undefined ? savedCollapseState[i.id] : false }))); 
        setSavedCollapseState(null); 
      } 
      else setInputs(prev => prev.map(i => ({ ...i, isCollapsed: false })));
    } else {
      const currentState = {}; inputs.forEach(i => { currentState[i.id] = i.isCollapsed || false; });
      setSavedCollapseState(currentState);
      setInputs(prev => prev.map(i => ({ ...i, isCollapsed: true })));
    }
  };

  const generateOutput = () => {
    const actualSeparator = (separator || '\\n\\n').replace(/\\n/g, '\n');
    return (inputs || []).filter(input => input.isActive !== false).map(input => {
        const tempTags = input.isTextMode ? parseTextToTags(input.text || '') : (input.tags || []);
        let joined = tempTags.filter(t => t.isActive !== false).map((t, idx, arr) => {
           let s = removeGarbage(t.rawText !== undefined ? t.rawText : t.text).replace(/(^\s*)~~([\s\S]*?)~~(\s*$)/, '$1$2$3'); 
           if (idx === 0) s = s.trimStart(); 
           let d = t.delimiter !== undefined ? t.delimiter : (idx < arr.length - 1 ? ', ' : '');
           if (idx === arr.length - 1) d = d.replace(/[,，。\r\n\s]+$/, '');
           return s + d;
        }).join('').trim();

        if (joined.length > 0 && input.showTitle) {
           const originalIndex = inputs.indexOf(input) + 1;
           joined = `${input.title || `片段 ${originalIndex}`}\n${joined}`;
        }
        return joined;
      }).filter(text => text.length > 0).join(actualSeparator);
  };
  const outputText = generateOutput();

  const addInput = () => setInputs(prev => [...prev, { id: generateId(), text: '', title: `片段 ${prev.length + 1}`, isActive: true, tags: [], isTextMode: false, color: 'bg-white', isCollapsed: false, showTitle: false, lang: 'zh' }]);
  const removeInput = (id) => { setInputs(prev => prev.length > 1 ? prev.filter(i => i.id !== id) : prev); };
  const handleTitleChange = (id, newTitle) => setInputs(prev => prev.map(i => i.id === id ? { ...i, title: newTitle } : i));
  const handleTextChange = (id, text) => setInputs(prev => prev.map(i => i.id === id ? invalidateCache({ ...i, text: removeGarbage(text) }) : i));
  const toggleActive = (id) => setInputs(prev => prev.map(i => i.id === id ? { ...i, isActive: !i.isActive } : i));
  const toggleCollapse = (id) => setInputs(prev => prev.map(i => i.id === id ? { ...i, isCollapsed: !i.isCollapsed } : i));
  const toggleShowTitle = (id) => setInputs(prev => prev.map(i => i.id === id ? { ...i, showTitle: !i.showTitle } : i));
  const changeInputColor = (id, newColor, closePicker = true) => { setInputs(prev => prev.map(i => i.id === id ? { ...i, color: newColor } : i)); if (closePicker) setActiveColorPickerId(null); };
  
  const confirmReset = () => {
    setInputs([
      { id: generateId(), text: '', title: '片段 1', isActive: true, tags: [], isTextMode: false, color: 'bg-white', isCollapsed: false, showTitle: false, lang: 'zh' },
      { id: generateId(), text: '', title: '片段 2', isActive: true, tags: [], isTextMode: false, color: 'bg-white', isCollapsed: false, showTitle: false, lang: 'zh' }
    ]);
    setSeparator('\\n\\n'); setIsResetModalOpen(false);
  };

  const isInputEmpty = (input) => input.isTextMode ? (!input.text || input.text.trim() === '') : (!input.tags || input.tags.length === 0);

  // ================= 导入导出与保存 =================
  const handleExportClick = () => {
    setIsExportModalOpen(true);
  };

  const adjustSaveTitleNumber = (delta) => {
    let title = saveTitle.trim() || activeWorkspace.name || "快照";
    const match = title.match(/^(.*?)(\s*)(\d+)$/);
    if (match) {
        let num = parseInt(match[3], 10) + delta;
        if (num < 1) {
            setSaveTitle(match[1].trim());
        } else {
            setSaveTitle(`${match[1]}${match[2]}${num}`);
        }
    } else if (delta > 0) {
        setSaveTitle(`${title} 1`);
    }
  };

  const hasSaveTitleNumber = /^(.*?)(\s*)(\d+)$/.test(saveTitle.trim());

  const handleSaveClick = () => {
    setSaveTitle(activeWorkspace.name || `快照-${new Date().toLocaleDateString()}`);
    setIsSaveModalOpen(true);
    setTimeout(() => saveInputRef.current?.focus(), 100);
  };

  const handlePreSave = () => {
    const finalTitle = saveTitle.trim() || `快照-${new Date().toLocaleDateString()}`;
    if (savedPrompts.find(p => p.title === finalTitle)) { setConflictTarget(savedPrompts.find(p => p.title === finalTitle)); setIsConflictModalOpen(true); } 
    else executeSave(finalTitle);
  };

  const executeSave = async (finalTitle, overwriteId = null) => {
    const snapshotId = overwriteId || generateId();
    const newSnapshot = { id: snapshotId, title: finalTitle, inputs: cleanDataForStorage(inputs), separator: separator || '\\n\\n', timestamp: Date.now() };
    setIsConflictModalOpen(false); setIsSaveModalOpen(false); setIsDrawerOpen(true);
    
    setWorkspaces(prev => prev.map(w => w.id === activeWorkspaceId ? { ...w, isDirty: false, name: finalTitle } : w));
    if (pendingCloseTabId) { executeCloseTab(pendingCloseTabId); setPendingCloseTabId(null); }

    try {
      const newList = [newSnapshot, ...savedPrompts.filter(p => p.id !== overwriteId)];
      setSavedPrompts(newList);
      await authFetch(`${API_BASE}/saved`, { method: 'POST', body: JSON.stringify(newList) });
    } catch (e) { console.error("保存快照失败", e); }
  };

  const handleOverwrite = () => executeSave(conflictTarget.title, conflictTarget.id);
  const handleAutoRename = () => {
    let newTitle = getAutoRenamedTitle(conflictTarget.title);
    while (savedPrompts.some(p => p.title === newTitle)) newTitle = getAutoRenamedTitle(newTitle);
    executeSave(newTitle);
  };
  const getAutoRenamedTitle = (title) => {
    const match = title.match(/(.*?)(\D?)(\d+)$/);
    if (match) return `${match[1]}${match[2]}${parseInt(match[3], 10) + 1}`;
    return `${title}-1`;
  };
  const handleCancelConflict = () => { setIsConflictModalOpen(false); setTimeout(() => { saveInputRef.current?.focus(); }, 50); };

  const deleteSnapshot = async (id) => {
    try { 
      const newList = savedPrompts.filter(p => p.id !== id);
      setSavedPrompts(newList);
      await authFetch(`${API_BASE}/saved`, { method: 'POST', body: JSON.stringify(newList) });
    } catch (e) {}
  };

  const updateSavedTitle = async (id, newTitle) => {
    if (!newTitle.trim()) return setEditingSavedTitleId(null);
    try {
      const newList = savedPrompts.map(p => p.id === id ? { ...p, title: newTitle } : p);
      setSavedPrompts(newList);
      await authFetch(`${API_BASE}/saved`, { method: 'POST', body: JSON.stringify(newList) });
      setEditingSavedTitleId(null);
    } catch (e) { console.error("重命名失败", e); }
  };

  const confirmExport = () => {
    if (!exportOptions.workspaces && !exportOptions.snapshots && !exportOptions.presets && !exportOptions.settings) return setErrorMessage('请至少选择一项导出内容');
    const exportData = { type: 'prompt_builder_export_v2', version: 2, timestamp: Date.now() };
    let hasData = false;
    
    if (exportOptions.workspaces && workspaces.length > 0) { exportData.workspaces = workspaces; hasData = true; }
    if (exportOptions.snapshots && savedPrompts.length > 0) { exportData.snapshots = savedPrompts; hasData = true; }
    if (exportOptions.presets && presets.length > 0) { exportData.presets = presets; hasData = true; }
    if (exportOptions.settings) { exportData.settings = { transConfig }; hasData = true; }
    
    if (!hasData) return setErrorMessage('没有可导出的数据，请检查所选项是否为空');

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `Prompt_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    setIsExportModalOpen(false);
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        let importCount = 0; let importedSettings = false; let importedWorkspacesCount = 0;

        if (Array.isArray(importedData)) { setSavedPrompts([...importedData, ...savedPrompts]); importCount = importedData.length; } 
        else if (importedData.type === 'prompt_builder_export_v2') {
          if (importedData.workspaces && Array.isArray(importedData.workspaces)) {
            const newWsList = importedData.workspaces.map(w => ({ ...w, id: generateId(), isDirty: false }));
            setWorkspaces(prev => [...prev, ...newWsList]);
            setActiveWorkspaceId(newWsList[0].id);
            importedWorkspacesCount = newWsList.length;
          }
          if (importedData.snapshots) { setSavedPrompts([...importedData.snapshots, ...savedPrompts]); importCount += importedData.snapshots.length; }
          if (importedData.presets) { setPresets([...importedData.presets, ...presets]); importCount += importedData.presets.length; }
          if (importedData.settings && importedData.settings.transConfig) { setTransConfig(migrateTransConfig(importedData.settings.transConfig)); importedSettings = true; }
        }
        setSuccessMessage(`✅ 成功导入 ${importedWorkspacesCount > 0 ? importedWorkspacesCount + '个工作区, ' : ''}${importCount}条片段${importedSettings ? '及应用配置' : ''}！`);
      } catch (err) { setErrorMessage('导入失败: ' + err.message); }
    };
    reader.readAsText(file); e.target.value = null; 
  };

  const executeCopy = (text, id = null) => {
    if (!text) return;
    const textArea = document.createElement("textarea"); textArea.value = text; textArea.style.position = "fixed"; textArea.style.left = "-9999px";
    document.body.appendChild(textArea); textArea.focus(); textArea.select();
    try { document.execCommand('copy'); if (id) { setCopiedDrawerId(id); setTimeout(() => setCopiedDrawerId(null), 2000); } else { setCopied(true); setTimeout(() => setCopied(false), 2000); } } catch (err) {}
    textArea.remove();
  };

  const handleDragStart = (e, id) => { setDraggedId(id); if (e.dataTransfer) e.dataTransfer.effectAllowed = "move"; };
  const handleDragOver = (e, targetId) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;
    const draggedIndex = inputs.findIndex(i => i.id === draggedId);
    const targetIndex = inputs.findIndex(i => i.id === targetId);
    if (draggedIndex === -1 || targetIndex === -1) return;
    setInputs(prev => {
      const newInputs = [...prev]; const [item] = newInputs.splice(draggedIndex, 1); newInputs.splice(targetIndex, 0, item); return newInputs;
    });
  };

  // ================= 渲染 =================
  // ================= 未登录：显示登录/注册页面 =================
  if (!currentUser) {
    return (
      <div className={`flex items-center justify-center min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-zinc-950 text-zinc-200' : 'bg-gray-50 text-gray-800'}`}>
        <button onClick={() => setIsDarkMode(!isDarkMode)} className={`fixed top-4 right-4 p-2.5 rounded-xl border transition-colors ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-yellow-400' : 'bg-white border-gray-200 text-gray-500 hover:text-blue-500'}`}>
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <div className={`w-full max-w-sm mx-4 p-8 rounded-2xl shadow-2xl border transition-colors duration-300 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-100'}`}>
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${isDarkMode ? 'bg-blue-950/60' : 'bg-blue-50'}`}>
              <FileText className={`w-8 h-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <h1 className="text-2xl font-bold">Prompt Builder</h1>
            <p className={`text-sm mt-1 ${isDarkMode ? 'text-zinc-500' : 'text-gray-400'}`}>提示词拼合器</p>
          </div>
          <div className={`flex mb-6 rounded-xl p-1 ${isDarkMode ? 'bg-zinc-800' : 'bg-gray-100'}`}>
            <button onClick={() => { setAuthView('login'); setAuthError(''); }} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${authView === 'login' ? (isDarkMode ? 'bg-zinc-700 text-white shadow' : 'bg-white text-gray-800 shadow') : (isDarkMode ? 'text-zinc-500' : 'text-gray-400')}`}>
              <User className="w-4 h-4 inline mr-1.5" />登录
            </button>
            <button onClick={() => { setAuthView('register'); setAuthError(''); }} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${authView === 'register' ? (isDarkMode ? 'bg-zinc-700 text-white shadow' : 'bg-white text-gray-800 shadow') : (isDarkMode ? 'text-zinc-500' : 'text-gray-400')}`}>
              <UserPlus className="w-4 h-4 inline mr-1.5" />注册
            </button>
          </div>
          {authError && (
            <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${isDarkMode ? 'bg-red-950/40 text-red-400 border border-red-900/50' : 'bg-red-50 text-red-600 border border-red-100'}`}>{authError}</div>
          )}
          <form onSubmit={authView === 'login' ? handleLogin : handleRegister}>
            <div className="mb-4">
              <label className={`block text-xs font-medium mb-1.5 ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>用户名</label>
              <input type="text" value={authForm.username} onChange={e => setAuthForm(prev => ({ ...prev, username: e.target.value }))} placeholder="2-20个字符" autoComplete="username" className={`w-full px-4 py-3 rounded-xl border outline-none transition-all text-sm ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600' : 'bg-gray-50 border-gray-200 text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'}`} />
            </div>
            <div className="mb-6">
              <label className={`block text-xs font-medium mb-1.5 ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>密码</label>
              <input type="password" value={authForm.password} onChange={e => setAuthForm(prev => ({ ...prev, password: e.target.value }))} placeholder="至少4个字符" autoComplete={authView === 'login' ? 'current-password' : 'new-password'} className={`w-full px-4 py-3 rounded-xl border outline-none transition-all text-sm ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600' : 'bg-gray-50 border-gray-200 text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'}`} />
            </div>
            <button type="submit" disabled={authLoading} className={`w-full py-3 text-sm font-bold text-white rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 ${isDarkMode ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20 shadow-lg' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100 shadow-lg'}`}>
              {authLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (authView === 'login' ? '登 录' : '注 册')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ================= 已登录：显示主界面 =================
  return (
    <div 
      className={`flex flex-col md:flex-row h-screen font-sans overflow-hidden relative transition-colors duration-300 ${isDarkMode ? 'bg-zinc-950 text-zinc-200' : 'bg-gray-50 text-gray-800'}`}
      style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
    >
      
      {/* 全局颜色面板遮挡层已移至面板内部 */}

      {/* ================= 左半区：多标签页工作区 ================= */}
      <div className={`w-full md:w-1/2 h-1/2 md:h-full flex flex-col border-r z-10 transition-colors duration-300 ${isDarkMode ? 'border-zinc-800 bg-zinc-900' : 'border-gray-200 bg-white'}`}>
        
        <div className={`sticky top-0 z-20 flex flex-col shadow-sm transition-colors duration-300 ${isDarkMode ? 'bg-zinc-900' : 'bg-white'}`}>
          <div className={`flex items-end px-2 pt-2 gap-1 overflow-x-auto custom-scrollbar border-b ${isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-gray-200 border-gray-300'}`}>
            {workspaces.map(ws => (
              <div
                key={ws.id}
                draggable
                onDragStart={(e) => { setDraggedTabId(ws.id); e.dataTransfer.effectAllowed = "move"; setTimeout(() => e.target.style.opacity = '0.5', 0); }}
                onDragEnd={(e) => { e.target.style.opacity = '1'; setDraggedTabId(null); }}
                onDragOver={(e) => {
                    e.preventDefault();
                    if (!draggedTabId || draggedTabId === ws.id) return;
                    setWorkspaces(prev => {
                        const fromIndex = prev.findIndex(w => w.id === draggedTabId);
                        const toIndex = prev.findIndex(w => w.id === ws.id);
                        if (fromIndex === -1 || toIndex === -1) return prev;
                        const newWs = [...prev];
                        const [item] = newWs.splice(fromIndex, 1);
                        newWs.splice(toIndex, 0, item);
                        return newWs;
                    });
                }}
                onClick={() => setActiveWorkspaceId(ws.id)}
                className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-t-lg border border-b-0 cursor-pointer transition-colors max-w-[160px] min-w-[100px] ${
                  activeWorkspaceId === ws.id
                    ? (isDarkMode ? 'bg-zinc-900 border-zinc-800 text-blue-400 z-10 pb-2 -mb-[1px]' : 'bg-white border-gray-300 text-blue-600 z-10 pb-2 -mb-[1px]')
                    : (isDarkMode ? 'bg-zinc-900/40 border-transparent text-zinc-500 hover:bg-zinc-800' : 'bg-gray-100 border-transparent text-gray-500 hover:bg-white/80')
                }`}
              >
                {ws.isDirty && <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="有未保存的修改" />}
                {!ws.isDirty && <FileText size={12} className="shrink-0 opacity-50" />}
                
                {editingWorkspaceId === ws.id ? (
                  <input
                    autoFocus onBlur={() => setEditingWorkspaceId(null)} onKeyDown={e => e.key === 'Enter' && setEditingWorkspaceId(null)}
                    value={ws.name} onChange={e => handleWorkspaceNameChange(ws.id, e.target.value)}
                    className="bg-transparent outline-none w-full text-sm font-medium"
                  />
                ) : (
                  <span className="text-sm font-medium truncate flex-1 select-none" onDoubleClick={() => setEditingWorkspaceId(ws.id)} title={ws.name}>{ws.name}</span>
                )}
                <X size={14} className={`shrink-0 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white rounded-sm transition-all ${activeWorkspaceId === ws.id ? 'opacity-100':''}`} onClick={(e) => { e.stopPropagation(); handleCloseTabClick(ws.id); }} />
              </div>
            ))}
            {workspaces.length < 5 && (
              <button onClick={handleAddTab} className={`p-1.5 mb-1 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200' : 'hover:bg-gray-300 text-gray-500 hover:text-gray-800'}`} title="新建工作区 (最多5个)">
                <Plus size={16} />
              </button>
            )}
          </div>

          <div className={`p-3 border-b flex justify-between items-center transition-colors duration-300 ${isDarkMode ? 'border-zinc-800' : 'border-gray-100'}`}>
            <div className={`text-xs font-medium ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>
              共 {inputs.length} 个片段
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsPresetDrawerOpen(true)} className={`text-xs flex items-center gap-1 px-2.5 py-1 rounded-full border transition-colors ${isDarkMode ? 'bg-purple-950/40 text-purple-400 border-purple-900/50 hover:bg-purple-900/60' : 'bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100'}`} title="打开预设库">
                <Library className="w-3.5 h-3.5" /> 预设库 ({presets.length})
              </button>
              <button onClick={toggleAllCollapse} className={`text-xs flex items-center gap-1 font-bold px-2.5 py-1 rounded-full border transition-all active:scale-95 ${isDarkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-blue-400 hover:border-blue-800' : 'bg-white border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-300'}`}>
                {isAllCollapsed ? <><ChevronDown size={14}/> 还原展开</> : <><ChevronUp size={14}/> 全部折叠</>}
              </button>
              <div className="w-px h-4 mx-1 bg-gray-200 dark:bg-zinc-700"></div>
              {syncStatus === 'syncing' && <span className={`text-xs flex items-center gap-1 px-2.5 py-1 rounded-full border ${isDarkMode ? 'bg-blue-950/40 text-blue-400 border-blue-900/50' : 'bg-blue-50 text-blue-600 border-blue-100'}`}><Loader2 className="w-3.5 h-3.5 animate-spin" /> 同步中</span>}
              {syncStatus === 'synced' && <span className={`text-xs flex items-center gap-1 px-2.5 py-1 rounded-full border ${isDarkMode ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50' : 'bg-green-50 text-green-600 border-green-100'}`}><CheckCircle2 className="w-3.5 h-3.5" /> 已同步</span>}
              {syncStatus === 'error' && <span className={`text-xs flex items-center gap-1 px-2.5 py-1 rounded-full border ${isDarkMode ? 'bg-red-950/40 text-red-400 border-red-900/50' : 'bg-red-50 text-red-600 border-red-100'}`}><CloudOff className="w-3.5 h-3.5" /> 同步失败</span>}
              <div className="w-px h-4 mx-1 bg-gray-200 dark:bg-zinc-700"></div>
              <div className="relative group">
                <button className={`text-xs flex items-center gap-1 px-2.5 py-1 rounded-full border transition-colors ${isDarkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-blue-400' : 'bg-white border-gray-200 text-gray-600 hover:text-blue-600'}`}>
                  <User className="w-3.5 h-3.5" /> {currentUser?.username}
                </button>
                <div className={`absolute right-0 top-full mt-1 py-1 rounded-lg border shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 min-w-[120px] ${isDarkMode ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'}`}>
                  <button onClick={() => setShowChangePassword(true)} className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors ${isDarkMode ? 'text-zinc-300 hover:bg-zinc-800' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <Lock className="w-3.5 h-3.5" /> 修改密码
                  </button>
                  <button onClick={handleLogout} className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors ${isDarkMode ? 'text-red-400 hover:bg-zinc-800' : 'text-red-500 hover:bg-red-50'}`}>
                    <LogOut className="w-3.5 h-3.5" /> 退出登录
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`flex-1 overflow-y-auto p-4 space-y-4 pb-20 custom-scrollbar transition-colors duration-300 ${isDarkMode ? 'bg-zinc-950/50' : 'bg-gray-50/30'}`}>
          {inputs.map((input, index) => (
            <div
              key={input.id}
              draggable={dragEnabledId === input.id}
              onDragStart={(e) => handleDragStart(e, input.id)}
              onDragOver={(e) => handleDragOver(e, input.id)}
              onDragEnd={() => { setDraggedId(null); setDragEnabledId(null); }}
              className={`relative border rounded-xl shadow-sm transition-all duration-200 group flex flex-col
                ${draggedId === input.id ? (isDarkMode ? 'opacity-40 border-blue-500' : 'opacity-40 border-blue-400') : ''}
                ${input.isActive === false ? 'opacity-60 grayscale-[0.5]' : ''}
                ${getColorClasses(input.color, isDarkMode)}`}
              style={{ ...(input.isActive !== false && input.color?.startsWith('#') ? { backgroundColor: input.color } : {}) }}
            >
              <div className={`flex justify-between items-center px-3 py-2 rounded-t-xl shrink-0 border-b transition-colors duration-300 ${isDarkMode ? 'bg-zinc-800/30 border-zinc-800/50' : 'bg-white/50 border-gray-100'}`}>
                <div className="flex items-center gap-2 flex-1 mr-4 overflow-hidden">
                  <button
                    onClick={() => toggleShowTitle(input.id)}
                    className={`flex items-center justify-center w-4 h-4 rounded shrink-0 border transition-colors focus:outline-none ${
                      input.showTitle
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : (isDarkMode ? 'bg-zinc-800 border-zinc-600 hover:border-zinc-500' : 'bg-white border-gray-300 hover:border-blue-400')
                    }`}
                    title="在最终结果中包含此标题"
                  >
                    {input.showTitle && <Check size={12} strokeWidth={4} />}
                  </button>
                  {editingTitleId === input.id ? (
                    <input
                      autoFocus
                      value={input.title || ''}
                      onChange={(e) => handleTitleChange(input.id, e.target.value)}
                      onBlur={() => setEditingTitleId(null)}
                      onKeyDown={(e) => e.key === 'Enter' && setEditingTitleId(null)}
                      className={`text-xs font-medium border rounded px-1.5 py-0.5 outline-none w-full transition-colors ${isDarkMode ? 'bg-zinc-900 border-blue-700 text-zinc-200' : 'bg-white border-blue-300 text-gray-800'}`}
                    />
                  ) : (
                    <span onDoubleClick={() => setEditingTitleId(input.id)} className={`text-xs font-medium cursor-text px-1.5 py-0.5 rounded transition-colors truncate ${isDarkMode ? 'text-zinc-400 hover:bg-zinc-800/80' : 'text-gray-500 hover:bg-gray-200/50'}`}>
                      {input.title || `片段 ${index + 1}`}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 relative shrink-0">
                  <div className="relative">
                    <button onClick={() => setActiveColorPickerId(activeColorPickerId === input.id ? null : input.id)} className={`p-1.5 rounded transition-colors ${isDarkMode ? 'text-zinc-500 hover:text-blue-400 hover:bg-zinc-800' : 'text-gray-400 hover:text-blue-500 hover:bg-white/80'}`} title="修改背景色">
                      <Palette className="w-4 h-4" />
                    </button>
                    {activeColorPickerId === input.id && (
                      <>
                        <div className="fixed inset-0 z-[60] cursor-default" onClick={() => setActiveColorPickerId(null)} />
                        <div className={`absolute right-0 top-full mt-2 p-3 border shadow-xl rounded-xl flex flex-wrap gap-2 w-48 animate-in fade-in zoom-in duration-200 z-[70] ${isDarkMode ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'}`}>
                          {BG_COLORS.map(c => (
                            <button
                              key={c.value}
                              onClick={(e) => { e.stopPropagation(); changeInputColor(input.id, c.value, true); }}
                              className={`w-6 h-6 rounded-full border cursor-pointer hover:scale-110 transition-transform ${getPickerButtonClasses(c.value, isDarkMode)} ${input.color === c.value ? (isDarkMode ? 'ring-2 ring-blue-500 ring-offset-1 ring-offset-zinc-900' : 'ring-2 ring-blue-400 ring-offset-1') : ''}`}
                              title={c.label}
                            />
                          ))}
                          <div className={`relative w-6 h-6 rounded-full border cursor-pointer hover:scale-110 transition-transform overflow-hidden ${isDarkMode ? 'border-zinc-600 bg-zinc-800' : 'border-gray-300 bg-white'} ${input.color?.startsWith('#') ? (isDarkMode ? 'ring-2 ring-blue-500 ring-offset-1 ring-offset-zinc-900' : 'ring-2 ring-blue-400 ring-offset-1') : ''}`} title="自定义颜色">
                            <input
                              type="color"
                              value={input.color?.startsWith('#') ? input.color : (isDarkMode ? '#18181b' : '#ffffff')}
                              onChange={(e) => changeInputColor(input.id, e.target.value, false)}
                              className="absolute -top-2 -left-2 w-10 h-10 cursor-pointer border-none p-0"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => handleTranslateToggle(input.id)} 
                    disabled={input.isTranslating || isInputEmpty(input)}
                    className={`p-1.5 rounded transition-colors ${
                      input.isTranslating || isInputEmpty(input) 
                        ? 'opacity-50 cursor-not-allowed ' + (isDarkMode ? 'text-zinc-600' : 'text-gray-300')
                        : input.lang === 'en'
                          ? (isDarkMode ? 'bg-blue-900/40 text-blue-400 hover:bg-blue-900/60' : 'bg-blue-100 text-blue-600 hover:bg-blue-200')
                          : (isDarkMode ? 'text-zinc-500 hover:text-blue-400 hover:bg-zinc-800' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50')
                    }`} 
                    title={input.lang === 'en' ? "已翻译为英文，点击切回中文" : "一键翻译为英文"}
                  >
                    {input.isTranslating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
                  </button>

                  <button 
                    onClick={() => !isInputEmpty(input) && saveToPresets(input)} 
                    disabled={isInputEmpty(input)}
                    className={`p-1.5 rounded transition-colors ${isInputEmpty(input) ? 'opacity-50 cursor-not-allowed ' + (isDarkMode ? 'text-zinc-600' : 'text-gray-300') : (isDarkMode ? 'text-zinc-500 hover:text-purple-400 hover:bg-purple-900/30' : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50')}`} 
                    title={isInputEmpty(input) ? "空片段无法存为预设" : "将此片段存为预设"}
                  >
                    <FolderPlus className="w-4 h-4" />
                  </button>

                  <button onClick={() => toggleInputMode(input.id)} className={`p-1.5 rounded transition-colors ${isDarkMode ? 'text-zinc-500 hover:text-blue-400 hover:bg-zinc-800' : 'text-gray-400 hover:text-blue-500 hover:bg-white/80'}`} title={input.isTextMode ? "切换到分块模式" : "切换到纯文本模式"}>
                    {input.isTextMode ? <LayoutGrid className="w-4 h-4" /> : <AlignLeft className="w-4 h-4" />}
                  </button>
                  <button onClick={() => toggleCollapse(input.id)} className={`p-1.5 rounded transition-colors ${isDarkMode ? 'text-zinc-500 hover:text-blue-400 hover:bg-zinc-800' : 'text-gray-400 hover:text-blue-500 hover:bg-white/80'}`} title={input.isCollapsed ? "展开片段" : "折叠片段"}>
                    {input.isCollapsed ? <ChevronDown size={16}/> : <ChevronUp size={16}/>}
                  </button>
                  <button onClick={() => toggleActive(input.id)} className={`p-1.5 rounded transition-colors ${input.isActive !== false ? (isDarkMode ? 'text-blue-400 hover:bg-zinc-800' : 'text-blue-500 hover:bg-white/80') : (isDarkMode ? 'text-zinc-600 hover:bg-zinc-800' : 'text-gray-400 hover:bg-gray-200/50')}`}>
                    {input.isActive !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button onClick={() => removeInput(input.id)} disabled={inputs.length <= 1} className={`p-1.5 rounded transition-colors disabled:opacity-20 ${isDarkMode ? 'text-zinc-500 hover:text-red-400 hover:bg-red-950/50' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div onMouseEnter={() => setDragEnabledId(input.id)} onMouseLeave={() => setDragEnabledId(null)} className={`p-1.5 cursor-grab active:cursor-grabbing transition-colors ${isDarkMode ? 'text-zinc-600 hover:text-zinc-400' : 'text-gray-300 hover:text-gray-600'}`}>
                    <GripVertical className="w-4 h-4" />
                  </div>
                </div>
              </div>
              
              {!input.isCollapsed && (
                input.isTextMode ? (
                  <textarea
                    value={input.text || ''}
                    onChange={(e) => {
                      handleTextChange(input.id, e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                    ref={(el) => {
                      if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }
                    }}
                    placeholder="在此输入提示词内容，可随意使用换行和逗号，不会被自动切分..."
                    className={`w-full min-h-[7rem] p-4 bg-transparent border-none resize-none overflow-hidden outline-none text-sm leading-relaxed custom-scrollbar ${isDarkMode ? 'text-zinc-300 placeholder-zinc-600' : 'text-gray-700 placeholder-gray-400'}`}
                  />
                ) : (
                  <div 
                    className={`w-full min-h-[7rem] p-3 flex flex-wrap gap-x-2.5 gap-y-3 items-start content-start cursor-text transition-all duration-200 ${dragOverInputId === input.id ? (isDarkMode ? 'bg-blue-900/20 ring-2 ring-blue-700 ring-inset rounded-xl' : 'bg-blue-50/50 ring-2 ring-blue-300 ring-inset rounded-xl') : ''}`}
                    onClick={(e) => {
                      if (e.target === e.currentTarget) e.currentTarget.querySelector('input')?.focus();
                    }}
                    onDragOver={(e) => handleTagDragOver(e, input.id, null)}
                    onDragLeave={(e) => handleTagDragLeave(e, input.id)}
                    onDrop={(e) => handleTagDrop(e, input.id, null)}
                  >
                    {(input.tags || []).map((tag) => (
                      editingTagId === tag.id ? (
                        <input
                          key={tag.id}
                          autoFocus
                          defaultValue={tag.text}
                          onBlur={(e) => handleTagEditComplete(input.id, tag.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); } 
                            else if (e.key === 'Escape') { e.preventDefault(); setEditingTagId(null); }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className={`px-3 py-1.5 border-2 rounded-lg outline-none text-sm text-center font-medium shadow-sm min-w-[60px] transition-colors ${isDarkMode ? 'bg-zinc-900 border-blue-600 text-blue-300' : 'bg-white border-blue-400 text-blue-700'}`}
                          style={{ width: `${Math.max(tag.text.length * 2, 4)}ch`, maxWidth: '100%' }}
                        />
                      ) : (
                        <div
                          key={tag.id}
                          draggable={true}
                          onDragStart={(e) => handleTagDragStart(e, input.id, tag.id)}
                          onDragOver={(e) => handleTagDragOver(e, input.id, tag.id)}
                          onDrop={(e) => handleTagDrop(e, input.id, tag.id)}
                          onDragEnd={handleTagDragEnd}
                          onClick={(e) => handleTagClick(e, input.id, tag.id)}
                          className={`group/tag relative px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-move border select-none flex items-center justify-center whitespace-pre-wrap text-left
                            ${tag.isActive !== false
                              ? (isDarkMode 
                                  ? 'bg-blue-900/30 text-blue-300 border-blue-800/50 hover:border-blue-500/50' 
                                  : 'bg-blue-50/50 text-blue-700 border-blue-200 hover:border-blue-400 shadow-sm')
                              : (isDarkMode
                                  ? 'bg-zinc-800/80 text-zinc-500 border-zinc-700/50 line-through opacity-70 hover:opacity-100'
                                  : 'bg-gray-100 text-gray-400 border-gray-200 line-through opacity-70 hover:opacity-100')
                            }
                            ${draggedTagId?.tagId === tag.id ? (isDarkMode ? 'opacity-30 scale-95 ring-2 ring-blue-500' : 'opacity-30 scale-95 ring-2 ring-blue-400') : ''}
                          `}
                          title="拖拽改变顺序，单击编辑文字，双击静音/激活"
                        >
                          {tag.text}
                          <button
                            onClick={(e) => { e.stopPropagation(); removeTag(input.id, tag.id); }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover/tag:opacity-100 transition-opacity shadow hover:bg-red-600 z-10"
                            title="删除此块"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )
                    ))}
                    <input
                      type="text"
                      placeholder={(input.tags && input.tags.length > 0) ? "继续输入..." : "在此输入提示词，用逗号或回车分隔块..."}
                      className={`flex-1 min-w-[160px] bg-transparent outline-none py-1.5 text-sm transition-colors ${isDarkMode ? 'text-zinc-300 placeholder-zinc-600' : 'text-gray-700 placeholder-gray-400'}`}
                      onKeyDown={(e) => handleTagInputKeyDown(e, input.id)}
                      onPaste={(e) => handleTagInputPaste(e, input.id)}
                      onBlur={(e) => handleTagInputBlur(e, input.id)}
                    />
                  </div>
                )
              )}
            </div>
          ))}
          <button
            onClick={addInput}
            className={`w-full py-4 border-2 border-dashed rounded-xl transition-all flex justify-center items-center gap-2 font-medium ${isDarkMode ? 'border-zinc-800 text-zinc-500 hover:border-blue-800 hover:text-blue-400 hover:bg-blue-950/20' : 'border-gray-200 text-gray-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50'}`}
          >
            <Plus className="w-5 h-5" /> 新增片段组
          </button>
        </div>

        <div className={`p-3 border-t flex justify-start sticky bottom-0 z-20 transition-colors duration-300 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-100'}`}>
          <button onClick={() => setIsResetModalOpen(true)} className={`text-xs flex items-center gap-1.5 font-medium px-2 py-1 rounded transition-colors ${isDarkMode ? 'text-zinc-500 hover:text-red-400 hover:bg-red-950/30' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}>
            <RotateCcw className="w-4 h-4" /> 重置当前工作区
          </button>
        </div>
      </div>

      {/* ================= 右半区：预览与拼合结果 ================= */}
      <div className={`w-full md:w-1/2 h-1/2 md:h-full flex flex-col transition-colors duration-300 ${isDarkMode ? 'bg-zinc-950' : 'bg-gray-50'}`}>
        <div className={`p-4 border-b flex justify-between items-center shadow-sm sticky top-0 z-20 transition-colors duration-300 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'}`}>
          <h2 className="text-lg font-bold truncate pr-4">{activeWorkspace.name} - 结果</h2>
          <div className="flex items-center gap-2 shrink-0">
            <select
              value={separator}
              onChange={(e) => setSeparator(e.target.value)}
              className={`text-xs border-none rounded p-1.5 outline-none cursor-pointer transition-colors ${isDarkMode ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              <option value="\n\n">双换行 (分段)</option>
              <option value="\n">单换行</option>
              <option value=" ">空格</option>
              <option value="">无缝拼接</option>
            </select>
            
            <div className={`w-px h-5 mx-1 transition-colors ${isDarkMode ? 'bg-zinc-800' : 'bg-gray-200'}`}></div>

            <button onClick={() => setIsTransConfigModalOpen(true)} className={`p-2 rounded-lg transition-colors border border-transparent ${isDarkMode ? 'text-zinc-400 hover:bg-zinc-800 hover:border-zinc-700' : 'text-gray-500 hover:bg-gray-100 hover:border-gray-200'}`} title="翻译接口设置">
              <Settings size={20} />
            </button>

            <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2 rounded-lg transition-colors border border-transparent ${isDarkMode ? 'text-yellow-500 hover:bg-zinc-800 hover:border-zinc-700' : 'text-gray-500 hover:bg-gray-100 hover:border-gray-200'}`} title={isDarkMode ? "切换至明亮模式" : "切换至黑暗模式"}>
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button onClick={handleSaveClick} className={`p-2 rounded-lg transition-colors border border-transparent ${isDarkMode ? 'text-blue-400 hover:bg-blue-950/30 hover:border-blue-900/50' : 'text-blue-600 hover:bg-blue-50 hover:border-blue-100'}`} title="保存快照">
              <Save className="w-5 h-5" />
            </button>
            <button onClick={() => setIsDrawerOpen(true)} className={`p-2 rounded-lg transition-colors border border-transparent ${isDarkMode ? 'text-blue-400 hover:bg-blue-950/30 hover:border-blue-900/50' : 'text-blue-600 hover:bg-blue-50 hover:border-blue-100'}`} title="历史记录">
              <Bookmark className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 p-4 md:p-6 flex flex-col overflow-hidden">
          <div className={`flex-1 border rounded-xl shadow-inner overflow-hidden relative transition-colors duration-300 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'}`}>
            <textarea
              readOnly
              value={outputText}
              placeholder="当前工作区的标签块内容将在此实时拼合并展示..."
              className={`w-full h-full p-5 bg-transparent border-none resize-none outline-none text-sm leading-relaxed custom-scrollbar transition-colors ${isDarkMode ? 'text-zinc-300 placeholder-zinc-700' : 'text-gray-700 placeholder-gray-300'}`}
            />
            {!outputText && <div className={`absolute inset-0 flex items-center justify-center pointer-events-none text-sm italic ${isDarkMode ? 'text-zinc-700' : 'text-gray-300'}`}>等待输入...</div>}
          </div>
          <button
            onClick={() => executeCopy(outputText)}
            disabled={!outputText}
            className={`mt-6 py-4 rounded-xl text-white font-bold flex justify-center items-center gap-3 transition-all shadow-lg active:scale-[0.98] ${!outputText ? (isDarkMode ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-gray-300 cursor-not-allowed') : copied ? 'bg-green-500 shadow-green-900/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20'}`}
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            {copied ? '已成功复制 !' : '一键复制结果'}
          </button>
        </div>
      </div>

      {/* ================= 翻译设置弹窗 ================= */}
      {isTransConfigModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsTransConfigModalOpen(false); }}>
          <div className={`rounded-2xl shadow-2xl p-6 w-full max-w-sm border flex flex-col max-h-[80vh] ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-transparent'}`} onClick={e => e.stopPropagation()}>
            <h3 className={`font-bold mb-4 flex items-center gap-2 shrink-0 ${isDarkMode ? 'text-zinc-200' : 'text-gray-800'}`}>
              <Languages size={20} className="text-blue-500"/> 翻译接口设置
            </h3>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 mb-6 flex flex-col gap-3">
              <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg border transition-colors ${transConfig.activeProvider === 'google' ? (isDarkMode ? 'bg-blue-950/20 border-blue-700' : 'bg-blue-50 border-blue-300') : (isDarkMode ? 'bg-zinc-950 border-zinc-800 hover:bg-zinc-800' : 'bg-gray-50 border-gray-200 hover:border-blue-100')}`}>
                <input type="radio" checked={transConfig.activeProvider === 'google'} onChange={() => setTransConfig({...transConfig, activeProvider: 'google'})} className="accent-blue-600 w-4 h-4" />
                <div>
                  <div className={`font-bold text-sm ${isDarkMode ? 'text-zinc-200' : 'text-gray-800'}`}>Google 免费直连</div>
                  <div className={`text-xs mt-0.5 ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>无需任何配置，开箱即用</div>
                </div>
              </label>

              {transConfig.customApis.map(api => (
                <div key={api.id} className={`flex flex-col rounded-lg border transition-colors overflow-hidden ${transConfig.activeProvider === api.id ? (isDarkMode ? 'border-blue-700 bg-blue-950/20' : 'border-blue-400 bg-blue-50') : (isDarkMode ? 'border-zinc-800 bg-zinc-950' : 'border-gray-200 bg-gray-50')}`}>
                  <div className={`flex justify-between items-center p-3 cursor-pointer transition-colors ${transConfig.activeProvider !== api.id && (isDarkMode ? 'hover:bg-zinc-900' : 'hover:bg-gray-100')}`} onClick={() => setTransConfig({...transConfig, activeProvider: api.id})}>
                    <div className="flex items-center gap-3 overflow-hidden">
                      <input type="radio" checked={transConfig.activeProvider === api.id} readOnly className="accent-blue-600 w-4 h-4 shrink-0" />
                      <div className="flex flex-col overflow-hidden">
                        <div className={`font-bold text-sm truncate ${isDarkMode ? 'text-zinc-200' : 'text-gray-800'}`} title={api.name}>{api.name}</div>
                        <div className="flex mt-1">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded leading-none ${isDarkMode ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-600'}`}>自定义 API</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {confirmDeleteApiId === api.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteApiId(null); }} className={`text-xs px-2 py-1 rounded transition-colors ${isDarkMode ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}>取消</button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteCustomApi(api.id); }} className="text-xs px-2 py-1 rounded bg-red-500 hover:bg-red-600 text-white transition-colors shadow-sm">确认</button>
                        </div>
                      ) : (
                        <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteApiId(api.id); }} className={`p-1.5 rounded transition-colors ${isDarkMode ? 'text-zinc-500 hover:text-red-400 hover:bg-red-950/30' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`} title="删除接口">
                          <Trash2 size={16} />
                        </button>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); toggleExpandApi(api.id); }} className={`p-1.5 rounded transition-colors ${isDarkMode ? 'text-zinc-500 hover:text-blue-400 hover:bg-zinc-800' : 'text-gray-400 hover:text-blue-500 hover:bg-white'}`} title={expandedApiId === api.id ? "收起配置" : "展开配置"}>
                        {expandedApiId === api.id ? <Settings2 size={16} className="text-blue-500" /> : <Settings2 size={16} />}
                      </button>
                    </div>
                  </div>
                  
                  {expandedApiId === api.id && (
                    <div className={`p-4 border-t space-y-3 cursor-default ${isDarkMode ? 'border-zinc-800/50 bg-zinc-950' : 'border-gray-200/50 bg-white'}`} onClick={e => e.stopPropagation()}>
                      <div className="space-y-1">
                        <label className={`text-xs font-medium pl-1 ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>接口标识名称</label>
                        <input placeholder="如: DeepSeek" value={api.name} onChange={e => handleUpdateCustomApi(api.id, 'name', e.target.value)} className={`w-full text-xs p-2.5 rounded border outline-none focus:ring-1 focus:ring-blue-500 ${isDarkMode ? 'bg-zinc-900 border-zinc-700 text-zinc-300 placeholder-zinc-600' : 'bg-gray-50 border-gray-300 placeholder-gray-400'}`} />
                      </div>
                      <div className="space-y-1">
                        <label className={`text-xs font-medium pl-1 ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>API Base URL</label>
                        <input placeholder="如: https://api.deepseek.com/v1" value={api.apiBase} onChange={e => handleUpdateCustomApi(api.id, 'apiBase', e.target.value)} className={`w-full text-xs p-2.5 rounded border outline-none focus:ring-1 focus:ring-blue-500 ${isDarkMode ? 'bg-zinc-900 border-zinc-700 text-zinc-300 placeholder-zinc-600' : 'bg-gray-50 border-gray-300 placeholder-gray-400'}`} />
                      </div>
                      <div className="space-y-1">
                        <label className={`text-xs font-medium pl-1 ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>API Key (Bearer Token)</label>
                        <input placeholder="sk-..." type="password" value={api.apiKey} onChange={e => handleUpdateCustomApi(api.id, 'apiKey', e.target.value)} className={`w-full text-xs p-2.5 rounded border outline-none focus:ring-1 focus:ring-blue-500 ${isDarkMode ? 'bg-zinc-900 border-zinc-700 text-zinc-300 placeholder-zinc-600' : 'bg-gray-50 border-gray-300 placeholder-gray-400'}`} />
                      </div>
                      <div className="space-y-1">
                        <label className={`text-xs font-medium pl-1 ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>Model Name</label>
                        <input placeholder="如: deepseek-chat" value={api.modelName} onChange={e => handleUpdateCustomApi(api.id, 'modelName', e.target.value)} className={`w-full text-xs p-2.5 rounded border outline-none focus:ring-1 focus:ring-blue-500 ${isDarkMode ? 'bg-zinc-900 border-zinc-700 text-zinc-300 placeholder-zinc-600' : 'bg-gray-50 border-gray-300 placeholder-gray-400'}`} />
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); toggleExpandApi(api.id); }} className={`w-full py-2 text-sm font-bold rounded-lg mt-2 transition-colors ${isDarkMode ? 'bg-blue-900/40 text-blue-400 hover:bg-blue-900/60' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}>
                        保存此配置并收起
                      </button>
                    </div>
                  )}
                </div>
              ))}

              <button onClick={handleAddCustomApi} className={`w-full py-3 flex justify-center items-center gap-2 border-2 border-dashed rounded-xl font-medium transition-colors ${isDarkMode ? 'border-zinc-800 text-zinc-500 hover:border-blue-800 hover:text-blue-400 hover:bg-blue-950/20' : 'border-gray-200 text-gray-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50'}`}>
                <Plus size={18} /> 新增自定义 API
              </button>

            </div>

            <button onClick={handleSaveTransConfig} className={`w-full py-3 text-sm font-bold text-white rounded-xl shadow-md transition-colors active:scale-95 shrink-0 ${isDarkMode ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-600 hover:bg-blue-700'}`}>关闭并应用设置</button>
          </div>
        </div>
      )}

      {/* ================= 侧边抽屉：预设库 ================= */}
      {isPresetDrawerOpen && (
        <div className="fixed inset-0 z-[100] flex justify-start">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onMouseDown={() => setIsPresetDrawerOpen(false)} />
          <div className={`relative w-80 sm:w-96 shadow-2xl h-full flex flex-col transform transition-transform duration-300 border-r ${isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-gray-200'}`}>
            <div className={`p-4 border-b flex justify-between items-center transition-colors ${isDarkMode ? 'bg-purple-950/20 border-zinc-800' : 'bg-purple-50 border-purple-100'}`}>
              <h3 className={`font-bold flex gap-2 items-center ${isDarkMode ? 'text-purple-400' : 'text-purple-700'}`}><Library className="w-5 h-5"/> 我的预设库</h3>
              <button onClick={() => setIsPresetDrawerOpen(false)} className={`p-1.5 rounded-full transition-colors ${isDarkMode ? 'text-purple-500 hover:bg-purple-900/30' : 'text-purple-600 hover:bg-purple-200/50'}`}><X size={20}/></button>
            </div>
            <div className={`flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar ${isDarkMode ? 'bg-zinc-950/50' : 'bg-gray-50/50'}`}>
              {presets.length === 0 ? (
                <div className={`text-center py-20 flex flex-col items-center gap-3 ${isDarkMode ? 'text-zinc-600' : 'text-gray-400'}`}>
                  <FolderPlus className="w-10 h-10 opacity-50" />
                  <p className="text-sm">暂无预设。<br/>点击左侧片段右上角的 📁 按钮，<br/>即可将常用片段存入此库。</p>
                </div>
              ) : (
                presets.map(p => (
                  <div key={p.id} className={`border rounded-xl p-4 transition-all group relative shadow-sm ${isDarkMode ? 'bg-zinc-900/80 border-purple-900/30 hover:border-purple-700' : 'bg-white border-purple-100 hover:border-purple-300'}`}>
                    <div className="flex justify-between items-start mb-2">
                      {editingPresetTitleId === p.id ? (
                        <input autoFocus value={p.title} onChange={e => setPresets(presets.map(px => px.id === p.id ? {...px, title: e.target.value} : px))} onBlur={() => updatePresetTitle(p.id, p.title)} onKeyDown={e => e.key === 'Enter' && updatePresetTitle(p.id, p.title)} className={`text-sm font-bold border rounded px-1.5 py-0.5 outline-none w-full mr-6 ${isDarkMode ? 'bg-zinc-950 border-purple-700 text-zinc-200' : 'bg-purple-50 border-purple-300 text-gray-800'}`} />
                      ) : (
                        <span onDoubleClick={() => setEditingPresetTitleId(p.id)} className={`text-sm font-bold truncate pr-6 cursor-text rounded px-1 transition-colors ${isDarkMode ? 'text-zinc-200 hover:bg-zinc-800' : 'text-gray-800 hover:bg-purple-50'}`} title="双击重命名">{p.title}</span>
                      )}
                      <button onClick={() => deletePreset(p.id)} className={`absolute top-4 right-4 transition-colors opacity-0 group-hover:opacity-100 ${isDarkMode ? 'text-zinc-600 hover:text-red-400' : 'text-gray-300 hover:text-red-500'}`}><Trash2 size={16}/></button>
                    </div>
                    
                    <div className={`text-xs line-clamp-2 mb-4 p-2 rounded-lg border ${isDarkMode ? 'text-zinc-500 bg-zinc-950/50 border-zinc-800/50' : 'text-gray-500 bg-gray-50 border-gray-100'}`}>
                      {p.isTextMode ? p.text : (p.tags && p.tags.length > 0 ? p.tags.map(t => t.text).join(', ') : '空预设')}
                    </div>

                    <button onClick={() => insertPreset(p)} className={`w-full py-2.5 text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 active:scale-[0.98] ${isDarkMode ? 'bg-purple-900/20 text-purple-400 hover:bg-purple-900/40' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}>
                      <Plus className="w-4 h-4"/> 追加到当前工作区
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= 侧边抽屉：历史记录 ================= */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onMouseDown={() => setIsDrawerOpen(false)} />
          <div className={`relative w-80 sm:w-96 shadow-2xl h-full flex flex-col transform transition-transform duration-300 border-l ${isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-gray-200'}`}>
            <div className={`p-4 border-b flex justify-between items-center ${isDarkMode ? 'bg-blue-950/20 border-zinc-800' : 'bg-blue-50 border-blue-100'}`}>
              <h3 className={`font-bold flex gap-2 items-center ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}><Bookmark size={22}/> 已保存快照</h3>
              <div className="flex items-center gap-1">
                <input type="file" id="import-json" accept=".json" className="hidden" onChange={handleImport} />
                <button onClick={() => document.getElementById('import-json').click()} className={`p-1.5 rounded-md transition-colors ${isDarkMode ? 'text-zinc-400 hover:text-blue-400 hover:bg-blue-900/30' : 'text-gray-500 hover:text-blue-600 hover:bg-blue-100'}`} title="导入备份数据 (JSON)">
                  <Upload className="w-4 h-4" />
                </button>
                <button onClick={handleExportClick} className={`p-1.5 rounded-md transition-colors ${isDarkMode ? 'text-zinc-400 hover:text-blue-400 hover:bg-blue-900/30' : 'text-gray-500 hover:text-blue-600 hover:bg-blue-100'}`} title="导出备份数据 (JSON)">
                  <Download className="w-4 h-4" />
                </button>
                <div className={`w-px h-4 mx-1 ${isDarkMode ? 'bg-zinc-800' : 'bg-blue-200'}`}></div>
                <button onClick={() => setIsDrawerOpen(false)} className={`p-1.5 rounded-full transition-colors ${isDarkMode ? 'text-zinc-500 hover:bg-zinc-800' : 'text-blue-600 hover:bg-blue-100'}`}><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className={`flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar ${isDarkMode ? 'bg-zinc-950/50' : 'bg-gray-50/50'}`}>
              {savedPrompts.length === 0 ? (
                <div className={`text-center py-20 italic ${isDarkMode ? 'text-zinc-600' : 'text-gray-400'}`}>暂无历史快照</div>
              ) : (
                savedPrompts.map(p => (
                  <div key={p.id} className={`border rounded-xl p-4 transition-all group relative shadow-sm ${isDarkMode ? 'bg-zinc-900/80 border-blue-900/30 hover:border-blue-700' : 'bg-white border-gray-100 hover:border-blue-200'}`}>
                    <div className="flex justify-between items-start mb-2">
                      {editingSavedTitleId === p.id ? (
                        <input autoFocus value={p.title} onChange={e => updateSavedTitle(p.id, e.target.value)} onBlur={() => setEditingSavedTitleId(null)} onKeyDown={e => e.key === 'Enter' && setEditingSavedTitleId(null)} className={`text-sm font-bold border rounded px-1.5 py-0.5 outline-none w-full mr-6 ${isDarkMode ? 'bg-zinc-950 border-blue-700 text-zinc-200' : 'bg-blue-50 border-blue-300 text-gray-800'}`} />
                      ) : (
                        <span onDoubleClick={() => setEditingSavedTitleId(p.id)} className={`text-sm font-bold truncate pr-6 cursor-text rounded px-1 transition-colors ${isDarkMode ? 'text-zinc-200 hover:bg-zinc-800' : 'text-gray-800 hover:bg-blue-50'}`} title="双击重命名">{p.title}</span>
                      )}
                      <button onClick={() => deleteSnapshot(p.id)} className={`absolute top-4 right-4 transition-colors opacity-0 group-hover:opacity-100 ${isDarkMode ? 'text-zinc-600 hover:text-red-400' : 'text-gray-300 hover:text-red-500'}`}><Trash2 size={16}/></button>
                    </div>
                    <div className={`text-[10px] mb-4 flex items-center gap-1 ${isDarkMode ? 'text-zinc-500' : 'text-gray-400'}`}><Clock size={10}/> {new Date(p.timestamp).toLocaleString()}</div>
                    <div className="flex gap-2">
                      <button onClick={() => {updateActiveWorkspace({ inputs: p.inputs, separator: p.separator || '\\n\\n', name: p.title, isDirty: false }); setIsDrawerOpen(false);}} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 active:scale-95 ${isDarkMode ? 'bg-blue-900/20 text-blue-400 hover:bg-blue-900/40' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}><FileUp size={14}/> 加载到当前工作区</button>
                      <button onClick={() => executeCopy(p.inputs.filter(i => i.isActive).map(i => i.text).join((p.separator || '\\n\\n').replace(/\\n/g, '\n')), p.id)} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 active:scale-95 ${copiedDrawerId === p.id ? (isDarkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-green-100 text-green-700') : (isDarkMode ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}`}>
                        {copiedDrawerId === p.id ? <Check size={14}/> : <Copy size={14}/>} {copiedDrawerId === p.id ? '已复制' : '复制内容'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= 标签页关闭警告弹窗 ================= */}
      {isCloseWarningOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsCloseWarningOpen(false); }}>
          <div className={`rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-transparent'}`} onClick={e => e.stopPropagation()}>
            <AlertTriangle className="mx-auto text-amber-500 mb-3" size={40}/>
            <h3 className={`font-bold text-xl mb-2 ${isDarkMode ? 'text-zinc-200' : 'text-gray-800'}`}>存在未保存的修改</h3>
            <p className={`text-sm mb-8 leading-relaxed ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>此工作区内容尚未保存，直接关闭将丢失您最近的更改。是否需要保存快照？</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => { setIsCloseWarningOpen(false); setSaveTitle(workspaces.find(w=>w.id===pendingCloseTabId)?.name || ''); setIsSaveModalOpen(true); }} className={`w-full py-3 text-sm font-bold text-white rounded-xl transition-all shadow-lg active:scale-[0.98] ${isDarkMode ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'}`}>去保存快照</button>
              <button onClick={() => { setIsCloseWarningOpen(false); executeCloseTab(pendingCloseTabId); }} className={`w-full py-3 text-sm font-bold border rounded-xl transition-colors active:scale-[0.98] ${isDarkMode ? 'bg-red-950/30 border-red-900/50 text-red-400 hover:bg-red-900/40' : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'}`}>不保存，直接关闭</button>
              <button onClick={() => { setIsCloseWarningOpen(false); setPendingCloseTabId(null); }} className={`w-full py-3 text-sm font-bold border rounded-xl transition-colors active:scale-[0.98] ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800' : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200'}`}>取消</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= 保存快照弹窗 ================= */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) { setIsSaveModalOpen(false); setPendingCloseTabId(null); }}}>
          <div className={`rounded-2xl shadow-2xl p-6 w-full max-w-sm border flex flex-col ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-transparent'}`} onClick={e => e.stopPropagation()}>
            <h3 className={`font-bold mb-4 ${isDarkMode ? 'text-zinc-200' : 'text-gray-800'}`}>保存当前工作快照</h3>
            
            <div className={`max-h-32 mb-4 overflow-y-auto border rounded-lg p-1 custom-scrollbar ${isDarkMode ? 'border-zinc-800 bg-zinc-950/50' : 'border-gray-200 bg-gray-50/50'}`}>
              {savedPrompts.map(p => (
                 <div key={p.id} onClick={() => setSaveTitle(p.title)} className={`p-2 text-sm cursor-pointer rounded transition-colors truncate ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-gray-200 text-gray-700'}`}>
                     {p.title}
                 </div>
              ))}
              {savedPrompts.length === 0 && <div className={`p-2 text-xs text-center ${isDarkMode ? 'text-zinc-600' : 'text-gray-400'}`}>暂无记录，可直接在下方输入新名称</div>}
            </div>

            <div className="flex items-center gap-2 mb-6">
              <input ref={saveInputRef} autoFocus value={saveTitle} onChange={e => setSaveTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handlePreSave()} className={`flex-1 border p-2.5 rounded-lg outline-none focus:ring-2 transition-all text-sm ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-200 focus:ring-blue-600' : 'bg-white border-gray-300 focus:ring-blue-500'}`} placeholder="输入名称..." />
              <div className="flex gap-1 shrink-0">
                  <button onClick={() => adjustSaveTitleNumber(-1)} disabled={!hasSaveTitleNumber} className={`p-2 border rounded-lg transition-colors ${!hasSaveTitleNumber ? 'opacity-50 cursor-not-allowed ' + (isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-600' : 'bg-gray-50 border-gray-200 text-gray-300') : (isDarkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700' : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200')}`} title="数字减1"><Minus size={16}/></button>
                  <button onClick={() => adjustSaveTitleNumber(1)} className={`p-2 border rounded-lg transition-colors ${isDarkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700' : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200'}`} title="数字加1"><Plus size={16}/></button>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setIsSaveModalOpen(false); setPendingCloseTabId(null); }} className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-colors ${isDarkMode ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>取消</button>
              <button onClick={handlePreSave} className={`flex-1 py-2.5 text-sm font-bold text-white rounded-xl shadow-md transition-colors active:scale-95 ${isDarkMode ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-600 hover:bg-blue-700'}`}>确认保存</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= 导出选项弹窗 ================= */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsExportModalOpen(false); }}>
          <div className={`rounded-2xl shadow-2xl p-6 w-full max-w-xs border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-transparent'}`} onClick={e => e.stopPropagation()}>
            <h3 className={`font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-zinc-200' : 'text-gray-800'}`}><Download size={20} className="text-blue-500"/> 导出数据</h3>
            <p className={`text-sm mb-4 ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>请勾选需要导出的内容：</p>
            
            <div className="flex flex-col gap-3 mb-6">
              <div 
                onClick={() => setExportOptions({...exportOptions, workspaces: !exportOptions.workspaces})}
                className={`flex items-center gap-3 cursor-pointer p-2 rounded-lg transition-colors border ${isDarkMode ? 'hover:bg-zinc-800/50 border-transparent' : 'hover:bg-gray-50 border-transparent hover:border-gray-200'}`}
              >
                <button
                  className={`flex items-center justify-center w-4 h-4 rounded shrink-0 border transition-colors focus:outline-none ${
                    exportOptions.workspaces
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : (isDarkMode ? 'bg-zinc-800 border-zinc-600 hover:border-zinc-500' : 'bg-white border-gray-300 hover:border-blue-400')
                  }`}
                >
                  {exportOptions.workspaces && <Check size={12} strokeWidth={4} />}
                </button>
                <div className="flex flex-col">
                  <span className={`text-sm font-bold ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>当前所有工作区 ({workspaces.length})</span>
                  <span className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-gray-400'}`}>包括顶部所有的多标签页内容</span>
                </div>
              </div>

              <div 
                onClick={() => setExportOptions({...exportOptions, snapshots: !exportOptions.snapshots})}
                className={`flex items-center gap-3 cursor-pointer p-2 rounded-lg transition-colors border ${isDarkMode ? 'hover:bg-zinc-800/50 border-transparent' : 'hover:bg-gray-50 border-transparent hover:border-gray-200'}`}
              >
                <button
                  className={`flex items-center justify-center w-4 h-4 rounded shrink-0 border transition-colors focus:outline-none ${
                    exportOptions.snapshots
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : (isDarkMode ? 'bg-zinc-800 border-zinc-600 hover:border-zinc-500' : 'bg-white border-gray-300 hover:border-blue-400')
                  }`}
                >
                  {exportOptions.snapshots && <Check size={12} strokeWidth={4} />}
                </button>
                <div className="flex flex-col">
                  <span className={`text-sm font-bold ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>历史快照 ({savedPrompts.length})</span>
                  <span className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-gray-400'}`}>右侧历史面板中的拼合快照</span>
                </div>
              </div>

              <div 
                onClick={() => setExportOptions({...exportOptions, presets: !exportOptions.presets})}
                className={`flex items-center gap-3 cursor-pointer p-2 rounded-lg transition-colors border ${isDarkMode ? 'hover:bg-zinc-800/50 border-transparent' : 'hover:bg-gray-50 border-transparent hover:border-gray-200'}`}
              >
                <button
                  className={`flex items-center justify-center w-4 h-4 rounded shrink-0 border transition-colors focus:outline-none ${
                    exportOptions.presets
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : (isDarkMode ? 'bg-zinc-800 border-zinc-600 hover:border-zinc-500' : 'bg-white border-gray-300 hover:border-blue-400')
                  }`}
                >
                  {exportOptions.presets && <Check size={12} strokeWidth={4} />}
                </button>
                <div className="flex flex-col">
                  <span className={`text-sm font-bold ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>预设片段库 ({presets.length})</span>
                  <span className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-gray-400'}`}>左侧保存的独立提示词片段</span>
                </div>
              </div>

              <div 
                onClick={() => setExportOptions({...exportOptions, settings: !exportOptions.settings})}
                className={`flex items-center gap-3 cursor-pointer p-2 rounded-lg transition-colors border ${isDarkMode ? 'hover:bg-zinc-800/50 border-transparent' : 'hover:bg-gray-50 border-transparent hover:border-gray-200'}`}
              >
                <button
                  className={`flex items-center justify-center w-4 h-4 rounded shrink-0 border transition-colors focus:outline-none ${
                    exportOptions.settings
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : (isDarkMode ? 'bg-zinc-800 border-zinc-600 hover:border-zinc-500' : 'bg-white border-gray-300 hover:border-blue-400')
                  }`}
                >
                  {exportOptions.settings && <Check size={12} strokeWidth={4} />}
                </button>
                <div className="flex flex-col">
                  <span className={`text-sm font-bold ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>应用设置</span>
                  <span className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-gray-400'}`}>包含翻译 API 接口等全局配置数据</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setIsExportModalOpen(false)} className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-colors ${isDarkMode ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>取消</button>
              <button onClick={confirmExport} className={`flex-1 py-2.5 text-sm font-bold text-white rounded-xl shadow-md transition-colors active:scale-95 ${isDarkMode ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-600 hover:bg-blue-700'}`}>确认导出</button>
            </div>
          </div>
        </div>
      )}

      {isConflictModalOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) handleCancelConflict(); }}>
          <div className={`rounded-2xl shadow-2xl p-6 w-full max-w-sm border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-transparent'}`} onClick={e => e.stopPropagation()}>
            <h3 className={`font-bold mb-2 text-lg flex items-center gap-2 ${isDarkMode ? 'text-zinc-200' : 'text-gray-800'}`}>
              <AlertTriangle className="w-5 h-5 text-amber-500" /> 发现同名快照
            </h3>
            <p className={`text-sm mb-6 leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>已存在名为 <span className={`font-bold px-1 rounded ${isDarkMode ? 'text-blue-400 bg-blue-900/30' : 'text-blue-600 bg-blue-50'}`}>"{conflictTarget?.title}"</span> 的快照。您希望如何处理？</p>
            <div className="flex flex-col gap-3">
              <button onClick={handleOverwrite} className={`w-full py-2.5 text-sm font-bold rounded-xl transition-colors border active:scale-[0.98] ${isDarkMode ? 'bg-red-950/30 text-red-400 border-red-900/50 hover:bg-red-900/40' : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'}`}>直接覆盖原快照</button>
              <button onClick={handleAutoRename} className={`w-full py-2.5 text-sm font-bold text-white rounded-xl shadow-md transition-colors active:scale-[0.98] ${isDarkMode ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-600 hover:bg-blue-700'}`}>自动重命名并保存为新快照</button>
              <button onClick={handleCancelConflict} className={`w-full py-2.5 text-sm font-bold rounded-xl transition-colors active:scale-[0.98] ${isDarkMode ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>取消，我要自己改名</button>
            </div>
          </div>
        </div>
      )}

      {isResetModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsResetModalOpen(false); }}>
          <div className={`rounded-2xl shadow-2xl p-8 w-full max-w-xs text-center border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-transparent'}`} onClick={e => e.stopPropagation()}>
            <AlertTriangle className="mx-auto text-red-500 mb-3" size={40}/>
            <h3 className={`font-bold text-xl mb-2 ${isDarkMode ? 'text-zinc-200' : 'text-gray-800'}`}>确认重置？</h3>
            <p className={`text-sm mb-8 leading-relaxed ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>此操作将清空当前所有未保存的内容。历史快照和预设不会受到影响。</p>
            <div className="flex gap-3">
              <button onClick={() => setIsResetModalOpen(false)} className={`flex-1 py-3 text-sm font-bold border rounded-xl transition-colors ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>取消</button>
              <button onClick={confirmReset} className={`flex-1 py-3 text-sm font-bold text-white rounded-xl transition-all shadow-lg active:scale-95 ${isDarkMode ? 'bg-red-600 hover:bg-red-500 shadow-red-900/20' : 'bg-red-500 hover:bg-red-600 shadow-red-100'}`}>确认重置</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= 全局提示 Toast ================= */}
      {errorMessage && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[200] bg-red-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 animate-in slide-in-from-top-4 duration-300">
          <AlertTriangle className="w-5 h-5" />
          <span className="text-sm font-medium">{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[200] bg-emerald-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 animate-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-medium">{successMessage}</span>
        </div>
      )}

      {/* ================= 修改密码弹窗 ================= */}
      {showChangePassword && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowChangePassword(false); }}>
          <div className={`rounded-2xl shadow-2xl p-6 w-full max-w-xs border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-transparent'}`} onClick={e => e.stopPropagation()}>
            <h3 className={`font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-zinc-200' : 'text-gray-800'}`}><Lock className="w-5 h-5 text-blue-500" /> 修改密码</h3>
            <div className="space-y-3 mb-6">
              <input type="password" value={changePasswordForm.oldPassword} onChange={e => setChangePasswordForm(prev => ({ ...prev, oldPassword: e.target.value }))} placeholder="旧密码" className={`w-full px-4 py-2.5 rounded-lg border outline-none text-sm ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-200 focus:border-blue-600' : 'bg-gray-50 border-gray-200 text-gray-800 focus:border-blue-500'}`} />
              <input type="password" value={changePasswordForm.newPassword} onChange={e => setChangePasswordForm(prev => ({ ...prev, newPassword: e.target.value }))} placeholder="新密码（至少4个字符）" className={`w-full px-4 py-2.5 rounded-lg border outline-none text-sm ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-200 focus:border-blue-600' : 'bg-gray-50 border-gray-200 text-gray-800 focus:border-blue-500'}`} />
            </div>
            {authError && showChangePassword && (
              <div className={`mb-4 p-2 rounded-lg text-xs font-medium ${isDarkMode ? 'bg-red-950/40 text-red-400' : 'bg-red-50 text-red-600'}`}>{authError}</div>
            )}
            <div className="flex gap-3">
              <button onClick={() => { setShowChangePassword(false); setChangePasswordForm({ oldPassword: '', newPassword: '' }); setAuthError(''); }} className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-colors ${isDarkMode ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>取消</button>
              <button onClick={handleChangePassword} className={`flex-1 py-2.5 text-sm font-bold text-white rounded-xl shadow-md transition-colors active:scale-95 ${isDarkMode ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-600 hover:bg-blue-700'}`}>确认修改</button>
            </div>
          </div>
        </div>
      )}

      {/* Tailwind Dark Mode 滚动条优化 */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #94a3b8; }
        .dark .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #52525b; }
      `}} />
    </div>
  );
}