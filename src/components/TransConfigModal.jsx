import { useState, useRef } from 'react';
import { Languages, Settings2, Trash2, Plus, Zap, Server, Key, Pencil, Eye, EyeOff, X, LogOut, FileText, ExternalLink } from 'lucide-react';
import { AI_PROVIDER_PRESETS, DEFAULT_GLM_PROVIDER_ID, createDefaultAiConfig } from '../lib/parser';
import { generateId } from '../lib/constants';
import { appLogger } from '../lib/logger';

const SECTIONS = [
  { key: 'providers', label: 'AI 服务', icon: Server },
  { key: 'services', label: '服务分配', icon: Zap },
  { key: 'logs', label: '日志', icon: FileText },
];

export default function TransConfigModal({
  isDarkMode,
  aiConfig,
  appSettings,
  setIsTransConfigModalOpen,
  handleSaveTransConfig,
  handleLogout,
}) {
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const [draftAiConfig, setDraftAiConfig] = useState(() => clone(aiConfig || createDefaultAiConfig()));
  const [draftAppSettings, setDraftAppSettings] = useState(() => clone({
    maxWorkspaceTabs: 10,
    ...(appSettings || {}),
  }));
  const [showApiKey, setShowApiKey] = useState({});
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(null); // provider id or null
  const [addForm, setAddForm] = useState(() => initAddForm());
  const [editForm, setEditForm] = useState({});
  const [logRefreshKey, setLogRefreshKey] = useState(0);

  const contentRef = useRef(null);
  const sectionRefs = useRef({});

  const d = (light, dark) => isDarkMode ? dark : light;
  const providers = draftAiConfig?.providers || [];
  const availableProviderPresets = AI_PROVIDER_PRESETS.filter(preset => !providers.some(provider => provider.presetKey === preset.key));
  const getProviderModelListUrl = (providerOrForm) => {
    if (providerOrForm?.modelListUrl) return providerOrForm.modelListUrl;
    const preset = AI_PROVIDER_PRESETS.find(p => p.key === providerOrForm?.presetKey);
    return preset?.modelListUrl || '';
  };
  const getProviderApiPageUrl = (providerOrForm) => {
    if (providerOrForm?.apiPageUrl) return providerOrForm.apiPageUrl;
    const preset = AI_PROVIDER_PRESETS.find(p => p.key === providerOrForm?.presetKey);
    return preset?.apiPageUrl || '';
  };

  const ModelListLink = ({ provider }) => {
    const url = getProviderModelListUrl(provider);
    if (!url) return null;
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className={`inline-flex items-center gap-1 text-[10px] font-medium transition-colors ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
      >
        模型列表
        <ExternalLink size={10} />
      </a>
    );
  };
  const ApiPageLink = ({ provider }) => {
    const url = getProviderApiPageUrl(provider);
    if (!url) return null;
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className={`inline-flex items-center gap-1 text-[10px] font-medium transition-colors ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
      >
        API 页面
        <ExternalLink size={10} />
      </a>
    );
  };

  const closeWithoutSaving = () => {
    setIsTransConfigModalOpen(false);
  };

  const applyAndClose = () => {
    handleSaveTransConfig(draftAiConfig, draftAppSettings);
  };

  const addDraftProvider = (provider) => {
    setDraftAiConfig(prev => ({
      ...prev,
      providers: [...(prev.providers || []), { ...provider, id: provider.id }],
    }));
  };

  const updateDraftProvider = (id, updates) => {
    setDraftAiConfig(prev => ({
      ...prev,
      providers: (prev.providers || []).map(p => p.id === id ? { ...p, ...updates } : p),
    }));
  };

  const deleteDraftProvider = (id) => {
    if (id === DEFAULT_GLM_PROVIDER_ID) return;
    setDraftAiConfig(prev => ({
      ...prev,
      providers: (prev.providers || []).filter(p => p.id !== id),
      translationProviderId: prev.translationProviderId === id ? 'google' : prev.translationProviderId,
      conversionProviderId: prev.conversionProviderId === id ? null : prev.conversionProviderId,
    }));
  };

  const setDraftTranslationProviderId = (id) => {
    setDraftAiConfig(prev => ({ ...prev, translationProviderId: id }));
  };

  const setDraftConversionProviderId = (id) => {
    setDraftAiConfig(prev => ({ ...prev, conversionProviderId: id }));
  };

  const serviceProviders = providers;

  function initAddForm(presetKey = '') {
    if (presetKey) {
      const preset = AI_PROVIDER_PRESETS.find(p => p.key === presetKey);
      if (preset) {
        return {
          presetKey,
          name: preset.name,
          apiBase: preset.apiBase,
          modelName: preset.modelName,
          modelListUrl: preset.modelListUrl,
          apiPageUrl: preset.apiPageUrl,
          apiKey: '',
          isPreset: true,
        };
      }
    }
    return { presetKey: '', name: '', apiBase: '', modelName: '', modelListUrl: '', apiPageUrl: '', apiKey: '', isPreset: false };
  }

  const toggleShowApiKey = (id) => {
    setShowApiKey(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // 左侧标签点击 → 滚动到对应区域
  const handleTabClick = (key) => {
    const el = sectionRefs.current[key];
    if (el && contentRef.current) {
      contentRef.current.scrollTo({ top: el.offsetTop - contentRef.current.offsetTop - 8, behavior: 'smooth' });
    }
  };

  // ===== 添加服务弹窗逻辑 =====
  const handleOpenAddModal = () => {
    setAddForm(initAddForm());
    setAddModalOpen(true);
  };

  const handleAddPresetChange = (presetKey) => {
    setAddForm(initAddForm(presetKey));
  };

  const handleAddFormChange = (field, value) => {
    setAddForm(prev => ({ ...prev, [field]: value }));
  };

  const handleConfirmAdd = () => {
    if (!addForm.name.trim() || !addForm.apiBase.trim() || !addForm.apiKey.trim() || !addForm.modelName.trim()) return;
    const id = generateId();
    addDraftProvider({
      id,
      name: addForm.name.trim(),
      apiBase: addForm.apiBase.trim(),
      apiKey: addForm.apiKey.trim(),
      modelName: addForm.modelName.trim(),
      modelListUrl: addForm.modelListUrl || getProviderModelListUrl(addForm),
      apiPageUrl: addForm.apiPageUrl || getProviderApiPageUrl(addForm),
      isPreset: !!addForm.presetKey,
      presetKey: addForm.presetKey || null,
    });
    setAddModalOpen(false);
  };

  // ===== 编辑服务弹窗逻辑 =====
  const handleOpenEditModal = (provider) => {
    setEditForm({
      id: provider.id,
      name: provider.name,
      apiBase: provider.apiBase,
      apiKey: provider.apiKey,
      modelName: provider.modelName,
      modelListUrl: getProviderModelListUrl(provider),
      apiPageUrl: getProviderApiPageUrl(provider),
    });
    setEditModalOpen(provider.id);
  };

  const handleEditFormChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleConfirmEdit = () => {
    if (!editForm.name.trim() || !editForm.apiBase.trim() || !editForm.apiKey.trim() || !editForm.modelName.trim()) return;
    updateDraftProvider(editForm.id, {
      name: editForm.name.trim(),
      apiBase: editForm.apiBase.trim(),
      apiKey: editForm.apiKey.trim(),
      modelName: editForm.modelName.trim(),
      modelListUrl: editForm.modelListUrl || getProviderModelListUrl(editForm),
      apiPageUrl: editForm.apiPageUrl || getProviderApiPageUrl(editForm),
    });
    setEditModalOpen(null);
  };

  // ===== 删除确认 =====
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const handleConfirmDelete = (id) => {
    deleteDraftProvider(id);
    setPendingDeleteId(null);
  };

  const logs = appLogger.getRecent(100);
  const clearLogs = () => {
    appLogger.clear();
    setLogRefreshKey(v => v + 1);
  };

  return (
    <div className="app-overlay fixed inset-0 z-[120] flex items-center justify-center p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) closeWithoutSaving(); }}>
      <div className="app-modal rounded-2xl w-full max-w-2xl border flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>

        {/* 标题栏 */}
        <div className="app-modal-header px-6 py-4 border-b flex items-center shrink-0">
          <h3 className="font-bold text-lg flex items-center gap-2 text-[var(--app-text)]">
            <Settings2 size={22} className="text-[var(--app-brand)]" /> 设置
          </h3>
        </div>

        {/* 主体：左标签 + 右内容 */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* 左侧标签 */}
          <div className="w-36 shrink-0 border-r border-[var(--app-border-soft)] flex flex-col py-3 gap-1 bg-[color-mix(in_srgb,var(--app-surface-soft)_74%,transparent)]">
            {SECTIONS.map(section => {
              const Icon = section.icon;
              return (
                <button
                  key={section.key}
                  onClick={() => handleTabClick(section.key)}
                  className={`w-full px-3 py-2.5 text-left text-sm font-medium flex items-center gap-2.5 transition-colors ${
                    isDarkMode
                      ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={16} />
                  {section.label}
                </button>
              );
            })}
          </div>

          {/* 右侧内容 —— 所有区域从上到下排列，不分页 */}
          <div ref={contentRef} className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-0">

            {/* ===== AI 服务 ===== */}
            <div ref={el => sectionRefs.current['providers'] = el} className="space-y-4 py-6">
              <h4 className={`text-sm font-bold flex items-center gap-2 ${isDarkMode ? 'text-zinc-200' : 'text-gray-800'}`}>
                <Server size={14} className="text-green-500" /> AI 服务
              </h4>

              {/* 已添加的服务列表 */}
              <div className="space-y-2">
                {providers.length === 0 && (
                  <div className={`py-6 text-center text-sm ${isDarkMode ? 'text-zinc-600' : 'text-gray-400'}`}>
                    尚未添加任何 AI 服务，点击下方按钮添加
                  </div>
                )}
                {providers.map(provider => (
                  <div key={provider.id} className={`flex items-center gap-3 p-3 rounded-lg border ${d('bg-gray-50 border-gray-200', 'bg-zinc-950 border-zinc-800')}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${d('bg-blue-100 text-blue-600', 'bg-blue-900/30 text-blue-400')}`}>
                      {provider.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className={`font-medium text-sm truncate ${isDarkMode ? 'text-zinc-200' : 'text-gray-800'}`} title={provider.name}>{provider.name}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded leading-none ${provider.isPreset ? (isDarkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-100 text-emerald-600') : (isDarkMode ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-600')}`}>
                          {provider.isPreset ? '预设' : '自定义'}
                        </span>
                        <span className={`text-[10px] truncate ${isDarkMode ? 'text-zinc-600' : 'text-gray-400'}`}>{provider.modelName}</span>
                        <ModelListLink provider={provider} />
                        <span className={`text-[10px] ${provider.apiKey ? 'text-green-500' : (isDarkMode ? 'text-red-400' : 'text-red-500')}`}>
                          {provider.apiKey ? '● 已配置' : '● 未配置 Key'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => handleOpenEditModal(provider)} className={`p-1.5 rounded transition-colors ${d('text-gray-400 hover:text-blue-500 hover:bg-blue-50', 'text-zinc-500 hover:text-blue-400 hover:bg-blue-950/30')}`} title="编辑">
                        <Pencil size={14} />
                      </button>
                      {provider.id === DEFAULT_GLM_PROVIDER_ID ? null : pendingDeleteId === provider.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => setPendingDeleteId(null)} className={`text-xs px-1.5 py-0.5 rounded ${d('bg-gray-200 hover:bg-gray-300 text-gray-700', 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300')}`}>取消</button>
                          <button onClick={() => handleConfirmDelete(provider.id)} className="text-xs px-1.5 py-0.5 rounded bg-red-500 hover:bg-red-600 text-white">确认</button>
                        </div>
                      ) : (
                        <button onClick={() => setPendingDeleteId(provider.id)} className={`p-1.5 rounded transition-colors ${d('text-gray-400 hover:text-red-500 hover:bg-red-50', 'text-zinc-500 hover:text-red-400 hover:bg-red-950/30')}`} title="删除">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* 添加按钮 */}
              <button onClick={handleOpenAddModal} className={`w-full py-2.5 flex justify-center items-center gap-2 border-2 border-dashed rounded-xl font-medium transition-colors ${d('border-gray-200 text-gray-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50', 'border-zinc-800 text-zinc-500 hover:border-blue-800 hover:text-blue-400 hover:bg-blue-950/20')}`}>
                <Plus size={16} /> 添加 AI 服务
              </button>
            </div>

            {/* 分隔线 */}
            <div className={`border-t ${isDarkMode ? 'border-zinc-800' : 'border-gray-200'}`}></div>

            {/* ===== 服务分配 ===== */}
            <div ref={el => sectionRefs.current['services'] = el} className="space-y-5 py-6">
              <h4 className={`text-sm font-bold flex items-center gap-2 ${isDarkMode ? 'text-zinc-200' : 'text-gray-800'}`}>
                <Zap size={14} className="text-amber-500" /> 服务分配
              </h4>

              {/* 翻译服务 */}
              <div>
                <div className={`text-sm font-medium mb-2 flex items-center gap-2 ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>
                  <Languages size={14} className="text-blue-500" /> 默认翻译服务
                </div>
                <p className={`text-xs mb-2 ${isDarkMode ? 'text-zinc-500' : 'text-gray-400'}`}>作为主界面提示词后处理的默认翻译服务</p>
                <div className="space-y-1.5">
                  <label className={`flex items-center gap-3 cursor-pointer p-2.5 rounded-lg border transition-colors ${
                    draftAiConfig?.translationProviderId === 'google'
                      ? d('bg-blue-50 border-blue-300', 'bg-blue-950/20 border-blue-700')
                      : d('bg-gray-50 border-gray-200 hover:border-blue-100', 'bg-zinc-950 border-zinc-800 hover:bg-zinc-900')
                  }`}>
                    <input type="radio" checked={draftAiConfig?.translationProviderId === 'google'} onChange={() => setDraftTranslationProviderId('google')} className="accent-blue-600 w-4 h-4" />
                    <div>
                      <div className={`font-medium text-sm ${isDarkMode ? 'text-zinc-200' : 'text-gray-800'}`}>Google 免费直连</div>
                      <div className={`text-[10px] mt-0.5 ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>无需配置，开箱即用（仅翻译）</div>
                    </div>
                  </label>
                  {serviceProviders.map(provider => (
                    <label key={provider.id} className={`flex items-center gap-3 cursor-pointer p-2.5 rounded-lg border transition-colors ${
                      draftAiConfig?.translationProviderId === provider.id
                        ? d('bg-blue-50 border-blue-300', 'bg-blue-950/20 border-blue-700')
                        : d('bg-gray-50 border-gray-200 hover:border-blue-100', 'bg-zinc-950 border-zinc-800 hover:bg-zinc-900')
                    }`}>
                      <input type="radio" checked={draftAiConfig?.translationProviderId === provider.id} onChange={() => setDraftTranslationProviderId(provider.id)} className="accent-blue-600 w-4 h-4" />
                      <div>
                        <div className={`font-medium text-sm ${isDarkMode ? 'text-zinc-200' : 'text-gray-800'}`}>{provider.name}</div>
                        <div className={`text-[10px] mt-0.5 flex items-center gap-1.5 ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
                          <span>{provider.modelName}</span>
                          <ModelListLink provider={provider} />
                        </div>
                      </div>
                    </label>
                  ))}
                  {serviceProviders.length === 0 && (
                    <div className={`text-xs py-1.5 px-3 ${isDarkMode ? 'text-zinc-600' : 'text-gray-400'}`}>
                      请先在「AI 服务」中添加并配置至少一个服务商
                    </div>
                  )}
                </div>
              </div>

              {/* 提示词优化服务 */}
              <div>
                <div className={`text-sm font-medium mb-2 flex items-center gap-2 ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>
                  <Zap size={14} className="text-[var(--app-brand)]" /> 默认优化服务
                </div>
                <p className={`text-xs mb-2 ${isDarkMode ? 'text-zinc-500' : 'text-gray-400'}`}>作为主界面提示词后处理的默认优化模型</p>
                <div className="space-y-1.5">
                  {serviceProviders.map(provider => (
                    <label key={provider.id} className={`flex items-center gap-3 cursor-pointer p-2.5 rounded-lg border transition-colors ${
                      draftAiConfig?.conversionProviderId === provider.id
                        ? 'bg-[var(--app-brand-soft)] border-[color-mix(in_srgb,var(--app-brand)_58%,transparent)]'
                        : 'app-secondary-action'
                    }`}>
                      <input type="radio" checked={draftAiConfig?.conversionProviderId === provider.id} onChange={() => setDraftConversionProviderId(provider.id)} className="accent-blue-600 w-4 h-4" />
                      <div>
                        <div className={`font-medium text-sm ${isDarkMode ? 'text-zinc-200' : 'text-gray-800'}`}>{provider.name}</div>
                        <div className={`text-[10px] mt-0.5 flex items-center gap-1.5 ${isDarkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
                          <span>{provider.modelName}</span>
                          <ModelListLink provider={provider} />
                        </div>
                      </div>
                    </label>
                  ))}
                  {serviceProviders.length === 0 && (
                    <div className={`text-xs py-1.5 px-3 ${isDarkMode ? 'text-zinc-600' : 'text-gray-400'}`}>
                      请先在「AI 服务」中添加并配置至少一个服务商
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={`border-t ${isDarkMode ? 'border-zinc-800' : 'border-gray-200'}`}></div>

            {/* ===== 日志 ===== */}
            <div ref={el => sectionRefs.current['logs'] = el} className="space-y-4 py-6">
              <div className="flex items-center justify-between gap-3">
                <h4 className={`text-sm font-bold flex items-center gap-2 ${isDarkMode ? 'text-zinc-200' : 'text-gray-800'}`}>
                  <FileText size={14} className="text-orange-500" /> 应用日志
                </h4>
                <button
                  type="button"
                  onClick={clearLogs}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${isDarkMode ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                  清空
                </button>
              </div>
              <div key={logRefreshKey} className={`h-56 overflow-y-auto custom-scrollbar rounded-lg border p-3 text-xs font-mono space-y-1 ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-400' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                {logs.length === 0 ? (
                  <div className="text-center py-8 opacity-50">暂无日志</div>
                ) : (
                  logs.map((entry, i) => (
                    <div key={`${entry.ts}-${i}`} className={`flex gap-2 py-0.5 ${entry.level === 'error' ? (isDarkMode ? 'text-red-400' : 'text-red-600') : entry.level === 'warn' ? (isDarkMode ? 'text-yellow-400' : 'text-yellow-600') : ''}`}>
                      <span className="opacity-40 shrink-0">{new Date(entry.ts).toLocaleTimeString()}</span>
                      <span className={`shrink-0 w-14 text-right font-bold ${entry.level === 'error' ? 'text-red-500' : entry.level === 'warn' ? 'text-yellow-500' : 'text-blue-400'}`}>[{entry.level.toUpperCase()}]</span>
                      <span className="opacity-60 shrink-0">{entry.source}</span>
                      <span className="break-all">{entry.message}</span>
                      {entry.detail && <span className="opacity-30 break-all ml-1">{String(entry.detail).substring(0, 120)}</span>}
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
        <div className="app-modal-header px-6 py-4 border-t flex items-center justify-between shrink-0">
          <button onClick={() => { if (window.confirm('确定要清除所有本地数据吗？这将删除所有工作区、快照和预设。')) { handleLogout(); setIsTransConfigModalOpen(false); } }} className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${isDarkMode ? 'bg-red-950/40 text-red-400 hover:bg-red-900/40' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>
            <LogOut size={14} /> 清除数据
          </button>
          <div className="flex items-center gap-2">
            <button onClick={closeWithoutSaving} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors active:scale-95 ${d('bg-gray-100 text-gray-700 hover:bg-gray-200', 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700')}`}>
              取消
            </button>
            <button onClick={applyAndClose} className={`px-4 py-2 text-sm font-bold text-white rounded-lg transition-colors active:scale-95 ${isDarkMode ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-600 hover:bg-blue-700'}`}>
              关闭并应用
            </button>
          </div>
        </div>
      </div>

      {/* ===== 添加 AI 服务弹窗 ===== */}
      {addModalOpen && (
        <div className="app-overlay fixed inset-0 z-[130] flex items-center justify-center p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setAddModalOpen(false); }}>
          <div className="app-modal rounded-xl w-full max-w-md border" onClick={e => e.stopPropagation()}>

            {/* 弹窗标题 */}
            <div className="app-modal-header px-5 py-3.5 border-b flex justify-between items-center">
              <h4 className={`font-bold text-sm flex items-center gap-2 ${isDarkMode ? 'text-zinc-200' : 'text-gray-800'}`}>
                <Plus size={16} className="text-blue-500" /> 添加 AI 服务
              </h4>
              <button onClick={() => setAddModalOpen(false)} className={`p-1 rounded ${d('text-gray-400 hover:text-gray-600 hover:bg-gray-100', 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800')}`}>
                <X size={16} />
              </button>
            </div>

            {/* 弹窗内容 */}
            <div className="p-5 space-y-4">
              {/* 预设下拉 */}
              <div className="space-y-1">
                <label className={`text-xs font-medium pl-1 ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>选择服务商预设</label>
                <select
                  value={addForm.presetKey}
                  onChange={e => handleAddPresetChange(e.target.value)}
                  className={`w-full text-sm p-2.5 rounded-lg border outline-none focus:ring-1 focus:ring-blue-500 ${d('bg-gray-50 border-gray-300 text-gray-800', 'bg-zinc-800 border-zinc-700 text-zinc-300')}`}
                >
                  <option value="">自定义</option>
                  {availableProviderPresets.map(p => (
                    <option key={p.key} value={p.key}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* 名称 */}
              <div className="space-y-1">
                <label className={`text-xs font-medium pl-1 ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>标识名称</label>
                <input
                  placeholder="如: My DeepSeek"
                  value={addForm.name}
                  onChange={e => handleAddFormChange('name', e.target.value)}
                  className={`w-full text-sm p-2.5 rounded-lg border outline-none focus:ring-1 focus:ring-blue-500 ${d('bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-400', 'bg-zinc-800 border-zinc-700 text-zinc-300 placeholder-zinc-600')}`}
                />
              </div>

              {/* API Base */}
              <div className="space-y-1">
                <label className={`text-xs font-medium pl-1 ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>API Base URL</label>
                <input
                  placeholder="https://api.example.com/v1"
                  value={addForm.apiBase}
                  onChange={e => handleAddFormChange('apiBase', e.target.value)}
                  className={`w-full text-sm p-2.5 rounded-lg border outline-none focus:ring-1 focus:ring-blue-500 ${d('bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-400', 'bg-zinc-800 border-zinc-700 text-zinc-300 placeholder-zinc-600')}`}
                />
              </div>

              {/* API Key */}
              <div className="space-y-1">
                <label className={`text-xs font-medium pl-1 flex items-center gap-1 ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}><Key size={12} /> API Key</label>
                <input
                  placeholder="sk-..."
                  type="password"
                  value={addForm.apiKey}
                  onChange={e => handleAddFormChange('apiKey', e.target.value)}
                  className={`w-full text-sm p-2.5 rounded-lg border outline-none focus:ring-1 focus:ring-blue-500 ${d('bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-400', 'bg-zinc-800 border-zinc-700 text-zinc-300 placeholder-zinc-600')}`}
                />
                <div className="pl-1">
                  <ApiPageLink provider={addForm} />
                </div>
              </div>

              {/* Model Name */}
              <div className="space-y-1">
                <label className={`text-xs font-medium pl-1 ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>Model Name</label>
                <input
                  placeholder="model-name"
                  value={addForm.modelName}
                  onChange={e => handleAddFormChange('modelName', e.target.value)}
                  className={`w-full text-sm p-2.5 rounded-lg border outline-none focus:ring-1 focus:ring-blue-500 ${d('bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-400', 'bg-zinc-800 border-zinc-700 text-zinc-300 placeholder-zinc-600')}`}
                />
                <div className="pl-1">
                  <ModelListLink provider={addForm} />
                </div>
              </div>
            </div>

            {/* 弹窗底部按钮 */}
            <div className={`px-5 py-3.5 border-t flex justify-end gap-2 ${isDarkMode ? 'border-zinc-800' : 'border-gray-200'}`}>
              <button onClick={() => setAddModalOpen(false)} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${d('bg-gray-100 text-gray-700 hover:bg-gray-200', 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700')}`}>
                取消
              </button>
              <button
                onClick={handleConfirmAdd}
                disabled={!addForm.name.trim() || !addForm.apiBase.trim() || !addForm.apiKey.trim() || !addForm.modelName.trim()}
                className={`px-4 py-2 text-sm font-bold text-white rounded-lg transition-colors ${
                  addForm.name.trim() && addForm.apiBase.trim() && addForm.apiKey.trim() && addForm.modelName.trim()
                    ? 'bg-blue-600 hover:bg-blue-500 active:scale-95'
                    : 'bg-blue-600/40 cursor-not-allowed'
                }`}
              >
                确认添加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== 编辑 AI 服务弹窗 ===== */}
      {editModalOpen && (
        <div className="app-overlay fixed inset-0 z-[130] flex items-center justify-center p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setEditModalOpen(null); }}>
          <div className="app-modal rounded-xl w-full max-w-md border" onClick={e => e.stopPropagation()}>

            {/* 弹窗标题 */}
            <div className="app-modal-header px-5 py-3.5 border-b flex justify-between items-center">
              <h4 className={`font-bold text-sm flex items-center gap-2 ${isDarkMode ? 'text-zinc-200' : 'text-gray-800'}`}>
                <Pencil size={16} className="text-blue-500" /> 编辑 AI 服务
              </h4>
              <button onClick={() => setEditModalOpen(null)} className={`p-1 rounded ${d('text-gray-400 hover:text-gray-600 hover:bg-gray-100', 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800')}`}>
                <X size={16} />
              </button>
            </div>

            {/* 弹窗内容 */}
            <div className="p-5 space-y-4">
              {/* 名称 */}
              <div className="space-y-1">
                <label className={`text-xs font-medium pl-1 ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>标识名称</label>
                <input
                  value={editForm.name}
                  onChange={e => handleEditFormChange('name', e.target.value)}
                  className={`w-full text-sm p-2.5 rounded-lg border outline-none focus:ring-1 focus:ring-blue-500 ${d('bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-400', 'bg-zinc-800 border-zinc-700 text-zinc-300 placeholder-zinc-600')}`}
                />
              </div>

              {/* API Base */}
              <div className="space-y-1">
                <label className={`text-xs font-medium pl-1 ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>API Base URL</label>
                <input
                  value={editForm.apiBase}
                  onChange={e => handleEditFormChange('apiBase', e.target.value)}
                  className={`w-full text-sm p-2.5 rounded-lg border outline-none focus:ring-1 focus:ring-blue-500 ${d('bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-400', 'bg-zinc-800 border-zinc-700 text-zinc-300 placeholder-zinc-600')}`}
                />
              </div>

              {/* API Key */}
              <div className="space-y-1">
                <label className={`text-xs font-medium pl-1 flex items-center gap-1 ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}><Key size={12} /> API Key</label>
                <div className="relative">
                  <input
                    type={showApiKey[editForm.id] ? 'text' : 'password'}
                    value={editForm.apiKey}
                    onChange={e => handleEditFormChange('apiKey', e.target.value)}
                    className={`w-full text-sm p-2.5 pr-10 rounded-lg border outline-none focus:ring-1 focus:ring-blue-500 ${d('bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-400', 'bg-zinc-800 border-zinc-700 text-zinc-300 placeholder-zinc-600')}`}
                  />
                  <button onClick={() => toggleShowApiKey(editForm.id)} className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded ${d('text-gray-400 hover:text-gray-600', 'text-zinc-500 hover:text-zinc-300')}`}>
                    {showApiKey[editForm.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <div className="pl-1">
                  <ApiPageLink provider={editForm} />
                </div>
              </div>

              {/* Model Name */}
              <div className="space-y-1">
                <label className={`text-xs font-medium pl-1 ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>Model Name</label>
                <input
                  value={editForm.modelName}
                  onChange={e => handleEditFormChange('modelName', e.target.value)}
                  className={`w-full text-sm p-2.5 rounded-lg border outline-none focus:ring-1 focus:ring-blue-500 ${d('bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-400', 'bg-zinc-800 border-zinc-700 text-zinc-300 placeholder-zinc-600')}`}
                />
                <div className="pl-1">
                  <ModelListLink provider={editForm} />
                </div>
              </div>
            </div>

            {/* 弹窗底部按钮 */}
            <div className={`px-5 py-3.5 border-t flex justify-end gap-2 ${isDarkMode ? 'border-zinc-800' : 'border-gray-200'}`}>
              <button onClick={() => setEditModalOpen(null)} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${d('bg-gray-100 text-gray-700 hover:bg-gray-200', 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700')}`}>
                取消
              </button>
              <button
                onClick={handleConfirmEdit}
                disabled={!editForm.name.trim() || !editForm.apiBase.trim() || !editForm.apiKey.trim() || !editForm.modelName.trim()}
                className={`px-4 py-2 text-sm font-bold text-white rounded-lg transition-colors ${
                  editForm.name.trim() && editForm.apiBase.trim() && editForm.apiKey.trim() && editForm.modelName.trim()
                    ? 'bg-blue-600 hover:bg-blue-500 active:scale-95'
                    : 'bg-blue-600/40 cursor-not-allowed'
                }`}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
