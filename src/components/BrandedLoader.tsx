import React from 'react';
import { Loader2 } from 'lucide-react';
import { SOFIA_LOGO_URL } from './SofiaLogo';

interface BrandedLoaderProps {
  label?: string;
  sublabel?: string;
}

/**
 * Full-screen branded loading indicator shown while the app boots and
 * whenever the user navigates between pages (desktop & mobile).
 */
export function BrandedLoader({ label, sublabel }: BrandedLoaderProps) {
  return (
    <div
      className="branded-loader-overlay fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm px-4"
      role="status"
      aria-live="polite"
      aria-label={label || 'Loading page'}
    >
      <div className="branded-loader-card w-full max-w-[260px] rounded-3xl bg-white px-6 py-7 shadow-2xl border border-slate-200 flex flex-col items-center text-center">
        <div className="relative flex items-center justify-center">
          <span className="branded-loader-ring absolute inset-0 rounded-2xl" />
          <img
            src={SOFIA_LOGO_URL}
            alt="Sofia Travel"
            className="branded-loader-logo h-16 w-auto max-w-[190px] object-contain rounded-xl bg-white p-1.5 relative z-10 select-none"
            onError={(e) => {
              const img = e.currentTarget;
              if (!img.src.endsWith('/sofia-logo.png')) {
                img.src = '/sofia-logo.png';
              }
            }}
          />
        </div>

        <div className="mt-4 flex items-center gap-2 text-slate-800">
          <Loader2 className="w-4 h-4 text-cyan-600 animate-spin shrink-0" />
          <span className="text-sm font-extrabold tracking-tight">
            {label || 'Loading...'}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
          {sublabel || 'Preparing the latest data'}
        </p>

        <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100">
          <span className="branded-loader-bar block h-full w-1/2 rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500" />
        </div>
      </div>
    </div>
  );
}
