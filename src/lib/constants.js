// ================= 常量与配置 =================

// 生成唯一ID
export const generateId = () => 'id-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();

// API 基础路径
export const API_BASE = '/api';

// 定义低饱和度可选背景色
export const BG_COLORS = [
  { label: '默认背景', value: 'bg-white' },
  { label: '浅红', value: 'bg-red-100' },
  { label: '浅橙', value: 'bg-orange-100' },
  { label: '浅黄', value: 'bg-amber-100' },
  { label: '浅绿', value: 'bg-green-100' },
  { label: '浅蓝', value: 'bg-blue-100' },
  { label: '浅紫', value: 'bg-purple-100' },
  { label: '浅粉', value: 'bg-pink-100' }
];

export const DEFAULT_FOLDER_COLOR = 'blue';
export const DEFAULT_FOLDER_ICON = 'folder';

export const FOLDER_COLOR_OPTIONS = [
  {
    id: 'blue',
    label: 'Blue',
    accent: '#3b82f6',
    lightIcon: 'bg-blue-100 text-blue-700 border-blue-200',
    darkIcon: 'bg-blue-950/40 text-blue-300 border-blue-900/50',
    lightRow: 'border-blue-200 bg-blue-50/80',
    darkRow: 'border-blue-900/50 bg-blue-950/20',
    lightBadge: 'bg-blue-50 text-blue-700 border-blue-200',
    darkBadge: 'bg-blue-950/30 text-blue-300 border-blue-900/50'
  },
  {
    id: 'green',
    label: 'Green',
    accent: '#22c55e',
    lightIcon: 'bg-green-100 text-green-700 border-green-200',
    darkIcon: 'bg-green-950/40 text-green-300 border-green-900/50',
    lightRow: 'border-green-200 bg-green-50/80',
    darkRow: 'border-green-900/50 bg-green-950/20',
    lightBadge: 'bg-green-50 text-green-700 border-green-200',
    darkBadge: 'bg-green-950/30 text-green-300 border-green-900/50'
  },
  {
    id: 'orange',
    label: 'Orange',
    accent: '#f97316',
    lightIcon: 'bg-orange-100 text-orange-700 border-orange-200',
    darkIcon: 'bg-orange-950/40 text-orange-300 border-orange-900/50',
    lightRow: 'border-orange-200 bg-orange-50/80',
    darkRow: 'border-orange-900/50 bg-orange-950/20',
    lightBadge: 'bg-orange-50 text-orange-700 border-orange-200',
    darkBadge: 'bg-orange-950/30 text-orange-300 border-orange-900/50'
  },
  {
    id: 'rose',
    label: 'Rose',
    accent: '#f43f5e',
    lightIcon: 'bg-rose-100 text-rose-700 border-rose-200',
    darkIcon: 'bg-rose-950/40 text-rose-300 border-rose-900/50',
    lightRow: 'border-rose-200 bg-rose-50/80',
    darkRow: 'border-rose-900/50 bg-rose-950/20',
    lightBadge: 'bg-rose-50 text-rose-700 border-rose-200',
    darkBadge: 'bg-rose-950/30 text-rose-300 border-rose-900/50'
  },
  {
    id: 'violet',
    label: 'Violet',
    accent: '#8b5cf6',
    lightIcon: 'bg-violet-100 text-violet-700 border-violet-200',
    darkIcon: 'bg-violet-950/40 text-violet-300 border-violet-900/50',
    lightRow: 'border-violet-200 bg-violet-50/80',
    darkRow: 'border-violet-900/50 bg-violet-950/20',
    lightBadge: 'bg-violet-50 text-violet-700 border-violet-200',
    darkBadge: 'bg-violet-950/30 text-violet-300 border-violet-900/50'
  },
  {
    id: 'slate',
    label: 'Slate',
    accent: '#64748b',
    lightIcon: 'bg-slate-100 text-slate-700 border-slate-200',
    darkIcon: 'bg-slate-900/60 text-slate-300 border-slate-700/60',
    lightRow: 'border-slate-200 bg-slate-50/80',
    darkRow: 'border-slate-800 bg-slate-900/40',
    lightBadge: 'bg-slate-50 text-slate-700 border-slate-200',
    darkBadge: 'bg-slate-900/40 text-slate-300 border-slate-700/60'
  }
];

// 注意：FOLDER_ICON_OPTIONS 依赖 lucide-react 组件，留在 App.jsx 中

export const getFolderColorOption = (colorId) => (
  FOLDER_COLOR_OPTIONS.find(option => option.id === colorId) || FOLDER_COLOR_OPTIONS[0]
);

export const getColorClasses = (colorVal, isDarkMode) => {
  if (!colorVal || colorVal === 'bg-white') return isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200';
  const map = {
    'bg-red-100': isDarkMode ? 'bg-red-950/30 border-red-900/30' : 'bg-red-50 border-red-100',
    'bg-orange-100': isDarkMode ? 'bg-orange-950/30 border-orange-900/30' : 'bg-orange-50 border-orange-100',
    'bg-amber-100': isDarkMode ? 'bg-amber-950/30 border-amber-900/30' : 'bg-amber-50 border-amber-100',
    'bg-green-100': isDarkMode ? 'bg-green-950/30 border-green-900/30' : 'bg-green-50 border-green-100',
    'bg-blue-100': isDarkMode ? 'bg-blue-950/30 border-blue-900/30' : 'bg-blue-50 border-blue-100',
    'bg-purple-100': isDarkMode ? 'bg-purple-950/30 border-purple-900/30' : 'bg-purple-50 border-purple-100',
    'bg-pink-100': isDarkMode ? 'bg-pink-950/30 border-pink-900/30' : 'bg-pink-50 border-pink-100',
  };
  return map[colorVal] || (isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200');
};

export const getPickerButtonClasses = (colorVal, isDarkMode) => {
  if (!colorVal || colorVal === 'bg-white') return isDarkMode ? 'bg-zinc-800 border-zinc-600' : 'bg-white border-gray-300';
  const map = {
    'bg-red-100': isDarkMode ? 'bg-red-900/60 border-red-700' : 'bg-red-100 border-red-200',
    'bg-orange-100': isDarkMode ? 'bg-orange-900/60 border-orange-700' : 'bg-orange-100 border-orange-200',
    'bg-amber-100': isDarkMode ? 'bg-amber-900/60 border-amber-700' : 'bg-amber-100 border-amber-200',
    'bg-green-100': isDarkMode ? 'bg-green-900/60 border-green-700' : 'bg-green-100 border-green-200',
    'bg-blue-100': isDarkMode ? 'bg-blue-900/60 border-blue-700' : 'bg-blue-100 border-blue-200',
    'bg-purple-100': isDarkMode ? 'bg-purple-900/60 border-purple-700' : 'bg-purple-100 border-purple-200',
    'bg-pink-100': isDarkMode ? 'bg-pink-900/60 border-pink-700' : 'bg-pink-100 border-pink-200',
  };
  return map[colorVal] || '';
};
