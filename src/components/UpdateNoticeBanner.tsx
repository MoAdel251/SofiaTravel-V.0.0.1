import React, { useMemo, useState } from 'react';
import { RefreshCw, X, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface UpdateNoticeBannerProps {
  messageEn?: string;
  messageAr?: string;
  version?: string;
}

const DISMISS_KEY = 'sofia_update_notice_dismissed_version';

export function UpdateNoticeBanner({ messageEn, messageAr, version = '' }: UpdateNoticeBannerProps) {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [dismissed, setDismissed] = useState(false);

  const isDismissedForVersion = useMemo(() => {
    if (!version) return false;
    try {
      return localStorage.getItem(DISMISS_KEY) === version;
    } catch {
      return false;
    }
  }, [version]);

  if (dismissed || isDismissedForVersion) return null;

  const message = (isAr ? messageAr || messageEn : messageEn || messageAr) || '';

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, version || '1');
    } catch {}
  };

  return (
    <div className="sticky top-14 sm:top-16 z-30 shrink-0 border-b border-cyan-500/40 bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 text-white shadow-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-3 py-2 sm:px-5 sm:py-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-500/20 border border-cyan-400/40">
          <AlertTriangle className="h-4 w-4 text-cyan-300" />
        </span>
        <p className="min-w-0 flex-1 text-[11px] sm:text-xs font-semibold leading-snug text-cyan-50">
          {message}
          {version && (
            <span className="ms-1.5 inline-block rounded bg-cyan-400/15 border border-cyan-400/30 px-1.5 py-px font-mono text-[10px] font-black text-cyan-200 align-middle">
              {version}
            </span>
          )}
        </p>
        <div className="flex shrink-0 items-center gap-1.5 ms-auto">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex min-h-[34px] items-center gap-1.5 rounded-lg bg-cyan-500 px-3 text-[11px] font-black text-slate-950 transition-colors hover:bg-cyan-400 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>{isAr ? 'تحديث الآن' : 'Refresh now'}</span>
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-cyan-200 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
            aria-label={isAr ? 'إخفاء الرسالة' : 'Dismiss update message'}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
