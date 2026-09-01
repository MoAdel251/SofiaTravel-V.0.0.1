import React from 'react';

interface ManagerSignatureProps {
  className?: string;
  managerName?: string;
  title?: string;
}

export function ManagerSignature({ 
  className = '', 
  managerName = 'Ahmed Ali', 
  title = 'Authorized Manager & Finance Director' 
}: ManagerSignatureProps) {
  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      {/* Signature SVG mimicking the handwritten cursive style of Ahmed Ali */}
      <div className="w-56 h-20 flex items-center justify-center relative">
        <svg viewBox="0 0 320 110" className="w-full h-full text-slate-900" style={{ overflow: 'visible' }}>
          {/* 'Ahmed' in cursive */}
          {/* Loop of Capital A */}
          <path
            d="M 50 82 C 42 75, 38 60, 48 42 C 58 24, 78 22, 85 36 C 92 50, 80 82, 82 84 C 84 86, 92 65, 96 50 C 98 42, 102 38, 106 46 C 110 54, 106 78, 108 80 C 110 82, 114 62, 118 52 C 122 42, 126 40, 130 50 C 134 60, 132 78, 136 78 C 140 78, 144 56, 148 48 C 152 40, 156 42, 158 52 C 160 62, 158 76, 164 76 C 168 76, 172 64, 176 56 C 180 48, 184 52, 182 64 C 180 76, 184 80, 188 78 C 194 74, 198 40, 196 28 C 194 18, 188 32, 188 56 C 188 78, 198 82, 204 80"
            fill="none"
            stroke="#111827"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* 'Ali' in cursive */}
          <path
            d="M 218 84 C 210 75, 206 58, 218 36 C 228 16, 248 18, 254 34 C 260 52, 244 82, 248 84 C 252 86, 260 50, 264 24 C 266 12, 268 18, 268 44 C 268 70, 272 82, 276 80 C 280 78, 284 58, 286 48 C 288 38, 292 42, 292 56 C 292 70, 296 78, 302 76"
            fill="none"
            stroke="#111827"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Dot for 'i' */}
          <circle cx="288" cy="32" r="2.8" fill="#111827" />
          {/* Flourish underline underline curve */}
          <path
            d="M 45 92 C 90 94, 180 96, 300 88"
            fill="none"
            stroke="#111827"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeDasharray="120 4"
          />
        </svg>
      </div>

      <div className="border-t border-slate-300 w-48 pt-1.5 mt-0.5">
        <p className="text-xs font-bold text-slate-900 tracking-wide font-serif">{managerName}</p>
        <p className="text-[10px] text-slate-500 font-medium">{title}</p>
      </div>
    </div>
  );
}
