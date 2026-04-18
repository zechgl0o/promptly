import { Folder, Bookmark, FileText, Library, Palette, AlignLeft } from 'lucide-react';

export const FOLDER_ICON_OPTIONS = [
  { id: 'folder', label: 'Folder', icon: Folder },
  { id: 'bookmark', label: 'Bookmark', icon: Bookmark },
  { id: 'file-text', label: 'Text', icon: FileText },
  { id: 'library', label: 'Library', icon: Library },
  { id: 'palette', label: 'Palette', icon: Palette },
  { id: 'align-left', label: 'List', icon: AlignLeft }
];

export const getFolderIconOption = (iconId) => (
  FOLDER_ICON_OPTIONS.find(option => option.id === iconId) || FOLDER_ICON_OPTIONS[0]
);
