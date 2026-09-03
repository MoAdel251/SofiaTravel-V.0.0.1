import React from 'react';

interface SofiaLogoProps {
  className?: string;
  variant?: 'full' | 'icon-only' | 'horizontal';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function SofiaLogo({ className = '', variant = 'full', size = 'md' }: SofiaLogoProps) {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-20 h-20',
    xl: 'w-32 h-32'
  };

  if (variant === 'horizontal') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <svg viewBox="0 0 200 200" className="w-10 h-10 rounded-xl overflow-hidden shadow-md shrink-0">
          <rect width="200" height="200" fill="#1b143f" rx="24" />
          <path
            d="M 125 65 C 90 45, 60 70, 95 90 C 135 110, 130 145, 85 140 C 65 137, 55 125, 60 115"
            fill="none"
            stroke="#12d8e0"
            strokeWidth="16"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Lavender Airplane */}
          <g transform="translate(85, 52) rotate(-25) scale(0.7)">
            <path
              d="M 0 0 L 18 -6 L 24 -18 L 26 -16 L 22 -4 L 38 0 L 44 -5 L 46 -4 L 42 3 L 46 10 L 44 11 L 38 6 L 22 10 L 26 22 L 24 24 L 18 12 L 0 6 Z"
              fill="#ad95f8"
            />
          </g>
        </svg>
        <div className="flex flex-col">
          <span className="font-serif tracking-widest font-bold text-slate-900 text-lg uppercase leading-none">
            Sofia Travel
          </span>
          <span className="text-[10px] tracking-wider text-cyan-600 font-semibold uppercase mt-0.5">
            Tourism & Travel Agency
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative inline-block ${className}`}>
      <svg viewBox="0 0 300 300" className={`${sizeMap[size]} w-auto max-w-full rounded-2xl overflow-hidden shadow-lg`}>
        {/* Background */}
        <rect width="300" height="300" fill="#1b143f" />
        
        {/* Ribbon 'S' with gradient/glow */}
        <defs>
          <linearGradient id="sofiaCyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#14e4ec" />
            <stop offset="50%" stopColor="#0dbfc9" />
            <stop offset="100%" stopColor="#0bb0ba" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#0cbaba" floodOpacity="0.4"/>
          </filter>
        </defs>

        {/* Trail loop */}
        <path
          d="M 125 105 C 155 90, 185 105, 175 125 C 160 148, 120 145, 110 135"
          fill="none"
          stroke="#9f85eb"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="4 6"
          opacity="0.7"
        />

        {/* The Cyan 'S' swirl */}
        <path
          d="M 180 95 C 140 65, 95 100, 140 128 C 190 158, 185 200, 130 195 C 100 190, 85 172, 92 160"
          fill="none"
          stroke="url(#sofiaCyanGrad)"
          strokeWidth="20"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#glow)"
        />

        {/* Purple / Lavender Airplane on top flight path */}
        <g transform="translate(122, 75) rotate(-32) scale(0.95)">
          <path
            d="M 0 0 L 22 -8 L 30 -22 L 33 -20 L 28 -5 L 48 0 L 55 -6 L 58 -5 L 53 4 L 58 13 L 55 14 L 48 8 L 28 13 L 33 28 L 30 30 L 22 15 L 0 8 Z"
            fill="#a992f8"
          />
        </g>

        {/* Text "SOFIA TRAVEL" in elegant Serif */}
        <text
          x="150"
          y="255"
          textAnchor="middle"
          fill="#ffffff"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="24"
          fontWeight="bold"
          letterSpacing="4"
        >
          SOFIA TRAVEL
        </text>
      </svg>
    </div>
  );
}
