import { Sun, Moon, FileText, User, UserPlus, Loader2 } from 'lucide-react';

export default function AuthPage({
  isDarkMode,
  setIsDarkMode,
  authView,
  setAuthView,
  authForm,
  setAuthForm,
  authError,
  setAuthError,
  authLoading,
  handleLogin,
  handleRegister,
}) {
  return (
    <div className={`flex items-center justify-center min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-zinc-950 text-zinc-200' : 'bg-gray-50 text-gray-800'}`}>
      <button onClick={() => setIsDarkMode(!isDarkMode)} className={`fixed top-4 right-4 p-2.5 rounded-xl border transition-colors ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-yellow-400' : 'bg-white border-gray-200 text-gray-500 hover:text-blue-500'}`}>
        {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>
      <div className={`w-full max-w-sm mx-4 p-8 rounded-2xl shadow-2xl border transition-colors duration-300 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-100'}`}>
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${isDarkMode ? 'bg-blue-950/60' : 'bg-blue-50'}`}>
            <FileText className={`w-8 h-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
          <h1 className="text-2xl font-bold">Prompt Builder</h1>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-zinc-500' : 'text-gray-400'}`}>提示词拼合器</p>
        </div>
        <div className={`flex mb-6 rounded-xl p-1 ${isDarkMode ? 'bg-zinc-800' : 'bg-gray-100'}`}>
          <button onClick={() => { setAuthView('login'); setAuthError(''); }} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${authView === 'login' ? (isDarkMode ? 'bg-zinc-700 text-white shadow' : 'bg-white text-gray-800 shadow') : (isDarkMode ? 'text-zinc-500' : 'text-gray-400')}`}>
            <User className="w-4 h-4 inline mr-1.5" />登录
          </button>
          <button onClick={() => { setAuthView('register'); setAuthError(''); }} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${authView === 'register' ? (isDarkMode ? 'bg-zinc-700 text-white shadow' : 'bg-white text-gray-800 shadow') : (isDarkMode ? 'text-zinc-500' : 'text-gray-400')}`}>
            <UserPlus className="w-4 h-4 inline mr-1.5" />注册
          </button>
        </div>
        {authError && (
          <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${isDarkMode ? 'bg-red-950/40 text-red-400 border border-red-900/50' : 'bg-red-50 text-red-600 border border-red-100'}`}>{authError}</div>
        )}
        <form onSubmit={authView === 'login' ? handleLogin : handleRegister}>
          <div className="mb-4">
            <label className={`block text-xs font-medium mb-1.5 ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>用户名</label>
            <input type="text" value={authForm.username} onChange={e => setAuthForm(prev => ({ ...prev, username: e.target.value }))} placeholder="2-20个字符" autoComplete="username" className={`w-full px-4 py-3 rounded-xl border outline-none transition-all text-sm ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600' : 'bg-gray-50 border-gray-200 text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'}`} />
          </div>
          <div className="mb-6">
            <label className={`block text-xs font-medium mb-1.5 ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>密码</label>
            <input type="password" value={authForm.password} onChange={e => setAuthForm(prev => ({ ...prev, password: e.target.value }))} placeholder="至少8位，包含字母和数字" autoComplete={authView === 'login' ? 'current-password' : 'new-password'} className={`w-full px-4 py-3 rounded-xl border outline-none transition-all text-sm ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600' : 'bg-gray-50 border-gray-200 text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'}`} />
          </div>
          <button type="submit" disabled={authLoading} className={`w-full py-3 text-sm font-bold text-white rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 ${isDarkMode ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20 shadow-lg' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100 shadow-lg'}`}>
            {authLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (authView === 'login' ? '登 录' : '注 册')}
          </button>
        </form>
      </div>
    </div>
  );
}
