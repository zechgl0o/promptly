// ================= 常量与配置 =================

// 生成唯一 ID
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
    label: '蓝色',
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
    label: '绿色',
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
    label: '橙色',
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
    label: '玫红',
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
    label: '紫色',
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
    label: '灰蓝',
    accent: '#64748b',
    lightIcon: 'bg-slate-100 text-slate-700 border-slate-200',
    darkIcon: 'bg-slate-900/60 text-slate-300 border-slate-700/60',
    lightRow: 'border-slate-200 bg-slate-50/80',
    darkRow: 'border-slate-800 bg-slate-900/40',
    lightBadge: 'bg-slate-50 text-slate-700 border-slate-200',
    darkBadge: 'bg-slate-900/40 text-slate-300 border-slate-700/60'
  }
];

// 注意：FOLDER_ICON_OPTIONS 依赖 lucide-react 组件，保留在 App.jsx 中

export const getFolderColorOption = (colorId) => (
  FOLDER_COLOR_OPTIONS.find(option => option.id === colorId) || FOLDER_COLOR_OPTIONS[0]
);

export const getColorClasses = (colorVal, isDarkMode) => {
  if (!colorVal || colorVal === 'bg-white') return isDarkMode ? 'bg-zinc-800/90 border-zinc-600/70' : 'bg-white border-gray-200';
  const map = {
    'bg-red-100': isDarkMode ? 'bg-red-800/45 border-red-600/55 shadow-[0_0_8px_-6px_rgba(248,113,113,0.45)]' : 'bg-red-50 border-red-100',
    'bg-orange-100': isDarkMode ? 'bg-orange-800/45 border-orange-600/55 shadow-[0_0_8px_-6px_rgba(251,146,60,0.45)]' : 'bg-orange-50 border-orange-100',
    'bg-amber-100': isDarkMode ? 'bg-amber-800/45 border-amber-600/55 shadow-[0_0_8px_-6px_rgba(245,158,11,0.45)]' : 'bg-amber-50 border-amber-100',
    'bg-green-100': isDarkMode ? 'bg-emerald-800/45 border-emerald-600/55 shadow-[0_0_8px_-6px_rgba(52,211,153,0.45)]' : 'bg-green-50 border-green-100',
    'bg-blue-100': isDarkMode ? 'bg-blue-800/45 border-blue-600/55 shadow-[0_0_8px_-6px_rgba(96,165,250,0.45)]' : 'bg-blue-50 border-blue-100',
    'bg-purple-100': isDarkMode ? 'bg-violet-800/45 border-violet-600/55 shadow-[0_0_8px_-6px_rgba(167,139,250,0.45)]' : 'bg-purple-50 border-purple-100',
    'bg-pink-100': isDarkMode ? 'bg-pink-800/45 border-pink-600/55 shadow-[0_0_8px_-6px_rgba(244,114,182,0.45)]' : 'bg-pink-50 border-pink-100',
  };
  return map[colorVal] || (isDarkMode ? 'bg-zinc-800/90 border-zinc-600/70' : 'bg-white border-gray-200');
};

export const getColorHeaderClasses = (colorVal, isDarkMode) => {
  if (!colorVal || colorVal === 'bg-white') return isDarkMode ? 'bg-zinc-900/65 border-zinc-700/70' : 'bg-gray-50/80 border-gray-200';
  const map = {
    'bg-red-100': isDarkMode ? 'bg-red-950/45 border-red-700/45' : 'bg-red-100/65 border-red-200',
    'bg-orange-100': isDarkMode ? 'bg-orange-950/45 border-orange-700/45' : 'bg-orange-100/65 border-orange-200',
    'bg-amber-100': isDarkMode ? 'bg-amber-950/45 border-amber-700/45' : 'bg-amber-100/65 border-amber-200',
    'bg-green-100': isDarkMode ? 'bg-emerald-950/45 border-emerald-700/45' : 'bg-green-100/65 border-green-200',
    'bg-blue-100': isDarkMode ? 'bg-blue-950/45 border-blue-700/45' : 'bg-blue-100/65 border-blue-200',
    'bg-purple-100': isDarkMode ? 'bg-violet-950/45 border-violet-700/45' : 'bg-purple-100/65 border-purple-200',
    'bg-pink-100': isDarkMode ? 'bg-pink-950/45 border-pink-700/45' : 'bg-pink-100/65 border-pink-200',
  };
  return map[colorVal] || (isDarkMode ? 'bg-zinc-900/65 border-zinc-700/70' : 'bg-gray-50/80 border-gray-200');
};

export const getColorBodyClasses = (colorVal, isDarkMode) => {
  if (!colorVal || colorVal === 'bg-white') return 'bg-transparent';
  const map = {
    'bg-red-100': isDarkMode ? 'bg-red-950/25' : 'bg-red-50/50',
    'bg-orange-100': isDarkMode ? 'bg-orange-950/25' : 'bg-orange-50/50',
    'bg-amber-100': isDarkMode ? 'bg-amber-950/25' : 'bg-amber-50/50',
    'bg-green-100': isDarkMode ? 'bg-emerald-950/25' : 'bg-green-50/50',
    'bg-blue-100': isDarkMode ? 'bg-blue-950/25' : 'bg-blue-50/50',
    'bg-purple-100': isDarkMode ? 'bg-violet-950/25' : 'bg-purple-50/50',
    'bg-pink-100': isDarkMode ? 'bg-pink-950/25' : 'bg-pink-50/50',
  };
  return map[colorVal] || 'bg-transparent';
};

export const getColorBodyStyle = (colorVal, isDarkMode) => {
  if (!colorVal?.startsWith('#')) return {};
  return {
    backgroundColor: isDarkMode ? `${colorVal}18` : `${colorVal}10`,
  };
};

export const getColorHoverClasses = (colorVal, isDarkMode) => {
  if (colorVal?.startsWith('#')) {
    return isDarkMode ? 'hover:border-zinc-500' : 'hover:border-gray-300';
  }
  if (!colorVal || colorVal === 'bg-white') {
    return isDarkMode ? 'hover:border-zinc-500' : 'hover:border-gray-300';
  }

  const map = {
    'bg-red-100': isDarkMode ? 'hover:border-red-500/70' : 'hover:border-red-200',
    'bg-orange-100': isDarkMode ? 'hover:border-orange-500/70' : 'hover:border-orange-200',
    'bg-amber-100': isDarkMode ? 'hover:border-amber-500/70' : 'hover:border-amber-200',
    'bg-green-100': isDarkMode ? 'hover:border-emerald-500/70' : 'hover:border-green-200',
    'bg-blue-100': isDarkMode ? 'hover:border-blue-500/70' : 'hover:border-blue-200',
    'bg-purple-100': isDarkMode ? 'hover:border-violet-500/70' : 'hover:border-purple-200',
    'bg-pink-100': isDarkMode ? 'hover:border-pink-500/70' : 'hover:border-pink-200',
  };
  return map[colorVal] || (isDarkMode ? 'hover:border-zinc-500' : 'hover:border-gray-300');
};

export const getColorControlClasses = (colorVal, isDarkMode) => {
  if (colorVal?.startsWith('#')) {
    return isDarkMode ? 'text-zinc-300 hover:bg-zinc-800' : 'text-gray-600 hover:bg-gray-100';
  }
  if (!colorVal || colorVal === 'bg-white') {
    return isDarkMode ? 'text-zinc-400 hover:bg-zinc-800' : 'text-gray-500 hover:bg-gray-100';
  }

  const map = {
    'bg-red-100': isDarkMode ? 'text-red-300 hover:bg-red-950/40' : 'text-red-600 hover:bg-red-100',
    'bg-orange-100': isDarkMode ? 'text-orange-300 hover:bg-orange-950/40' : 'text-orange-600 hover:bg-orange-100',
    'bg-amber-100': isDarkMode ? 'text-amber-300 hover:bg-amber-950/40' : 'text-amber-600 hover:bg-amber-100',
    'bg-green-100': isDarkMode ? 'text-emerald-300 hover:bg-emerald-950/40' : 'text-emerald-600 hover:bg-emerald-100',
    'bg-blue-100': isDarkMode ? 'text-blue-300 hover:bg-blue-950/40' : 'text-blue-600 hover:bg-blue-100',
    'bg-purple-100': isDarkMode ? 'text-violet-300 hover:bg-violet-950/40' : 'text-violet-600 hover:bg-violet-100',
    'bg-pink-100': isDarkMode ? 'text-pink-300 hover:bg-pink-950/40' : 'text-pink-600 hover:bg-pink-100',
  };
  return map[colorVal] || (isDarkMode ? 'text-zinc-400 hover:bg-zinc-800' : 'text-gray-500 hover:bg-gray-100');
};

export const getColorCheckClasses = (colorVal, isDarkMode, checked) => {
  if (!checked) {
    return isDarkMode ? 'border-zinc-600 text-transparent hover:border-zinc-500' : 'border-gray-300 text-transparent hover:border-gray-400';
  }
  return getColorControlClasses(colorVal, isDarkMode);
};

export const getColorTagClasses = (colorVal, isDarkMode, isActive) => {
  if (!isActive) {
    return isDarkMode
      ? 'border-zinc-700 bg-zinc-900/70 text-zinc-500'
      : 'border-gray-200 bg-gray-50 text-gray-400';
  }

  if (colorVal?.startsWith('#')) {
    return isDarkMode
      ? 'border-zinc-600 bg-zinc-800/80 text-zinc-100'
      : 'border-gray-300 bg-white text-gray-700';
  }

  const map = {
    'bg-red-100': isDarkMode ? 'border-red-800 bg-red-950/40 text-red-200' : 'border-red-200 bg-red-50 text-red-700',
    'bg-orange-100': isDarkMode ? 'border-orange-800 bg-orange-950/40 text-orange-200' : 'border-orange-200 bg-orange-50 text-orange-700',
    'bg-amber-100': isDarkMode ? 'border-amber-800 bg-amber-950/40 text-amber-200' : 'border-amber-200 bg-amber-50 text-amber-700',
    'bg-green-100': isDarkMode ? 'border-emerald-800 bg-emerald-950/40 text-emerald-200' : 'border-emerald-200 bg-emerald-50 text-emerald-700',
    'bg-blue-100': isDarkMode ? 'border-blue-800 bg-blue-950/40 text-blue-200' : 'border-blue-200 bg-blue-50 text-blue-700',
    'bg-purple-100': isDarkMode ? 'border-violet-800 bg-violet-950/40 text-violet-200' : 'border-violet-200 bg-violet-50 text-violet-700',
    'bg-pink-100': isDarkMode ? 'border-pink-800 bg-pink-950/40 text-pink-200' : 'border-pink-200 bg-pink-50 text-pink-700',
  };
  return map[colorVal] || (isDarkMode ? 'border-zinc-700 bg-zinc-900/70 text-zinc-200' : 'border-gray-200 bg-white text-gray-700');
};

export const getPickerButtonClasses = (colorVal, isDarkMode) => {
  if (!colorVal || colorVal === 'bg-white') {
    return isDarkMode ? 'border-zinc-500 bg-zinc-100' : 'border-gray-300 bg-white';
  }
  if (colorVal.startsWith('#')) {
    return 'border-transparent';
  }

  const map = {
    'bg-red-100': 'border-red-200 bg-red-100',
    'bg-orange-100': 'border-orange-200 bg-orange-100',
    'bg-amber-100': 'border-amber-200 bg-amber-100',
    'bg-green-100': 'border-green-200 bg-green-100',
    'bg-blue-100': 'border-blue-200 bg-blue-100',
    'bg-purple-100': 'border-purple-200 bg-purple-100',
    'bg-pink-100': 'border-pink-200 bg-pink-100',
  };
  return map[colorVal] || (isDarkMode ? 'border-zinc-600 bg-zinc-700' : 'border-gray-300 bg-white');
};
