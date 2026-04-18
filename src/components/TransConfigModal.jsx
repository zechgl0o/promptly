import { Languages, Settings2, Trash2, Plus } from 'lucide-react';

export default function TransConfigModal({
  isDarkMode,
  // 数据
  transConfig,
  setTransConfig,
  expandedApiId,
  confirmDeleteApiId,
  // 回调
  setIsTransConfigModalOpen,
  handleUpdateCustomApi,
  handleDeleteCustomApi,
  toggleExpandApi,
  setConfirmDeleteApiId,
  handleAddCustomApi,
  handleSaveTransConfig,
}) {
  return (
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
  );
}
