import React, { useState, useEffect, useRef } from 'react';
import { GripVertical, Plus, Copy, Check, Trash2, Eye, EyeOff, Save, Bookmark, X, Clock, FileUp, Loader2, RotateCcw, AlignLeft, LayoutGrid, Palette, Library, FolderPlus, ChevronUp, ChevronDown, CloudOff, Sun, Moon, Languages, Settings, FileText, LogOut, User, Lock, Folder, CheckCircle2 } from 'lucide-react';
import { generateId, API_BASE, BG_COLORS, DEFAULT_FOLDER_COLOR, DEFAULT_FOLDER_ICON, getFolderColorOption, getColorClasses, getPickerButtonClasses } from './lib/constants';
import { cleanDataForStorage, parseTextToTags, syncTextFromTags, normalizeTagDelimitersForOrder, buildOutputTextFromInputs, normalizeSnapshotRecord, normalizeSavedPromptsList, extractImportedSnapshots, sanitizeInputs, migrateTransConfig, createDefaultWorkspace, removeGarbage } from './lib/parser';
import { appLogger } from './lib/logger';

import { useTheme } from './hooks/useTheme';
import { useAuth } from './hooks/useAuth';
import { useTransConfig } from './hooks/useTransConfig';
import { useWorkspaces } from './hooks/useWorkspaces';
import { useDataStore } from './hooks/useDataStore';
import Modals from './components/Modals';
import AuthPage from './components/AuthPage';
import LogPanel from './components/LogPanel';
import PresetDrawer from './components/PresetDrawer';
import SnapshotDrawer from './components/SnapshotDrawer';
import FolderStylePicker from './components/FolderStylePicker';
import FolderPickerModal from './components/FolderPickerModal';


// FOLDER_ICON_OPTIONS 依赖 lucide-react 组件，保留在此
const FOLDER_ICON_OPTIONS = [
  { id: 'folder', label: 'Folder', icon: Folder },
  { id: 'bookmark', label: 'Bookmark', icon: Bookmark },
  { id: 'file-text', label: 'Text', icon: FileText },
  { id: 'library', label: 'Library', icon: Library },
  { id: 'palette', label: 'Palette', icon: Palette },
  { id: 'align-left', label: 'List', icon: AlignLeft }
];

const getFolderIconOption = (iconId) => (
  FOLDER_ICON_OPTIONS.find(option => option.id === iconId) || FOLDER_ICON_OPTIONS[0]
);



// ================= ErrorBoundary 组件 =================
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, errorInfo: '' }; }
  static getDerivedStateFromError(error) { return { hasError: true, errorInfo: error.message }; }
  componentDidCatch(error, info) {
    appLogger.error('react', error.message, info.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32, textAlign: 'center', color: '#ef4444' }}>
          <h2 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>应用发生了错误</h2>
          <p style={{ fontSize: 13, color: '#999', marginBottom: 16, wordBreak: 'break-all' }}>{this.state.errorInfo}</p>
          <button onClick={() => { this.setState({ hasError: false, errorInfo: '' }); }} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #ddd', cursor: 'pointer', fontSize: 13 }}>重试</button>
          <button onClick={() => { appLogger.clear(); window.location.reload(); }} style={{ marginLeft: 8, padding: '8px 20px', borderRadius: 8, border: '1px solid #ddd', cursor: 'pointer', fontSize: 13 }}>清空日志并刷新</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  // ---------------- 全局提示状态（先于 hooks 声明，因 useAuth 依赖 setSuccessMessage） ----------------
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // ---------------- Hook 调用 ----------------
  const { isDarkMode, setIsDarkMode } = useTheme();
  const {
    transConfig, setTransConfig,
    expandedApiId, setExpandedApiId,
    confirmDeleteApiId, setConfirmDeleteApiId,
  } = useTransConfig();
  const {
    workspaces, setWorkspaces, activeWorkspaceId, setActiveWorkspaceId,
    activeWorkspace, editingWorkspaceId, setEditingWorkspaceId,
    pendingCloseTabId, setPendingCloseTabId,
    isCloseWarningOpen, setIsCloseWarningOpen,
    draggedTabId, setDraggedTabId,
    syncStatus, setSyncStatus, dataLoaded, setDataLoaded,
    setInputs, setSeparator, updateActiveWorkspace,
    handleAddTab, executeCloseTab, handleCloseTabClick, handleWorkspaceNameChange,
  } = useWorkspaces();
  const {
    currentUser, setCurrentUser, authToken, setAuthToken,
    authView, setAuthView, authForm, setAuthForm,
    authLoading, authError, setAuthError,
    showChangePassword, setShowChangePassword,
    changePasswordForm, setChangePasswordForm,
    authFetch, handleLogin, handleRegister, handleLogout, handleChangePassword,
  } = useAuth({ setSuccessMessage, setDataLoaded });
  const {
    savedPrompts, setSavedPrompts, folders, setFolders, presets, setPresets,
    snapshotPreviewPosition,
    snapshotSearchQuery, setSnapshotSearchQuery, isSnapshotBatchMode,
    selectedSnapshotIds,
    selectedSnapshotIdSet, snapshotPreviewMap, matchedSavedPrompts, groupedFilteredSavedPrompts,
    allVisibleSnapshotsSelected, hoveredSnapshot, isSnapshotSearchActive,
    toggleSnapshotBatchMode, toggleSnapshotSelected, toggleSelectAllVisibleSnapshots,
    promptAssignFolderForSnapshots, handleBatchDeleteSnapshots,
    openSnapshotPreview, scheduleCloseSnapshotPreview, clearSnapshotPreviewCloseTimer,
    presetSearchQuery, setPresetSearchQuery, isPresetBatchMode,
    selectedPresetIds,
    selectedPresetIdSet, matchedPresets, groupedFilteredPresets,
    allVisiblePresetsSelected, isPresetSearchActive,
    togglePresetBatchMode, togglePresetSelected, toggleSelectAllVisiblePresets,
    promptAssignFolderForPresets, handleBatchDeletePresets,
    togglePresetFolderExpanded,
    editingFolderId, editingFolderName, setEditingFolderName,
    activeFolderStylePickerId, setActiveFolderStylePickerId, folderStylePickerPos, setFolderStylePickerPos,
    toggleFolderExpanded, startEditingFolder, finishEditingFolder, commitFolderRename,
    updateFolderAppearance, openFolderDeleteDialog, handleDeleteFolderWithContents, handleDissolveFolder,
    showFolderPicker, folderPickerSnapshotIds,
    folderPickerTarget, folderPickerCreating,
    folderPickerNewName, setFolderPickerNewName, folderPickerDefaultName,
    folderDeleteTarget, setFolderDeleteTarget, closeFolderPicker, handlePickerSelectFolder, handlePickerRemoveFromFolder,
    handlePickerStartCreating, handlePickerCancelCreating, handlePickerConfirmCreating,
    cleanupStaleState,
  } = useDataStore({ authFetch, setErrorMessage });

  // ---------------- 数据状态（未被 hook 封装） ----------------
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
  const [isLogPanelOpen, setIsLogPanelOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState({ workspaces: true, snapshots: true, presets: true, settings: true });
  const [pendingImportPayload, setPendingImportPayload] = useState(null);
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

  // ---------------- 提取当前活跃工作区的属性 ----------------
  const inputs = activeWorkspace.inputs;
  const separator = activeWorkspace.separator;
  // 所有快照/预设/文件夹的计算属性已移入 useDataStore hook

  useEffect(() => {
    if (errorMessage) { const timer = setTimeout(() => setErrorMessage(''), 5000); return () => clearTimeout(timer); }
  }, [errorMessage]);

  useEffect(() => {
    if (successMessage) { const timer = setTimeout(() => setSuccessMessage(''), 4000); return () => clearTimeout(timer); }
  }, [successMessage]);

  useEffect(() => { cleanupStaleState({ dataLoaded }); }, [savedPrompts, folders, dataLoaded, cleanupStaleState]);

  // 1. 初始化数据加载（token 变化时重新加载，确保登录后立即加载数据）
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
      // 没有 token 时不请求
      if (!authToken) { setDataLoaded(true); return; }
      
      try {
        const res = await authFetch(`${API_BASE}/data`);
        if (res.ok) {
          const data = await res.json();
          processLoadedWorkspace(data);
          if (data.savedPrompts) setSavedPrompts(normalizeSavedPromptsList(data.savedPrompts));
          // scope 迁移映射表：旧 folderId → 新 preset-scope folderId
          const folderIdMigrationMap = new Map();

          if (data.folders && Array.isArray(data.folders)) {
            // 去重：同 id 保留第一个，同 name+scope 也保留第一个
            const seenIds = new Set();
            const seenNameScopes = new Set();
            const deduped = data.folders.filter(f => {
              const nameScopeKey = `${f.name.trim().toLowerCase()}|||${f.scope || 'snapshot'}`;
              if (seenIds.has(f.id) || seenNameScopes.has(nameScopeKey)) return false;
              seenIds.add(f.id);
              seenNameScopes.add(nameScopeKey);
              return true;
            });
            // scope 迁移：旧文件夹没有 scope 字段，根据引用情况分配
            const snapshotFolderIds = new Set((data.savedPrompts || []).map(s => s.folderId).filter(Boolean));
            const presetFolderIds = new Set((data.presets || []).map(p => p.folderId).filter(Boolean));
            const migratedFolders = [];
            deduped.forEach(f => {
              if (f.scope) { migratedFolders.push(f); return; } // 已有 scope，保持
              const isSnapshotRef = snapshotFolderIds.has(f.id);
              const isPresetRef = presetFolderIds.has(f.id);
              if (isSnapshotRef && isPresetRef) {
                // 两边都引用：复制一份给 preset，原文件夹归 snapshot
                const newPresetFolderId = generateId();
                migratedFolders.push({ ...f, scope: 'snapshot' });
                migratedFolders.push({ ...f, id: newPresetFolderId, scope: 'preset' });
                folderIdMigrationMap.set(f.id, newPresetFolderId);
              } else if (isPresetRef) {
                migratedFolders.push({ ...f, scope: 'preset' });
              } else {
                migratedFolders.push({ ...f, scope: 'snapshot' });
              }
            });
            setFolders(migratedFolders);
          } else if (data.savedPrompts) {
            // 旧数据迁移：从快照中提取文件夹信息
            const folderMap = new Map();
            data.savedPrompts.forEach(snapshot => {
              if (snapshot.folderId && snapshot.folderName) {
                if (!folderMap.has(snapshot.folderId)) {
                  folderMap.set(snapshot.folderId, {
                    id: snapshot.folderId,
                    name: snapshot.folderName,
                    color: snapshot.folderColor || DEFAULT_FOLDER_COLOR,
                    icon: snapshot.folderIcon || DEFAULT_FOLDER_ICON,
                    scope: 'snapshot',
                  });
                }
              }
            });
            if (folderMap.size > 0) setFolders(Array.from(folderMap.values()));
          }
          if (data.presets) {
            // 预设按 id + 内容签名 双重去重（修复重复导入导致的重复项）
            const seenIds = new Set();
            const seenSignatures = new Set();
            const deduped = data.presets.filter(p => {
              const idKey = p.id;
              const sigKey = `${p.title || ''}|||${p.text || ''}`;
              if (seenIds.has(idKey) || seenSignatures.has(sigKey)) return false;
              seenIds.add(idKey);
              seenSignatures.add(sigKey);
              return true;
            }).map(p => {
              // 如果 folderId 在迁移映射中，更新为新 id
              if (p.folderId && folderIdMigrationMap.has(p.folderId)) {
                return { ...p, folderId: folderIdMigrationMap.get(p.folderId) };
              }
              return p;
            });
            setPresets(deduped);
          }
        } else if (res.status === 401) {
          setCurrentUser(null); setAuthToken(null);
        }
      } catch (e) { console.warn("无法连接到后端服务，将使用初始状态。"); appLogger.error('init', '无法连接后端', e.message); } 
      finally { if (isMounted) setDataLoaded(true); }
    };
    
    setDataLoaded(false);
    loadLocalData();

    return () => { isMounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken, authFetch]);

  // 2. 更新活跃工作区的完整数据 — 已移入 useWorkspaces hook

  // 3. 自动同步工作区到后端
  useEffect(() => {
    if (!dataLoaded) return;
    if (!authToken) {
      setSyncStatus('synced');
      return;
    }

    setSyncStatus('syncing');
    const timer = setTimeout(async () => {
      try {
        const cleanPayload = { 
          workspaces: workspaces.map(w => ({ ...w, inputs: cleanDataForStorage(w.inputs) })), 
          activeWorkspaceId 
        };
        const res = await authFetch(`${API_BASE}/workspace`, { method: 'POST', body: JSON.stringify(cleanPayload) });
        if (res.status === 401) { setCurrentUser(null); setAuthToken(null); return; }
        if (!res.ok) throw new Error("Sync failed");
        setSyncStatus('synced');
      } catch (e) { setSyncStatus('error'); appLogger.error('sync', '工作区同步失败', e.message); }
    }, 1000);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaces, activeWorkspaceId, dataLoaded, authToken, authFetch]);

  // 4. 自动同步快照到后端
  useEffect(() => {
    if (!dataLoaded || !authToken) return;

    const timer = setTimeout(async () => {
      try {
        const res = await authFetch(`${API_BASE}/saved`, { method: 'POST', body: JSON.stringify(savedPrompts) });
        if (res.status === 401) { setCurrentUser(null); setAuthToken(null); return; }
        if (!res.ok) throw new Error('Save snapshots failed');
      } catch (e) { console.error("保存快照失败", e); appLogger.error('sync', '保存快照失败', e.message); }
    }, 800);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedPrompts, dataLoaded, authToken, authFetch]);

  // 4.5 自动同步文件夹到后端
  useEffect(() => {
    if (!dataLoaded || !authToken) return;

    const timer = setTimeout(async () => {
      try {
        await authFetch(`${API_BASE}/folders`, { method: 'POST', body: JSON.stringify(folders) });
      } catch (e) { console.error("保存文件夹失败", e); appLogger.error('sync', '保存文件夹失败', e.message); }
    }, 800);
    return () => clearTimeout(timer);
  }, [folders, dataLoaded, authToken, authFetch]);

  // 5. 自动同步预设到后端
  useEffect(() => {
    if (!dataLoaded || !authToken) return;

    const timer = setTimeout(async () => {
      try {
        await authFetch(`${API_BASE}/presets`, { method: 'POST', body: JSON.stringify(presets) });
      } catch (e) { console.error("保存预设失败", e); appLogger.error('sync', '保存预设失败', e.message); }
    }, 800);
    return () => clearTimeout(timer);
  }, [presets, dataLoaded, authToken, authFetch]);

  // ---------------- 多标签页管理逻辑 — 已移入 useWorkspaces hook ----------------

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
    } catch { setErrorMessage("保存预设失败"); }
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
    } catch { /* optimistic update, sync failure handled elsewhere */ }
  };

  const updatePresetTitle = async (id, newTitle) => {
    if (!newTitle.trim()) return setEditingPresetTitleId(null);
    try {
      const newList = presets.map(p => p.id === id ? {...p, title: newTitle} : p);
      setPresets(newList);
      await authFetch(`${API_BASE}/presets`, { method: 'POST', body: JSON.stringify(newList) });
      setEditingPresetTitleId(null);
    } catch { /* optimistic update, sync failure handled elsewhere */ }
  };

  // ======== 预设库批量/文件夹操作 — 已移入 useDataStore hook ========

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
      const normalizedTags = normalizeTagDelimitersForOrder(newTags);
      const newInputs = [...prev];
      newInputs[inputIndex] = invalidateCache({ ...input, tags: normalizedTags, text: syncTextFromTags(normalizedTags) });
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
      const normalizedSourceTags = normalizeTagDelimitersForOrder(newSourceTags);
      const normalizedTargetTags = normalizeTagDelimitersForOrder(newTargetTags);

      const newInputs = [...prev];
      newInputs[sourceIndex] = invalidateCache({ ...sourceInput, tags: normalizedSourceTags, text: syncTextFromTags(normalizedSourceTags) });
      newInputs[targetIndex] = invalidateCache({ ...targetInput, tags: normalizedTargetTags, text: syncTextFromTags(normalizedTargetTags) });
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

  const generateOutput = () => buildOutputTextFromInputs(inputs, separator);
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

  const executeSave = (finalTitle, overwriteId = null) => {
    const snapshotId = overwriteId || generateId();
    const newSnapshot = normalizeSnapshotRecord({
      id: snapshotId,
      title: finalTitle,
      inputs: cleanDataForStorage(inputs),
      separator: separator || '\\n\\n',
      timestamp: Date.now(),
      folderId: null
    });
    setIsConflictModalOpen(false); setIsSaveModalOpen(false); setIsDrawerOpen(true);
    
    setWorkspaces(prev => prev.map(w => w.id === activeWorkspaceId ? { ...w, isDirty: false, name: finalTitle } : w));
    if (pendingCloseTabId) { executeCloseTab(pendingCloseTabId); setPendingCloseTabId(null); }
    setSavedPrompts(prev => [newSnapshot, ...prev.filter(p => p.id !== overwriteId)]);
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

  const deleteSnapshot = (id) => {
    setSavedPrompts(prev => prev.filter(p => p.id !== id));
  };

  const updateSavedTitle = (id, newTitle) => {
    if (!newTitle.trim()) return;
    setSavedPrompts(prev => prev.map(p => p.id === id ? { ...p, title: newTitle } : p));
  };

  const confirmExport = () => {
    if (!exportOptions.workspaces && !exportOptions.snapshots && !exportOptions.presets && !exportOptions.settings) return setErrorMessage('请至少选择一项导出内容');
    const exportData = { type: 'prompt_builder_export_v2', version: 2, timestamp: Date.now() };
    let hasData = false;
    
    if (exportOptions.workspaces && workspaces.length > 0) { exportData.workspaces = workspaces; hasData = true; }
    if (exportOptions.snapshots && savedPrompts.length > 0) {
      if (folders.length > 0) exportData.folders = folders;
      exportData.snapshots = savedPrompts.map(snapshot => {
        const folder = snapshot.folderId ? folders.find(f => f.id === snapshot.folderId) : null;
        return {
          ...snapshot,
          folderName: folder ? folder.name : '',
          folderColor: folder ? (folder.color || DEFAULT_FOLDER_COLOR) : null,
          folderIcon: folder ? (folder.icon || DEFAULT_FOLDER_ICON) : null,
        };
      });
      hasData = true;
    }
    if (exportOptions.presets && presets.length > 0) { exportData.presets = presets; hasData = true; }
    if (exportOptions.settings) { exportData.settings = { transConfig }; hasData = true; }
    
    if (!hasData) return setErrorMessage('没有可导出的数据，请检查所选项是否为空');

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `Prompt_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    setIsExportModalOpen(false);
  };

  const executeImport = (importedData, snapshotImportMode = 'merge') => {
    let importedSnapshotCount = 0;
    let importedPresetCount = 0;
    let presetSkippedCount = 0;
    let importedSettings = false;
    let importedWorkspacesCount = 0;

    if (Array.isArray(importedData)) {
      const importedSnapshots = normalizeSavedPromptsList(importedData);
      // 旧格式：从快照中提取文件夹
      const folderMap = new Map();
      importedData.forEach(snapshot => {
        if (snapshot.folderId && snapshot.folderName) {
          if (!folderMap.has(snapshot.folderId)) {
            folderMap.set(snapshot.folderId, {
              id: snapshot.folderId,
              name: snapshot.folderName,
              color: snapshot.folderColor || DEFAULT_FOLDER_COLOR,
              icon: snapshot.folderIcon || DEFAULT_FOLDER_ICON,
            });
          }
        }
      });
      if (folderMap.size > 0) {
        // 导入时去重：与已有文件夹重名+同scope的跳过
        setFolders(prev => {
          const existingNameScopes = new Set(prev.map(f => `${f.name.trim().toLowerCase()}|||${f.scope || 'snapshot'}`));
          const newFolders = Array.from(folderMap.values()).filter(f => !existingNameScopes.has(`${f.name.trim().toLowerCase()}|||${f.scope || 'snapshot'}`));
          return newFolders.length > 0 ? [...newFolders, ...prev] : prev;
        });
      }
      if (snapshotImportMode === 'replace') setSavedPrompts(importedSnapshots);
      importedSnapshotCount = importedSnapshots.length;
    } else if (importedData.type === 'prompt_builder_export_v2') {
      if (importedData.workspaces && Array.isArray(importedData.workspaces)) {
        const newWsList = importedData.workspaces.map(w => ({
          ...w,
          id: generateId(),
          inputs: sanitizeInputs(Array.isArray(w.inputs) ? w.inputs : []),
          isDirty: false
        }));
        setWorkspaces(prev => [...prev, ...newWsList]);
        setActiveWorkspaceId(newWsList[0].id);
        importedWorkspacesCount = newWsList.length;
      }

      if (importedData.snapshots) {
        const importedSnapshots = normalizeSavedPromptsList(importedData.snapshots);
        if (snapshotImportMode === 'replace') setSavedPrompts(importedSnapshots);
        else setSavedPrompts(prev => [...importedSnapshots, ...prev]);
        importedSnapshotCount += importedSnapshots.length;

        // 导入文件夹（快照 scope）
        if (importedData.folders && Array.isArray(importedData.folders)) {
          // 新格式：有 folders 数组，去重后合并，scope 默认为 snapshot
          setFolders(prev => {
            const existingNameScopes = new Set(prev.map(f => `${f.name.trim().toLowerCase()}|||${f.scope || 'snapshot'}`));
            const newFolders = importedData.folders
              .map(f => ({ ...f, scope: f.scope || 'snapshot' }))
              .filter(f => !existingNameScopes.has(`${f.name.trim().toLowerCase()}|||${f.scope}`));
            return newFolders.length > 0 ? [...newFolders, ...prev] : prev;
          });
        } else {
          // 旧格式：从快照中提取文件夹
          const folderMap = new Map();
          importedData.snapshots.forEach(snapshot => {
            if (snapshot.folderId && snapshot.folderName) {
              if (!folderMap.has(snapshot.folderId)) {
                folderMap.set(snapshot.folderId, {
                  id: snapshot.folderId,
                  name: snapshot.folderName,
                  color: snapshot.folderColor || DEFAULT_FOLDER_COLOR,
                  icon: snapshot.folderIcon || DEFAULT_FOLDER_ICON,
                  scope: 'snapshot',
                });
              }
            }
          });
          if (folderMap.size > 0) {
            setFolders(prev => {
              const existingNameScopes = new Set(prev.map(f => `${f.name.trim().toLowerCase()}|||${f.scope || 'snapshot'}`));
              const newFolders = Array.from(folderMap.values()).filter(f => !existingNameScopes.has(`${f.name.trim().toLowerCase()}|||snapshot`));
              return newFolders.length > 0 ? [...newFolders, ...prev] : prev;
            });
          }
        }
      }

      if (importedData.presets && importedData.presets.length > 0) {
        setPresets(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          // 同时用 (title + text) 做内容级去重
          const existingSignatures = new Set(prev.map(p => `${p.title || ''}|||${p.text || ''}`));
          let skipped = 0;
          const deduped = importedData.presets.filter(ip => {
            if (existingIds.has(ip.id)) { skipped++; return false; }
            const sig = `${ip.title || ''}|||${ip.text || ''}`;
            if (existingSignatures.has(sig)) { skipped++; return false; }
            existingIds.add(ip.id);
            existingSignatures.add(sig);
            return true;
          });
          if (deduped.length > 0) {
            importedPresetCount += deduped.length;
            return [...deduped, ...prev];
          } else {
            // 全部重复，不计入成功计数，但也不单独报错（避免和成功提示重叠）
            importedPresetCount += 0;
            presetSkippedCount = skipped;
            return prev;
          }
        });
        // 只有实际导入了才计入成功消息（在上方条件内已处理）
      }

      if (importedData.settings && importedData.settings.transConfig) {
        setTransConfig(migrateTransConfig(importedData.settings.transConfig));
        importedSettings = true;
      }
    }

    const messageParts = [];
    const actionText = snapshotImportMode === 'replace' && importedSnapshotCount > 0 ? '已清空当前快照并导入 ' : '已导入 ';

    if (importedWorkspacesCount > 0) messageParts.push(`${importedWorkspacesCount} 个工作区`);
    if (importedSnapshotCount > 0) messageParts.push(`${actionText}${importedSnapshotCount} 条快照`.trim());
    if (importedPresetCount > 0) messageParts.push(`${importedPresetCount} 条预设`);
    if (presetSkippedCount > 0) messageParts.push(`跳过 ${presetSkippedCount} 条重复预设`);
    if (importedSettings) messageParts.push('应用设置');

    const finalMsg = messageParts.length > 0 ? messageParts.join('，') : '导入完成（无新增数据）';
    setSuccessMessage(finalMsg);
  };

  const closeImportModeModal = () => {
    setPendingImportPayload(null);
  };

  const handleImportWithMode = (snapshotImportMode) => {
    if (!pendingImportPayload?.data) return closeImportModeModal();

    const importedData = pendingImportPayload.data;
    setPendingImportPayload(null);
    executeImport(importedData, snapshotImportMode);
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        const importedSnapshots = extractImportedSnapshots(importedData);

        if (importedSnapshots.length > 0 && savedPrompts.length > 0) {
          setPendingImportPayload({
            data: importedData,
            importedSnapshotCount: importedSnapshots.length,
            currentSnapshotCount: savedPrompts.length
          });
          return;
        }

        executeImport(importedData, 'merge');
      } catch (err) { setErrorMessage('导入失败: ' + err.message); }
    };
    reader.readAsText(file); e.target.value = null; 
  };

  const executeCopy = (text, id = null) => {
    if (!text) return;
    const textArea = document.createElement("textarea"); textArea.value = text; textArea.style.position = "fixed"; textArea.style.left = "-9999px";
    document.body.appendChild(textArea); textArea.focus(); textArea.select();
    try { document.execCommand('copy'); if (id) { setCopiedDrawerId(id); setTimeout(() => setCopiedDrawerId(null), 2000); } else { setCopied(true); setTimeout(() => setCopied(false), 2000); } } catch { /* fallback: clipboard API not available */ }
    textArea.remove();
  };

  // 快照/预设/文件夹操作函数 — 已移入 useDataStore hook

  const renderSnapshotCard = (snapshot, options = {}) => {
    const {
      isNested = false,
      accentColor = null,
      hideFolderLabel = false
    } = options;
    const previewText = snapshotPreviewMap[snapshot.id] || '';
    const isSelected = selectedSnapshotIdSet.has(snapshot.id);

    return (
      <div key={snapshot.id} className={isNested ? 'ml-4 pl-4 relative' : ''}>
        {isNested && (
          <span
            className="absolute left-0 top-5 h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: accentColor || getFolderColorOption(DEFAULT_FOLDER_COLOR).accent }}
          />
        )}

        <div
          onMouseEnter={(e) => openSnapshotPreview(snapshot.id, e.currentTarget)}
          onMouseLeave={scheduleCloseSnapshotPreview}
          className={`border rounded-xl p-4 transition-all group relative shadow-sm ${
            isDarkMode
              ? 'bg-zinc-900/80 border-blue-900/30 hover:border-blue-700'
              : 'bg-white border-gray-100 hover:border-blue-200'
          }`}
        >
          <div className="flex items-start gap-2">
            {isSnapshotBatchMode && (
              <button
                type="button"
                onClick={() => toggleSnapshotSelected(snapshot.id)}
                className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                  isSelected
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : (isDarkMode ? 'border-zinc-700 bg-zinc-950 text-zinc-500' : 'border-gray-300 bg-white text-gray-300')
                }`}
                title={isSelected ? '取消选择' : '选择快照'}
              >
                {isSelected && <Check size={12} strokeWidth={4} />}
              </button>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0 flex-1">
                  {editingSavedTitleId === snapshot.id ? (
                    <input
                      autoFocus
                      value={snapshot.title}
                      onChange={e => updateSavedTitle(snapshot.id, e.target.value)}
                      onBlur={() => setEditingSavedTitleId(null)}
                      onKeyDown={e => { if (e.key === 'Enter') setEditingSavedTitleId(null); }}
                      className={`text-sm font-bold border rounded px-1.5 py-0.5 outline-none w-full ${
                        isDarkMode ? 'bg-zinc-950 border-blue-700 text-zinc-200' : 'bg-blue-50 border-blue-300 text-gray-800'
                      }`}
                    />
                  ) : (
                    <button
                      type="button"
                      onDoubleClick={() => setEditingSavedTitleId(snapshot.id)}
                      className={`text-left text-sm font-bold truncate rounded px-1 transition-colors w-full ${
                        isDarkMode ? 'text-zinc-200 hover:bg-zinc-800' : 'text-gray-800 hover:bg-blue-50'
                      }`}
                      title="双击重命名"
                    >
                      {snapshot.title}
                    </button>
                  )}

                  <div className={`text-[10px] mt-1 flex items-center gap-1 ${isDarkMode ? 'text-zinc-500' : 'text-gray-400'}`}>
                    <Clock size={10} /> {new Date(snapshot.timestamp).toLocaleString()}
                  </div>
                </div>

                <button
                  onClick={() => deleteSnapshot(snapshot.id)}
                  className={`transition-colors opacity-0 group-hover:opacity-100 ${
                    isDarkMode ? 'text-zinc-600 hover:text-red-400' : 'text-gray-300 hover:text-red-500'
                  }`}
                  title="删除快照"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {snapshot.folderId && !hideFolderLabel && (() => {
                const folder = folders.find(f => f.id === snapshot.folderId);
                return folder ? (
                  <div className="mb-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                      isDarkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-blue-50 text-blue-700'
                    }`}>
                      <Folder size={12} />
                      {folder.name}
                    </span>
                  </div>
                ) : null;
              })()}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    updateActiveWorkspace({ inputs: snapshot.inputs, separator: snapshot.separator || '\n\n', name: snapshot.title, isDirty: false });
                    setIsDrawerOpen(false);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 active:scale-95 ${
                    isDarkMode ? 'bg-blue-900/20 text-blue-400 hover:bg-blue-900/40' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                  }`}
                >
                  <FileUp size={14} /> 加载
                </button>
                <button
                  onClick={() => executeCopy(previewText, snapshot.id)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 active:scale-95 ${
                    copiedDrawerId === snapshot.id
                      ? (isDarkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-green-100 text-green-700')
                      : (isDarkMode ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')
                  }`}
                >
                  {copiedDrawerId === snapshot.id ? <Check size={14} /> : <Copy size={14} />}
                  {copiedDrawerId === snapshot.id ? '已复制' : '复制'}
                </button>
                <button
                  onClick={() => promptAssignFolderForSnapshots([snapshot.id])}
                  className={`px-2.5 py-2 rounded-lg transition-colors ${
                    isDarkMode ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-blue-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-blue-600'
                  }`}
                  title="加入或移出文件夹"
                >
                  <FolderPlus size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ======== 预设卡片渲染函数（对标快照的 renderSnapshotCard）========
  const renderPresetCard = (preset, options = {}) => {
    const { isNested = false, accentColor = null, hideFolderLabel = false } = options;
    const isSelected = selectedPresetIdSet.has(preset.id);
    return (
      <div key={preset.id} className={isNested ? 'ml-4 pl-4 relative' : ''}>
        {isNested && (
          <span
            className="absolute left-0 top-5 h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: accentColor || getFolderColorOption(DEFAULT_FOLDER_COLOR).accent }}
          />
        )}
        <div className={`border rounded-xl p-4 transition-all group relative shadow-sm ${
          isDarkMode
            ? 'bg-zinc-900/80 border-purple-900/30 hover:border-purple-700'
            : 'bg-white border-purple-100 hover:border-purple-300'
        }`}>
          <div className="flex items-start gap-2">
            {/* 批量选择复选框 */}
            {isPresetBatchMode && (
              <button
                type="button"
                onClick={() => togglePresetSelected(preset.id)}
                className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                  isSelected
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : (isDarkMode ? 'border-zinc-700 bg-zinc-950 text-zinc-500' : 'border-gray-300 bg-white text-gray-300')
                }`}
                title={isSelected ? '取消选择' : '选择预设'}
              >
                {isSelected && <Check size={12} strokeWidth={4} />}
              </button>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0 flex-1">
                  {editingPresetTitleId === preset.id ? (
                    <input
                      autoFocus
                      value={preset.title}
                      onChange={e => setPresets(presets.map(px => px.id === preset.id ? {...px, title: e.target.value} : px))}
                      onBlur={() => updatePresetTitle(preset.id, preset.title)}
                      onKeyDown={e => e.key === 'Enter' && updatePresetTitle(preset.id, preset.title)}
                      className={`text-sm font-bold border rounded px-1.5 py-0.5 outline-none w-full ${
                        isDarkMode ? 'bg-zinc-950 border-purple-700 text-zinc-200' : 'bg-purple-50 border-purple-300 text-gray-800'
                      }`}
                    />
                  ) : (
                    <span
                      onDoubleClick={() => setEditingPresetTitleId(preset.id)}
                      className={`text-sm font-bold truncate pr-6 cursor-text rounded px-1 transition-colors ${
                        isDarkMode ? 'text-zinc-200 hover:bg-zinc-800' : 'text-gray-800 hover:bg-purple-50'
                      }`}
                      title="双击重命名"
                    >{preset.title}</span>
                  )}
                  {/* 文件夹标签 */}
                  {preset.folderId && !hideFolderLabel && (() => {
                    const folder = folders.find(f => f.id === preset.folderId);
                    return folder ? (
                      <div className="mt-1">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                          isDarkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-purple-50 text-purple-700'
                        }`}>
                          <Folder size={12} />
                          {folder.name}
                        </span>
                      </div>
                    ) : null;
                  })()}
                </div>
                <button onClick={() => deletePreset(preset.id)} className={`transition-colors opacity-0 group-hover:opacity-100 ${
                  isDarkMode ? 'text-zinc-600 hover:text-red-400' : 'text-gray-300 hover:text-red-500'
                }`} title="删除预设"><Trash2 size={16}/></button>
              </div>

              {/* 预设内容预览 */}
              <div className={`text-xs line-clamp-2 mb-3 p-2 rounded-lg border ${
                isDarkMode ? 'text-zinc-500 bg-zinc-950/50 border-zinc-800/50' : 'text-gray-500 bg-gray-50 border-gray-100'
              }`}>
                {preset.isTextMode ? preset.text : (preset.tags && preset.tags.length > 0 ? preset.tags.map(t => t.text).join(', ') : '空预设')}
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-2">
                <button
                  onClick={() => insertPreset(preset)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 active:scale-95 ${
                    isDarkMode ? 'bg-purple-900/20 text-purple-400 hover:bg-purple-900/40' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                  }`}
                >
                  <Plus size={14}/> 追加到工作区
                </button>
                {!isPresetBatchMode && (
                  <button
                    onClick={() => promptAssignFolderForPresets([preset.id])}
                    className={`px-2.5 py-2 rounded-lg transition-colors ${
                      isDarkMode ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-purple-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-purple-600'
                    }`}
                    title="加入或移出文件夹"
                  ><FolderPlus size={14}/></button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFolderSection = (group) => {
    const colorOption = getFolderColorOption(group.folderColor);
    const folderIconOption = getFolderIconOption(group.folderIcon);
    const FolderGlyph = folderIconOption.icon;
    const countLabel = isSnapshotSearchActive ? `${group.matchedCount} / ${group.totalCount}` : `${group.totalCount}`;
    const sectionHeaderClasses = group.isExpanded
      ? (isDarkMode ? colorOption.darkRow : colorOption.lightRow)
      : (isDarkMode ? 'border-zinc-800 bg-zinc-900/70' : 'border-gray-200 bg-white');
    const iconChipClasses = isDarkMode ? colorOption.darkIcon : colorOption.lightIcon;
    const badgeClasses = isDarkMode ? colorOption.darkBadge : colorOption.lightBadge;

    return (
      <section key={group.folderId} className="space-y-3">
        <div className="space-y-2">
          <div
            onClick={() => toggleFolderExpanded(group.folderId)}
            className={`flex items-center justify-between rounded-xl border px-3 py-2 transition-colors cursor-pointer ${sectionHeaderClasses}`}
          >
            <div className="min-w-0 flex flex-1 items-center gap-2">
              <div className={`flex items-center gap-2 min-w-0 flex-1 ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>
                <ChevronDown size={15} className={`shrink-0 transition-transform ${group.isExpanded ? 'rotate-0' : '-rotate-90'}`} />
                <span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${iconChipClasses}`}>
                  <FolderGlyph size={14} />
                </span>
              </div>

              <div className="min-w-0 flex-1" onClick={(e) => e.stopPropagation()}>
                {editingFolderId === group.folderId ? (
                  <input
                    autoFocus
                    value={editingFolderName}
                    onChange={(e) => setEditingFolderName(e.target.value)}
                    onBlur={() => commitFolderRename(group.folderId)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitFolderRename(group.folderId);
                      if (e.key === 'Escape') finishEditingFolder();
                    }}
                    className={`w-full rounded px-1.5 py-0.5 text-sm font-semibold outline-none border ${
                      isDarkMode ? 'bg-zinc-950 border-zinc-700 text-zinc-100' : 'bg-white border-gray-300 text-gray-800'
                    }`}
                  />
                ) : (
                  <button
                    type="button"
                    onDoubleClick={() => startEditingFolder(group.folderId, group.folderName)}
                    className={`max-w-full truncate rounded px-1.5 py-0.5 text-left text-sm font-semibold transition-colors ${
                      isDarkMode ? 'text-zinc-200 hover:bg-zinc-800' : 'text-gray-800 hover:bg-gray-100'
                    }`}
                    title="双击重命名文件夹"
                  >
                    {group.folderName}
                  </button>
                )}
              </div>
            </div>

            <div className="ml-3 flex shrink-0 items-center gap-2">
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${badgeClasses}`}>
                {countLabel}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (activeFolderStylePickerId === group.folderId) {
                    setActiveFolderStylePickerId(null);
                    setFolderStylePickerPos(null);
                  } else {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setFolderStylePickerPos({ top: rect.top, right: rect.right });
                    setActiveFolderStylePickerId(group.folderId);
                  }
                }}
                className={`rounded-lg p-1.5 transition-colors ${
                  isDarkMode ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                }`}
                title="设置文件夹图标和颜色"
              >
                <Palette size={14} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openFolderDeleteDialog(group.folderId, group.folderName, 'snapshot');
                }}
                className={`rounded-lg p-1.5 transition-colors ${
                  isDarkMode ? 'text-zinc-400 hover:bg-red-950/30 hover:text-red-300' : 'text-gray-500 hover:bg-red-50 hover:text-red-500'
                }`}
                title="删除文件夹"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>

        {group.isExpanded && (
          <div className="space-y-3">
            {group.items.map(snapshot => renderSnapshotCard(snapshot, {
              isNested: true,
              accentColor: colorOption.accent,
              hideFolderLabel: true
            }))}
          </div>
        )}
      </section>
    );
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
      <ErrorBoundary>
        <AuthPage
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          authView={authView}
          setAuthView={setAuthView}
          authForm={authForm}
          setAuthForm={setAuthForm}
          authError={authError}
          setAuthError={setAuthError}
          authLoading={authLoading}
          handleLogin={handleLogin}
          handleRegister={handleRegister}
        />
      </ErrorBoundary>
    );
  }

  // ================= 已登录：显示主界面 =================
  return (
    <ErrorBoundary>
    <div 
      className={`flex flex-col md:flex-row h-screen font-sans overflow-hidden relative transition-colors duration-300 ${isDarkMode ? 'bg-zinc-950 text-zinc-200' : 'bg-gray-50 text-gray-800'}`}
      style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
    >
      
      {/* 全局颜色面板遮挡层已移至面板内部 */}

      {/* ================= 左半区：多标签页工作区 ================= */}
      <div className={`w-full md:w-1/2 h-1/2 md:h-full flex flex-col border-r z-10 transition-colors duration-300 ${isDarkMode ? 'border-zinc-800 bg-zinc-900' : 'border-gray-200 bg-white'}`}>
        
        <div className={`sticky top-0 z-20 flex flex-col shadow-sm transition-colors duration-300 ${isDarkMode ? 'bg-zinc-900' : 'bg-white'}`}>
          <div className={`flex items-end px-2 pt-2 gap-1 overflow-x-auto overflow-y-hidden custom-scrollbar border-b ${isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-gray-200 border-gray-300'}`}>
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

            <button onClick={() => setIsLogPanelOpen(true)} className={`p-2 rounded-lg transition-colors border border-transparent ${isDarkMode ? 'text-zinc-500 hover:bg-zinc-800 hover:border-zinc-700' : 'text-gray-400 hover:bg-gray-100 hover:border-gray-200'}`} title="查看应用日志">
              <FileText size={20} />
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
      <Modals
        isDarkMode={isDarkMode}
        workspaces={workspaces}
        savedPrompts={savedPrompts}
        presets={presets}
        // 翻译设置
        isTransConfigModalOpen={isTransConfigModalOpen}
        setIsTransConfigModalOpen={setIsTransConfigModalOpen}
        transConfig={transConfig}
        setTransConfig={setTransConfig}
        expandedApiId={expandedApiId}
        confirmDeleteApiId={confirmDeleteApiId}
        handleUpdateCustomApi={handleUpdateCustomApi}
        handleDeleteCustomApi={handleDeleteCustomApi}
        toggleExpandApi={toggleExpandApi}
        setConfirmDeleteApiId={setConfirmDeleteApiId}
        handleAddCustomApi={handleAddCustomApi}
        handleSaveTransConfig={handleSaveTransConfig}
        // 文件夹删除
        folderDeleteTarget={folderDeleteTarget}
        setFolderDeleteTarget={setFolderDeleteTarget}
        handleDeleteFolderWithContents={handleDeleteFolderWithContents}
        handleDissolveFolder={handleDissolveFolder}
        // 标签页关闭警告
        isCloseWarningOpen={isCloseWarningOpen}
        setIsCloseWarningOpen={setIsCloseWarningOpen}
        pendingCloseTabId={pendingCloseTabId}
        setPendingCloseTabId={setPendingCloseTabId}
        executeCloseTab={executeCloseTab}
        // 保存快照（含关闭警告页共享的 setter）
        isSaveModalOpen={isSaveModalOpen}
        setIsSaveModalOpen={setIsSaveModalOpen}
        saveTitle={saveTitle}
        setSaveTitle={setSaveTitle}
        saveInputRef={saveInputRef}
        handlePreSave={handlePreSave}
        adjustSaveTitleNumber={adjustSaveTitleNumber}
        hasSaveTitleNumber={hasSaveTitleNumber}
        // 导出
        isExportModalOpen={isExportModalOpen}
        setIsExportModalOpen={setIsExportModalOpen}
        exportOptions={exportOptions}
        setExportOptions={setExportOptions}
        confirmExport={confirmExport}
        // 导入模式
        pendingImportPayload={pendingImportPayload}
        setPendingImportPayload={setPendingImportPayload}
        closeImportModeModal={closeImportModeModal}
        handleImportWithMode={handleImportWithMode}
        // 同名冲突
        isConflictModalOpen={isConflictModalOpen}
        setIsConflictModalOpen={setIsConflictModalOpen}
        conflictTarget={conflictTarget}
        handleOverwrite={handleOverwrite}
        handleAutoRename={handleAutoRename}
        handleCancelConflict={handleCancelConflict}
        // 重置确认
        isResetModalOpen={isResetModalOpen}
        setIsResetModalOpen={setIsResetModalOpen}
        confirmReset={confirmReset}
        // 修改密码
        showChangePassword={showChangePassword}
        setShowChangePassword={setShowChangePassword}
        changePasswordForm={changePasswordForm}
        setChangePasswordForm={setChangePasswordForm}
        handleChangePassword={handleChangePassword}
        authError={authError}
        setAuthError={setAuthError}
        // Toast
        errorMessage={errorMessage}
        successMessage={successMessage}
      />

      {isLogPanelOpen && <LogPanel isDarkMode={isDarkMode} setIsLogPanelOpen={setIsLogPanelOpen} />}
      <FolderStylePicker
        isDarkMode={isDarkMode}
        activeFolderStylePickerId={activeFolderStylePickerId}
        folderStylePickerPos={folderStylePickerPos}
        folders={folders}
        setActiveFolderStylePickerId={setActiveFolderStylePickerId}
        setFolderStylePickerPos={setFolderStylePickerPos}
        updateFolderAppearance={updateFolderAppearance}
      />

      <FolderPickerModal
        isDarkMode={isDarkMode}
        showFolderPicker={showFolderPicker}
        folderPickerSnapshotIds={folderPickerSnapshotIds}
        folderPickerTarget={folderPickerTarget}
        folders={folders}
        presets={presets}
        savedPrompts={savedPrompts}
        folderPickerCreating={folderPickerCreating}
        folderPickerNewName={folderPickerNewName}
        setFolderPickerNewName={setFolderPickerNewName}
        folderPickerDefaultName={folderPickerDefaultName}
        closeFolderPicker={closeFolderPicker}
        handlePickerSelectFolder={handlePickerSelectFolder}
        handlePickerRemoveFromFolder={handlePickerRemoveFromFolder}
        handlePickerStartCreating={handlePickerStartCreating}
        handlePickerCancelCreating={handlePickerCancelCreating}
        handlePickerConfirmCreating={handlePickerConfirmCreating}
      />

      {isPresetDrawerOpen && <PresetDrawer
        isDarkMode={isDarkMode}
        presets={presets}
        matchedPresets={matchedPresets}
        groupedFilteredPresets={groupedFilteredPresets}
        presetSearchQuery={presetSearchQuery}
        isPresetBatchMode={isPresetBatchMode}
        selectedPresetIds={selectedPresetIds}
        allVisiblePresetsSelected={allVisiblePresetsSelected}
        folders={folders}
        editingPresetTitleId={editingPresetTitleId}
        selectedPresetIdSet={selectedPresetIdSet}
        isPresetSearchActive={isPresetSearchActive}
        setPresetSearchQuery={setPresetSearchQuery}
        togglePresetBatchMode={togglePresetBatchMode}
        toggleSelectAllVisiblePresets={toggleSelectAllVisiblePresets}
        promptAssignFolderForPresets={promptAssignFolderForPresets}
        handleBatchDeletePresets={handleBatchDeletePresets}
        setEditingPresetTitleId={setEditingPresetTitleId}
        updatePresetTitle={updatePresetTitle}
        setPresets={setPresets}
        deletePreset={deletePreset}
        insertPreset={insertPreset}
        setIsPresetDrawerOpen={setIsPresetDrawerOpen}
        togglePresetFolderExpanded={togglePresetFolderExpanded}
        openFolderDeleteDialog={openFolderDeleteDialog}
        renderPresetCard={renderPresetCard}
      />}
      {isDrawerOpen && <SnapshotDrawer
        isDarkMode={isDarkMode}
        savedPrompts={savedPrompts}
        matchedSavedPrompts={matchedSavedPrompts}
        groupedFilteredSavedPrompts={groupedFilteredSavedPrompts}
        snapshotSearchQuery={snapshotSearchQuery}
        isSnapshotBatchMode={isSnapshotBatchMode}
        selectedSnapshotIds={selectedSnapshotIds}
        allVisibleSnapshotsSelected={allVisibleSnapshotsSelected}
        folders={folders}
        snapshotPreviewMap={snapshotPreviewMap}
        editingSavedTitleId={editingSavedTitleId}
        copiedDrawerId={copiedDrawerId}
        selectedSnapshotIdSet={selectedSnapshotIdSet}
        isSnapshotSearchActive={isSnapshotSearchActive}
        setSnapshotSearchQuery={setSnapshotSearchQuery}
        toggleSnapshotBatchMode={toggleSnapshotBatchMode}
        toggleSelectAllVisibleSnapshots={toggleSelectAllVisibleSnapshots}
        promptAssignFolderForSnapshots={promptAssignFolderForSnapshots}
        handleBatchDeleteSnapshots={handleBatchDeleteSnapshots}
        setEditingSavedTitleId={setEditingSavedTitleId}
        updateSavedTitle={updateSavedTitle}
        deleteSnapshot={deleteSnapshot}
        updateActiveWorkspace={updateActiveWorkspace}
        setIsDrawerOpen={setIsDrawerOpen}
        executeCopy={executeCopy}
        handleImport={handleImport}
        handleExportClick={handleExportClick}
        editingFolderId={editingFolderId}
        editingFolderName={editingFolderName}
        activeFolderStylePickerId={activeFolderStylePickerId}
        toggleFolderExpanded={toggleFolderExpanded}
        startEditingFolder={startEditingFolder}
        finishEditingFolder={finishEditingFolder}
        commitFolderRename={commitFolderRename}
        setEditingFolderName={setEditingFolderName}
        setActiveFolderStylePickerId={setActiveFolderStylePickerId}
        setFolderStylePickerPos={setFolderStylePickerPos}
        openFolderDeleteDialog={openFolderDeleteDialog}
        renderSnapshotCard={renderSnapshotCard}
        renderFolderSection={renderFolderSection}
      />}
      {isDrawerOpen && hoveredSnapshot && snapshotPreviewPosition && snapshotPreviewMap[hoveredSnapshot.id] && (
        <div
          onMouseEnter={clearSnapshotPreviewCloseTimer}
          onMouseLeave={scheduleCloseSnapshotPreview}
          className={`fixed z-[125] rounded-2xl border shadow-2xl backdrop-blur-sm ${
            isDarkMode ? 'border-zinc-800 bg-zinc-950/95 text-zinc-200' : 'border-gray-200 bg-white/95 text-gray-800'
          }`}
          style={{
            top: `${snapshotPreviewPosition.top}px`,
            left: `${snapshotPreviewPosition.left}px`,
            width: `${snapshotPreviewPosition.width}px`,
            maxHeight: `${snapshotPreviewPosition.maxHeight}px`
          }}
        >
          <div className={`px-4 py-3 border-b text-sm font-semibold ${
            isDarkMode ? 'border-zinc-800 text-zinc-200' : 'border-gray-200 text-gray-700'
          }`}>
            {hoveredSnapshot.title}
          </div>
          <div className={`px-4 py-3 text-xs leading-6 whitespace-pre-wrap break-words overflow-y-auto custom-scrollbar ${
            isDarkMode ? 'text-zinc-300' : 'text-gray-600'
          }`} style={{ maxHeight: `${snapshotPreviewPosition.maxHeight - 49}px` }}>
            {snapshotPreviewMap[hoveredSnapshot.id]}
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
    </ErrorBoundary>
  );
}
