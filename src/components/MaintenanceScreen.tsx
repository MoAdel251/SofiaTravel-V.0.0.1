import React, { useState } from 'react';
import { Wrench, RefreshCw, Lock, AlertCircle, ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { SOFIA_LOGO_URL } from './SofiaLogo';
import { useLanguage } from '../context/LanguageContext';

interface MaintenanceScreenProps {
  companyName: string;
  message: string;
  updatedAt?: string;
  onRefresh: () => Promise<void> | void;
  onDeveloperUnlock: (username: string, password: string) => boolean;
}

/**
 * Full-page gate shown to every non-developer while the developer has
 * temporarily disabled the site (e.g. during an update).
 */
export function MaintenanceScreen({
  companyName,
  message,
  updatedAt,
  onRefresh,
  onDeveloperUnlock,
}: MaintenanceScreenProps) {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDeveloperLogin, setShowDeveloperLogin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const unlocked = onDeveloperUnlock(username, password);
    if (!unlocked) {
      setError(
        isAr
          ? 'بيانات حساب المطور غير صحيحة.'
          : 'Invalid developer credentials.'
      );
      return;
    }
    setPassword('');
  };

  const lastUpdated = updatedAt
    ? new Date(updatedAt).toLocaleString(isAr ? 'ar-EG' : 'en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : null;

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="min-h-[100dvh] w-full bg-slate-950 text-white flex flex-col items-center justify-center p-5 relative overflow-hidden"
    >
      <div className="pointer-events-none absolute -top-24 -end-24 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -start-20 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="relative w-full max-w-md bg-slate-900/80 border border-slate-700/70 rounded-3xl shadow-2xl p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex flex-col items-center text-center">
          <div className="bg-white rounded-2xl px-3 py-2 shadow-lg mb-4">
            <img
              src={SOFIA_LOGO_URL}
              alt={companyName}
              className="h-16 w-auto object-contain select-none"
              onError={(e) => {
                const img = e.currentTarget;
                if (!img.src.endsWith('/sofia-logo.png')) img.src = '/sofia-logo.png';
              }}
            />
          </div>

          <div className="w-12 h-12 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 flex items-center justify-center mb-4">
            <Wrench className="w-6 h-6" />
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            {isAr ? 'الموقع تحت الصيانة حالياً' : 'Site Temporarily Unavailable'}
          </h1>
          <p className="text-xs font-semibold text-amber-300/90 mt-1 uppercase tracking-wider">
            {isAr ? companyName : `${companyName} • Scheduled Update`}
          </p>

          <p className="text-sm text-slate-300 leading-relaxed mt-4 whitespace-pre-line">
            {message}
          </p>

          {lastUpdated && (
            <p className="text-[11px] text-slate-500 mt-3">
              {isAr ? 'آخر تحديث:' : 'Last updated:'} {lastUpdated}
            </p>
          )}

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="mt-5 inline-flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer min-h-[44px]"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isAr ? 'إعادة التحقق' : 'Check again'}</span>
          </button>
        </div>

        <div className="mt-7 pt-5 border-t border-slate-800">
          {!showDeveloperLogin ? (
            <button
              type="button"
              onClick={() => setShowDeveloperLogin(true)}
              className="w-full flex items-center justify-center gap-2 text-[11px] font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isAr ? 'دخول المطور' : 'Developer access'}</span>
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <Lock className="w-3.5 h-3.5" />
                <span>{isAr ? 'حساب المطور فقط' : 'Developer account only'}</span>
              </div>

              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={isAr ? 'اسم المستخدم' : 'Username'}
                autoComplete="username"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
              />

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isAr ? 'كلمة المرور' : 'Password'}
                  autoComplete="current-password"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2.5 pe-10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute inset-y-0 end-2 flex items-center px-1.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {error && (
                <p className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-400">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </p>
              )}

              <button
                type="submit"
                disabled={!username.trim() || !password}
                className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-900 px-5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer min-h-[44px]"
              >
                <span>{isAr ? 'دخول وإعادة تفعيل الموقع' : 'Sign in & re-enable site'}</span>
                <ArrowRight className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
              </button>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                {isAr
                  ? 'الدخول بحساب المطور يمنحك الوصول الكامل للموقع أثناء الصيانة حتى تتمكن من إنهاء التحديث.'
                  : 'Signing in as the developer keeps full access during maintenance so you can finish the update and turn the site back on.'}
              </p>
            </form>
          )}
        </div>
      </div>

      <p className="relative mt-5 text-[10px] text-slate-600 font-mono">
        © {new Date().getFullYear()} {companyName}
      </p>
    </div>
  );
}
