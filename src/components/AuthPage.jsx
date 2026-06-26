import { Sun, Moon, FileText, User, UserPlus, Loader2, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

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
  const [showPassword, setShowPassword] = useState(false);
  const isLogin = authView === 'login';

  return (
    <div className={`flex min-h-screen items-center justify-center transition-colors duration-300 ${isDarkMode ? 'bg-zinc-950 text-zinc-200' : 'bg-gray-50 text-gray-800'}`}>
      <button
        type="button"
        onClick={() => setIsDarkMode(!isDarkMode)}
        className={`fixed right-4 top-4 rounded-xl border p-2.5 transition-colors ${isDarkMode ? 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-yellow-400' : 'border-gray-200 bg-white text-gray-500 hover:text-blue-500'}`}
        aria-label="切换主题"
      >
        {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>

      <div className={`mx-4 w-full max-w-sm rounded-2xl border p-8 shadow-2xl transition-colors duration-300 ${isDarkMode ? 'border-zinc-800 bg-zinc-900' : 'border-gray-100 bg-white'}`}>
        <div className="mb-8 text-center">
          <div className={`mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl ${isDarkMode ? 'bg-blue-950/60' : 'bg-blue-50'}`}>
            <FileText className={`h-8 w-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
          <h1 className="text-2xl font-bold">Promptly</h1>
          <p className={`mt-1 text-sm ${isDarkMode ? 'text-zinc-500' : 'text-gray-400'}`}>提示词拼合器</p>
        </div>

        <div className={`mb-6 flex rounded-xl p-1 ${isDarkMode ? 'bg-zinc-800' : 'bg-gray-100'}`}>
          <button
            type="button"
            onClick={() => { setAuthView('login'); setAuthError(''); }}
            className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all ${isLogin ? (isDarkMode ? 'bg-zinc-700 text-white shadow' : 'bg-white text-gray-800 shadow') : (isDarkMode ? 'text-zinc-500' : 'text-gray-400')}`}
          >
            <User className="mr-1.5 inline h-4 w-4" />登录
          </button>
          <button
            type="button"
            onClick={() => { setAuthView('register'); setAuthError(''); }}
            className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all ${!isLogin ? (isDarkMode ? 'bg-zinc-700 text-white shadow' : 'bg-white text-gray-800 shadow') : (isDarkMode ? 'text-zinc-500' : 'text-gray-400')}`}
          >
            <UserPlus className="mr-1.5 inline h-4 w-4" />注册
          </button>
        </div>

        {authError && (
          <div className={`mb-4 rounded-lg border p-3 text-sm font-medium ${isDarkMode ? 'border-red-900/50 bg-red-950/40 text-red-400' : 'border-red-100 bg-red-50 text-red-600'}`}>{authError}</div>
        )}

        <form onSubmit={isLogin ? handleLogin : handleRegister}>
          <div className="mb-4">
            <label className={`mb-1.5 block text-xs font-medium ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>用户名</label>
            <input
              type="text"
              value={authForm.username}
              onChange={e => setAuthForm(prev => ({ ...prev, username: e.target.value }))}
              placeholder="2-20 个字符"
              autoComplete="username"
              className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all ${isDarkMode ? 'border-zinc-800 bg-zinc-950 text-zinc-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600' : 'border-gray-200 bg-gray-50 text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'}`}
            />
          </div>
          <div className="mb-6">
            <label className={`mb-1.5 block text-xs font-medium ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>密码</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={authForm.password}
                onChange={e => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
                placeholder="至少 8 位，包含字母和数字"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                className={`w-full rounded-xl border px-4 py-3 pr-12 text-sm outline-none transition-all ${isDarkMode ? 'border-zinc-800 bg-zinc-950 text-zinc-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600' : 'border-gray-200 bg-gray-50 text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 transition-colors ${isDarkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-gray-400 hover:text-gray-600'}`}
                tabIndex={-1}
                aria-label={showPassword ? '隐藏密码' : '显示密码'}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={authLoading}
            className={`w-full rounded-xl py-3 text-sm font-bold text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 ${isDarkMode ? 'bg-blue-600 shadow-blue-900/20 hover:bg-blue-500' : 'bg-blue-600 shadow-blue-100 hover:bg-blue-700'}`}
          >
            {authLoading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : (isLogin ? '登录' : '注册')}
          </button>
        </form>
      </div>
    </div>
  );
}
