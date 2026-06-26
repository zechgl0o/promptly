import { Folder, Bookmark, FileText, Library, Palette, AlignLeft } from 'lucide-react';

export const FOLDER_ICON_OPTIONS = [
  { id: 'folder', label: '文件夹', icon: Folder },
  { id: 'bookmark', label: '书签', icon: Bookmark },
  { id: 'file-text', label: '文本', icon: FileText },
  { id: 'library', label: '资料库', icon: Library },
  { id: 'palette', label: '调色板', icon: Palette },
  { id: 'align-left', label: '列表', icon: AlignLeft }
];

export const getFolderIconOption = (iconId) => (
  FOLDER_ICON_OPTIONS.find(option => option.id === iconId) || FOLDER_ICON_OPTIONS[0]
);
