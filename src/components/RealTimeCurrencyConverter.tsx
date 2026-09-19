import React, { useState, useEffect } from 'react';
import { RefreshCw, ArrowRightLeft, TrendingUp, TrendingDown, DollarSign, Globe, CheckCircle2, AlertCircle } from 'lucide-react';
import { DEFAULT_EXCHANGE_RATES, formatCurrency } from '../utils/currency';
import { ExchangeRate } from '../types';

interface RealTimeCurrencyConverterProps {
  rates?: ExchangeRate[];
  onUpdateRates?: (rates: ExchangeRate[]) => void;
  className?: string;
}

export function RealTimeCurrencyConverter({ rates = DEFAULT_EXCHANGE_RATES, onUpdateRates, className = '' }: RealTimeCurrencyConverterProps) {
  const [amount, setAmount] = useState<number>(1000);
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('EGP');
  const [liveRates, setLiveRates] = useState<ExchangeRate[]>(rates && rates.length > 0 ? rates : DEFAULT_EXCHANGE_RATES);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());
  const [apiError, setApiError] = useState<string | null>(null);

  // Fetch real-time exchange rates from public open exchange rate API
  const fetchLiveRates = async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/USD');
      if (response.ok) {
        const data = await response.json();
        if (data && data.rates) {
          const updatedRates: ExchangeRate[] = [
            { currency: 'USD', rate_to_usd: 1.0 },
            { currency: 'EGP', rate_to_usd: data.rates.EGP || 48.5 },
            { currency: 'EUR', rate_to_usd: data.rates.EUR || 0.92 },
            { currency: 'GBP', rate_to_usd: data.rates.GBP || 0.78 },
            { currency: 'SAR', rate_to_usd: data.rates.SAR || 3.75 },
            { currency: 'AED', rate_to_usd: data.rates.AED || 3.67 },
            { currency: 'KWD', rate_to_usd: data.rates.KWD || 0.31 },
            { currency: 'QAR', rate_to_usd: data.rates.QAR || 3.64 },
          ];
          setLiveRates(updatedRates);
          setLastUpdated(new Date().toLocaleTimeString());
          if (onUpdateRates) {
            onUpdateRates(updatedRates);
          }
        }
      } else {
        throw new Error('Could not reach live exchange server.');
      }
    } catch (err) {
      console.warn('Using default exchange rates due to network offline mode:', err);
      setApiError('Online rates unavailable; utilizing updated local market rates.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveRates();
  }, []);

  // Calculation helpers
  const getRateToUSD = (curr: string) => {
    const found = liveRates.find(r => r.currency.toUpperCase() === curr.toUpperCase());
    return found ? found.rate_to_usd : 1.0;
  };

  const convertValue = (val: number, from: string, to: string) => {
    if (!val) return 0;
    if (from.toUpperCase() === to.toUpperCase()) return val;
    const fromRate = getRateToUSD(from);
    const toRate = getRateToUSD(to);
    // Amount in USD = val / fromRate (if fromRate is rate per 1 USD)
    const amountInUSD = fromRate > 0 ? val / fromRate : val;
    return amountInUSD * toRate;
  };

  const convertedResult = convertValue(amount, fromCurrency, toCurrency);
  const directRate = convertValue(1, fromCurrency, toCurrency);

  const handleSwap = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  };

  const currencyList = [
    { code: 'EGP', name: 'Egyptian Pound', flag: '🇪🇬' },
    { code: 'USD', name: 'US Dollar', flag: '🇺🇸' },
    { code: 'EUR', name: 'Euro', flag: '🇪🇺' },
    { code: 'GBP', name: 'British Pound', flag: '🇬🇧' },
    { code: 'SAR', name: 'Saudi Riyal', flag: '🇸🇦' },
    { code: 'AED', name: 'UAE Dirham', flag: '🇦🇪' },
    { code: 'KWD', name: 'Kuwaiti Dinar', flag: '🇰🇼' },
    { code: 'QAR', name: 'Qatari Riyal', flag: '🇶🇦' },
  ];

  return (
    <div className={`bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-black text-slate-900">Real-Time Currency Converter</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">Live exchange rate fluctuations and multi-currency matrix.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-400">Synced: {lastUpdated}</span>
          <button
            onClick={fetchLiveRates}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Updating...' : 'Live Sync'}</span>
          </button>
        </div>
      </div>

      {apiError && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{apiError}</span>
        </div>
      )}

      {/* Main Converter Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
        {/* Amount Input */}
        <div className="lg:col-span-4 space-y-1">
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Amount</label>
          <div className="relative">
            <input
              type="number"
              value={amount || ''}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              className="w-full pl-3 pr-3 py-3 bg-white border border-slate-300 rounded-xl text-base font-black text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Enter amount..."
            />
          </div>
        </div>

        {/* From Currency */}
        <div className="lg:col-span-3 space-y-1">
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">From</label>
          <select
            value={fromCurrency}
            onChange={(e) => setFromCurrency(e.target.value)}
            className="w-full py-3 px-3 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
          >
            {currencyList.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.code} - {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Swap Button */}
        <div className="lg:col-span-1 flex justify-center pt-4 lg:pt-5">
          <button
            onClick={handleSwap}
            title="Swap Currencies"
            className="p-3 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-300 rounded-2xl shadow-xs transition-all cursor-pointer transform hover:scale-105"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>
        </div>

        {/* To Currency */}
        <div className="lg:col-span-4 space-y-1">
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">To</label>
          <select
            value={toCurrency}
            onChange={(e) => setToCurrency(e.target.value)}
            className="w-full py-3 px-3 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
          >
            {currencyList.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.code} - {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Result Display Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 p-6 rounded-2xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
        <div>
          <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">Converted Value</span>
          <div className="text-3xl font-black mt-1 text-emerald-400">
            {formatCurrency(convertedResult, toCurrency, true)}
          </div>
          <div className="text-xs text-slate-300 mt-1 font-medium">
            1 {fromCurrency} = {directRate.toFixed(4)} {toCurrency}
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-xs px-4 py-3 rounded-xl border border-white/10 text-xs space-y-1">
          <div className="font-bold text-blue-200">Base Reference</div>
          <div className="text-slate-200">Primary Company Currency: <span className="font-extrabold text-amber-300">Egyptian Pound (EGP)</span></div>
        </div>
      </div>

      {/* Multi-Currency Conversion Matrix Table */}
      <div className="space-y-3">
        <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
          Multi-Currency Breakdown for {formatCurrency(amount, fromCurrency)}
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {currencyList.map((c) => {
            const val = convertValue(amount, fromCurrency, c.code);
            const isBase = c.code === 'EGP';
            return (
              <div
                key={c.code}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isBase
                    ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/30'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                    <span>{c.flag}</span>
                    <span>{c.code}</span>
                  </span>
                  {isBase && <span className="text-[10px] font-black text-amber-800 bg-amber-200/80 px-1.5 py-0.5 rounded-md">PRIMARY</span>}
                </div>
                <div className="text-base font-black text-slate-900 mt-2">
                  {formatCurrency(val, c.code, true)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
