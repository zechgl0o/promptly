import { FolderPlus, Minus, Plus } from 'lucide-react';
import { getFolderColorOption } from '../lib/constants';
import { getFolderIconOption } from '../lib/folderUtils';

export default function FolderPickerModal({
  isDarkMode,
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
  closeFolderPicker,
  handlePickerSelectFolder,
  handlePickerRemoveFromFolder,
  handlePickerStartCreating,
  handlePickerCancelCreating,
  handlePickerConfirmCreating,
}) {
  if (!showFolderPicker) return null;

  const targetLabel = folderPickerTarget === 'preset' ? '预设' : '快照';

  return (
    <div className="app-overlay fixed inset-0 z-[120] flex items-center justify-center p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) closeFolderPicker(); }}>
      <div className="app-modal flex max-h-[80vh] w-full max-w-sm flex-col rounded-2xl border p-5" onClick={e => e.stopPropagation()}>
        <h3 className="mb-4 flex shrink-0 items-center gap-2 font-bold text-[var(--app-text)]">
          <FolderPlus className="h-5 w-5 text-[var(--app-brand)]" />
          加入文件夹 ({targetLabel})
        </h3>

        <div className="-mx-1 min-h-0 flex-1 space-y-2 overflow-y-auto px-1 custom-scrollbar">
          {(() => {
            const hasAnyInFolder = folderPickerSnapshotIds.some(id => {
              if (folderPickerTarget === 'preset') {
                const preset = presets.find(x => x.id === id);
                return preset && preset.folderId;
              }
              const snapshot = savedPrompts.find(s => s.id === id);
              return snapshot && snapshot.folderId;
            });

            return (
              <button
                onClick={hasAnyInFolder ? handlePickerRemoveFromFolder : undefined}
                disabled={!hasAnyInFolder}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${hasAnyInFolder ? 'app-secondary-action' : 'cursor-not-allowed border-[var(--app-border-soft)] bg-[color-mix(in_srgb,var(--app-surface)_42%,transparent)] opacity-60'}`}
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${hasAnyInFolder ? (isDarkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-gray-200 text-gray-500') : (isDarkMode ? 'bg-zinc-900 text-zinc-700' : 'bg-gray-100 text-gray-300')}`}>
                  <Minus size={16} />
                </div>
                <div className="flex min-w-0 flex-col">
                  <div className={`truncate text-sm font-medium ${hasAnyInFolder ? (isDarkMode ? 'text-zinc-300' : 'text-gray-700') : (isDarkMode ? 'text-zinc-600' : 'text-gray-400')}`}>移出文件夹</div>
                  <div className={`text-xs ${hasAnyInFolder ? (isDarkMode ? 'text-zinc-500' : 'text-gray-400') : (isDarkMode ? 'text-zinc-700' : 'text-gray-300')}`}>
                    {hasAnyInFolder ? `将${targetLabel}从文件夹中移除` : `选中的${targetLabel}不在任何文件夹中`}
                  </div>
                </div>
              </button>
            );
          })()}

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
                className="app-secondary-action group flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors"
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${isDarkMode ? colorOption.darkIcon : colorOption.lightIcon}`}>
                  <FolderGlyph size={16} />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className={`truncate text-sm font-medium ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>{folder.name}</div>
                  <div className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-gray-400'}`}>
                    {itemCount} {itemLabel}
                  </div>
                </div>
              </button>
            );
          })}

          {folderPickerCreating ? (
            <div className={`flex items-center gap-2 rounded-lg border p-3 ${isDarkMode ? 'border-blue-800 bg-blue-950/20' : 'border-blue-300 bg-blue-50'}`}>
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${isDarkMode ? 'border-blue-900/50 bg-blue-950/40 text-blue-300' : 'border-blue-200 bg-blue-100 text-blue-700'}`}>
                <FolderPlus size={16} />
              </div>
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <input
                  autoFocus
                  value={folderPickerNewName}
                  onChange={e => setFolderPickerNewName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handlePickerConfirmCreating();
                    if (e.key === 'Escape') handlePickerCancelCreating();
                  }}
                  placeholder={folderPickerDefaultName || '输入文件夹名称'}
                  className={`min-w-0 flex-1 rounded border p-1.5 text-sm outline-none focus:ring-1 focus:ring-blue-500 ${isDarkMode ? 'border-zinc-700 bg-zinc-900 text-zinc-300 placeholder-zinc-600' : 'border-gray-300 bg-white text-gray-800 placeholder-gray-400'}`}
                />
                <button
                  onClick={handlePickerConfirmCreating}
                  className="shrink-0 rounded bg-blue-600 px-2.5 py-1 text-xs font-bold text-white transition-colors hover:bg-blue-500"
                >
                  确认
                </button>
                <button
                  onClick={handlePickerCancelCreating}
                  className={`shrink-0 rounded px-2.5 py-1 text-xs transition-colors ${isDarkMode ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handlePickerStartCreating}
              className={`flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed p-3 transition-colors ${isDarkMode ? 'border-zinc-800 text-zinc-500 hover:border-blue-800 hover:bg-blue-950/20 hover:text-blue-400' : 'border-gray-200 text-gray-400 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-500'}`}
            >
              <Plus size={16} />
              <span className="text-sm font-medium">新建文件夹</span>
            </button>
          )}
        </div>

        <button
          onClick={closeFolderPicker}
          className={`mt-4 w-full shrink-0 rounded-xl py-2.5 text-sm font-bold transition-colors active:scale-95 ${isDarkMode ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          取消
        </button>
      </div>
    </div>
  );
}
