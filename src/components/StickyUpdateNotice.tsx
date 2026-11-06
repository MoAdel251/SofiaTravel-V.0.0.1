import React, { useEffect, useState } from 'react';
import { Megaphone, RefreshCw, Smartphone, ChevronDown, X, BellRing } from 'lucide-react';
import { CompanySettings } from '../types';
import { APP_VERSION } from '../lib/appVersion';

interface StickyUpdateNoticeProps {
  settings: CompanySettings;
  isAr: boolean;
}

/**
 * Site-wide sticky message published by the IT department.
 * It stays pinned under the top bar until the employee dismisses it or
 * refreshes the website to load the new version.
 */
export function StickyUpdateNotice({ settings, isAr }: StickyUpdateNoticeProps) {
  const version = String(settings.update_notice_version || APP_VERSION);
  const storageKey = `sofia_update_notice_dismissed_${version}`;
  const [dismissed, setDismissed] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(storageKey) === '1');
    } catch {
      setDismissed(false);
    }
  }, [storageKey]);

  const isActive =
    Boolean(settings.update_notice_enabled) &&
    Boolean(String(settings.update_notice_message || '').trim());

  if (!isActive || dismissed) return null;

  const title =
    String(settings.update_notice_title || '').trim() ||
    (isAr ? 'تحديث جديد للموقع متاح الآن' : 'A new website update is available');

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(storageKey, '1');
    } catch {}
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    window.location.reload();
  };

  return (
    <div
      className="sticky-update-notice shrink-0 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-slate-950 shadow-md border-b border-amber-600/40"
      role="status"
      aria-live="polite"
    >
      <div className="px-3 sm:px-6 py-2.5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
          <span className="w-8 h-8 rounded-xl bg-slate-950/15 flex items-center justify-center shrink-0">
            <Megaphone className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs font-black uppercase tracking-wide flex flex-wrap items-center gap-1.5">
              <span>{title}</span>
              <span className="px-1.5 py-0.5 rounded-md bg-slate-950 text-amber-200 font-mono text-[10px] normal-case tracking-normal">
                {version.startsWith('v') ? version : `v${version}`}
              </span>
            </p>
            <p className="text-[11px] sm:text-xs font-semibold leading-relaxed whitespace-pre-line mt-0.5">
              {settings.update_notice_message}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ps-10 sm:ps-0">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 text-amber-200 hover:bg-slate-900 text-[11px] sm:text-xs font-black cursor-pointer transition-colors min-h-[38px]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isAr ? 'تحديث الصفحة الآن' : 'Refresh Now'}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowSteps(v => !v)}
            className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-slate-950/10 hover:bg-slate-950/20 text-[11px] sm:text-xs font-bold cursor-pointer transition-colors min-h-[38px]"
            aria-expanded={showSteps}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isAr ? 'إعادة تثبيت الاختصار' : 'Shortcut steps'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showSteps ? 'rotate-180' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-2 rounded-xl hover:bg-slate-950/15 cursor-pointer transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center"
            aria-label={isAr ? 'إغلاق الرسالة' : 'Dismiss message'}
            title={isAr ? 'إغلاق الرسالة' : 'Dismiss message'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showSteps && (
        <div className="px-3 sm:px-6 pb-3">
          <div className="rounded-2xl bg-slate-950/10 border border-slate-950/15 px-3 py-2.5 grid gap-1.5 text-[11px] sm:text-xs font-semibold">
            <p className="flex items-start gap-2">
              <BellRing className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>
                {isAr
                  ? '١) اضغط "تحديث الصفحة الآن" لتحميل أحدث إصدار من الموقع.'
                  : '1) Tap "Refresh Now" to load the latest version of the website.'}
              </span>
            </p>
            <p className="flex items-start gap-2">
              <Smartphone className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>
                {isAr
                  ? '٢) إذا كنت تستخدم اختصاراً على الشاشة الرئيسية: احذف (أزل تثبيت) الاختصار القديم أولاً.'
                  : '2) If you use a home-screen shortcut: uninstall (remove) the old shortcut first.'}
              </span>
            </p>
            <p className="flex items-start gap-2">
              <RefreshCw className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>
                {isAr
                  ? '٣) افتح الموقع من المتصفح ثم أعد تثبيت الاختصار من قائمة المتصفح ("إضافة إلى الشاشة الرئيسية" / "تثبيت التطبيق").'
                  : '3) Open the website in the browser, then reinstall the shortcut from the browser menu ("Add to Home Screen" / "Install app").'}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
