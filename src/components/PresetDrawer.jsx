import { Library, X, Search, FolderPlus, Trash2, ChevronDown } from 'lucide-react';
import { getFolderColorOption } from '../lib/constants';
import { getFolderIconOption } from '../lib/folderUtils';

/* eslint-disable no-unused-vars */
export default function PresetDrawer({
  isDarkMode,
  presets,
  matchedPresets,
  groupedFilteredPresets,
  presetSearchQuery,
  isPresetBatchMode,
  selectedPresetIds,
  allVisiblePresetsSelected,
  folders,
  editingPresetTitleId,
  selectedPresetIdSet,
  isPresetSearchActive,
  setPresetSearchQuery,
  togglePresetBatchMode,
  toggleSelectAllVisiblePresets,
  promptAssignFolderForPresets,
  handleBatchDeletePresets,
  setEditingPresetTitleId,
  updatePresetTitle,
  setPresets,
  deletePreset,
  insertPreset,
  setIsPresetDrawerOpen,
  togglePresetFolderExpanded,
  openFolderDeleteDialog,
  renderPresetCard,
}) {
  return (

  <div className="fixed inset-0 z-[100] flex justify-start">
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onMouseDown={() => setIsPresetDrawerOpen(false)} />
    <div className={`relative w-80 sm:w-96 shadow-2xl h-full flex flex-col transform transition-transform duration-300 border-r ${isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-gray-200'}`}>
      <div className={`p-4 border-b flex justify-between items-center transition-colors ${isDarkMode ? 'bg-purple-950/20 border-zinc-800' : 'bg-purple-50 border-purple-100'}`}>
        <h3 className={`font-bold flex gap-2 items-center ${isDarkMode ? 'text-purple-400' : 'text-purple-700'}`}><Library className="w-5 h-5"/> 我的预设库 ({presets.length})</h3>
        <button onClick={() => setIsPresetDrawerOpen(false)} className={`p-1.5 rounded-full transition-colors ${isDarkMode ? 'text-purple-500 hover:bg-purple-900/30' : 'text-purple-600 hover:bg-purple-200/50'}`}><X size={20}/></button>
      </div>
      <div className={`flex-1 overflow-y-auto p-4 custom-scrollbar ${isDarkMode ? 'bg-zinc-950/50' : 'bg-gray-50/50'}`}>
        <div className="space-y-4">
          {/* 搜索 + 批量操作工具栏 */}
          <div className={`rounded-xl border p-3 space-y-3 ${isDarkMode ? 'border-zinc-800 bg-zinc-900/70' : 'border-gray-200 bg-white/90'}`}>
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-zinc-500' : 'text-gray-400'}`} size={15} />
              <input
                value={presetSearchQuery}
                onChange={e => setPresetSearchQuery(e.target.value)}
                className={`w-full rounded-lg border py-2 pl-9 pr-3 text-sm outline-none transition-colors ${
                  isDarkMode ? 'border-zinc-800 bg-zinc-950 text-zinc-200 focus:border-purple-700' : 'border-gray-200 bg-gray-50 text-gray-700 focus:border-purple-300'
                }`}
                placeholder="搜索预设标题、内容或标签"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={togglePresetBatchMode}
                className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors ${
                  isPresetBatchMode
                    ? (isDarkMode ? 'bg-purple-900/40 text-purple-300' : 'bg-purple-100 text-purple-700')
                    : (isDarkMode ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
                }`}
              >
                {isPresetBatchMode ? '退出批量' : '批量管理'}
              </button>

              {isPresetBatchMode && (
                <>
                  <button
                    onClick={toggleSelectAllVisiblePresets}
                    className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors ${
                      isDarkMode ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {allVisiblePresetsSelected ? '取消全选' : '全选当前结果'}
                  </button>
                  <button
                    onClick={() => promptAssignFolderForPresets(selectedPresetIds)}
                    disabled={selectedPresetIds.length === 0}
                    className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors ${
                      selectedPresetIds.length === 0
                        ? 'opacity-50 cursor-not-allowed ' + (isDarkMode ? 'bg-zinc-900 text-zinc-600' : 'bg-gray-100 text-gray-400')
                        : (isDarkMode ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
                    }`}
                  >
                    批量加入文件夹
                  </button>
                  <button
                    onClick={handleBatchDeletePresets}
                    disabled={selectedPresetIds.length === 0}
                    className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors ${
                      selectedPresetIds.length === 0
                        ? 'opacity-50 cursor-not-allowed ' + (isDarkMode ? 'bg-zinc-900 text-zinc-600' : 'bg-gray-100 text-gray-400')
                        : (isDarkMode ? 'bg-red-950/40 text-red-300 hover:bg-red-900/40' : 'bg-red-50 text-red-600 hover:bg-red-100')
                    }`}
                  >
                    批量删除
                  </button>
                  <div className={`px-3 py-2 text-xs rounded-lg ${isDarkMode ? 'bg-zinc-950 text-zinc-400' : 'bg-gray-100 text-gray-500'}`}>
                    已选 {selectedPresetIds.length}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 预设列表（文件夹分组） */}
          {presets.length === 0 ? (
            <div className={`text-center py-20 flex flex-col items-center gap-3 ${isDarkMode ? 'text-zinc-600' : 'text-gray-400'}`}>
              <FolderPlus className="w-10 h-10 opacity-50" />
              <p className="text-sm">暂无预设。<br/>点击左侧片段右上角的 📁 按钮，<br/>即可将常用片段存入此库。</p>
            </div>
          ) : matchedPresets.length === 0 ? (
            <div className={`text-center py-16 italic ${isDarkMode ? 'text-zinc-600' : 'text-gray-400'}`}>没有匹配的预设</div>
          ) : (
            <>
              {/* 文件夹分组 */}
              {groupedFilteredPresets.folders.map(group => {
                const colorOption = getFolderColorOption(group.folderColor);
                const iconOption = getFolderIconOption(group.folderIcon);
                const FolderGlyph = iconOption.icon;
                const countLabel = isPresetSearchActive ? `${group.matchedCount} / ${group.totalCount}` : `${group.totalCount}`;
                return (
                  <section key={group.folderId} className="space-y-3">
                    <div className="space-y-2">
                      <div
                        onClick={() => togglePresetFolderExpanded(group.folderId)}
                        className={`flex items-center justify-between rounded-xl border px-3 py-2 transition-colors cursor-pointer ${
                          group.isExpanded
                            ? (isDarkMode ? colorOption.darkRow : colorOption.lightRow)
                            : (isDarkMode ? 'border-zinc-800 bg-zinc-900/70' : 'border-gray-200 bg-white')
                        }`}
                      >
                        <div className="min-w-0 flex flex-1 items-center gap-2">
                          <div className={`flex items-center gap-2 min-w-0 flex-1 ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>
                            <ChevronDown size={15} className={`shrink-0 transition-transform ${group.isExpanded ? 'rotate-0' : '-rotate-90'}`} />
                            <span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${isDarkMode ? colorOption.darkIcon : colorOption.lightIcon}`}>
                              <FolderGlyph size={14} />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className={`max-w-full truncate px-1.5 py-0.5 text-left text-sm font-semibold block ${isDarkMode ? 'text-zinc-200' : 'text-gray-800'}`}>
                              {group.folderName}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3 flex shrink-0 items-center gap-2">
                          <span className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums ${isDarkMode ? colorOption.darkBadge : colorOption.lightBadge}`}>
                            {countLabel}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); openFolderDeleteDialog(group.folderId, group.folderName, 'preset'); }}
                            className={`rounded-lg p-1.5 transition-colors ${isDarkMode ? 'text-zinc-400 hover:bg-red-950/30 hover:text-red-300' : 'text-gray-500 hover:bg-red-50 hover:text-red-500'}`}
                            title="删除文件夹"
                          >
                            <Trash2 size={14}/>
                          </button>
                        </div>
                      </div>

                      {group.isExpanded && (
                        <div className="space-y-3 ml-4 pl-4 relative">
                          {group.items.map(p => renderPresetCard(p, {
                            isNested: true,
                            accentColor: colorOption.accent,
                            hideFolderLabel: true,
                          }))}
                        </div>
                      )}
                    </div>
                  </section>
                );
              })}

              {/* 未分组的预设 */}
              {groupedFilteredPresets.ungrouped.length > 0 && (
                <section className="space-y-3">
                  <div className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
                    isDarkMode ? 'border-zinc-800 bg-zinc-900/70 text-zinc-200' : 'border-gray-200 bg-white text-gray-700'
                  }`}>
                    未分组
                  </div>
                  <div className="space-y-3">
                    {groupedFilteredPresets.ungrouped.map(p => renderPresetCard(p))}
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
