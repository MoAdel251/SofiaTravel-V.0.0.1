import { ExchangeRate } from '../types';

export const DEFAULT_EXCHANGE_RATES: ExchangeRate[] = [
  { currency: 'EGP', rate_to_usd: 1.0 },
  { currency: 'USD', rate_to_usd: 50.0 }, // 1 USD = 50 EGP
  { currency: 'EUR', rate_to_usd: 55.0 }, // 1 EUR = 55 EGP
  { currency: 'GBP', rate_to_usd: 62.0 },
  { currency: 'SAR', rate_to_usd: 13.3 },
  { currency: 'AED', rate_to_usd: 13.6 },
];

const FALLBACK_PER_USD: Record<string, number> = {
  USD: 1.0,
  EGP: 50.0,
  EUR: 0.92,
  GBP: 0.79,
  SAR: 3.75,
  AED: 3.67,
};

export function normalizeCurrencyCode(currency: string = 'EGP'): string {
  const c = String(currency || 'EGP').trim().toUpperCase();
  if (c === '$' || c === 'US$') return 'USD';
  if (c === '€') return 'EUR';
  if (c === '£') return 'GBP';
  if (c === 'ج.م' || c === 'LE' || c === 'EGP') return 'EGP';
  return c || 'EGP';
}

/**
 * Returns currency symbol / abbreviation strictly according to system rules:
 * - Egyptian Pound -> 'EGP'
 * - U.S. Dollar -> '$'
 * - Euro -> 'EUR' / '€'
 * - Others -> standard code
 */
export function getCurrencySymbol(currency: string = 'EGP'): string {
  const code = normalizeCurrencyCode(currency);
  switch (code) {
    case 'USD':
      return '$';
    case 'EGP':
      return 'EGP';
    case 'EUR':
      return 'EUR';
    case 'GBP':
      return '£';
    case 'SAR':
      return 'SAR';
    case 'AED':
      return 'AED';
    default:
      return code;
  }
}

/**
 * Formats a monetary amount with the correct symbol / abbreviation.
 */
export function formatCurrency(
  amount: number | undefined | null,
  currency: string = 'EGP',
  showDecimals: boolean = false
): string {
  const val = Number(amount) || 0;
  const numStr = val.toLocaleString(undefined, {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  });

  const code = normalizeCurrencyCode(currency);
  if (code === 'USD') {
    return `$${numStr} USD`;
  } else if (code === 'EGP') {
    return `${numStr} EGP`;
  } else if (code === 'EUR') {
    return `${numStr} EUR`;
  } else if (code === 'GBP') {
    return `£${numStr} GBP`;
  } else {
    return `${numStr} ${code}`;
  }
}

/**
 * Resolves how many EGP equal 1 unit of `curr`, supporting both:
 * 1) Server USD-base rates (e.g., USD: 1.0, EUR: 0.92, EGP: 48.5)
 * 2) Client EGP-base rates (e.g., EGP: 1.0, USD: 50.0, EUR: 55.0)
 */
export function getRateInEgp(
  currency: string = 'EGP',
  rates: ExchangeRate[] = DEFAULT_EXCHANGE_RATES
): number {
  const code = normalizeCurrencyCode(currency);
  if (code === 'EGP') return 1.0;

  const list = Array.isArray(rates) && rates.length > 0 ? rates : DEFAULT_EXCHANGE_RATES;
  const egpEntry = list.find(r => normalizeCurrencyCode(r.currency) === 'EGP');
  const isUnitsPerUSD = !egpEntry || Number(egpEntry.rate_to_usd) > 5;

  if (isUnitsPerUSD) {
    const egpPerUsd = egpEntry && Number(egpEntry.rate_to_usd) > 0 ? Number(egpEntry.rate_to_usd) : FALLBACK_PER_USD.EGP;
    if (code === 'USD') return egpPerUsd;
    const targetEntry = list.find(r => normalizeCurrencyCode(r.currency) === code);
    const unitsPerUsd = targetEntry && Number(targetEntry.rate_to_usd) > 0
      ? Number(targetEntry.rate_to_usd)
      : (FALLBACK_PER_USD[code] || 1.0);
    return unitsPerUsd > 0 ? egpPerUsd / unitsPerUsd : egpPerUsd;
  } else {
    const targetEntry = list.find(r => normalizeCurrencyCode(r.currency) === code);
    if (targetEntry && Number(targetEntry.rate_to_usd) > 0) {
      return Number(targetEntry.rate_to_usd);
    }
    return 50.0 / (FALLBACK_PER_USD[code] || 1.0);
  }
}

/**
 * Convert an amount from one currency to another using exchange rates.
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string = 'EGP',
  toCurrency: string = 'EGP',
  rates: ExchangeRate[] = DEFAULT_EXCHANGE_RATES
): number {
  const num = Number(amount) || 0;
  const from = normalizeCurrencyCode(fromCurrency);
  const to = normalizeCurrencyCode(toCurrency);
  if (num === 0 || from === to) return num;

  const fromInEgp = getRateInEgp(from, rates);
  const toInEgp = getRateInEgp(to, rates);
  const inEgp = num * fromInEgp;
  return toInEgp > 0 ? inEgp / toInEgp : inEgp;
}

/**
 * Calculates EGP base currency equivalent for any amount and currency using stored or default exchange rate.
 */
export function calculateEgpEquivalent(
  amount: number,
  currency: string = 'EGP',
  exchangeRate?: number,
  rates: ExchangeRate[] = DEFAULT_EXCHANGE_RATES
): { rate: number; egpEquivalent: number } {
  const curr = normalizeCurrencyCode(currency);
  const num = Number(amount) || 0;
  if (curr === 'EGP') {
    return { rate: 1.0, egpEquivalent: num };
  }
  const computedRate = getRateInEgp(curr, rates);
  // Only trust explicit exchangeRate if it represents EGP per unit (e.g., > 1 for USD/EUR/SAR)
  const rate = exchangeRate && exchangeRate > 1.5 ? Number(exchangeRate) : computedRate;
  return {
    rate: Math.round(rate * 100) / 100,
    egpEquivalent: num * rate,
  };
}

/**
 * Formats multi-currency display with original amount and EGP equivalent.
 */
export function formatMultiCurrencyDisplay(
  amount: number,
  currency: string = 'EGP',
  exchangeRate?: number,
  rates: ExchangeRate[] = DEFAULT_EXCHANGE_RATES
): string {
  const code = normalizeCurrencyCode(currency);
  const { rate, egpEquivalent } = calculateEgpEquivalent(amount, code, exchangeRate, rates);
  const origFormatted = formatCurrency(amount, code);
  if (code === 'EGP') {
    return origFormatted;
  }
  return `${origFormatted} (Rate: 1 ${code} = ${rate} EGP → Equivalent: ${formatCurrency(egpEquivalent, 'EGP')})`;
}

export function formatTripleCurrencyString(
  amount: number,
  sourceCurrency: string = 'USD',
  rates: ExchangeRate[] = DEFAULT_EXCHANGE_RATES
): string {
  const code = normalizeCurrencyCode(sourceCurrency);
  const { egpEquivalent } = calculateEgpEquivalent(amount, code, undefined, rates);
  return `${formatCurrency(amount, code)} (Equivalent: ${formatCurrency(egpEquivalent, 'EGP')})`;
}
