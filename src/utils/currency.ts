import { ExchangeRate } from '../types';

export const DEFAULT_EXCHANGE_RATES: ExchangeRate[] = [
  { currency: 'EGP', rate_to_usd: 1.0 },
  { currency: 'USD', rate_to_usd: 50.0 }, // 1 USD = 50 EGP
  { currency: 'EUR', rate_to_usd: 55.0 }, // 1 EUR = 55 EGP
  { currency: 'GBP', rate_to_usd: 62.0 },
  { currency: 'SAR', rate_to_usd: 13.3 },
  { currency: 'AED', rate_to_usd: 13.6 },
];

/**
 * Returns currency symbol / abbreviation strictly according to system rules:
 * - Egyptian Pound -> 'EGP'
 * - U.S. Dollar -> '$'
 * - Euro -> 'EUR' / '€'
 * - Others -> standard code
 */
export function getCurrencySymbol(currency: string = 'EGP'): string {
  const code = (currency || 'EGP').toUpperCase().trim();
  switch (code) {
    case '$':
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

  const code = (currency || 'EGP').toUpperCase().trim();
  if (code === 'USD' || code === '$') {
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
 * Convert an amount from one currency to another using exchange rates (Base currency: EGP).
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string = 'EGP',
  toCurrency: string = 'EGP',
  rates: ExchangeRate[] = DEFAULT_EXCHANGE_RATES
): number {
  const normalize = (curr: string) => {
    const c = (curr || 'EGP').toUpperCase().trim();
    return c === '$' ? 'USD' : c;
  };
  const from = normalize(fromCurrency);
  const to = normalize(toCurrency);
  if (!amount || from === to) return amount;

  const getRateToEgp = (curr: string) => {
    if (curr === 'EGP') return 1.0;
    const r = rates.find(x => (x.currency || '').toUpperCase() === curr);
    return r ? Number(r.rate_to_usd) : (curr === 'USD' ? 50.0 : curr === 'EUR' ? 55.0 : 1.0);
  };

  const fromRate = getRateToEgp(from); // 1 Unit = fromRate EGP
  const toRate = getRateToEgp(to);     // 1 Unit = toRate EGP

  // Amount in EGP
  const inEgp = amount * fromRate;
  return toRate > 0 ? inEgp / toRate : inEgp;
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
  const curr = (currency || 'EGP').toUpperCase().trim();
  if (curr === 'EGP') {
    return { rate: 1.0, egpEquivalent: Number(amount) || 0 };
  }
  let rate = exchangeRate;
  if (!rate || rate <= 0) {
    const found = rates.find(r => (r.currency || '').toUpperCase() === curr);
    rate = found ? Number(found.rate_to_usd) : (curr === 'USD' ? 50.0 : curr === 'EUR' ? 55.0 : 1.0);
  }
  return {
    rate,
    egpEquivalent: (Number(amount) || 0) * rate
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
  const { rate, egpEquivalent } = calculateEgpEquivalent(amount, currency, exchangeRate, rates);
  const origFormatted = formatCurrency(amount, currency);
  if (currency.toUpperCase() === 'EGP') {
    return origFormatted;
  }
  return `${origFormatted} (Rate: 1 ${currency} = ${rate} EGP → Equivalent: ${formatCurrency(egpEquivalent, 'EGP')})`;
}

export function formatTripleCurrencyString(
  amount: number,
  sourceCurrency: string = 'USD',
  rates: ExchangeRate[] = DEFAULT_EXCHANGE_RATES
): string {
  const { egpEquivalent } = calculateEgpEquivalent(amount, sourceCurrency, undefined, rates);
  return `${formatCurrency(amount, sourceCurrency)} (Equivalent: ${formatCurrency(egpEquivalent, 'EGP')})`;
}
