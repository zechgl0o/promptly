import { Check, Trash2, Plus, Folder, FolderPlus } from 'lucide-react';
import { DEFAULT_FOLDER_COLOR, getFolderColorOption } from '../lib/constants';

export default function PresetCard({
  preset,
  isNested = false,
  accentColor = null,
  hideFolderLabel = false,
  // 数据
  isDarkMode,
  folders,
  isPresetBatchMode,
  selectedPresetIdSet,
  editingPresetTitleId,
  // 回调
  togglePresetSelected,
  setEditingPresetTitleId,
  updatePresetTitle,
  setPresets,
  presets,
  deletePreset,
  insertPreset,
  promptAssignFolderForPresets,
}) {
  const isSelected = selectedPresetIdSet.has(preset.id);

  return (
    <div className={isNested ? 'ml-4 pl-4 relative' : ''}>
      {isNested && (
        <span
          className="absolute left-0 top-5 h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: accentColor || getFolderColorOption(DEFAULT_FOLDER_COLOR).accent }}
        />
      )}
      <div className={`border rounded-xl p-4 transition-all group relative shadow-sm ${
        isDarkMode
          ? 'bg-zinc-900/80 border-purple-900/30 hover:border-purple-700'
          : 'bg-white border-purple-100 hover:border-purple-300'
      }`}>
        <div className="flex items-start gap-2">
          {isPresetBatchMode && (
            <button
              type="button"
              onClick={() => togglePresetSelected(preset.id)}
              className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                isSelected
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : (isDarkMode ? 'border-zinc-700 bg-zinc-950 text-zinc-500' : 'border-gray-300 bg-white text-gray-300')
              }`}
              title={isSelected ? '取消选择' : '选择预设'}
            >
              {isSelected && <Check size={12} strokeWidth={4} />}
            </button>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0 flex-1">
                {editingPresetTitleId === preset.id ? (
                  <input
                    autoFocus
                    value={preset.title}
                    onChange={e => setPresets(presets.map(px => px.id === preset.id ? {...px, title: e.target.value} : px))}
                    onBlur={() => updatePresetTitle(preset.id, preset.title)}
                    onKeyDown={e => e.key === 'Enter' && updatePresetTitle(preset.id, preset.title)}
                    className={`text-sm font-bold border rounded px-1.5 py-0.5 outline-none w-full ${
                      isDarkMode ? 'bg-zinc-950 border-purple-700 text-zinc-200' : 'bg-purple-50 border-purple-300 text-gray-800'
                    }`}
                  />
                ) : (
                  <span
                    onDoubleClick={() => setEditingPresetTitleId(preset.id)}
                    className={`text-sm font-bold truncate pr-6 cursor-text rounded px-1 transition-colors ${
                      isDarkMode ? 'text-zinc-200 hover:bg-zinc-800' : 'text-gray-800 hover:bg-purple-50'
                    }`}
                    title="双击重命名"
                  >{preset.title}</span>
                )}
                {preset.folderId && !hideFolderLabel && (() => {
                  const folder = folders.find(f => f.id === preset.folderId);
                  return folder ? (
                    <div className="mt-1">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                        isDarkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-purple-50 text-purple-700'
                      }`}>
                        <Folder size={12} />
                        {folder.name}
                      </span>
                    </div>
                  ) : null;
                })()}
              </div>
              <button onClick={() => deletePreset(preset.id)} className={`transition-colors opacity-0 group-hover:opacity-100 ${
                isDarkMode ? 'text-zinc-600 hover:text-red-400' : 'text-gray-300 hover:text-red-500'
              }`} title="删除预设"><Trash2 size={16}/></button>
            </div>

            <div className={`text-xs line-clamp-2 mb-3 p-2 rounded-lg border ${
              isDarkMode ? 'text-zinc-500 bg-zinc-950/50 border-zinc-800/50' : 'text-gray-500 bg-gray-50 border-gray-100'
            }`}>
              {preset.isTextMode ? preset.text : (preset.tags && preset.tags.length > 0 ? preset.tags.map(t => t.text).join(', ') : '空预设')}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => insertPreset(preset)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 active:scale-95 ${
                  isDarkMode ? 'bg-purple-900/20 text-purple-400 hover:bg-purple-900/40' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                }`}
              >
                <Plus size={14}/> 追加到工作区
              </button>
              {!isPresetBatchMode && (
                <button
                  onClick={() => promptAssignFolderForPresets([preset.id])}
                  className={`px-2.5 py-2 rounded-lg transition-colors ${
                    isDarkMode ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-purple-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-purple-600'
                  }`}
                  title="加入或移出文件夹"
                ><FolderPlus size={14}/></button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
