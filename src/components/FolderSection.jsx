import { ChevronDown, Palette, Trash2 } from 'lucide-react';
import { getFolderColorOption } from '../lib/constants';
import { getFolderIconOption } from '../lib/folderUtils';

export default function FolderSection({
  group,
  isSnapshotSearchActive,
  // 数据
  isDarkMode,
  editingFolderId,
  editingFolderName,
  activeFolderStylePickerId,
  // 回调
  toggleFolderExpanded,
  startEditingFolder,
  finishEditingFolder,
  commitFolderRename,
  setEditingFolderName,
  setActiveFolderStylePickerId,
  setFolderStylePickerPos,
  openFolderDeleteDialog,
  // 子项渲染
  renderItem,
}) {
  const colorOption = getFolderColorOption(group.folderColor);
  const folderIconOption = getFolderIconOption(group.folderIcon);
  const FolderGlyph = folderIconOption.icon;
  const countLabel = isSnapshotSearchActive ? `${group.matchedCount} / ${group.totalCount}` : `${group.totalCount}`;
  const sectionHeaderClasses = group.isExpanded
    ? (isDarkMode ? colorOption.darkRow : colorOption.lightRow)
    : (isDarkMode ? 'border-zinc-800 bg-zinc-900/70' : 'border-gray-200 bg-white');
  const iconChipClasses = isDarkMode ? colorOption.darkIcon : colorOption.lightIcon;
  const badgeClasses = isDarkMode ? colorOption.darkBadge : colorOption.lightBadge;

  return (
    <section key={group.folderId} className="space-y-3">
      <div className="space-y-2">
        <div
          onClick={() => toggleFolderExpanded(group.folderId)}
          className={`flex items-center justify-between rounded-xl border px-3 py-2 transition-colors cursor-pointer ${sectionHeaderClasses}`}
        >
          <div className="min-w-0 flex flex-1 items-center gap-2">
            <div className={`flex items-center gap-2 min-w-0 flex-1 ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>
              <ChevronDown size={15} className={`shrink-0 transition-transform ${group.isExpanded ? 'rotate-0' : '-rotate-90'}`} />
              <span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${iconChipClasses}`}>
                <FolderGlyph size={14} />
              </span>
            </div>

            <div className="min-w-0 flex-1" onClick={(e) => e.stopPropagation()}>
              {editingFolderId === group.folderId ? (
                <input
                  autoFocus
                  value={editingFolderName}
                  onChange={(e) => setEditingFolderName(e.target.value)}
                  onBlur={() => commitFolderRename(group.folderId)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitFolderRename(group.folderId);
                    if (e.key === 'Escape') finishEditingFolder();
                  }}
                  className={`w-full rounded px-1.5 py-0.5 text-sm font-semibold outline-none border ${
                    isDarkMode ? 'bg-zinc-950 border-zinc-700 text-zinc-100' : 'bg-white border-gray-300 text-gray-800'
                  }`}
                />
              ) : (
                <button
                  type="button"
                  onDoubleClick={() => startEditingFolder(group.folderId, group.folderName)}
                  className={`max-w-full truncate rounded px-1.5 py-0.5 text-left text-sm font-semibold transition-colors ${
                    isDarkMode ? 'text-zinc-200 hover:bg-zinc-800' : 'text-gray-800 hover:bg-gray-100'
                  }`}
                  title="双击重命名文件夹"
                >
                  {group.folderName}
                </button>
              )}
            </div>
          </div>

          <div className="ml-3 flex shrink-0 items-center gap-2">
            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${badgeClasses}`}>
              {countLabel}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (activeFolderStylePickerId === group.folderId) {
                  setActiveFolderStylePickerId(null);
                  setFolderStylePickerPos(null);
                } else {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setFolderStylePickerPos({ top: rect.top, right: rect.right });
                  setActiveFolderStylePickerId(group.folderId);
                }
              }}
              className={`rounded-lg p-1.5 transition-colors ${
                isDarkMode ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}
              title="设置文件夹图标和颜色"
            >
              <Palette size={14} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openFolderDeleteDialog(group.folderId, group.folderName, 'snapshot');
              }}
              className={`rounded-lg p-1.5 transition-colors ${
                isDarkMode ? 'text-zinc-400 hover:bg-red-950/30 hover:text-red-300' : 'text-gray-500 hover:bg-red-50 hover:text-red-500'
              }`}
              title="删除文件夹"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>

      {group.isExpanded && (
        <div className="space-y-3">
          {group.items.map(item => renderItem(item, {
            isNested: true,
            accentColor: colorOption.accent,
            hideFolderLabel: true
          }))}
        </div>
      )}
    </section>
  );
}
