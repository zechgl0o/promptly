import { FileText, X } from 'lucide-react';
import { appLogger } from '../lib/logger';

export default function LogPanel({
  isDarkMode,
  setIsLogPanelOpen,
}) {
  return (

  <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsLogPanelOpen(false); }}>
    <div className={`rounded-2xl shadow-2xl p-5 w-full max-w-lg border flex flex-col max-h-[80vh] ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-transparent'}`} onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-3 shrink-0">
        <h3 className={`font-bold flex items-center gap-2 ${isDarkMode ? 'text-zinc-200' : 'text-gray-800'}`}>
          <FileText size={18} className="text-orange-500" /> 应用日志
        </h3>
        <div className="flex items-center gap-2">
          <button onClick={() => { appLogger.clear(); }} className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${isDarkMode ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>清空</button>
          <button onClick={() => setIsLogPanelOpen(false)} className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'text-zinc-400 hover:bg-zinc-800' : 'text-gray-400 hover:bg-gray-100'}`}><X size={16} /></button>
        </div>
      </div>
      <div className={`flex-1 overflow-y-auto custom-scrollbar rounded-lg border p-3 text-xs font-mono space-y-1 ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-400' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
        {(() => {
          const logs = appLogger.getRecent(100);
          if (logs.length === 0) return <div className="text-center py-8 opacity-50">暂无日志</div>;
          return logs.map((entry, i) => (
            <div key={i} className={`flex gap-2 py-0.5 ${entry.level === 'error' ? (isDarkMode ? 'text-red-400' : 'text-red-600') : entry.level === 'warn' ? (isDarkMode ? 'text-yellow-400' : 'text-yellow-600') : ''}`}>
              <span className="opacity-40 shrink-0">{new Date(entry.ts).toLocaleTimeString()}</span>
              <span className={`shrink-0 w-14 text-right font-bold ${entry.level === 'error' ? 'text-red-500' : entry.level === 'warn' ? 'text-yellow-500' : 'text-blue-400'}`}>[{entry.level.toUpperCase()}]</span>
              <span className="opacity-60 shrink-0">{entry.source}</span>
              <span className="break-all">{entry.message}</span>
              {entry.detail && <span className="opacity-30 break-all ml-1">{entry.detail.substring(0, 120)}</span>}
            </div>
          ));
        })()}
      </div>
    </div>
  </div>

  );
}
