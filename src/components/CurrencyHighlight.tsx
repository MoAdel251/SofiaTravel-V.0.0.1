import React from 'react';
import { getCurrencySymbol } from '../utils/currency';

interface CurrencyHighlightProps {
  amount?: number | string | null;
  currency?: string;
  className?: string;
  symbolOnly?: boolean;
  prefix?: string;
}

/**
 * CurrencyHighlight component renders monetary amounts with a distinctly highlighted
 * currency symbol badge (e.g. EGP, $, EUR, GBP) using vibrant theme-matched colors.
 */
export const CurrencyHighlight: React.FC<CurrencyHighlightProps> = ({
  amount,
  currency = 'USD',
  className = '',
  symbolOnly = false,
  prefix = ''
}) => {
  const code = (currency || 'USD').toUpperCase().trim();
  const symbol = getCurrencySymbol(code);
  const numVal = Number(amount) || 0;
  const formattedNum = numVal.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  // Highlight badge color style per currency code
  let badgeStyle = "bg-amber-100 text-amber-950 border-amber-300/80 ring-1 ring-amber-400/30";
  if (code === 'EGP') {
    badgeStyle = "bg-emerald-100 text-emerald-950 border-emerald-300/80 ring-1 ring-emerald-400/30";
  } else if (code === 'USD' || code === '$') {
    badgeStyle = "bg-blue-100 text-blue-950 border-blue-300/80 ring-1 ring-blue-400/30";
  } else if (code === 'EUR') {
    badgeStyle = "bg-purple-100 text-purple-950 border-purple-300/80 ring-1 ring-purple-400/30";
  } else if (code === 'GBP') {
    badgeStyle = "bg-indigo-100 text-indigo-950 border-indigo-300/80 ring-1 ring-indigo-400/30";
  } else if (code === 'SAR' || code === 'AED') {
    badgeStyle = "bg-teal-100 text-teal-950 border-teal-300/80 ring-1 ring-teal-400/30";
  }

  if (symbolOnly) {
    return (
      <span className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded-md text-[10px] font-black border uppercase tracking-wider shadow-2xs ${badgeStyle} ${className}`}>
        {symbol}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 font-bold ${className}`}>
      {prefix && <span>{prefix}</span>}
      <span className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded-md text-[10px] font-black border uppercase tracking-wider shadow-2xs ${badgeStyle}`}>
        {symbol}
      </span>
      <span>{formattedNum}</span>
    </span>
  );
};
