import { ExchangeRate } from '../types';

export const DEFAULT_EXCHANGE_RATES: ExchangeRate[] = [
  { currency: 'USD', rate_to_usd: 1.0 },
  { currency: 'EGP', rate_to_usd: 48.5 },
  { currency: 'EUR', rate_to_usd: 0.92 },
  { currency: 'GBP', rate_to_usd: 0.78 },
  { currency: 'SAR', rate_to_usd: 3.75 },
  { currency: 'AED', rate_to_usd: 3.67 },
];

/**
 * Returns currency symbol / abbreviation strictly according to system rules:
 * - Egyptian Pound -> 'EGP'
 * - U.S. Dollar -> '$'
 * - Euro -> '€'
 * - Others -> standard code
 */
export function getCurrencySymbol(currency: string = 'USD'): string {
  const code = (currency || 'USD').toUpperCase().trim();
  switch (code) {
    case 'USD':
      return '$';
    case 'EGP':
      return 'EGP';
    case 'EUR':
      return '€';
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
 * e.g.
 * - USD: $1,250.00
 * - EGP: 1,250.00 EGP
 * - EUR: €1,250.00
 */
export function formatCurrency(
  amount: number | undefined | null,
  currency: string = 'USD',
  showDecimals: boolean = false
): string {
  const val = Number(amount) || 0;
  const numStr = val.toLocaleString(undefined, {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  });

  const code = (currency || 'USD').toUpperCase().trim();
  if (code === 'USD') {
    return `$${numStr}`;
  } else if (code === 'EGP') {
    return `${numStr} EGP`;
  } else if (code === 'EUR') {
    return `€${numStr}`;
  } else if (code === 'GBP') {
    return `£${numStr}`;
  } else {
    return `${numStr} ${code}`;
  }
}

/**
 * Convert an amount from one currency to another using exchange rates.
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string = 'USD',
  toCurrency: string = 'USD',
  rates: ExchangeRate[] = DEFAULT_EXCHANGE_RATES
): number {
  if (!amount || fromCurrency === toCurrency) return amount;

  const fromRate = rates.find(r => r.currency.toUpperCase() === fromCurrency.toUpperCase())?.rate_to_usd || 1.0;
  const toRate = rates.find(r => r.currency.toUpperCase() === toCurrency.toUpperCase())?.rate_to_usd || 1.0;

  // Amount in USD = amount / fromRate
  // Amount in toCurrency = (amount / fromRate) * toRate
  const inUsd = fromRate > 0 ? amount / fromRate : amount;
  return inUsd * toRate;
}

/**
 * Returns amounts converted to all 3 primary currencies: USD, EGP, EUR
 */
export function getTripleCurrencyAmounts(
  amount: number,
  sourceCurrency: string = 'USD',
  rates: ExchangeRate[] = DEFAULT_EXCHANGE_RATES
): { usd: number; egp: number; eur: number } {
  return {
    usd: convertCurrency(amount, sourceCurrency, 'USD', rates),
    egp: convertCurrency(amount, sourceCurrency, 'EGP', rates),
    eur: convertCurrency(amount, sourceCurrency, 'EUR', rates),
  };
}
