import { Bookmark, Upload, Download, X, Search } from 'lucide-react';

/* eslint-disable no-unused-vars */
export default function SnapshotDrawer({
  isDarkMode,
  savedPrompts,
  matchedSavedPrompts,
  groupedFilteredSavedPrompts,
  snapshotSearchQuery,
  isSnapshotBatchMode,
  selectedSnapshotIds,
  allVisibleSnapshotsSelected,
  folders,
  snapshotPreviewMap,
  editingSavedTitleId,
  copiedDrawerId,
  selectedSnapshotIdSet,
  isSnapshotSearchActive,
  setSnapshotSearchQuery,
  toggleSnapshotBatchMode,
  toggleSelectAllVisibleSnapshots,
  promptAssignFolderForSnapshots,
  handleBatchDeleteSnapshots,
  setEditingSavedTitleId,
  updateSavedTitle,
  deleteSnapshot,
  updateActiveWorkspace,
  setIsDrawerOpen,
  executeCopy,
  handleImport,
  handleExportClick,
  editingFolderId,
  editingFolderName,
  activeFolderStylePickerId,
  toggleFolderExpanded,
  startEditingFolder,
  finishEditingFolder,
  commitFolderRename,
  setEditingFolderName,
  setActiveFolderStylePickerId,
  setFolderStylePickerPos,
  openFolderDeleteDialog,
  renderSnapshotCard,
  renderFolderSection,
}) {
  return (

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
      <div className={`flex-1 overflow-y-auto p-4 custom-scrollbar ${isDarkMode ? 'bg-zinc-950/50' : 'bg-gray-50/50'}`}>
        <div className="space-y-4">
          <div className={`rounded-xl border p-3 space-y-3 ${isDarkMode ? 'border-zinc-800 bg-zinc-900/70' : 'border-gray-200 bg-white/90'}`}>
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-zinc-500' : 'text-gray-400'}`} size={15} />
              <input
                value={snapshotSearchQuery}
                onChange={e => setSnapshotSearchQuery(e.target.value)}
                className={`w-full rounded-lg border py-2 pl-9 pr-3 text-sm outline-none transition-colors ${
                  isDarkMode ? 'border-zinc-800 bg-zinc-950 text-zinc-200 focus:border-blue-700' : 'border-gray-200 bg-gray-50 text-gray-700 focus:border-blue-300'
                }`}
                placeholder="搜索标题、文件夹或输出内容"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={toggleSnapshotBatchMode}
                className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors ${
                  isSnapshotBatchMode
                    ? (isDarkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-700')
                    : (isDarkMode ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
                }`}
              >
                {isSnapshotBatchMode ? '退出批量' : '批量管理'}
              </button>

              {isSnapshotBatchMode && (
                <>
                  <button
                    onClick={toggleSelectAllVisibleSnapshots}
                    className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors ${
                      isDarkMode ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {allVisibleSnapshotsSelected ? '取消全选' : '全选当前结果'}
                  </button>
                  <button
                    onClick={() => promptAssignFolderForSnapshots(selectedSnapshotIds)}
                    disabled={selectedSnapshotIds.length === 0}
                    className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors ${
                      selectedSnapshotIds.length === 0
                        ? 'opacity-50 cursor-not-allowed ' + (isDarkMode ? 'bg-zinc-900 text-zinc-600' : 'bg-gray-100 text-gray-400')
                        : (isDarkMode ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
                    }`}
                  >
                    批量加入文件夹
                  </button>
                  <button
                    onClick={handleBatchDeleteSnapshots}
                    disabled={selectedSnapshotIds.length === 0}
                    className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors ${
                      selectedSnapshotIds.length === 0
                        ? 'opacity-50 cursor-not-allowed ' + (isDarkMode ? 'bg-zinc-900 text-zinc-600' : 'bg-gray-100 text-gray-400')
                        : (isDarkMode ? 'bg-red-950/40 text-red-300 hover:bg-red-900/40' : 'bg-red-50 text-red-600 hover:bg-red-100')
                    }`}
                  >
                    批量删除
                  </button>
                  <div className={`px-3 py-2 text-xs rounded-lg ${isDarkMode ? 'bg-zinc-950 text-zinc-400' : 'bg-gray-100 text-gray-500'}`}>
                    已选 {selectedSnapshotIds.length}
                  </div>
                </>
              )}
            </div>
          </div>

          {savedPrompts.length === 0 ? (
            <div className={`text-center py-20 italic ${isDarkMode ? 'text-zinc-600' : 'text-gray-400'}`}>暂无历史快照</div>
          ) : matchedSavedPrompts.length === 0 ? (
            <div className={`text-center py-16 italic ${isDarkMode ? 'text-zinc-600' : 'text-gray-400'}`}>没有匹配的快照</div>
          ) : (
            <>
              {groupedFilteredSavedPrompts.folders.map(renderFolderSection)}

              {groupedFilteredSavedPrompts.ungrouped.length > 0 && (
                <section className="space-y-3">
                  <div className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
                    isDarkMode ? 'border-zinc-800 bg-zinc-900/70 text-zinc-200' : 'border-gray-200 bg-white text-gray-700'
                  }`}>
                    未分组
                  </div>

                  <div className="space-y-3">
                    {groupedFilteredSavedPrompts.ungrouped.map(snapshot => renderSnapshotCard(snapshot))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  </div>

  );
}
/* eslint-enable no-unused-vars */
