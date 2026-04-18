import { Copy, Check, Trash2, FileUp, Folder, FolderPlus, Clock } from 'lucide-react';
import { DEFAULT_FOLDER_COLOR, getFolderColorOption } from '../lib/constants';

export default function SnapshotCard({
  snapshot,
  isNested = false,
  accentColor = null,
  hideFolderLabel = false,
  // 数据
  isDarkMode,
  folders,
  isSnapshotBatchMode,
  selectedSnapshotIdSet,
  snapshotPreviewMap,
  editingSavedTitleId,
  copiedDrawerId,
  // 回调
  toggleSnapshotSelected,
  setEditingSavedTitleId,
  updateSavedTitle,
  deleteSnapshot,
  updateActiveWorkspace,
  setIsDrawerOpen,
  executeCopy,
  promptAssignFolderForSnapshots,
}) {
  const previewText = snapshotPreviewMap[snapshot.id] || '';
  const isSelected = selectedSnapshotIdSet.has(snapshot.id);

  return (
    <div className={isNested ? 'ml-4 pl-4 relative' : ''}>
      {isNested && (
        <span
          className="absolute left-0 top-5 h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: accentColor || getFolderColorOption(DEFAULT_FOLDER_COLOR).accent }}
        />
      )}

      <div
        className={`border rounded-xl p-4 transition-all group relative shadow-sm ${
          isDarkMode
            ? 'bg-zinc-900/80 border-blue-900/30 hover:border-blue-700'
            : 'bg-white border-gray-100 hover:border-blue-200'
        }`}
      >
        <div className="flex items-start gap-2">
          {isSnapshotBatchMode && (
            <button
              type="button"
              onClick={() => toggleSnapshotSelected(snapshot.id)}
              className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                isSelected
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : (isDarkMode ? 'border-zinc-700 bg-zinc-950 text-zinc-500' : 'border-gray-300 bg-white text-gray-300')
              }`}
              title={isSelected ? '取消选择' : '选择快照'}
            >
              {isSelected && <Check size={12} strokeWidth={4} />}
            </button>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0 flex-1">
                {editingSavedTitleId === snapshot.id ? (
                  <input
                    autoFocus
                    value={snapshot.title}
                    onChange={e => updateSavedTitle(snapshot.id, e.target.value)}
                    onBlur={() => setEditingSavedTitleId(null)}
                    onKeyDown={e => { if (e.key === 'Enter') setEditingSavedTitleId(null); }}
                    className={`text-sm font-bold border rounded px-1.5 py-0.5 outline-none w-full ${
                      isDarkMode ? 'bg-zinc-950 border-blue-700 text-zinc-200' : 'bg-blue-50 border-blue-300 text-gray-800'
                    }`}
                  />
                ) : (
                  <button
                    type="button"
                    onDoubleClick={() => setEditingSavedTitleId(snapshot.id)}
                    className={`text-left text-sm font-bold truncate rounded px-1 transition-colors w-full ${
                      isDarkMode ? 'text-zinc-200 hover:bg-zinc-800' : 'text-gray-800 hover:bg-blue-50'
                    }`}
                    title="双击重命名"
                  >
                    {snapshot.title}
                  </button>
                )}

                <div className={`text-[10px] mt-1 flex items-center gap-1 ${isDarkMode ? 'text-zinc-500' : 'text-gray-400'}`}>
                  <Clock size={10} /> {new Date(snapshot.timestamp).toLocaleString()}
                </div>
              </div>

              <button
                onClick={() => deleteSnapshot(snapshot.id)}
                className={`transition-colors opacity-0 group-hover:opacity-100 ${
                  isDarkMode ? 'text-zinc-600 hover:text-red-400' : 'text-gray-300 hover:text-red-500'
                }`}
                title="删除快照"
              >
                <Trash2 size={16} />
              </button>
            </div>

            {snapshot.folderId && !hideFolderLabel && (() => {
              const folder = folders.find(f => f.id === snapshot.folderId);
              return folder ? (
                <div className="mb-3">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                    isDarkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-blue-50 text-blue-700'
                  }`}>
                    <Folder size={12} />
                    {folder.name}
                  </span>
                </div>
              ) : null;
            })()}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  updateActiveWorkspace({ inputs: snapshot.inputs, separator: snapshot.separator || '\n\n', name: snapshot.title, isDirty: false });
                  setIsDrawerOpen(false);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 active:scale-95 ${
                  isDarkMode ? 'bg-blue-900/20 text-blue-400 hover:bg-blue-900/40' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                }`}
              >
                <FileUp size={14} /> 加载
              </button>
              <button
                onClick={() => executeCopy(previewText, snapshot.id)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 active:scale-95 ${
                  copiedDrawerId === snapshot.id
                    ? (isDarkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-green-100 text-green-700')
                    : (isDarkMode ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')
                }`}
              >
                {copiedDrawerId === snapshot.id ? <Check size={14} /> : <Copy size={14} />}
                {copiedDrawerId === snapshot.id ? '已复制' : '复制'}
              </button>
              <button
                onClick={() => promptAssignFolderForSnapshots([snapshot.id])}
                className={`px-2.5 py-2 rounded-lg transition-colors ${
                  isDarkMode ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-blue-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-blue-600'
                }`}
                title="加入或移出文件夹"
              >
                <FolderPlus size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
