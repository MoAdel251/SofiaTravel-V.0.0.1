import React from 'react';
import sofiaAttachedLogo from '../assets/images/sofia_travel_logo_1790154418169.jpg';

export const SOFIA_LOGO_URL = sofiaAttachedLogo;

interface SofiaLogoProps {
  className?: string;
  variant?: 'full' | 'icon-only' | 'horizontal';
  size?: 'xs' | 'sm' | 'md' | 'md-lg' | 'lg' | 'xl';
  theme?: 'light' | 'dark' | 'auto';
}

export function SofiaLogo({ className = '', variant = 'full', size = 'md' }: SofiaLogoProps) {
  const heightMap = {
    xs: 'h-8',
    sm: 'h-10',
    md: 'h-14',
    'md-lg': 'h-[3.75rem]',
    lg: 'h-20',
    xl: 'h-28'
  };

  if (variant === 'icon-only') {
    const boxMap = {
      xs: 'h-8 w-8',
      sm: 'h-10 w-10',
      md: 'h-12 w-12',
      'md-lg': 'h-14 w-14',
      lg: 'h-16 w-16',
      xl: 'h-24 w-24'
    };
    return (
      <div className={`inline-flex items-center justify-center shrink-0 rounded-xl overflow-hidden bg-white p-0.5 border border-slate-200/80 shadow-xs ${boxMap[size]} ${className}`}>
        <img
          src={SOFIA_LOGO_URL}
          alt="Sofia Travel"
          className="w-full h-full object-contain select-none"
          onError={(e) => {
            const img = e.currentTarget;
            if (!img.src.endsWith('/sofia-logo.png')) {
              img.src = '/sofia-logo.png';
            }
          }}
        />
      </div>
    );
  }

  // Render the exact attached Sofia Travel logo as-is (contains cyan S + lavender plane + SOFIA TRAVEL wordmark)
  return (
    <div className={`inline-flex items-center justify-center shrink-0 ${className}`}>
      <img
        src={SOFIA_LOGO_URL}
        alt="Sofia Travel"
        className={`${heightMap[size]} w-auto object-contain rounded-xl bg-white p-1 border border-slate-200/80 shadow-xs select-none`}
        onError={(e) => {
          const img = e.currentTarget;
          if (!img.src.endsWith('/sofia-logo.png')) {
            img.src = '/sofia-logo.png';
          }
        }}
      />
    </div>
  );
}
