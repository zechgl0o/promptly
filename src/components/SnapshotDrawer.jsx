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
      <div className="app-overlay absolute inset-0 transition-opacity" onMouseDown={() => setIsDrawerOpen(false)} />
      <div data-snapshot-drawer="true" className="app-drawer relative flex h-full w-80 transform flex-col border-l transition-transform duration-300 sm:w-96">
        <div className="app-drawer-header flex items-center justify-between border-b p-4">
          <h3 className="flex items-center gap-2 font-bold text-[var(--app-text)]">
            <Bookmark size={22} className="text-[var(--app-brand)]" />
            已保存快照
          </h3>
          <div className="flex items-center gap-1">
            <input type="file" id="import-json" accept=".json" className="hidden" onChange={handleImport} />
            <button onClick={() => document.getElementById('import-json').click()} className="tool-button h-8 w-8 text-[var(--app-muted)]" title="导入备份数据 (JSON)">
              <Upload className="h-4 w-4" />
            </button>
            <button onClick={handleExportClick} className="tool-button h-8 w-8 text-[var(--app-muted)]" title="导出备份数据 (JSON)">
              <Download className="h-4 w-4" />
            </button>
            <div className="mx-1 h-4 w-px bg-[var(--app-border)]" />
            <button onClick={() => setIsDrawerOpen(false)} className="tool-button h-8 w-8 text-[var(--app-muted)]" title="关闭">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="custom-scrollbar flex-1 overflow-y-auto bg-[color-mix(in_srgb,var(--app-surface-soft)_72%,transparent)] p-4">
          <div className="space-y-4">
            <div className="app-subpanel space-y-3 p-3">
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-zinc-500' : 'text-gray-400'}`} size={15} />
                <input
                  value={snapshotSearchQuery}
                  onChange={e => setSnapshotSearchQuery(e.target.value)}
                  className="app-input w-full rounded-lg py-2 pl-9 pr-3 text-sm"
                  placeholder="搜索标题或输出内容"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={toggleSnapshotBatchMode}
                  className={`rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
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
                      className={`rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                        isDarkMode ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {allVisibleSnapshotsSelected ? '取消全选' : '全选当前结果'}
                    </button>
                    <button
                      onClick={() => promptAssignFolderForSnapshots(selectedSnapshotIds)}
                      disabled={selectedSnapshotIds.length === 0}
                      className={`rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                        selectedSnapshotIds.length === 0
                          ? `cursor-not-allowed opacity-50 ${isDarkMode ? 'bg-zinc-900 text-zinc-600' : 'bg-gray-100 text-gray-400'}`
                          : (isDarkMode ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
                      }`}
                    >
                      批量加入文件夹
                    </button>
                    <button
                      onClick={handleBatchDeleteSnapshots}
                      disabled={selectedSnapshotIds.length === 0}
                      className={`rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                        selectedSnapshotIds.length === 0
                          ? `cursor-not-allowed opacity-50 ${isDarkMode ? 'bg-zinc-900 text-zinc-600' : 'bg-gray-100 text-gray-400'}`
                          : (isDarkMode ? 'bg-red-950/40 text-red-300 hover:bg-red-900/40' : 'bg-red-50 text-red-600 hover:bg-red-100')
                      }`}
                    >
                      批量删除
                    </button>
                    <div className={`rounded-lg px-3 py-2 text-xs ${isDarkMode ? 'bg-zinc-950 text-zinc-400' : 'bg-gray-100 text-gray-500'}`}>
                      已选 {selectedSnapshotIds.length}
                    </div>
                  </>
                )}
              </div>
            </div>

            {savedPrompts.length === 0 ? (
              <div className={`py-20 text-center italic ${isDarkMode ? 'text-zinc-600' : 'text-gray-400'}`}>暂无历史快照</div>
            ) : matchedSavedPrompts.length === 0 ? (
              <div className={`py-16 text-center italic ${isDarkMode ? 'text-zinc-600' : 'text-gray-400'}`}>没有匹配的快照</div>
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
