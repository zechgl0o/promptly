import { AlertTriangle, Check, CheckCircle2, Minus, Plus, Download, Lock } from 'lucide-react';
import TransConfigModal from './TransConfigModal';

export default function Modals({
  isDarkMode,

  // ---- 共享数据 ----
  workspaces, savedPrompts, presets,

  // ---- 翻译设置 ----
  isTransConfigModalOpen, setIsTransConfigModalOpen,
  transConfig, setTransConfig,
  expandedApiId, confirmDeleteApiId,
  handleUpdateCustomApi, handleDeleteCustomApi,
  toggleExpandApi, setConfirmDeleteApiId,
  handleAddCustomApi, handleSaveTransConfig,

  // ---- 文件夹删除 ----
  folderDeleteTarget, setFolderDeleteTarget,
  handleDeleteFolderWithContents, handleDissolveFolder,

  // ---- 标签页关闭警告 ----
  isCloseWarningOpen, setIsCloseWarningOpen,
  pendingCloseTabId, setPendingCloseTabId,
  executeCloseTab,

  // ---- 保存快照（含关闭警告页共享的 setter） ----
  isSaveModalOpen, setIsSaveModalOpen,
  saveTitle, setSaveTitle,
  saveInputRef,
  handlePreSave, adjustSaveTitleNumber, hasSaveTitleNumber,

  // ---- 导出 ----
  isExportModalOpen, setIsExportModalOpen,
  exportOptions, setExportOptions,
  confirmExport,

  // ---- 导入模式 ----
  pendingImportPayload, // setPendingImportPayload kept for API stability
  closeImportModeModal, handleImportWithMode,

  // ---- 同名冲突 ----
  isConflictModalOpen, // setIsConflictModalOpen kept for API stability
  conflictTarget,
  handleOverwrite, handleAutoRename, handleCancelConflict,

  // ---- 重置确认 ----
  isResetModalOpen, setIsResetModalOpen,
  confirmReset,

  // ---- 修改密码 ----
  showChangePassword, setShowChangePassword,
  changePasswordForm, setChangePasswordForm,
  handleChangePassword, authError, setAuthError,

  // ---- 全局提示 Toast ----
  errorMessage, successMessage,
}) {
  return (
    <>
      {/* ================= 翻译设置弹窗 ================= */}
      {isTransConfigModalOpen && (
        <TransConfigModal
          isDarkMode={isDarkMode}
          transConfig={transConfig}
          setTransConfig={setTransConfig}
          expandedApiId={expandedApiId}
          confirmDeleteApiId={confirmDeleteApiId}
          setIsTransConfigModalOpen={setIsTransConfigModalOpen}
          handleUpdateCustomApi={handleUpdateCustomApi}
          handleDeleteCustomApi={handleDeleteCustomApi}
          toggleExpandApi={toggleExpandApi}
          setConfirmDeleteApiId={setConfirmDeleteApiId}
          handleAddCustomApi={handleAddCustomApi}
          handleSaveTransConfig={handleSaveTransConfig}
        />
      )}

      {/* ================= 文件夹删除弹窗 ================= */}
      {folderDeleteTarget && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) setFolderDeleteTarget(null); }}>
          <div className={`rounded-2xl shadow-2xl p-6 w-full max-w-md border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-transparent'}`} onClick={e => e.stopPropagation()}>
            <h3 className={`font-bold text-lg mb-2 ${isDarkMode ? 'text-zinc-200' : 'text-gray-800'}`}>
              删除文件夹&ldquo;{folderDeleteTarget.folderName}&rdquo;
            </h3>
            <p className={`text-sm leading-6 mb-6 ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>
              你可以删除整个文件夹及其中{folderDeleteTarget.scope === 'preset' ? '预设' : '快照'}，或仅解散文件夹并把里面的{folderDeleteTarget.scope === 'preset' ? '预设' : '快照'}放回列表中。
            </p>

            <div className="flex flex-col gap-3">
              <button onClick={handleDeleteFolderWithContents} className={`w-full py-3 text-sm font-bold rounded-xl transition-colors ${isDarkMode ? 'bg-red-950/40 text-red-300 hover:bg-red-900/40' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>
                删除文件夹和内容
              </button>
              <button onClick={handleDissolveFolder} className={`w-full py-3 text-sm font-bold rounded-xl transition-colors ${isDarkMode ? 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                只解散文件夹
              </button>
              <button onClick={() => setFolderDeleteTarget(null)} className={`w-full py-3 text-sm font-bold rounded-xl transition-colors ${isDarkMode ? 'bg-zinc-950 text-zinc-400 hover:bg-zinc-800' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                取消
              </button>
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
                  <span className={`text-sm font-bold ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>预设片段库 ({presets?.length ?? 0})</span>
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

      {/* ================= 导入模式选择弹窗 ================= */}
      {pendingImportPayload && (
        <div className="fixed inset-0 z-[128] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) closeImportModeModal(); }}>
          <div className={`rounded-2xl shadow-2xl p-6 w-full max-w-md border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-transparent'}`} onClick={e => e.stopPropagation()}>
            <h3 className={`font-bold mb-2 text-lg flex items-center gap-2 ${isDarkMode ? 'text-zinc-200' : 'text-gray-800'}`}>
              <AlertTriangle className="w-5 h-5 text-amber-500" /> 导入快照方式
            </h3>
            <p className={`text-sm mb-6 leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>
              当前列表里已有 <span className={`font-bold px-1 rounded ${isDarkMode ? 'text-blue-400 bg-blue-900/30' : 'text-blue-600 bg-blue-50'}`}>{pendingImportPayload.currentSnapshotCount}</span> 条快照，
              这次要导入 <span className={`font-bold px-1 rounded ${isDarkMode ? 'text-blue-400 bg-blue-900/30' : 'text-blue-600 bg-blue-50'}`}>{pendingImportPayload.importedSnapshotCount}</span> 条快照。
              请选择先清空当前快照列表再导入，还是直接合并到现有列表。工作区、预设和设置仍会按原逻辑导入。
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={() => handleImportWithMode('replace')} className={`w-full py-2.5 text-sm font-bold rounded-xl transition-colors border active:scale-[0.98] ${isDarkMode ? 'bg-red-950/30 text-red-400 border-red-900/50 hover:bg-red-900/40' : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'}`}>
                清空当前快照后导入
              </button>
              <button onClick={() => handleImportWithMode('merge')} className={`w-full py-2.5 text-sm font-bold text-white rounded-xl shadow-md transition-colors active:scale-[0.98] ${isDarkMode ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-600 hover:bg-blue-700'}`}>
                合并到当前列表
              </button>
              <button onClick={closeImportModeModal} className={`w-full py-2.5 text-sm font-bold rounded-xl transition-colors active:scale-[0.98] ${isDarkMode ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= 同名快照冲突弹窗 ================= */}
      {isConflictModalOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) handleCancelConflict(); }}>
          <div className={`rounded-2xl shadow-2xl p-6 w-full max-w-sm border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-transparent'}`} onClick={e => e.stopPropagation()}>
            <h3 className={`font-bold mb-2 text-lg flex items-center gap-2 ${isDarkMode ? 'text-zinc-200' : 'text-gray-800'}`}>
              <AlertTriangle className="w-5 h-5 text-amber-500" /> 发现同名快照
            </h3>
            <p className={`text-sm mb-6 leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>已存在名为 <span className={`font-bold px-1 rounded ${isDarkMode ? 'text-blue-400 bg-blue-900/30' : 'text-blue-600 bg-blue-50'}`}>&ldquo;{conflictTarget?.title}&rdquo;</span> 的快照。您希望如何处理？</p>
            <div className="flex flex-col gap-3">
              <button onClick={handleOverwrite} className={`w-full py-2.5 text-sm font-bold rounded-xl transition-colors border active:scale-[0.98] ${isDarkMode ? 'bg-red-950/30 text-red-400 border-red-900/50 hover:bg-red-900/40' : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'}`}>直接覆盖原快照</button>
              <button onClick={handleAutoRename} className={`w-full py-2.5 text-sm font-bold text-white rounded-xl shadow-md transition-colors active:scale-[0.98] ${isDarkMode ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-600 hover:bg-blue-700'}`}>自动重命名并保存为新快照</button>
              <button onClick={handleCancelConflict} className={`w-full py-2.5 text-sm font-bold rounded-xl transition-colors active:scale-[0.98] ${isDarkMode ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>取消，我要自己改名</button>
            </div>
          </div>
        </div>
      )}

      {/* ================= 重置确认弹窗 ================= */}
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

      {/* ================= 修改密码弹窗 ================= */}
      {showChangePassword && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowChangePassword(false); }}>
          <div className={`rounded-2xl shadow-2xl p-6 w-full max-w-xs border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-transparent'}`} onClick={e => e.stopPropagation()}>
            <h3 className={`font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-zinc-200' : 'text-gray-800'}`}><Lock className="w-5 h-5 text-blue-500" /> 修改密码</h3>
            <div className="space-y-3 mb-6">
              <input type="password" value={changePasswordForm.oldPassword} onChange={e => setChangePasswordForm(prev => ({ ...prev, oldPassword: e.target.value }))} placeholder="旧密码" className={`w-full px-4 py-2.5 rounded-lg border outline-none text-sm ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-200 focus:border-blue-600' : 'bg-gray-50 border-gray-200 text-gray-800 focus:border-blue-500'}`} />
              <input type="password" value={changePasswordForm.newPassword} onChange={e => setChangePasswordForm(prev => ({ ...prev, newPassword: e.target.value }))} placeholder="新密码（至少8位，包含字母和数字）" className={`w-full px-4 py-2.5 rounded-lg border outline-none text-sm ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-200 focus:border-blue-600' : 'bg-gray-50 border-gray-200 text-gray-800 focus:border-blue-500'}`} />
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
    </>
  );
}
