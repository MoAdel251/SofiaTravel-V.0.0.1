import React from 'react';

interface SofiaLogoProps {
  className?: string;
  variant?: 'full' | 'icon-only' | 'horizontal';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  theme?: 'light' | 'dark' | 'auto';
}

export function SofiaLogo({ className = '', variant = 'full', size = 'md', theme = 'auto' }: SofiaLogoProps) {
  const sizeMap = {
    xs: 'h-6',
    sm: 'h-8',
    md: 'h-11',
    lg: 'h-16',
    xl: 'h-24'
  };

  const iconSizeMap = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  if (variant === 'icon-only') {
    return (
      <div className={`inline-flex items-center justify-center shrink-0 rounded-xl overflow-hidden bg-white p-1 shadow-sm border border-slate-200/80 ${iconSizeMap[size]} ${className}`}>
        <img 
          src="/sofia-logo.png" 
          alt="Sofia Travel" 
          className="w-full h-full object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/sofia-logo.svg";
          }}
        />
      </div>
    );
  }

  if (variant === 'horizontal') {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        <img 
          src="/sofia-logo.png" 
          alt="Sofia Travel" 
          className={`${sizeMap[size]} object-contain shrink-0 rounded-lg p-0.5 bg-white shadow-2xs border border-slate-100`}
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/sofia-logo.svg";
          }}
        />
        <div className="flex flex-col">
          <span className={`font-serif tracking-widest font-bold uppercase leading-none text-sm sm:text-base ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>
            Sofia Travel
          </span>
          <span className="text-[9px] tracking-wider text-cyan-600 font-bold uppercase mt-0.5">
            Travel Management OS
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <img 
        src="/sofia-logo.png" 
        alt="Sofia Travel Logo" 
        className={`${sizeMap[size]} object-contain drop-shadow-md rounded-xl bg-white p-1 border border-slate-100`}
        onError={(e) => {
          (e.target as HTMLImageElement).src = "/sofia-logo.svg";
        }}
      />
    </div>
  );
}

