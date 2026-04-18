import { FolderPlus, Minus, Plus } from 'lucide-react';
import { getFolderColorOption } from '../lib/constants';
import { getFolderIconOption } from '../lib/folderUtils';

export default function FolderPickerModal({
  isDarkMode,
  // 数据
  showFolderPicker,
  folderPickerSnapshotIds,
  folderPickerTarget,
  folders,
  presets,
  savedPrompts,
  folderPickerCreating,
  folderPickerNewName,
  setFolderPickerNewName,
  folderPickerDefaultName,
  // 回调
  closeFolderPicker,
  handlePickerSelectFolder,
  handlePickerRemoveFromFolder,
  handlePickerStartCreating,
  handlePickerCancelCreating,
  handlePickerConfirmCreating,
}) {
  if (!showFolderPicker) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) closeFolderPicker(); }}>
      <div className={`rounded-2xl shadow-2xl p-5 w-full max-w-sm border flex flex-col max-h-[80vh] ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-transparent'}`} onClick={e => e.stopPropagation()}>
        <h3 className={`font-bold mb-4 flex items-center gap-2 shrink-0 ${isDarkMode ? 'text-zinc-200' : 'text-gray-800'}`}>
          <FolderPlus className="w-5 h-5 text-blue-500" />
          加入文件夹{folderPickerTarget === 'preset' ? ' (预设)' : ' (快照)'}
        </h3>

        <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar min-h-0 -mx-1 px-1">
          {/* 移出文件夹选项 */}
          {(() => {
            const hasAnyInFolder = folderPickerSnapshotIds.some(id => {
              if (folderPickerTarget === 'preset') {
                const p = presets.find(x => x.id === id);
                return p && p.folderId;
              } else {
                const s = savedPrompts.find(s => s.id === id);
                return s && s.folderId;
              }
            });
            const label = folderPickerTarget === 'preset' ? '预设' : '快照';
            return (
              <button
                onClick={hasAnyInFolder ? handlePickerRemoveFromFolder : undefined}
                disabled={!hasAnyInFolder}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${hasAnyInFolder ? (isDarkMode ? 'border-zinc-800 bg-zinc-950 hover:bg-zinc-800 hover:border-zinc-700' : 'border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300') : (isDarkMode ? 'border-zinc-800/50 bg-zinc-950/30 cursor-not-allowed' : 'border-gray-100 bg-gray-50/50 cursor-not-allowed')}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${hasAnyInFolder ? (isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-gray-200 text-gray-500') : (isDarkMode ? 'bg-zinc-900 text-zinc-700' : 'bg-gray-100 text-gray-300')}`}>
                  <Minus size={16} />
                </div>
                <div className="flex flex-col min-w-0">
                  <div className={`text-sm font-medium truncate ${hasAnyInFolder ? (isDarkMode ? 'text-zinc-300' : 'text-gray-700') : (isDarkMode ? 'text-zinc-600' : 'text-gray-400')}`}>移出文件夹</div>
                  <div className={`text-xs ${hasAnyInFolder ? (isDarkMode ? 'text-zinc-500' : 'text-gray-400') : (isDarkMode ? 'text-zinc-700' : 'text-gray-300')}`}>{hasAnyInFolder ? `将${label}从文件夹中移除` : `选中的${label}不在任何文件夹中`}</div>
                </div>
              </button>
            );
          })()}

          {/* 现有文件夹列表（按 scope 过滤） */}
          {folders.filter(f => f.scope === folderPickerTarget).map(folder => {
            const colorOption = getFolderColorOption(folder.color);
            const iconOption = getFolderIconOption(folder.icon);
            const FolderGlyph = iconOption.icon;
            const itemCount = folderPickerTarget === 'preset'
              ? presets.filter(p => p.folderId === folder.id).length
              : savedPrompts.filter(s => s.folderId === folder.id).length;
            const itemLabel = folderPickerTarget === 'preset' ? '个预设' : '个快照';
            return (
              <button
                key={folder.id}
                onClick={() => handlePickerSelectFolder(folder.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left group ${isDarkMode ? 'border-zinc-800 bg-zinc-950 hover:bg-zinc-800 hover:border-zinc-700' : 'border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300'}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${isDarkMode ? colorOption.darkIcon : colorOption.lightIcon}`}>
                  <FolderGlyph size={16} />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className={`text-sm font-medium truncate ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>{folder.name}</div>
                  <div className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-gray-400'}`}>
                    {itemCount} {itemLabel}
                  </div>
                </div>
              </button>
            );
          })}

          {/* 新建文件夹区域 */}
          {folderPickerCreating ? (
            <div className={`flex items-center gap-2 p-3 rounded-lg border ${isDarkMode ? 'border-blue-800 bg-blue-950/20' : 'border-blue-300 bg-blue-50'}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${isDarkMode ? 'bg-blue-950/40 text-blue-300 border-blue-900/50' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                <FolderPlus size={16} />
              </div>
              <div className="flex-1 flex items-center gap-2 min-w-0">
                <input
                  autoFocus
                  value={folderPickerNewName}
                  onChange={e => setFolderPickerNewName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handlePickerConfirmCreating();
                    if (e.key === 'Escape') handlePickerCancelCreating();
                  }}
                  placeholder={folderPickerDefaultName || '输入文件夹名称'}
                  className={`flex-1 min-w-0 text-sm p-1.5 rounded border outline-none focus:ring-1 focus:ring-blue-500 ${isDarkMode ? 'bg-zinc-900 border-zinc-700 text-zinc-300 placeholder-zinc-600' : 'bg-white border-gray-300 placeholder-gray-400 text-gray-800'}`}
                />
                <button
                  onClick={handlePickerConfirmCreating}
                  className={`px-2.5 py-1 text-xs font-bold rounded transition-colors shrink-0 bg-blue-600 text-white hover:bg-blue-500`}
                >
                  确认
                </button>
                <button
                  onClick={handlePickerCancelCreating}
                  className={`px-2.5 py-1 text-xs rounded transition-colors shrink-0 ${isDarkMode ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handlePickerStartCreating}
              className={`w-full flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed transition-colors ${isDarkMode ? 'border-zinc-800 text-zinc-500 hover:border-blue-800 hover:text-blue-400 hover:bg-blue-950/20' : 'border-gray-200 text-gray-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50'}`}
            >
              <Plus size={16} />
              <span className="text-sm font-medium">新建文件夹</span>
            </button>
          )}
        </div>

        <button
          onClick={closeFolderPicker}
          className={`w-full py-2.5 mt-4 text-sm font-bold rounded-xl transition-colors active:scale-95 shrink-0 ${isDarkMode ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          取消
        </button>
      </div>
    </div>
  );
}
