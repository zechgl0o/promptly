import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { generateId, API_BASE, DEFAULT_FOLDER_COLOR, DEFAULT_FOLDER_ICON } from '../lib/constants';
import { buildOutputTextFromInputs } from '../lib/parser';
import { appLogger } from '../lib/logger';

/**
 * useDataStore — 快照 + 预设 + 文件夹 的统一数据管理 hook
 * 
 * 将三者合并为一个 hook 是因为它们深度交叉：
 * - 文件夹选择器同时操作快照和预设的 folderId
 * - 删除文件夹需要同时清理快照/预设的引用
 * - 分组计算依赖 folders 实体
 * 
 * 外部依赖：
 * - authFetch: 用于同步到后端
 * - setErrorMessage: 用于显示错误提示
 */
export function useDataStore({ authFetch, setErrorMessage }) {
  // ===================== 核心数据 =====================
  const [savedPrompts, setSavedPrompts] = useState([]);
  const [folders, setFolders] = useState([]);
  const [presets, setPresets] = useState([]);

  // ===================== 快照 UI 状态 =====================
  const [hoveredSnapshotId, setHoveredSnapshotId] = useState(null);
  const [snapshotPreviewPosition, setSnapshotPreviewPosition] = useState(null);
  const [snapshotSearchQuery, setSnapshotSearchQuery] = useState('');
  const [isSnapshotBatchMode, setIsSnapshotBatchMode] = useState(false);
  const [selectedSnapshotIds, setSelectedSnapshotIds] = useState([]);
  const [collapsedFolderIds, setCollapsedFolderIds] = useState(() => {
    try { const v = localStorage.getItem('promptly_collapsed_folders'); return v ? JSON.parse(v) : []; } catch { return []; }
  });
  const snapshotPreviewCloseTimeoutRef = useRef(null);

  // ===================== 预设 UI 状态 =====================
  const [presetSearchQuery, setPresetSearchQuery] = useState('');
  const [isPresetBatchMode, setIsPresetBatchMode] = useState(false);
  const [selectedPresetIds, setSelectedPresetIds] = useState([]);
  const [collapsedPresetFolderIds, setCollapsedPresetFolderIds] = useState(() => {
    try { const v = localStorage.getItem('promptly_collapsed_preset_folders'); return v ? JSON.parse(v) : []; } catch { return []; }
  });

  // ===================== 文件夹编辑状态 =====================
  const [editingFolderId, setEditingFolderId] = useState(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [activeFolderStylePickerId, setActiveFolderStylePickerId] = useState(null);
  const [folderStylePickerPos, setFolderStylePickerPos] = useState(null);

  // ===================== 文件夹选择器状态 =====================
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [folderPickerSnapshotIds, setFolderPickerSnapshotIds] = useState([]);
  const [folderPickerTarget, setFolderPickerTarget] = useState('snapshot');
  const [folderPickerCreating, setFolderPickerCreating] = useState(false);
  const [folderPickerNewName, setFolderPickerNewName] = useState('');
  const [folderPickerDefaultName, setFolderPickerDefaultName] = useState('');
  const [folderDeleteTarget, setFolderDeleteTarget] = useState(null);

  // ===================== 计算属性：快照 =====================
  const selectedSnapshotIdSet = useMemo(() => new Set(selectedSnapshotIds), [selectedSnapshotIds]);
  const collapsedFolderIdSet = useMemo(() => new Set(collapsedFolderIds), [collapsedFolderIds]);

  const snapshotSearchKeyword = snapshotSearchQuery.trim().toLowerCase();
  const isSnapshotSearchActive = snapshotSearchKeyword.length > 0;

  const snapshotPreviewMap = useMemo(() => {
    return savedPrompts.reduce((acc, snapshot) => {
      acc[snapshot.id] = buildOutputTextFromInputs(snapshot.inputs || [], snapshot.separator || '\n\n');
      return acc;
    }, {});
  }, [savedPrompts]);

  const matchedSavedPrompts = useMemo(() => {
    if (!isSnapshotSearchActive) return savedPrompts;
    return savedPrompts.filter(snapshot => {
      const title = (snapshot.title || '').toLowerCase();
      const preview = (snapshotPreviewMap[snapshot.id] || '').toLowerCase();
      return title.includes(snapshotSearchKeyword) || preview.includes(snapshotSearchKeyword);
    });
  }, [savedPrompts, snapshotPreviewMap, isSnapshotSearchActive, snapshotSearchKeyword]);

  const groupedFilteredSavedPrompts = useMemo(() => {
    const folderMap = new Map();
    const ungrouped = [];

    folders.filter(f => !f.scope || f.scope === 'snapshot').forEach(folder => {
      folderMap.set(folder.id, {
        folderId: folder.id, folderName: folder.name,
        folderColor: folder.color || DEFAULT_FOLDER_COLOR, folderIcon: folder.icon || DEFAULT_FOLDER_ICON,
        totalCount: 0, matchedCount: 0, items: []
      });
    });

    savedPrompts.forEach(snapshot => {
      if (snapshot.folderId && folderMap.has(snapshot.folderId)) folderMap.get(snapshot.folderId).totalCount += 1;
    });

    matchedSavedPrompts.forEach(snapshot => {
      if (snapshot.folderId && folderMap.has(snapshot.folderId)) {
        const group = folderMap.get(snapshot.folderId);
        group.matchedCount += 1;
        group.items.push(snapshot);
        return;
      }
      ungrouped.push(snapshot);
    });

    return {
      folders: Array.from(folderMap.values())
        .filter(group => !isSnapshotSearchActive || group.items.length > 0)
        .map(group => ({ ...group, isExpanded: isSnapshotSearchActive || !collapsedFolderIdSet.has(group.folderId) })),
      ungrouped
    };
  }, [folders, savedPrompts, matchedSavedPrompts, isSnapshotSearchActive, collapsedFolderIdSet]);

  const visibleSnapshotIds = useMemo(() => {
    const ids = [...groupedFilteredSavedPrompts.ungrouped.map(s => s.id)];
    groupedFilteredSavedPrompts.folders.forEach(group => {
      if (!group.isExpanded) return;
      group.items.forEach(s => ids.push(s.id));
    });
    return ids;
  }, [groupedFilteredSavedPrompts]);

  const allVisibleSnapshotsSelected = useMemo(() => {
    return visibleSnapshotIds.length > 0 && visibleSnapshotIds.every(id => selectedSnapshotIdSet.has(id));
  }, [visibleSnapshotIds, selectedSnapshotIdSet]);

  const hoveredSnapshot = useMemo(() => {
    return savedPrompts.find(snapshot => snapshot.id === hoveredSnapshotId) || null;
  }, [savedPrompts, hoveredSnapshotId]);

  // ===================== 计算属性：预设 =====================
  const selectedPresetIdSet = useMemo(() => new Set(selectedPresetIds), [selectedPresetIds]);
  const collapsedPresetFolderIdSet = useMemo(() => new Set(collapsedPresetFolderIds), [collapsedPresetFolderIds]);

  const presetSearchKeyword = presetSearchQuery.trim().toLowerCase();
  const isPresetSearchActive = presetSearchKeyword.length > 0;

  const matchedPresets = useMemo(() => {
    if (!isPresetSearchActive) return presets;
    return presets.filter(p => {
      const title = (p.title || '').toLowerCase();
      const text = (p.text || '').toLowerCase();
      const tagStr = (p.tags && p.tags.length > 0 ? p.tags.map(t => t.text).join(' ') : '').toLowerCase();
      return title.includes(presetSearchKeyword) || text.includes(presetSearchKeyword) || tagStr.includes(presetSearchKeyword);
    });
  }, [presets, isPresetSearchActive, presetSearchKeyword]);

  const groupedFilteredPresets = useMemo(() => {
    const folderMap = new Map();
    const ungrouped = [];
    folders.filter(f => f.scope === 'preset').forEach(folder => {
      folderMap.set(folder.id, {
        folderId: folder.id, folderName: folder.name,
        folderColor: folder.color || DEFAULT_FOLDER_COLOR, folderIcon: folder.icon || DEFAULT_FOLDER_ICON,
        totalCount: 0, matchedCount: 0, items: []
      });
    });
    presets.forEach(p => { if (p.folderId && folderMap.has(p.folderId)) folderMap.get(p.folderId).totalCount += 1; });
    matchedPresets.forEach(p => {
      if (p.folderId && folderMap.has(p.folderId)) {
        const group = folderMap.get(p.folderId);
        group.matchedCount += 1;
        group.items.push(p);
      } else { ungrouped.push(p); }
    });
    return {
      folders: Array.from(folderMap.values()).filter(g => !isPresetSearchActive || g.items.length > 0)
        .map(g => ({ ...g, isExpanded: isPresetSearchActive || !collapsedPresetFolderIdSet.has(g.folderId) })),
      ungrouped
    };
  }, [folders, presets, matchedPresets, isPresetSearchActive, collapsedPresetFolderIdSet]);

  const visiblePresetIds = useMemo(() => {
    const ids = [...groupedFilteredPresets.ungrouped.map(p => p.id)];
    groupedFilteredPresets.folders.forEach(group => { if (!group.isExpanded) return; group.items.forEach(p => ids.push(p.id)); });
    return ids;
  }, [groupedFilteredPresets]);

  const allVisiblePresetsSelected = useMemo(() =>
    visiblePresetIds.length > 0 && visiblePresetIds.every(id => selectedPresetIdSet.has(id)),
  [visiblePresetIds, selectedPresetIdSet]);

  // ===================== 副作用：折叠状态持久化 =====================
  useEffect(() => {
    try { localStorage.setItem('promptly_collapsed_folders', JSON.stringify(collapsedFolderIds)); } catch { /* localStorage unavailable */ }
  }, [collapsedFolderIds]);

  useEffect(() => {
    try { localStorage.setItem('promptly_collapsed_preset_folders', JSON.stringify(collapsedPresetFolderIds)); } catch { /* localStorage unavailable */ }
  }, [collapsedPresetFolderIds]);

  useEffect(() => {
    return () => {
      if (snapshotPreviewCloseTimeoutRef.current) {
        clearTimeout(snapshotPreviewCloseTimeoutRef.current);
      }
    };
  }, []);

  // ===================== 快照操作 =====================
  const toggleSnapshotBatchMode = useCallback(() => {
    setIsSnapshotBatchMode(prev => {
      if (prev) setSelectedSnapshotIds([]);
      return !prev;
    });
  }, []);

  const toggleSnapshotSelected = useCallback((snapshotId) => {
    setSelectedSnapshotIds(prev => {
      if (prev.includes(snapshotId)) return prev.filter(id => id !== snapshotId);
      return [...prev, snapshotId];
    });
  }, []);

  const toggleSelectAllVisibleSnapshots = useCallback(() => {
    if (visibleSnapshotIds.length === 0) return;
    setSelectedSnapshotIds(prev => {
      if (allVisibleSnapshotsSelected) return prev.filter(id => !visibleSnapshotIds.includes(id));
      const merged = new Set(prev);
      visibleSnapshotIds.forEach(id => merged.add(id));
      return Array.from(merged);
    });
  }, [visibleSnapshotIds, allVisibleSnapshotsSelected]);

  const assignSnapshotsToFolder = useCallback((snapshotIds, folderId) => {
    const ids = Array.from(new Set((snapshotIds || []).filter(Boolean)));
    if (ids.length === 0) return;
    setSavedPrompts(prev => prev.map(snapshot => (
      ids.includes(snapshot.id) ? { ...snapshot, folderId: folderId || null } : snapshot
    )));
    if (folderId) setCollapsedFolderIds(prev => prev.filter(id => id !== folderId));
    setSelectedSnapshotIds([]);
  }, []);

  const promptAssignFolderForSnapshots = useCallback((snapshotIds) => {
    if (!snapshotIds || snapshotIds.length === 0) return;
    setFolderPickerSnapshotIds(snapshotIds);
    setFolderPickerTarget('snapshot');
    setFolderPickerCreating(false);
    setFolderPickerNewName('');
    setShowFolderPicker(true);
  }, []);

  const handleBatchDeleteSnapshots = useCallback(() => {
    if (selectedSnapshotIds.length === 0) return;
    if (!window.confirm(`确定删除选中的 ${selectedSnapshotIds.length} 个快照吗？`)) return;
    setSavedPrompts(prev => prev.filter(snapshot => !selectedSnapshotIdSet.has(snapshot.id)));
    setSelectedSnapshotIds([]);
  }, [selectedSnapshotIds, selectedSnapshotIdSet]);

  // ===================== 快照预览 =====================
  const clearSnapshotPreviewCloseTimer = useCallback(() => {
    if (snapshotPreviewCloseTimeoutRef.current) {
      clearTimeout(snapshotPreviewCloseTimeoutRef.current);
      snapshotPreviewCloseTimeoutRef.current = null;
    }
  }, []);

  const closeSnapshotPreview = useCallback(() => {
    clearSnapshotPreviewCloseTimer();
    setHoveredSnapshotId(null);
    setSnapshotPreviewPosition(null);
  }, [clearSnapshotPreviewCloseTimer]);

  const scheduleCloseSnapshotPreview = useCallback(() => {
    clearSnapshotPreviewCloseTimer();
    snapshotPreviewCloseTimeoutRef.current = setTimeout(() => {
      setHoveredSnapshotId(null);
      setSnapshotPreviewPosition(null);
      snapshotPreviewCloseTimeoutRef.current = null;
    }, 90);
  }, [clearSnapshotPreviewCloseTimer]);

  const openSnapshotPreview = useCallback((snapshotId, element) => {
    const previewText = snapshotPreviewMap[snapshotId] || '';
    if (!previewText || !element) return;
    clearSnapshotPreviewCloseTimer();
    const rect = element.getBoundingClientRect();
    const width = Math.min(360, Math.max(260, rect.left - 24));
    const maxHeight = Math.min(420, Math.max(180, window.innerHeight - 32));
    const top = Math.max(16, Math.min(rect.top, window.innerHeight - maxHeight - 16));
    const left = Math.max(16, rect.left - width - 12);
    setHoveredSnapshotId(snapshotId);
    setSnapshotPreviewPosition({ top, left, width, maxHeight });
  }, [snapshotPreviewMap, clearSnapshotPreviewCloseTimer]);

  // ===================== 预设操作 =====================
  const togglePresetBatchMode = useCallback(() => {
    setIsPresetBatchMode(prev => { if (prev) setSelectedPresetIds([]); return !prev; });
  }, []);

  const togglePresetSelected = useCallback((id) => {
    setSelectedPresetIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  const toggleSelectAllVisiblePresets = useCallback(() => {
    if (visiblePresetIds.length === 0) return;
    setSelectedPresetIds(prev => allVisiblePresetsSelected ? prev.filter(id => !visiblePresetIds.includes(id)) : [...new Set([...prev, ...visiblePresetIds])]);
  }, [visiblePresetIds, allVisiblePresetsSelected]);

  const assignPresetsToFolder = useCallback((presetIds, folderId) => {
    const ids = Array.from(new Set((presetIds || []).filter(Boolean)));
    if (ids.length === 0) return;
    setPresets(prev => prev.map(p => ids.includes(p.id) ? { ...p, folderId } : p));
    if (folderId) setCollapsedPresetFolderIds(prev => prev.filter(id => id !== folderId));
    setSelectedPresetIds([]);
  }, []);

  const promptAssignFolderForPresets = useCallback((presetIds) => {
    if (!presetIds || presetIds.length === 0) return;
    setFolderPickerSnapshotIds(presetIds);
    setFolderPickerTarget('preset');
    setFolderPickerCreating(false);
    setFolderPickerNewName('');
    setShowFolderPicker(true);
  }, []);

  const handleBatchDeletePresets = useCallback(() => {
    if (selectedPresetIds.length === 0) return;
    if (!window.confirm(`确定删除选中的 ${selectedPresetIds.length} 个预设吗？`)) return;
    setPresets(prev => prev.filter(p => !selectedPresetIdSet.has(p.id)));
    setSelectedPresetIds([]);
  }, [selectedPresetIds, selectedPresetIdSet]);

  // ===================== 文件夹操作 =====================
  const toggleFolderExpanded = useCallback((folderId) => {
    if (!folderId) return;
    setCollapsedFolderIds(prev => prev.includes(folderId) ? prev.filter(id => id !== folderId) : [...prev, folderId]);
  }, []);

  const togglePresetFolderExpanded = useCallback((folderId) => {
    if (!folderId) return;
    setCollapsedPresetFolderIds(prev => prev.includes(folderId) ? prev.filter(id => id !== folderId) : [...prev, folderId]);
  }, []);

  const startEditingFolder = useCallback((folderId, folderName) => {
    setEditingFolderId(folderId);
    setEditingFolderName(folderName || '');
  }, []);

  const finishEditingFolder = useCallback(() => {
    setEditingFolderId(null);
    setEditingFolderName('');
  }, []);

  const commitFolderRename = useCallback((folderId) => {
    const trimmedName = editingFolderName.trim();
    if (!folderId) { finishEditingFolder(); return; }
    if (!trimmedName) {
      setErrorMessage('文件夹名称不能为空');
      return;
    }
    const currentFolder = folders.find(f => f.id === folderId);
    const currentScope = currentFolder?.scope || 'snapshot';
    const conflictingFolder = folders.find(f =>
      f.id !== folderId && f.scope === currentScope && f.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (conflictingFolder) {
      setErrorMessage('已存在同名文件夹');
      return;
    }
    setFolders(prev => prev.map(f => f.id === folderId ? { ...f, name: trimmedName } : f));
    finishEditingFolder();
  }, [editingFolderName, folders, setErrorMessage, finishEditingFolder]);

  const updateFolderAppearance = useCallback((folderId, patch) => {
    const mappedPatch = {};
    if ('folderIcon' in patch) mappedPatch.icon = patch.folderIcon;
    if ('folderColor' in patch) mappedPatch.color = patch.folderColor;
    if ('icon' in patch) mappedPatch.icon = patch.icon;
    if ('color' in patch) mappedPatch.color = patch.color;
    setFolders(prev => prev.map(f => f.id === folderId ? { ...f, ...mappedPatch } : f));
  }, []);

  const openFolderDeleteDialog = useCallback((folderId, folderName, scope = 'snapshot') => {
    if (!folderId) return;
    setFolderDeleteTarget({ folderId, folderName, scope });
  }, []);

  const handleDeleteFolderWithContents = useCallback(() => {
    if (!folderDeleteTarget) return;
    const { folderId, scope } = folderDeleteTarget;
    if (scope === 'preset') {
      setPresets(prev => prev.filter(p => p.folderId !== folderId));
      setSelectedPresetIds([]);
      setCollapsedPresetFolderIds(prev => prev.filter(id => id !== folderId));
    } else {
      setSavedPrompts(prev => prev.filter(snapshot => snapshot.folderId !== folderId));
      setSelectedSnapshotIds([]);
      setCollapsedFolderIds(prev => prev.filter(id => id !== folderId));
    }
    setFolders(prev => prev.filter(f => f.id !== folderId));
    setFolderDeleteTarget(null);
  }, [folderDeleteTarget]);

  const handleDissolveFolder = useCallback(() => {
    if (!folderDeleteTarget) return;
    const { folderId, scope } = folderDeleteTarget;
    if (scope === 'preset') {
      setPresets(prev => prev.map(p => p.folderId === folderId ? { ...p, folderId: null } : p));
      setSelectedPresetIds([]);
      setCollapsedPresetFolderIds(prev => prev.filter(id => id !== folderId));
    } else {
      setSavedPrompts(prev => prev.map(snapshot => snapshot.folderId === folderId ? { ...snapshot, folderId: null } : snapshot));
      setSelectedSnapshotIds([]);
      setCollapsedFolderIds(prev => prev.filter(id => id !== folderId));
    }
    setFolders(prev => prev.filter(f => f.id !== folderId));
    setFolderDeleteTarget(null);
  }, [folderDeleteTarget]);

  // ===================== 文件夹选择器 =====================
  const closeFolderPicker = useCallback(() => {
    setShowFolderPicker(false);
    setFolderPickerSnapshotIds([]);
    setFolderPickerTarget('snapshot');
    setFolderPickerCreating(false);
    setFolderPickerNewName('');
    setFolderPickerDefaultName('');
  }, []);

  const handlePickerSelectFolder = useCallback((folderId) => {
    if (folderPickerTarget === 'preset') assignPresetsToFolder(folderPickerSnapshotIds, folderId);
    else assignSnapshotsToFolder(folderPickerSnapshotIds, folderId);
    closeFolderPicker();
  }, [folderPickerTarget, folderPickerSnapshotIds, assignPresetsToFolder, assignSnapshotsToFolder, closeFolderPicker]);

  const handlePickerRemoveFromFolder = useCallback(() => {
    if (folderPickerTarget === 'preset') assignPresetsToFolder(folderPickerSnapshotIds, null);
    else assignSnapshotsToFolder(folderPickerSnapshotIds, null);
    closeFolderPicker();
  }, [folderPickerTarget, folderPickerSnapshotIds, assignPresetsToFolder, assignSnapshotsToFolder, closeFolderPicker]);

  const handlePickerStartCreating = useCallback(() => {
    const prefix = folderPickerTarget === 'preset' ? '新预设集' : '新快照集';
    const existingNames = new Set(folders.filter(f => f.scope === folderPickerTarget).map(f => f.name.trim().toLowerCase()));
    let defaultName = prefix;
    let seq = 2;
    while (existingNames.has(defaultName.toLowerCase())) {
      defaultName = `${prefix}${seq}`;
      seq++;
    }
    setFolderPickerDefaultName(defaultName);
    setFolderPickerCreating(true);
    setFolderPickerNewName('');
  }, [folderPickerTarget, folders]);

  const handlePickerCancelCreating = useCallback(() => {
    setFolderPickerCreating(false);
    setFolderPickerNewName('');
    setFolderPickerDefaultName('');
  }, []);

  const handlePickerConfirmCreating = useCallback(() => {
    const finalName = folderPickerNewName.trim() || folderPickerDefaultName;
    if (!finalName) return;
    const existingFolder = folders.find(f =>
      f.name.trim().toLowerCase() === finalName.toLowerCase() && f.scope === folderPickerTarget
    );
    if (existingFolder) {
      setErrorMessage(`文件夹"${existingFolder.name}"已存在，请换一个名称`);
      return;
    }
    const newFolderId = generateId();
    setFolders(prev => [...prev, {
      id: newFolderId, name: finalName,
      color: DEFAULT_FOLDER_COLOR, icon: DEFAULT_FOLDER_ICON,
      scope: folderPickerTarget,
    }]);
    if (folderPickerTarget === 'preset') assignPresetsToFolder(folderPickerSnapshotIds, newFolderId);
    else assignSnapshotsToFolder(folderPickerSnapshotIds, newFolderId);
    closeFolderPicker();
  }, [folderPickerNewName, folderPickerDefaultName, folderPickerTarget, folders, folderPickerSnapshotIds, assignPresetsToFolder, assignSnapshotsToFolder, closeFolderPicker, setErrorMessage]);

  // ===================== 数据清理辅助 =====================
  const cleanupStaleState = useCallback(({ dataLoaded }) => {
    if (!dataLoaded) return;
    setSelectedSnapshotIds(prev => prev.filter(id => savedPrompts.some(snapshot => snapshot.id === id)));
    const existingFolderIds = new Set(folders.map(f => f.id));
    setCollapsedFolderIds(prev => prev.filter(id => existingFolderIds.has(id)));
    if (editingFolderId && !existingFolderIds.has(editingFolderId)) {
      setEditingFolderId(null);
      setEditingFolderName('');
    }
    if (activeFolderStylePickerId && !existingFolderIds.has(activeFolderStylePickerId)) {
      setActiveFolderStylePickerId(null);
      setFolderStylePickerPos(null);
    }
  }, [savedPrompts, folders, editingFolderId, activeFolderStylePickerId]);

  // ===================== 后端同步 =====================
  const syncSnapshots = useCallback(async ({ dataLoaded, authToken, setCurrentUser, setAuthToken }) => {
    if (!dataLoaded || !authToken) return;
    const timer = setTimeout(async () => {
      try {
        const res = await authFetch(`${API_BASE}/saved`, { method: 'POST', body: JSON.stringify(savedPrompts) });
        if (res.status === 401) { setCurrentUser(null); setAuthToken(null); return; }
        if (!res.ok) throw new Error('Save snapshots failed');
      } catch (e) { console.error("保存快照失败", e); appLogger.error('sync', '保存快照失败', e.message); }
    }, 800);
    return () => clearTimeout(timer);
  }, [savedPrompts, authFetch]);

  const syncFolders = useCallback(async ({ dataLoaded, authToken }) => {
    if (!dataLoaded || !authToken) return;
    const timer = setTimeout(async () => {
      try {
        await authFetch(`${API_BASE}/folders`, { method: 'POST', body: JSON.stringify(folders) });
      } catch (e) { console.error("保存文件夹失败", e); appLogger.error('sync', '保存文件夹失败', e.message); }
    }, 800);
    return () => clearTimeout(timer);
  }, [folders, authFetch]);

  const syncPresets = useCallback(async ({ dataLoaded, authToken }) => {
    if (!dataLoaded || !authToken) return;
    const timer = setTimeout(async () => {
      try {
        await authFetch(`${API_BASE}/presets`, { method: 'POST', body: JSON.stringify(presets) });
      } catch (e) { console.error("保存预设失败", e); appLogger.error('sync', '保存预设失败', e.message); }
    }, 800);
    return () => clearTimeout(timer);
  }, [presets, authFetch]);

  // ===================== 返回 =====================
  return {
    // 核心数据
    savedPrompts, setSavedPrompts,
    folders, setFolders,
    presets, setPresets,

    // 快照 UI
    hoveredSnapshotId, setHoveredSnapshotId,
    snapshotPreviewPosition, setSnapshotPreviewPosition,
    snapshotSearchQuery, setSnapshotSearchQuery,
    isSnapshotBatchMode, setIsSnapshotBatchMode,
    selectedSnapshotIds, setSelectedSnapshotIds,
    collapsedFolderIds, setCollapsedFolderIds,

    // 快照计算
    selectedSnapshotIdSet,
    snapshotPreviewMap,
    matchedSavedPrompts,
    groupedFilteredSavedPrompts,
    visibleSnapshotIds,
    allVisibleSnapshotsSelected,
    hoveredSnapshot,
    isSnapshotSearchActive,

    // 快照操作
    toggleSnapshotBatchMode,
    toggleSnapshotSelected,
    toggleSelectAllVisibleSnapshots,
    assignSnapshotsToFolder,
    promptAssignFolderForSnapshots,
    handleBatchDeleteSnapshots,
    openSnapshotPreview,
    closeSnapshotPreview,
    scheduleCloseSnapshotPreview,
    clearSnapshotPreviewCloseTimer,

    // 预设 UI
    presetSearchQuery, setPresetSearchQuery,
    isPresetBatchMode, setIsPresetBatchMode,
    selectedPresetIds, setSelectedPresetIds,
    collapsedPresetFolderIds, setCollapsedPresetFolderIds,

    // 预设计算
    selectedPresetIdSet,
    matchedPresets,
    groupedFilteredPresets,
    visiblePresetIds,
    allVisiblePresetsSelected,
    isPresetSearchActive,

    // 预设操作
    togglePresetBatchMode,
    togglePresetSelected,
    toggleSelectAllVisiblePresets,
    assignPresetsToFolder,
    promptAssignFolderForPresets,
    handleBatchDeletePresets,
    togglePresetFolderExpanded,

    // 文件夹编辑
    editingFolderId, setEditingFolderId,
    editingFolderName, setEditingFolderName,
    activeFolderStylePickerId, setActiveFolderStylePickerId,
    folderStylePickerPos, setFolderStylePickerPos,
    toggleFolderExpanded,
    startEditingFolder,
    finishEditingFolder,
    commitFolderRename,
    updateFolderAppearance,
    openFolderDeleteDialog,
    handleDeleteFolderWithContents,
    handleDissolveFolder,

    // 文件夹选择器
    showFolderPicker, setShowFolderPicker,
    folderPickerSnapshotIds, setFolderPickerSnapshotIds,
    folderPickerTarget, setFolderPickerTarget,
    folderPickerCreating, setFolderPickerCreating,
    folderPickerNewName, setFolderPickerNewName,
    folderPickerDefaultName, setFolderPickerDefaultName,
    folderDeleteTarget, setFolderDeleteTarget,
    closeFolderPicker,
    handlePickerSelectFolder,
    handlePickerRemoveFromFolder,
    handlePickerStartCreating,
    handlePickerCancelCreating,
    handlePickerConfirmCreating,

    // 辅助
    snapshotPreviewCloseTimeoutRef,
    cleanupStaleState,
    syncSnapshots, syncFolders, syncPresets,
  };
}
