import { useState, useCallback } from 'react';
import { generateId } from '../lib/constants';
import { sanitizeInputs, createDefaultWorkspace } from '../lib/parser';

/**
 * useWorkspaces — 工作区（多标签页）状态管理 hook
 * 
 * 状态：workspaces, activeWorkspaceId, editingWorkspaceId, pendingCloseTabId, isCloseWarningOpen, draggedTabId, syncStatus, dataLoaded
 * 
 * 方法：setInputs, setSeparator, updateActiveWorkspace, handleAddTab, executeCloseTab, handleCloseTabClick, handleWorkspaceNameChange
 * 
 * 注意：数据加载和同步逻辑保留在 App.jsx 中（因为它们依赖 authFetch/authToken/savedPrompts 等外部状态）
 */
export function useWorkspaces() {
  const [workspaces, setWorkspaces] = useState([createDefaultWorkspace(1)]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(workspaces[0].id);
  const [editingWorkspaceId, setEditingWorkspaceId] = useState(null);
  const [pendingCloseTabId, setPendingCloseTabId] = useState(null);
  const [isCloseWarningOpen, setIsCloseWarningOpen] = useState(false);
  const [draggedTabId, setDraggedTabId] = useState(null);
  const [syncStatus, setSyncStatus] = useState('synced');
  const [dataLoaded, setDataLoaded] = useState(false);

  // 当前活跃工作区的派生属性
  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0];

  // 设置活跃工作区的 inputs
  const setInputs = useCallback((payload) => {
    setWorkspaces(prevWorkspaces => prevWorkspaces.map(w => {
      if (w.id === activeWorkspaceId) {
        const nextInputs = typeof payload === 'function' ? payload(w.inputs) : payload;
        return { ...w, inputs: nextInputs, isDirty: true };
      }
      return w;
    }));
  }, [activeWorkspaceId]);

  // 设置活跃工作区的 separator
  const setSeparator = useCallback((payload) => {
    setWorkspaces(prevWorkspaces => prevWorkspaces.map(w => {
      if (w.id === activeWorkspaceId) {
        const nextSeparator = typeof payload === 'function' ? payload(w.separator) : payload;
        return { ...w, separator: nextSeparator, isDirty: true };
      }
      return w;
    }));
  }, [activeWorkspaceId]);

  // 更新活跃工作区的完整数据（用于加载快照等）
  const updateActiveWorkspace = useCallback(({ inputs: newInputs, separator: newSeparator, name, isDirty }) => {
    setWorkspaces(prevWorkspaces => prevWorkspaces.map(w => {
      if (w.id === activeWorkspaceId) {
        return { ...w, inputs: sanitizeInputs(newInputs), separator: newSeparator, name: name || w.name, isDirty: isDirty !== undefined ? isDirty : true };
      }
      return w;
    }));
  }, [activeWorkspaceId]);

  // 新建标签页
  const handleAddTab = useCallback(() => {
    setWorkspaces(prev => {
      if (prev.length >= 5) return prev;
      const newId = generateId();
      const newWs = { ...createDefaultWorkspace(prev.length + 1), id: newId };
      setActiveWorkspaceId(newId);
      return [...prev, newWs];
    });
  }, []);

  // 执行关闭标签页
  const executeCloseTab = useCallback((id) => {
    setWorkspaces(prev => {
      const newWorkspaces = prev.filter(w => w.id !== id);
      if (newWorkspaces.length === 0) {
        const fallbackWs = createDefaultWorkspace(1);
        setActiveWorkspaceId(fallbackWs.id);
        return [fallbackWs];
      }
      setActiveWorkspaceId(oldActive => {
        if (oldActive === id) return newWorkspaces[newWorkspaces.length - 1].id;
        return oldActive;
      });
      return newWorkspaces;
    });
    setPendingCloseTabId(null);
  }, []);

  // 点击关闭标签页（判断是否需要警告）
  const handleCloseTabClick = useCallback((id) => {
    const ws = workspaces.find(w => w.id === id);
    if (!ws) return;
    const isEmpty = ws.inputs.every(i => (i.isTextMode ? !i.text.trim() : (!i.tags || i.tags.length === 0)));
    
    if (ws.isDirty && !isEmpty) {
      setPendingCloseTabId(id);
      setIsCloseWarningOpen(true);
    } else {
      executeCloseTab(id);
    }
  }, [workspaces, executeCloseTab]);

  // 修改工作区名称
  const handleWorkspaceNameChange = useCallback((id, newName) => {
    setWorkspaces(prev => prev.map(w => w.id === id ? { ...w, name: newName } : w));
  }, []);

  return {
    workspaces, setWorkspaces,
    activeWorkspaceId, setActiveWorkspaceId,
    activeWorkspace,
    editingWorkspaceId, setEditingWorkspaceId,
    pendingCloseTabId, setPendingCloseTabId,
    isCloseWarningOpen, setIsCloseWarningOpen,
    draggedTabId, setDraggedTabId,
    syncStatus, setSyncStatus,
    dataLoaded, setDataLoaded,
    setInputs, setSeparator,
    updateActiveWorkspace,
    handleAddTab,
    executeCloseTab,
    handleCloseTabClick,
    handleWorkspaceNameChange,
  };
}
