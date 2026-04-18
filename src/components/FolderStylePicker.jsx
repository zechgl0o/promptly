import { FOLDER_COLOR_OPTIONS, getFolderColorOption } from '../lib/constants';
import { FOLDER_ICON_OPTIONS } from '../lib/folderUtils';

export default function FolderStylePicker({
  isDarkMode,
  activeFolderStylePickerId,
  folderStylePickerPos,
  folders,
  setActiveFolderStylePickerId,
  setFolderStylePickerPos,
  updateFolderAppearance,
}) {
  if (!activeFolderStylePickerId || !folderStylePickerPos) return null;

  const folder = folders.find(f => f.id === activeFolderStylePickerId);
  if (!folder) return null;

  const colorOption = getFolderColorOption(folder.color);
  const iconChipClasses = isDarkMode ? colorOption.darkIcon : colorOption.lightIcon;

  return (
    <>
      <div className="fixed inset-0 z-[110]" onClick={() => { setActiveFolderStylePickerId(null); setFolderStylePickerPos(null); }} />
      <div
        className={`fixed z-[111] rounded-xl border p-3 shadow-2xl ${isDarkMode ? 'border-zinc-800 bg-zinc-900' : 'border-gray-200 bg-white'}`}
        style={{
          top: folderStylePickerPos.top - 4,
          right: window.innerWidth - folderStylePickerPos.right + 36,
          transform: 'translateY(-100%)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className={`text-[11px] font-semibold mb-2 ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>图标</div>
        <div className="flex flex-wrap gap-2">
          {FOLDER_ICON_OPTIONS.map(option => {
            const IconComponent = option.icon;
            const isActive = option.id === folder.icon;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => updateFolderAppearance(folder.id, { icon: option.id })}
                className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
                  isActive
                    ? `border-transparent ${iconChipClasses}`
                    : (isDarkMode ? 'border-zinc-700 bg-zinc-950 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200' : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300 hover:text-gray-700')
                }`}
                title={option.label}
              >
                <IconComponent size={15} />
              </button>
            );
          })}
        </div>

        <div className={`text-[11px] font-semibold mt-3 mb-2 ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>颜色</div>
        <div className="flex flex-wrap gap-2">
          {FOLDER_COLOR_OPTIONS.map(option => {
            const isActive = option.id === folder.color;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => updateFolderAppearance(folder.id, { color: option.id })}
                className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-105 ${
                  isActive
                    ? (isDarkMode ? 'border-white' : 'border-gray-700')
                    : (isDarkMode ? 'border-zinc-800' : 'border-white')
                }`}
                style={{ backgroundColor: option.accent }}
                title={option.label}
              />
            );
          })}
        </div>
      </div>
    </>
  );
}
