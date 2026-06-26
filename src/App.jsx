import React, { useState, useEffect, useRef } from 'react';
import { GripVertical, Plus, Copy, Check, Trash2, Eye, EyeOff, Save, Bookmark, X, Clock, FileUp, Loader2, RotateCcw, AlignLeft, LayoutGrid, Palette, Library, FolderPlus, ChevronUp, ChevronDown, CircleAlert, Sun, Moon, Settings, FileText, LogOut, Folder, CheckCircle2, Sparkles, MoreHorizontal, HelpCircle } from 'lucide-react';
import { generateId, API_BASE, BG_COLORS, DEFAULT_FOLDER_COLOR, DEFAULT_FOLDER_ICON, getFolderColorOption, getColorClasses, getColorHeaderClasses, getColorBodyClasses, getColorBodyStyle, getColorHoverClasses, getColorControlClasses, getColorCheckClasses, getColorTagClasses, getPickerButtonClasses } from './lib/constants';
import { cleanDataForStorage, parseTextToTags, syncTextFromTags, normalizeTagDelimitersForOrder, buildOutputTextFromInputs, normalizeSnapshotRecord, normalizeSavedPromptsList, extractImportedSnapshots, sanitizeInputs, migrateTransConfig, createDefaultWorkspace, removeGarbage, buildApiUrl } from './lib/parser';
import { appLogger } from './lib/logger';

import { useTheme } from './hooks/useTheme';
import { useAuth } from './hooks/useAuth';
import { useTransConfig } from './hooks/useTransConfig';
import { useWorkspaces } from './hooks/useWorkspaces';
import { useDataStore } from './hooks/useDataStore';
import Modals from './components/Modals';
import AuthPage from './components/AuthPage';
import PresetDrawer from './components/PresetDrawer';
import SnapshotDrawer from './components/SnapshotDrawer';
import FolderStylePicker from './components/FolderStylePicker';
import FolderPickerModal from './components/FolderPickerModal';


// section
const FOLDER_ICON_OPTIONS = [
  { id: 'folder', label: '文件夹', icon: Folder },
  { id: 'bookmark', label: '书签', icon: Bookmark },
  { id: 'file-text', label: '文本', icon: FileText },
  { id: 'library', label: '库', icon: Library },
  { id: 'palette', label: '调色板', icon: Palette },
  { id: 'align-left', label: '列表', icon: AlignLeft }
];

const getFolderIconOption = (iconId) => (
  FOLDER_ICON_OPTIONS.find(option => option.id === iconId) || FOLDER_ICON_OPTIONS[0]
);

const MAX_WORKSPACE_TABS = 10;

const OPTIMIZE_PLATFORMS = {
  nanobanana2: {
    label: 'Nano Banana 2',
    natural: 'Rewrite the user prompt for Nano Banana 2 image generation. Keep the original intent, subject, relationships, and constraints. Make it concise, visual, and production-ready. Emphasize subject, composition, camera angle, lighting, material, style, and important details. Avoid tag soup and avoid adding unsupported claims. Output only the optimized prompt.',
    structured: 'Rewrite the user prompt for Nano Banana 2 image generation as a structured prompt. Keep the original intent and constraints. Use these exact section labels: Subject, Scene, Composition, Lighting, Style, Details, Constraints, Negative. Keep each section concise and useful. Output only the structured prompt.'
  },
  gptImage2: {
    label: 'GPT Image 2',
    natural: 'Rewrite the user prompt for GPT Image 2 image generation. Preserve intent, subject identity, spatial relationships, text requirements, and visual constraints. Write a clear instruction-style prompt with enough context for accurate image generation. Avoid markdown and extra commentary. Output only the optimized prompt.',
    structured: 'Rewrite the user prompt for GPT Image 2 image generation as a structured prompt. Preserve intent, relationships, text requirements, and constraints. Use these exact section labels: Objective, Subject, Environment, Composition, Style, Lighting, Key Details, Constraints, Negative. Output only the structured prompt.'
  }
};

const OPTIMIZE_MODES = {
  natural: '自然语言',
  structured: '结构化'
};

const buildPromptOptimizerSystemPrompt = (platform, mode, language) => {
  const platformConfig = OPTIMIZE_PLATFORMS[platform] || OPTIMIZE_PLATFORMS.nanobanana2;
  const rule = platformConfig[mode] || platformConfig.natural;
  const languageRule = language === 'en'
    ? 'Output language: English. Translate or rewrite all ordinary descriptive content into natural English while preserving proper nouns, model/platform names, quoted required text, and technical tokens that should remain unchanged.'
    : 'Output language: Simplified Chinese. Use clear, production-ready Chinese. Preserve proper nouns, model/platform names, quoted required text, and technical tokens that should remain unchanged.';
  return [
    'You are a senior image prompt editor.',
    rule,
    languageRule,
    'Do not translate proper nouns unless the user prompt clearly asks for translation.',
    'Do not explain your changes. Do not wrap the result in quotes.'
  ].join('\n');
};



// section
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
          <h2 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>应用发生错误</h2>
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
  // section
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // section
  const { isDarkMode, setIsDarkMode } = useTheme();
  const {
    aiConfig, setAiConfig,
    appSettings, setAppSettings, updateAppSettings,
    addProvider, updateProvider, deleteProvider,
    setTranslationProviderId, setConversionProviderId,
    transConfig, setTransConfig,
    setExpandedApiId,
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
  } = useWorkspaces({ maxWorkspaceTabs: MAX_WORKSPACE_TABS });
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

  // section
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
  const [isSnapshotLimitModalOpen, setIsSnapshotLimitModalOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState({ workspaces: true, snapshots: true, presets: true, settings: true });
  const [pendingImportPayload, setPendingImportPayload] = useState(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false); 
  const [saveTitle, setSaveTitle] = useState('');
  const [snapshotImageDataUrl, setSnapshotImageDataUrl] = useState('');
  const [snapshotImagePlatform, setSnapshotImagePlatform] = useState('nanobanana2');
  const [snapshotImageCustomPlatform, setSnapshotImageCustomPlatform] = useState('');
  const [activeColorPickerId, setActiveColorPickerId] = useState(null);
  const [savedCollapseState, setSavedCollapseState] = useState(null);
  const [postProcessTranslateEnabled, setPostProcessTranslateEnabled] = useState(false);
  const [postProcessOptimizeEnabled, setPostProcessOptimizeEnabled] = useState(true);
  const [translationTargetLanguage, setTranslationTargetLanguage] = useState('en');
  const [optimizePlatform, setOptimizePlatform] = useState('nanobanana2');
  const [optimizeMode, setOptimizeMode] = useState('natural');
  const [optimizedOutputs, setOptimizedOutputs] = useState({});
  const [postProcessedResult, setPostProcessedResult] = useState(null);
  const [isPostProcessing, setIsPostProcessing] = useState(false);
  const [isShowingProcessedOutput, setIsShowingProcessedOutput] = useState(false);
  const [isPostProcessHelpOpen, setIsPostProcessHelpOpen] = useState(false);
  
  const [draggedTagId, setDraggedTagId] = useState(null);
  const [dragOverInputId, setDragOverInputId] = useState(null); 
  const [editingTagId, setEditingTagId] = useState(null);
  const clickTimeoutRef = useRef(null);

  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [conflictTarget, setConflictTarget] = useState(null);
  const saveInputRef = useRef(null);

  // section
  const inputs = activeWorkspace.inputs;
  const separator = activeWorkspace.separator;
  // section

  useEffect(() => {
    if (errorMessage) { const timer = setTimeout(() => setErrorMessage(''), 5000); return () => clearTimeout(timer); }
  }, [errorMessage]);

  useEffect(() => {
    if (successMessage) { const timer = setTimeout(() => setSuccessMessage(''), 4000); return () => clearTimeout(timer); }
  }, [successMessage]);

  useEffect(() => { cleanupStaleState({ dataLoaded }); }, [savedPrompts, folders, dataLoaded, cleanupStaleState]);

  // section
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

    const loadServerData = async () => {
      if (!authToken) {
        if (isMounted) setDataLoaded(false);
        return;
      }

      try {
        const res = await authFetch(`${API_BASE}/data`);
        if (res.status === 401) {
          setCurrentUser(null);
          setAuthToken(null);
          return;
        }
        if (!res.ok) throw new Error('数据加载失败');
        const data = await res.json();
        if (!isMounted) return;
        processLoadedWorkspace(data);
        if (data.savedPrompts) setSavedPrompts(normalizeSavedPromptsList(data.savedPrompts));
        if (Array.isArray(data.folders)) setFolders(data.folders);
        if (Array.isArray(data.presets)) setPresets(data.presets);
        if (data.transConfig) setTransConfig(migrateTransConfig(data.transConfig));
        appLogger.info('init', 'Docker server data loaded');
      } catch (e) {
        appLogger.error('init', 'Docker server data load failed', e.message);
        setErrorMessage('数据加载失败，请确认服务已启动');
      } finally {
        if (isMounted) setDataLoaded(true);
      }
    };
    
    setDataLoaded(false);
    loadServerData();

    return () => { isMounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]);


  // section

  // section
  useEffect(() => {
    if (!dataLoaded) return;

    setSyncStatus('syncing');
    const timer = setTimeout(async () => {
      try {
        if (!authToken) return;
        const cleanPayload = { 
          workspaces: workspaces.map(w => ({ ...w, inputs: cleanDataForStorage(w.inputs) })), 
          activeWorkspaceId 
        };
        const res = await authFetch(`${API_BASE}/workspace`, { method: 'POST', body: JSON.stringify(cleanPayload) });
        if (res.status === 401) { setCurrentUser(null); setAuthToken(null); return; }
        if (!res.ok) throw new Error('Save workspace failed');
        setSyncStatus('synced');
      } catch (e) { setSyncStatus('error'); appLogger.error('sync', 'Save workspace failed', e.message); }
    }, 1000);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaces, activeWorkspaceId, dataLoaded, authToken, authFetch, setCurrentUser, setAuthToken]);

  // section
  useEffect(() => {
    if (!dataLoaded) return;

    const timer = setTimeout(async () => {
      try {
        if (!authToken) return;
        const res = await authFetch(`${API_BASE}/saved`, { method: 'POST', body: JSON.stringify(savedPrompts) });
        if (res.status === 401) { setCurrentUser(null); setAuthToken(null); return; }
        if (!res.ok) throw new Error('Save snapshots failed');
      } catch (e) { console.error('Save snapshots failed', e); appLogger.error('sync', 'Save snapshots failed', e.message); }
    }, 800);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedPrompts, dataLoaded, authToken, authFetch, setCurrentUser, setAuthToken]);

  // section
  useEffect(() => {
    if (!dataLoaded) return;

    const timer = setTimeout(async () => {
      try {
        if (!authToken) return;
        const res = await authFetch(`${API_BASE}/folders`, { method: 'POST', body: JSON.stringify(folders) });
        if (res.status === 401) { setCurrentUser(null); setAuthToken(null); return; }
        if (!res.ok) throw new Error('Save folders failed');
      } catch (e) { console.error('Save folders failed', e); appLogger.error('sync', 'Save folders failed', e.message); }
    }, 800);
    return () => clearTimeout(timer);
  }, [folders, dataLoaded, authToken, authFetch, setCurrentUser, setAuthToken]);

  // section
  useEffect(() => {
    if (!dataLoaded) return;

    const timer = setTimeout(async () => {
      try {
        if (!authToken) return;
        const res = await authFetch(`${API_BASE}/presets`, { method: 'POST', body: JSON.stringify(presets) });
        if (res.status === 401) { setCurrentUser(null); setAuthToken(null); return; }
        if (!res.ok) throw new Error('Save presets failed');
      } catch (e) { console.error('Save presets failed', e); appLogger.error('sync', 'Save presets failed', e.message); }
    }, 800);
    return () => clearTimeout(timer);
  }, [presets, dataLoaded, authToken, authFetch, setCurrentUser, setAuthToken]);

  // section

  // section
  const invalidateCache = (input) => ({ ...input, zhCache: input.lang === 'en' ? null : input.zhCache, enCache: input.lang === 'zh' ? null : input.enCache });

  // section
  const handleSaveTransConfig = (nextAiConfig = aiConfig, nextAppSettings = appSettings) => {
    // section
    if (nextAiConfig.translationProviderId !== 'google') {
      const activeApi = nextAiConfig.providers.find(p => p.id === nextAiConfig.translationProviderId);
      if (activeApi && (!activeApi.apiBase.trim() || !activeApi.apiKey.trim() || !activeApi.modelName.trim())) {
        setErrorMessage('翻译服务配置不完整，请在设置中补全。');
        return;
      }
    }
    setAiConfig(nextAiConfig);
    setAppSettings(nextAppSettings);
    setIsTransConfigModalOpen(false);
    setExpandedApiId(null);
    setSuccessMessage('设置已保存');
  };

  // section
  const detectPromptLanguage = (text) => {
    const cjkCount = (text.match(/[\u3400-\u9fff]/g) || []).length;
    const latinCount = (text.match(/[A-Za-z]/g) || []).length;
    return cjkCount > 0 && cjkCount >= latinCount * 0.15 ? 'zh' : 'en';
  };

  const translatePromptText = async (textToTranslate, targetLanguage) => {
    let translatedStr = '';
    const targetLabel = targetLanguage === 'zh' ? 'Simplified Chinese' : 'English';

    if (aiConfig.translationProviderId === 'google') {
      const googleTarget = targetLanguage === 'zh' ? 'zh-CN' : 'en';
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${googleTarget}&dt=t&q=${encodeURIComponent(textToTranslate)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Google 翻译请求失败');
      const data = await res.json();
      translatedStr = data[0].map(x => x[0]).join('');
    } else {
      const activeApi = aiConfig.providers.find(a => a.id === aiConfig.translationProviderId);
      if (!activeApi) throw new Error('未找到当前翻译服务，请在设置中重新选择。');
      const apiUrl = buildApiUrl(activeApi.apiBase);
      let res;
      try {
        res = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${activeApi.apiKey}` },
          body: JSON.stringify({
            model: activeApi.modelName,
            messages: [
              {
                role: 'system',
                content: `You are a professional prompt translator. Translate the given prompt to ${targetLabel}. Keep prompt weights, brackets, quoted required text, proper nouns, model names, and special punctuation intact. Output only the translation result without quotes or explanations.`
              },
              { role: 'user', content: textToTranslate }
            ]
          })
        });
      } catch (fetchErr) {
        throw new Error('请求失败');
      }
      if (!res.ok) {
        try { await res.json(); } catch { /* ignore */ }
        throw new Error('请求失败');
      }
      const data = await res.json();
      translatedStr = data.choices?.[0]?.message?.content?.trim() || '';
      if (!translatedStr) throw new Error('AI 返回内容为空');
    }

    return translatedStr;
  };

  const optimizePromptText = async (sourceText, outputLanguage) => {
    const activeApi = aiConfig.providers.find(a => a.id === aiConfig.conversionProviderId);
    if (!aiConfig.conversionProviderId || !activeApi) {
      throw new Error('请先在设置中选择提示词优化使用的 AI 服务');
    }

    if (!activeApi.apiBase?.trim() || !activeApi.apiKey?.trim() || !activeApi.modelName?.trim()) {
      throw new Error('提示词优化服务配置不完整，请补全 API 地址、密钥和模型名称。');
    }

    const apiUrl = buildApiUrl(activeApi.apiBase);
    let res;
    try {
      res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeApi.apiKey}`
        },
        body: JSON.stringify({
          model: activeApi.modelName,
          temperature: 0.35,
          messages: [
            { role: 'system', content: buildPromptOptimizerSystemPrompt(optimizePlatform, optimizeMode, outputLanguage) },
            { role: 'user', content: sourceText }
          ]
        })
      });
    } catch {
      throw new Error('提示词优化请求失败');
    }

    if (!res.ok) throw new Error('提示词优化请求失败');
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim() || '';
    if (!text) throw new Error('AI 返回内容为空');
    return text;
  };

  const saveToPresets = async (input) => {
    const presetId = generateId();
    const presetData = cleanDataForStorage([{
      id: presetId, title: input.title || '未命名预设', text: input.text || '', tags: input.tags || [],
      isTextMode: input.isTextMode || false, color: input.color || 'bg-white', isCollapsed: false, showTitle: input.showTitle || false, lang: input.lang || 'zh'
    }])[0];
    presetData.timestamp = Date.now();

    const newList = [presetData, ...presets];
    setPresets(newList);
    setSuccessMessage('已保存到预设库');
  };

  const insertPreset = (preset) => {
    setInputs(prev => [...prev, {
      id: generateId(), title: preset.title || '预设片段', text: preset.text || '', tags: (preset.tags || []).map(t => ({ ...t, id: generateId() })),
      isTextMode: preset.isTextMode || false, color: preset.color || 'bg-white', isActive: true, isCollapsed: false, showTitle: preset.showTitle || false, lang: preset.lang || 'zh', zhCache: null, enCache: null
    }]);
    setSuccessMessage('已插入预设');
  };

  const deletePreset = async (id) => {
    const newList = presets.filter(p => p.id !== id);
    setPresets(newList);
  };

  const updatePresetTitle = async (id, newTitle) => {
    if (!newTitle.trim()) return setEditingPresetTitleId(null);
    const newList = presets.map(p => p.id === id ? {...p, title: newTitle} : p);
    setPresets(newList);
    setEditingPresetTitleId(null);
  };

  // section

  // section
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

  // section
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
              if (!lastTag.delimiter || !lastTag.delimiter.match(/[,\uFF0C\u3001]\s*$/)) lastTag.delimiter = (lastTag.delimiter || '') + ', ';
          }
          newTags.push(...parsedTags);
      } else if (textToParse.trim() === '' && newTags.length > 0) newTags[newTags.length - 1].delimiter += textToParse;
      return invalidateCache({ ...input, tags: newTags, text: syncTextFromTags(newTags) });
    }));
  };

  const handleTagInputKeyDown = (e, inputId) => {
    if (e.key === 'Enter') { e.preventDefault(); addTagsFromText(inputId, e.target.value, ''); e.target.value = ''; } 
    else if (e.key === ',' || e.key === '\uFF0C' || e.key === '\u3001') { e.preventDefault(); addTagsFromText(inputId, e.target.value, e.key === '\u3001' ? '\u3001' : ','); e.target.value = ''; }
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
  const outputSourceText = outputText.trim();
  const optimizedPlatformLabel = OPTIMIZE_PLATFORMS[optimizePlatform]?.label || 'Nano Banana 2';
  const optimizedModeLabel = OPTIMIZE_MODES[optimizeMode] || '自然语言';
  const selectedOptimizeProvider = (aiConfig.providers || []).find(provider => provider.id === aiConfig.conversionProviderId);
  const selectedOptimizeProviderLabel = selectedOptimizeProvider
    ? `${selectedOptimizeProvider.name || selectedOptimizeProvider.modelName} · ${selectedOptimizeProvider.modelName || '未填写模型'}`
    : '选择提示词优化使用的大模型服务';
  const isPostProcessedResultCurrent = Boolean(
    postProcessedResult?.text &&
    postProcessedResult.sourceText === outputSourceText &&
    postProcessedResult.translateEnabled === postProcessTranslateEnabled &&
    postProcessedResult.optimizeEnabled === postProcessOptimizeEnabled &&
    (!postProcessTranslateEnabled || postProcessedResult.targetLanguage === translationTargetLanguage) &&
    (!postProcessOptimizeEnabled || (
      postProcessedResult.platform === optimizePlatform &&
      postProcessedResult.mode === optimizeMode &&
      postProcessedResult.providerId === aiConfig.conversionProviderId
    ))
  );
  const displayedOutputText = isShowingProcessedOutput && isPostProcessedResultCurrent
    ? postProcessedResult.text
    : outputText;
  const previewContentLabel = isShowingProcessedOutput && isPostProcessedResultCurrent ? '处理后' : '处理前';
  const hasSelectedPostProcess = postProcessTranslateEnabled || postProcessOptimizeEnabled;
  const postProcessSummary = [
    postProcessTranslateEnabled ? `翻译为${translationTargetLanguage === 'zh' ? '中文' : '英文'}` : '',
    postProcessOptimizeEnabled ? `${optimizedPlatformLabel} / ${optimizedModeLabel}` : ''
  ].filter(Boolean).join(' → ');

  const addInput = () => setInputs(prev => [...prev, { id: generateId(), text: '', title: '片段 ' + (prev.length + 1), isTextMode: true, tags: [], collapsed: false, color: 'bg-white', lang: 'zh' }]);
  const removeInput = (id) => { setInputs(prev => prev.length > 1 ? prev.filter(i => i.id !== id) : prev); };
  const handleTitleChange = (id, newTitle) => setInputs(prev => prev.map(i => i.id === id ? { ...i, title: newTitle } : i));
  const handleTextChange = (id, text) => setInputs(prev => prev.map(i => i.id === id ? invalidateCache({ ...i, text: removeGarbage(text) }) : i));
  const toggleActive = (id) => setInputs(prev => prev.map(i => i.id === id ? { ...i, isActive: !i.isActive } : i));
  const toggleCollapse = (id) => setInputs(prev => prev.map(i => i.id === id ? { ...i, isCollapsed: !i.isCollapsed } : i));
  const toggleShowTitle = (id) => setInputs(prev => prev.map(i => i.id === id ? { ...i, showTitle: !i.showTitle } : i));
  const changeInputColor = (id, newColor, closePicker = true) => { setInputs(prev => prev.map(i => i.id === id ? { ...i, color: newColor } : i)); if (closePicker) setActiveColorPickerId(null); };
  
  const confirmReset = () => {
    setInputs([
        { id: generateId(), text: '', title: '首句', isTextMode: true, tags: [], collapsed: false, color: 'bg-white', lang: 'zh' },
        { id: generateId(), text: '', title: '描述', isTextMode: true, tags: [], collapsed: false, color: 'bg-white', lang: 'zh' }
    ]);
    setSeparator('\\n\\n'); setIsResetModalOpen(false);
  };

  const isInputEmpty = (input) => input.isTextMode ? (!input.text || input.text.trim() === '') : (!input.tags || input.tags.length === 0);
  const handleExecutePostProcessing = async () => {
    if (!outputSourceText || !hasSelectedPostProcess || isPostProcessing) return;
    setIsPostProcessing(true);
    try {
      let processedText = outputSourceText;
      const appliedSteps = [];
      let currentLanguage = detectPromptLanguage(processedText);

      if (postProcessTranslateEnabled) {
        if (currentLanguage !== translationTargetLanguage) {
          processedText = await translatePromptText(processedText, translationTargetLanguage);
          currentLanguage = translationTargetLanguage;
          appliedSteps.push('translation');
        } else {
          appliedSteps.push('translation-skipped');
        }
      }

      if (postProcessOptimizeEnabled) {
        processedText = await optimizePromptText(processedText, currentLanguage);
        appliedSteps.push('optimization');
      }

      const result = {
        sourceText: outputSourceText,
        text: processedText,
        steps: appliedSteps,
        translateEnabled: postProcessTranslateEnabled,
        optimizeEnabled: postProcessOptimizeEnabled,
        targetLanguage: translationTargetLanguage,
        platform: optimizePlatform,
        mode: optimizeMode,
        providerId: aiConfig.conversionProviderId,
        updatedAt: Date.now()
      };
      setPostProcessedResult(result);
      setOptimizedOutputs(prev => ({
        ...prev,
        postProcessedResult: result
      }));
      setIsShowingProcessedOutput(true);
      setSuccessMessage('提示词后处理完成');
    } catch (err) {
      if (String(err?.message || '').includes('设置')) setIsTransConfigModalOpen(true);
      setErrorMessage(err?.message || '提示词后处理失败');
    } finally {
      setIsPostProcessing(false);
    }
  };

  useEffect(() => {
    setIsShowingProcessedOutput(false);
  }, [outputSourceText, postProcessTranslateEnabled, postProcessOptimizeEnabled, translationTargetLanguage, optimizePlatform, optimizeMode, aiConfig.conversionProviderId]);

  // section
  const handleExportClick = () => {
    setIsExportModalOpen(true);
  };

  const adjustSaveTitleNumber = (delta) => {
    let title = saveTitle.trim() || activeWorkspace.name || '工作区';
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
  const clearSnapshotImageForm = () => {
    setSnapshotImageDataUrl('');
    setSnapshotImagePlatform('nanobanana2');
    setSnapshotImageCustomPlatform('');
  };

  const handleSaveClick = () => {
    setSaveTitle(activeWorkspace.name || '工作区');
    clearSnapshotImageForm();
    setIsSaveModalOpen(true);
    setTimeout(() => saveInputRef.current?.focus(), 100);
  };

  const handlePreSave = () => {
    const finalTitle = saveTitle.trim() || activeWorkspace.name || '工作区';
    if (savedPrompts.find(p => p.title === finalTitle)) { setConflictTarget(savedPrompts.find(p => p.title === finalTitle)); setIsConflictModalOpen(true); } 
    else executeSave(finalTitle);
  };

  const executeSave = (finalTitle, overwriteId = null) => {
    const snapshotId = overwriteId || generateId();
    const imagePlatformLabel = snapshotImagePlatform === 'custom'
      ? snapshotImageCustomPlatform.trim()
      : (snapshotImagePlatform === 'gptImage2' ? 'GPT Image 2' : 'Nano Banana 2');
    const newSnapshot = normalizeSnapshotRecord({
      id: snapshotId,
      title: finalTitle,
      inputs: cleanDataForStorage(inputs),
      separator: separator || '\\n\\n',
      timestamp: Date.now(),
      folderId: null,
      optimizedOutputs: { ...optimizedOutputs, postProcessedResult },
      previewImage: snapshotImageDataUrl
        ? { dataUrl: snapshotImageDataUrl, platform: imagePlatformLabel || '自定义' }
        : null
    });
    setIsConflictModalOpen(false); setIsSaveModalOpen(false); setIsDrawerOpen(true); clearSnapshotImageForm();
    
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
    
    if (!hasData) return setErrorMessage('Nothing to export');

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
      // section
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
        // section
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

        // section
        if (importedData.folders && Array.isArray(importedData.folders)) {
          // section
          setFolders(prev => {
            const existingNameScopes = new Set(prev.map(f => `${f.name.trim().toLowerCase()}|||${f.scope || 'snapshot'}`));
            const newFolders = importedData.folders
              .map(f => ({ ...f, scope: f.scope || 'snapshot' }))
              .filter(f => !existingNameScopes.has(`${f.name.trim().toLowerCase()}|||${f.scope}`));
            return newFolders.length > 0 ? [...newFolders, ...prev] : prev;
          });
        } else {
          // section
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
          // section
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
            // section
            importedPresetCount += 0;
            presetSkippedCount = skipped;
            return prev;
          }
        });
        // section
      }

      if (importedData.settings && importedData.settings.transConfig) {
        setTransConfig(migrateTransConfig(importedData.settings.transConfig));
        importedSettings = true;
      }
    }

    const messageParts = [];
    const actionText = snapshotImportMode === 'replace' && importedSnapshotCount > 0 ? '已替换 ' : '已导入 ';

    if (importedWorkspacesCount > 0) messageParts.push(String(importedWorkspacesCount) + ' 个工作区');
    if (importedSnapshotCount > 0) messageParts.push(actionText + String(importedSnapshotCount) + ' 个快照');
    if (importedPresetCount > 0) messageParts.push(String(importedPresetCount) + ' 个预设');
    if (presetSkippedCount > 0) messageParts.push('已跳过 ' + String(presetSkippedCount) + ' 个重复预设');
    if (importedSettings) messageParts.push('设置');

    const finalMsg = messageParts.length > 0 ? '导入完成：' + messageParts.join('，') : '导入完成';
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
      } catch (err) { setErrorMessage('操作失败'); }
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

  const loadSnapshotAsWorkspace = (snapshot) => {
    if (workspaces.length >= MAX_WORKSPACE_TABS) {
      setIsSnapshotLimitModalOpen(true);
      return;
    }

    const newWorkspaceId = generateId();
    const newWorkspace = {
      ...createDefaultWorkspace(workspaces.length + 1),
      id: newWorkspaceId,
      name: snapshot.title || `快照 ${workspaces.length + 1}`,
      inputs: sanitizeInputs(snapshot.inputs || []),
      separator: snapshot.separator || '\n\n',
      isDirty: false
    };

    setWorkspaces(prev => [...prev, newWorkspace]);
    setActiveWorkspaceId(newWorkspaceId);
    setOptimizedOutputs(snapshot.optimizedOutputs || {});
    setPostProcessedResult(snapshot.optimizedOutputs?.postProcessedResult || null);
    setIsShowingProcessedOutput(false);
    setIsDrawerOpen(false);
    setSuccessMessage('已在新工作区载入快照');
  };

  // section

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
          className="app-subpanel p-4 transition-all group relative hover:border-[color-mix(in_srgb,var(--app-brand)_58%,transparent)]"
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
                title={isSelected ? '取消选择' : '选择'}
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
                      className="app-input text-sm font-bold rounded px-1.5 py-0.5 w-full"
                    />
                  ) : (
                    <button
                      type="button"
                      onDoubleClick={() => setEditingSavedTitleId(snapshot.id)}
                      className="text-left text-sm font-bold truncate rounded px-1 transition-colors w-full text-[var(--app-text)] hover:bg-[var(--app-brand-soft)]"
                      title={snapshot.title}
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
                  className={isDarkMode ? 'transition-colors opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400' : 'transition-colors opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500'}
                  title="删除快照"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {snapshot.folderId && !hideFolderLabel && (() => {
                const folder = folders.find(f => f.id === snapshot.folderId);
                return folder ? (
                  <div className="mb-3">
                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium bg-[var(--app-brand-soft)] text-[var(--app-brand)]">
                      <Folder size={12} />
                      {folder.name}
                    </span>
                  </div>
                ) : null;
              })()}

              <div className="flex gap-2">
                <button
                  onClick={() => loadSnapshotAsWorkspace(snapshot)}
                  className="flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 active:scale-95 bg-[var(--app-brand-soft)] text-[var(--app-brand)] hover:bg-[color-mix(in_srgb,var(--app-brand)_18%,transparent)]"
                >
                  <FileUp size={14} /> 载入快照
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
                  title="加入文件夹"
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

  // section
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
        <div className="app-subpanel p-4 transition-all group relative hover:border-[color-mix(in_srgb,var(--app-brand)_58%,transparent)]">
          <div className="flex items-start gap-2">
            {/* section */}
            {isPresetBatchMode && (
              <button
                type="button"
                onClick={() => togglePresetSelected(preset.id)}
                className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                  isSelected
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : (isDarkMode ? 'border-zinc-700 bg-zinc-950 text-zinc-500' : 'border-gray-300 bg-white text-gray-300')
                }`}
                title={isSelected ? '取消选择' : '选择'}
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
                      className="app-input text-sm font-bold rounded px-1.5 py-0.5 w-full"
                    />
                  ) : (
                    <span
                      onDoubleClick={() => setEditingPresetTitleId(preset.id)}
                      className="text-sm font-bold truncate pr-6 cursor-text rounded px-1 transition-colors text-[var(--app-text)] hover:bg-[var(--app-brand-soft)]"
                      title={preset.title}
                    >{preset.title}</span>
                  )}
                  {/* section */}
                  {preset.folderId && !hideFolderLabel && (() => {
                    const folder = folders.find(f => f.id === preset.folderId);
                    return folder ? (
                      <div className="mt-1">
                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium bg-[var(--app-brand-soft)] text-[var(--app-brand)]">
                          <Folder size={12} />
                          {folder.name}
                        </span>
                      </div>
                    ) : null;
                  })()}
                </div>
                <button onClick={() => deletePreset(preset.id)} className={`transition-colors opacity-0 group-hover:opacity-100 ${
                  isDarkMode ? 'text-zinc-600 hover:text-red-400' : 'text-gray-300 hover:text-red-500'
                }`} title="删除预设">
                  <Trash2 size={16} />
                </button>
              </div>

              {/* section */}
              <div className={`text-xs line-clamp-2 mb-3 p-2 rounded-lg border ${
                isDarkMode ? 'text-zinc-500 bg-zinc-950/50 border-zinc-800/50' : 'text-gray-500 bg-gray-50 border-gray-100'
              }`}>
                {preset.isTextMode ? preset.text : (preset.tags && preset.tags.length > 0 ? preset.tags.map(t => t.text).join(', ') : '无内容')}
              </div>

              {/* section */}
              <div className="flex gap-2">
                <button
                  onClick={() => insertPreset(preset)}
                  className="flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 active:scale-95 bg-[var(--app-brand-soft)] text-[var(--app-brand)] hover:bg-[color-mix(in_srgb,var(--app-brand)_18%,transparent)]"
                >
                  <Plus size={14}/> 插入预设
                </button>
                {!isPresetBatchMode && (
                  <button
                    onClick={() => promptAssignFolderForPresets([preset.id])}
                    className="app-secondary-action px-2.5 py-2 rounded-lg transition-colors"
                    title="加入文件夹"
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
                    title="重命名文件夹"
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
                title="设置样式"
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
  // section
  // section
  // section
  return (
    <ErrorBoundary>
    <div 
      className={`promptly-shell ${isDarkMode ? 'dark theme-dark' : 'theme-light'} flex flex-col md:flex-row h-screen gap-3 p-3 font-sans overflow-hidden relative transition-colors duration-300`}
      style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
    >
      
      {/* section */}

      {/* section */}
      <div className="workspace-pane w-full md:w-1/2 h-1/2 md:h-full flex flex-col overflow-hidden rounded-2xl z-10 transition-colors duration-300 backdrop-blur-xl">
        
        <div className="sticky top-0 z-20 flex flex-col transition-colors duration-300">
          <div className="pane-top-row px-4 border-b flex items-center">
            <div className="mr-3 flex h-9 shrink-0 items-center gap-2 rounded-xl border border-[var(--app-border-soft)] bg-[var(--app-surface-soft)] px-3.5 text-xs font-bold uppercase tracking-wide text-[var(--app-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.55)]" />
              <span>Promptly</span>
            </div>
          </div>

          <div className="h-12 min-h-12 flex items-center px-4 gap-2 overflow-x-auto overflow-y-hidden custom-scrollbar border-b bg-[color-mix(in_srgb,var(--app-surface)_72%,transparent)] border-[var(--app-border-soft)]">
            {workspaces.map(ws => (
              <div
                key={ws.id}
                draggable={editingWorkspaceId !== ws.id}
                onDragStart={(e) => {
                  if (editingWorkspaceId === ws.id) {
                    e.preventDefault();
                    return;
                  }
                  setDraggedTabId(ws.id);
                  e.dataTransfer.effectAllowed = "move";
                  setTimeout(() => e.target.style.opacity = '0.5', 0);
                }}
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
                title={ws.name}
                 className={`group relative flex h-9 items-center gap-2 px-3 rounded-xl border cursor-pointer transition-colors min-w-[108px] ${
                   activeWorkspaceId === ws.id
                     ? 'shrink-0 w-auto max-w-none bg-[var(--app-surface-raised)] border-[var(--app-border)] text-[var(--app-brand)] z-10 shadow-[0_10px_24px_-20px_rgba(59,130,246,0.9)]'
                     : 'max-w-[160px] bg-transparent border-[var(--app-border-soft)] text-[var(--app-faint)] hover:bg-[var(--app-surface-raised)] hover:text-[var(--app-muted)]'
                 }`}
              >
                {ws.isDirty && <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="Unsaved changes" />}
                {!ws.isDirty && <FileText size={12} className="shrink-0 opacity-50" />}
                
                {editingWorkspaceId === ws.id ? (
                  <input
                    autoFocus onBlur={() => setEditingWorkspaceId(null)} onKeyDown={e => e.key === 'Enter' && setEditingWorkspaceId(null)}
                    value={ws.name} onChange={e => handleWorkspaceNameChange(ws.id, e.target.value)}
                    draggable={false}
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onDragStart={(e) => e.stopPropagation()}
                    className="bg-transparent outline-none w-full text-sm font-medium"
                  />
                ) : (
                  <span
                    className={`text-sm font-medium select-none ${
                      activeWorkspaceId === ws.id ? 'flex-none whitespace-nowrap' : 'flex-1 truncate'
                    }`}
                    onDoubleClick={() => setEditingWorkspaceId(ws.id)}
                    title={ws.name}
                  >
                    {ws.name}
                  </span>
                )}
                <X size={14} className={`shrink-0 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white rounded-sm transition-all ${activeWorkspaceId === ws.id ? 'opacity-100':''}`} onClick={(e) => { e.stopPropagation(); handleCloseTabClick(ws.id); }} />
              </div>
            ))}
            {workspaces.length < 10 && (
              <button onClick={handleAddTab} className="tool-button h-9 w-9 text-[var(--app-muted)]" title="Add tab">
                <Plus size={16} />
              </button>
            )}
          </div>

          <div className="absolute right-4 top-0 h-14 flex justify-end items-center gap-3 transition-colors duration-300">
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--app-muted)]">
                共 {inputs.length} 个片段
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <button onClick={() => setIsPresetDrawerOpen(true)} className="soft-pill text-xs gap-1 px-3 h-8" title="预设库">
                <Library className="w-3.5 h-3.5" /> 预设库
              </button>
              <button onClick={toggleAllCollapse} className="soft-pill text-xs gap-1 font-semibold px-2.5 active:scale-95">
              {isAllCollapsed ? <><ChevronDown size={14}/> 全部展开</> : <><ChevronUp size={14}/> 全部折叠</>}
              </button>
              <div className="w-px h-4 mx-1 bg-[var(--app-border)]"></div>
              {syncStatus === 'syncing' && <span className="soft-pill text-xs px-2.5 py-1">正在保存</span>}
              {syncStatus === 'synced' && <span className="soft-pill text-xs px-2.5 py-1 text-[var(--app-success)]"><CheckCircle2 size={13}/> 已保存</span>}
              {syncStatus === 'error' && <span className="soft-pill text-xs px-2.5 py-1 text-red-400"><CircleAlert size={13}/> 保存失败</span>}
            </div>
          </div>
        </div>

        <div className="pane-body flex-1 overflow-y-auto p-5 space-y-5 pb-24 custom-scrollbar transition-colors duration-300">
          {inputs.map((input, index) => (
            <div
              key={input.id}
              draggable={dragEnabledId === input.id}
              onDragStart={(e) => handleDragStart(e, input.id)}
              onDragOver={(e) => handleDragOver(e, input.id)}
              onDragEnd={() => { setDraggedId(null); setDragEnabledId(null); }}
               className={`panel-card prompt-fragment-card ${!input.color || input.color === 'bg-white' ? 'is-default-color' : ''} relative transition-all duration-200 group flex flex-col ${getColorHoverClasses(input.color, isDarkMode)}
                ${draggedId === input.id ? (isDarkMode ? 'opacity-40 border-blue-500' : 'opacity-40 border-blue-400') : ''}
                ${input.isActive === false ? 'opacity-60 grayscale-[0.5]' : ''}
                ${getColorClasses(input.color, isDarkMode)}`}
              style={{ ...(input.isActive !== false && input.color?.startsWith('#') ? { backgroundColor: input.color } : {}) }}
            >
              <div
                 className={`panel-card-header flex justify-between items-center px-3 py-2.5 pl-4 shrink-0 border-b transition-colors duration-300 ${getColorHeaderClasses(input.color, isDarkMode)}`}
                style={{ ...(input.isActive !== false && input.color?.startsWith('#') ? { backgroundColor: `${input.color}dd`, borderColor: `${input.color}66` } : {}) }}
              >
                <div className="flex items-center gap-2 flex-1 mr-4 overflow-hidden">
                  <button
                    onClick={() => toggleShowTitle(input.id)}
                      className={`flex items-center justify-center w-4 h-4 rounded shrink-0 border transition-colors focus:outline-none ${getColorCheckClasses(input.color, isDarkMode, input.showTitle)}`}
                    title="在输出中显示标题"
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
                    <span onDoubleClick={() => setEditingTitleId(input.id)} className={`fragment-title text-sm font-semibold cursor-text px-1.5 py-0.5 rounded transition-colors truncate ${isDarkMode ? 'text-zinc-300 hover:bg-zinc-800/80' : 'text-gray-600 hover:bg-gray-200/50'}`}>
                            {input.title || '片段 ' + (index + 1)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 relative shrink-0">
                  <div className="relative">
                    <button onClick={() => setActiveColorPickerId(activeColorPickerId === input.id ? null : input.id)} className={`h-7 w-7 rounded-lg inline-flex items-center justify-center transition-colors ${getColorControlClasses(input.color, isDarkMode)}`} title="颜色">
                      <Palette className="w-4 h-4" />
                    </button>
                    {activeColorPickerId === input.id && (
                      <>
                        <div className="fixed inset-0 z-[60] cursor-default" onClick={() => setActiveColorPickerId(null)} />
                        <div className={`absolute right-0 top-full mt-2 p-3 border shadow-xl rounded-xl flex flex-wrap gap-2 w-48 animate-in fade-in zoom-in duration-200 z-[70] ${isDarkMode ? 'bg-zinc-800 border-zinc-600 shadow-[0_18px_45px_-24px_rgba(0,0,0,0.9)]' : 'bg-white border-gray-200'}`}>
                          {BG_COLORS.map(c => (
                            <button
                              key={c.value}
                              onClick={(e) => { e.stopPropagation(); changeInputColor(input.id, c.value, true); }}
                              className={`w-6 h-6 rounded-full border cursor-pointer hover:scale-110 transition-transform ${getPickerButtonClasses(c.value, isDarkMode)} ${input.color === c.value ? (isDarkMode ? 'ring-2 ring-blue-500 ring-offset-1 ring-offset-zinc-900' : 'ring-2 ring-blue-400 ring-offset-1') : ''}`}
                              title={c.label}
                            />
                          ))}
                          <div className={`relative w-6 h-6 rounded-full border cursor-pointer hover:scale-110 transition-transform overflow-hidden flex items-center justify-center ${isDarkMode ? 'border-zinc-500 bg-zinc-700 text-zinc-200 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]' : 'border-gray-300 bg-white text-gray-500'} ${input.color?.startsWith('#') ? (isDarkMode ? 'ring-2 ring-blue-500 ring-offset-1 ring-offset-zinc-900' : 'ring-2 ring-blue-400 ring-offset-1') : ''}`} title="自定义颜色">
                            <MoreHorizontal className="pointer-events-none relative z-10 h-4 w-4" />
                            <input
                              type="color"
                              value={input.color?.startsWith('#') ? input.color : (isDarkMode ? '#18181b' : '#ffffff')}
                              onChange={(e) => changeInputColor(input.id, e.target.value, false)}
                              className="absolute inset-0 h-full w-full cursor-pointer border-none p-0 opacity-0"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => !isInputEmpty(input) && saveToPresets(input)} 
                    disabled={isInputEmpty(input)}
                    className={`p-1.5 rounded transition-colors ${isInputEmpty(input) ? 'opacity-50 cursor-not-allowed ' + (isDarkMode ? 'text-zinc-600' : 'text-gray-300') : getColorControlClasses(input.color, isDarkMode)}`}
                    title="保存为预设"
                  >
                    <FolderPlus className="w-4 h-4" />
                  </button>

                  <button onClick={() => toggleInputMode(input.id)} className={`h-7 w-7 rounded-lg inline-flex items-center justify-center transition-colors ${getColorControlClasses(input.color, isDarkMode)}`} title="切换编辑模式">
                    {input.isTextMode ? <LayoutGrid className="w-4 h-4" /> : <AlignLeft className="w-4 h-4" />}
                  </button>
                  <button onClick={() => toggleCollapse(input.id)} className={`h-7 w-7 rounded-lg inline-flex items-center justify-center transition-colors ${getColorControlClasses(input.color, isDarkMode)}`} title="折叠片段">
                    {input.isCollapsed ? <ChevronDown size={16}/> : <ChevronUp size={16}/>}
                  </button>
                  <button onClick={() => toggleActive(input.id)} className={`p-1.5 rounded transition-colors ${input.isActive !== false ? getColorControlClasses(input.color, isDarkMode) : (isDarkMode ? 'text-zinc-600 hover:bg-zinc-800' : 'text-gray-400 hover:bg-gray-200/50')}`}>
                    {input.isActive !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button onClick={() => removeInput(input.id)} disabled={inputs.length <= 1} className={`p-1.5 rounded transition-colors disabled:opacity-20 ${isDarkMode ? 'text-zinc-500 hover:text-red-400 hover:bg-red-950/50' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div onMouseEnter={() => setDragEnabledId(input.id)} onMouseLeave={() => setDragEnabledId(null)} className={`p-1.5 cursor-grab active:cursor-grabbing rounded transition-colors ${getColorControlClasses(input.color, isDarkMode)}`}>
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
                    placeholder="输入内容..."
                    className={`data-textarea w-full min-h-[5.75rem] p-3.5 pl-4 border-none resize-none overflow-hidden outline-none text-sm leading-relaxed custom-scrollbar transition-colors ${getColorBodyClasses(input.color, isDarkMode)}`}
                    style={{ ...(input.isActive !== false ? getColorBodyStyle(input.color, isDarkMode) : {}) }}
                  />
                ) : (
                  <div 
                    className={`w-full min-h-[5.75rem] p-3.5 pl-4 flex flex-wrap gap-x-2 gap-y-2.5 items-start content-start cursor-text transition-all duration-200 ${getColorBodyClasses(input.color, isDarkMode)} ${dragOverInputId === input.id ? (isDarkMode ? 'ring-2 ring-blue-700 ring-inset rounded-xl' : 'ring-2 ring-blue-300 ring-inset rounded-xl') : ''}`}
                    style={{ ...(input.isActive !== false ? getColorBodyStyle(input.color, isDarkMode) : {}) }}
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
                          className={`px-3 py-1.5 border-2 rounded-lg outline-none text-sm text-center font-medium shadow-sm min-w-[60px] transition-colors ${getColorTagClasses(input.color, isDarkMode, true)}`}
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
                          className={`group/tag relative px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all cursor-move border select-none flex items-center justify-center whitespace-pre-wrap text-left
                            ${getColorTagClasses(input.color, isDarkMode, tag.isActive !== false)}
                            ${draggedTagId?.tagId === tag.id ? (isDarkMode ? 'opacity-30 scale-95 ring-2 ring-blue-500' : 'opacity-30 scale-95 ring-2 ring-blue-400') : ''}
                          `}
                          title="点击切换标签启用状态"
                        >
                          {tag.text}
                          <button
                            onClick={(e) => { e.stopPropagation(); removeTag(input.id, tag.id); }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover/tag:opacity-100 transition-opacity shadow hover:bg-red-600 z-10"
                            title="删除标签"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )
                    ))}
                    <input
                      type="text"
                      placeholder="继续输入..."
                      className="flex-1 min-w-[160px] bg-transparent outline-none py-1.5 text-sm transition-colors text-[var(--app-text)] placeholder:text-[var(--app-faint)]"
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
            className="w-full py-5 border border-dashed rounded-2xl transition-all flex justify-center items-center gap-2 font-medium border-[var(--app-border)] text-[var(--app-muted)] hover:border-[var(--app-brand)] hover:text-[var(--app-brand)] hover:bg-[var(--app-brand-soft)]"
          >
            <Plus className="w-5 h-5" /> 添加片段
          </button>
        </div>

        <div className="pane-toolbar-row p-3 border-t flex justify-start sticky bottom-0 z-20 transition-colors duration-300">
          <button onClick={() => setIsResetModalOpen(true)} className="tool-button text-xs flex items-center gap-1.5 font-medium px-2 py-1 text-[var(--app-muted)] hover:!text-red-400">
            <RotateCcw className="w-4 h-4" /> 重置当前工作区
          </button>
        </div>
      </div>

      {/* section */}
      <div className="workspace-pane w-full md:w-1/2 h-1/2 md:h-full flex flex-col overflow-hidden rounded-2xl transition-colors duration-300 backdrop-blur-xl">
        <div className="sticky top-0 z-20 flex flex-col transition-colors duration-300">
          <div className="pane-top-row px-4 border-b flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold truncate text-[var(--app-text)]">{activeWorkspace.name} - 结果</h2>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="text-[10px] font-medium text-[var(--app-muted)]">
                {displayedOutputText.length} 字符
            </div>
            <select
              value={separator}
              onChange={(e) => setSeparator(e.target.value)}
              className="soft-pill h-8 px-2 text-xs outline-none cursor-pointer"
            >
              <option value="\n\n">双换行（分段）</option>
              <option value="\n">单换行</option>
              <option value=" ">空格</option>
              <option value="">无分隔</option>
            </select>
            
            <div className="w-px h-5 mx-1 bg-[var(--app-border)] transition-colors"></div>

            <button onClick={() => setIsTransConfigModalOpen(true)} className="tool-button w-8 text-[var(--app-muted)]" title="设置">
              <Settings size={20} />
            </button>

            <button onClick={() => setIsDarkMode(!isDarkMode)} className="tool-button w-8 text-[var(--app-muted)]" title="主题">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button onClick={handleSaveClick} className="tool-button w-8 text-[var(--app-brand)]" title="保存">
              <Save className="w-5 h-5" />
            </button>
            <button onClick={() => setIsDrawerOpen(true)} className="tool-button w-8 text-[var(--app-brand)]" title="快照">
              <Bookmark className="w-5 h-5" />
            </button>
          </div>
        </div>
        </div>

        <div className="pane-body flex-1 p-5 flex flex-col overflow-hidden gap-4">
          {/* section */}
          <div className="panel-card prompt-preview-card flex-1 min-h-0 overflow-hidden relative transition-colors duration-300">
            <div className="absolute top-5 left-5 z-10 flex items-center gap-2">
              <span className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-[var(--app-brand-soft)] text-[var(--app-brand)] border border-[var(--app-border)]">
                {previewContentLabel}
              </span>
              {isShowingProcessedOutput && isPostProcessedResultCurrent && postProcessSummary && (
                <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-[var(--app-surface-raised)] text-[var(--app-muted)] border border-[var(--app-border)]">
                  {postProcessSummary}
                </span>
              )}
            </div>
            <div className="absolute right-5 top-5 z-10 inline-flex h-8 items-center rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-raised)] p-0.5">
              <button
                type="button"
                onClick={() => setIsShowingProcessedOutput(false)}
                className={`h-7 rounded-md px-3 text-[11px] font-semibold transition-colors ${
                  !isShowingProcessedOutput
                    ? 'bg-[var(--app-brand-soft)] text-[var(--app-brand)]'
                    : 'text-[var(--app-muted)] hover:text-[var(--app-text)]'
                }`}
              >
                处理前
              </button>
              <button
                type="button"
                onClick={() => setIsShowingProcessedOutput(true)}
                disabled={!isPostProcessedResultCurrent}
                className={`h-7 rounded-md px-3 text-[11px] font-semibold transition-colors ${
                  isShowingProcessedOutput && isPostProcessedResultCurrent
                    ? 'bg-[var(--app-brand-soft)] text-[var(--app-brand)]'
                    : isPostProcessedResultCurrent
                      ? 'text-[var(--app-muted)] hover:text-[var(--app-text)]'
                      : 'cursor-not-allowed text-[var(--app-faint)] opacity-50'
                }`}
              >
                处理后
              </button>
            </div>
            <textarea
              readOnly
              value={displayedOutputText}
              placeholder="当前工作区的标签块内容将在此实时拼合并展示..."
              className="data-textarea w-full h-full p-6 pt-16 pb-24 bg-transparent border-none resize-none outline-none text-sm leading-relaxed custom-scrollbar transition-colors"
            />
            <div className="absolute bottom-5 right-5 z-10 flex items-center gap-3 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-raised)] px-3 py-2 shadow-sm">
              <span className="text-xs font-bold text-[var(--app-muted)]">提示词后处理：</span>
              <label className={`post-process-option inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold ${
                postProcessTranslateEnabled ? 'is-selected' : ''
              }`}>
                <input
                  type="checkbox"
                  checked={postProcessTranslateEnabled}
                  onChange={(e) => setPostProcessTranslateEnabled(e.target.checked)}
                  className="post-process-checkbox"
                />
                翻译
              </label>
              <label className={`post-process-option inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold ${
                postProcessOptimizeEnabled ? 'is-selected' : ''
              }`}>
                <input
                  type="checkbox"
                  checked={postProcessOptimizeEnabled}
                  onChange={(e) => setPostProcessOptimizeEnabled(e.target.checked)}
                  className="post-process-checkbox"
                />
                优化
              </label>
              <button
                type="button"
                onClick={handleExecutePostProcessing}
                disabled={!outputSourceText || !hasSelectedPostProcess || isPostProcessing}
                className={`primary-action h-9 px-4 text-sm font-bold inline-flex items-center gap-1.5 ${
                  !outputSourceText || !hasSelectedPostProcess || isPostProcessing ? 'cursor-not-allowed opacity-55' : ''
                }`}
              >
                {isPostProcessing ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                {isPostProcessing ? '处理中...' : '执行'}
              </button>
            </div>
            {!outputText && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 pointer-events-none text-sm italic text-[var(--app-faint)]">
                <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-raised)] text-[var(--app-brand)] shadow-[var(--app-glow)]">
                  <Sparkles size={24} />
                </span>
                <span>等待输入...</span>
              </div>
            )}
          </div>

          {hasSelectedPostProcess && (
            <div className="panel-card shrink-0 p-3.5 transition-colors duration-300">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <div className="flex shrink-0 items-center gap-2">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--app-border)] bg-[var(--app-brand-soft)] text-[var(--app-brand)]">
                  <Sparkles size={16} />
                </span>
                <div className="relative flex items-center gap-1.5">
                  <div className="text-xs font-bold text-[var(--app-text)]">提示词后处理</div>
                  <button
                    type="button"
                    onClick={() => setIsPostProcessHelpOpen(open => !open)}
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full transition-colors ${
                      isPostProcessHelpOpen
                        ? 'bg-[var(--app-brand-soft)] text-[var(--app-brand)]'
                        : 'text-[var(--app-faint)] hover:bg-[var(--app-brand-soft)] hover:text-[var(--app-brand)]'
                    }`}
                    title="查看后处理说明"
                    aria-label="查看后处理说明"
                    aria-expanded={isPostProcessHelpOpen}
                  >
                    <HelpCircle size={14} />
                  </button>
                  {isPostProcessHelpOpen && (
                    <>
                      <button
                        type="button"
                        aria-label="关闭后处理说明"
                        className="fixed inset-0 z-40 cursor-default"
                        onClick={() => setIsPostProcessHelpOpen(false)}
                      />
                      <div className="absolute left-0 top-full z-50 mt-2 w-64 whitespace-normal rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-raised)] p-3 text-[11px] font-normal leading-5 text-[var(--app-muted)] shadow-[var(--app-shadow)]">
                        按“翻译 → 优化”的顺序执行已勾选项目。未勾选的步骤会自动跳过。
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="flex min-w-0 flex-[1_1_520px] flex-wrap items-center justify-end gap-2">
                {postProcessTranslateEnabled && (
                  <label className="flex shrink-0 items-center gap-1">
                    <span className="shrink-0 text-[10px] font-semibold text-[var(--app-muted)]">目标语言</span>
                    <select
                      value={translationTargetLanguage}
                      onChange={(e) => setTranslationTargetLanguage(e.target.value)}
                      className="soft-pill h-8 px-2 text-xs outline-none cursor-pointer"
                    >
                      <option value="zh">中文</option>
                      <option value="en">English</option>
                    </select>
                  </label>
                )}
                {postProcessOptimizeEnabled && (
                  <>
                  <label className="flex min-w-0 max-w-[360px] flex-[1_1_220px] items-center gap-1 overflow-hidden">
                    <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold text-[var(--app-muted)]">
                      优化模型
                      <HelpCircle size={12} className="text-[var(--app-faint)]" title="选择用于调用 API 优化提示词的大模型服务" />
                    </span>
                    <select
                      value={aiConfig.conversionProviderId || ''}
                      onChange={(e) => setConversionProviderId(e.target.value)}
                      className="soft-pill h-8 w-full min-w-0 max-w-full flex-1 truncate px-3 text-xs outline-none cursor-pointer"
                      title={selectedOptimizeProviderLabel}
                    >
                      {(aiConfig.providers || []).length === 0 && <option value="">请先配置模型服务</option>}
                      {(aiConfig.providers || []).map(provider => (
                        <option key={provider.id} value={provider.id}>
                          {provider.name || provider.modelName} · {provider.modelName || '未填写模型'}
                        </option>
                      ))}
                    </select>
                  </label>
                    <label className="flex shrink-0 items-center gap-1">
                      <span className="shrink-0 text-[10px] font-semibold text-[var(--app-muted)]">平台</span>
                      <select
                        value={optimizePlatform}
                        onChange={(e) => setOptimizePlatform(e.target.value)}
                        className="soft-pill h-8 px-2 text-xs outline-none cursor-pointer"
                        title="选择优化提示词面向的生图平台"
                      >
                        <option value="nanobanana2">Nano Banana 2</option>
                        <option value="gptImage2">GPT Image 2</option>
                      </select>
                    </label>
                    <label className="flex shrink-0 items-center gap-1">
                      <span className="shrink-0 text-[10px] font-semibold text-[var(--app-muted)]">格式</span>
                      <select
                        value={optimizeMode}
                        onChange={(e) => setOptimizeMode(e.target.value)}
                        className="soft-pill h-8 px-2 text-xs outline-none cursor-pointer"
                        title="选择优化结果的输出形式"
                      >
                        <option value="natural">自然语言</option>
                        <option value="structured">结构化</option>
                      </select>
                    </label>
                  </>
                )}
              </div>
            </div>
            </div>
          )}

          <div className="flex gap-3 shrink-0">
            <button
              onClick={() => executeCopy(displayedOutputText)}
              disabled={!displayedOutputText}
              className={`primary-action flex-1 px-4 py-4 font-bold flex justify-center items-center gap-2 active:scale-[0.98] ${
                !displayedOutputText
                  ? 'cursor-not-allowed'
                  : copied
                    ? '!bg-[var(--app-success)]'
                    : ''
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? '已复制' : '复制提示词'}
            </button>
          </div>
        </div>
      </div>
      <Modals
        isDarkMode={isDarkMode}
        workspaces={workspaces}
        savedPrompts={savedPrompts}
        presets={presets}
        // section
        isTransConfigModalOpen={isTransConfigModalOpen}
        setIsTransConfigModalOpen={setIsTransConfigModalOpen}
        handleSaveTransConfig={handleSaveTransConfig}
        handleLogout={handleLogout}
        // API settings
        aiConfig={aiConfig}
        appSettings={appSettings}
        setAiConfig={setAiConfig}
        setAppSettings={setAppSettings}
        updateAppSettings={updateAppSettings}
        addProvider={addProvider}
        updateProvider={updateProvider}
        deleteProvider={deleteProvider}
        setTranslationProviderId={setTranslationProviderId}
        setConversionProviderId={setConversionProviderId}
        // section
        folderDeleteTarget={folderDeleteTarget}
        setFolderDeleteTarget={setFolderDeleteTarget}
        handleDeleteFolderWithContents={handleDeleteFolderWithContents}
        handleDissolveFolder={handleDissolveFolder}
        // section
        isCloseWarningOpen={isCloseWarningOpen}
        setIsCloseWarningOpen={setIsCloseWarningOpen}
        pendingCloseTabId={pendingCloseTabId}
        setPendingCloseTabId={setPendingCloseTabId}
        executeCloseTab={executeCloseTab}
        // section
        isSaveModalOpen={isSaveModalOpen}
        setIsSaveModalOpen={setIsSaveModalOpen}
        saveTitle={saveTitle}
        setSaveTitle={setSaveTitle}
        snapshotImageDataUrl={snapshotImageDataUrl}
        setSnapshotImageDataUrl={setSnapshotImageDataUrl}
        snapshotImagePlatform={snapshotImagePlatform}
        setSnapshotImagePlatform={setSnapshotImagePlatform}
        snapshotImageCustomPlatform={snapshotImageCustomPlatform}
        setSnapshotImageCustomPlatform={setSnapshotImageCustomPlatform}
        clearSnapshotImageForm={clearSnapshotImageForm}
        saveInputRef={saveInputRef}
        handlePreSave={handlePreSave}
        adjustSaveTitleNumber={adjustSaveTitleNumber}
        hasSaveTitleNumber={hasSaveTitleNumber}
        // section
        isExportModalOpen={isExportModalOpen}
        setIsExportModalOpen={setIsExportModalOpen}
        exportOptions={exportOptions}
        setExportOptions={setExportOptions}
        confirmExport={confirmExport}
        // section
        pendingImportPayload={pendingImportPayload}
        setPendingImportPayload={setPendingImportPayload}
        closeImportModeModal={closeImportModeModal}
        handleImportWithMode={handleImportWithMode}
        // section
        isConflictModalOpen={isConflictModalOpen}
        setIsConflictModalOpen={setIsConflictModalOpen}
        conflictTarget={conflictTarget}
        handleOverwrite={handleOverwrite}
        handleAutoRename={handleAutoRename}
        handleCancelConflict={handleCancelConflict}
        // section
        isResetModalOpen={isResetModalOpen}
        setIsResetModalOpen={setIsResetModalOpen}
        confirmReset={confirmReset}
        // section
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

      {isSnapshotLimitModalOpen && (
        <div className="app-overlay fixed inset-0 z-[130] flex items-center justify-center p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsSnapshotLimitModalOpen(false); }}>
          <div className="app-modal w-full max-w-sm rounded-2xl border p-6" onClick={e => e.stopPropagation()}>
            <h3 className={`text-base font-bold mb-2 ${isDarkMode ? 'text-zinc-100' : 'text-gray-900'}`}>无法载入快照</h3>
            <p className={`text-sm leading-6 mb-5 ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>
              当前工作区数量已达到上限（{MAX_WORKSPACE_TABS} 个），本次快照加载已终止。请先关闭一个工作区后再试。
            </p>
            <button
              type="button"
              onClick={() => setIsSnapshotLimitModalOpen(false)}
              className={`w-full rounded-xl py-2.5 text-sm font-bold transition-colors ${isDarkMode ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              我知道了
            </button>
          </div>
        </div>
      )}
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
          className="app-modal fixed z-[125] rounded-2xl border"
          style={{
            top: `${snapshotPreviewPosition.top}px`,
            left: `${snapshotPreviewPosition.left}px`,
            width: `${snapshotPreviewPosition.width}px`,
            maxHeight: `${snapshotPreviewPosition.maxHeight}px`
          }}
        >
          <div className="app-modal-header px-4 py-3 border-b text-sm font-semibold text-[var(--app-text)]">
            {hoveredSnapshot.title}
          </div>
          <div className="flex gap-3 p-3" style={{ maxHeight: `${snapshotPreviewPosition.maxHeight - 49}px` }}>
            {hoveredSnapshot.previewImage && (
              <div className={`relative h-40 w-48 shrink-0 overflow-hidden rounded-xl border ${isDarkMode ? 'border-zinc-800 bg-zinc-900' : 'border-gray-200 bg-gray-50'}`}>
                <img src={hoveredSnapshot.previewImage.dataUrl} alt="提示词效果预览" className="h-full w-full object-contain" />
                {hoveredSnapshot.previewImage.platform && (
                  <span className="absolute bottom-2 right-2 rounded-md bg-black/65 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    {hoveredSnapshot.previewImage.platform}
                  </span>
                )}
              </div>
            )}
            <div className={`min-w-0 flex-1 overflow-y-auto custom-scrollbar text-xs leading-6 whitespace-pre-wrap break-words ${
              isDarkMode ? 'text-zinc-300' : 'text-gray-600'
            }`}>
              {snapshotPreviewMap[hoveredSnapshot.id]}
            </div>
          </div>
        </div>
      )}

      {/* section */}
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
