import React from 'react';
import { SOFIA_LOGO_URL } from './SofiaLogo';
import { useLanguage } from '../context/LanguageContext';

interface NavigationLoaderProps {
  visible: boolean;
}

export function NavigationLoader({ visible }: NavigationLoaderProps) {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 backdrop-blur-[2px] px-4"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="animate-loader-pop flex flex-col items-center gap-3 rounded-3xl border border-slate-200 bg-white px-8 py-6 shadow-2xl">
        <img
          src={SOFIA_LOGO_URL}
          alt="Sofia Travel"
          className="h-14 sm:h-16 w-auto object-contain select-none"
          onError={(e) => {
            const img = e.currentTarget;
            if (!img.src.endsWith('/sofia-logo.png')) img.src = '/sofia-logo.png';
          }}
        />
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
          <span className="h-4 w-4 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
          <span>{isAr ? 'جارٍ تحميل الصفحة...' : 'Loading page...'}</span>
        </div>
      </div>
    </div>
  );
}
