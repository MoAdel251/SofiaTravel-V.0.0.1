import React, { useState, useMemo } from 'react';
import { 
  Printer, 
  Download, 
  MessageCircle, 
  DollarSign, 
  Plane, 
  Hotel as HotelIcon, 
  Compass, 
  TrendingUp,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { 
  Reservation, 
  Customer, 
  Supplier, 
  Invoice, 
  TourPackage, 
  Hotel, 
  Flight, 
  Employee, 
  CompanySettings,
  Voucher,
  Expense,
  PayrollRecord,
  EmployeeAdvance,
  CommissionRecord
} from '../types';
import { formatCurrency, convertCurrency, normalizeCurrencyCode, DEFAULT_EXCHANGE_RATES } from '../utils/currency';
import { CurrencyHighlight } from './CurrencyHighlight';

interface ReportsViewProps {
  reservations: Reservation[];
  vouchers?: Voucher[];
  customers: Customer[];
  suppliers: Supplier[];
  invoices?: Invoice[];
  expenses?: Expense[];
  payrollRecords?: PayrollRecord[];
  advances?: EmployeeAdvance[];
  commissions?: CommissionRecord[];
  packages?: TourPackage[];
  hotels?: Hotel[];
  flights?: Flight[];
  employees?: Employee[];
  settings?: CompanySettings;
  currentCurrency?: string;
}

export function ReportsView({ 
  reservations = [], 
  vouchers = [],
  customers = [], 
  suppliers = [],
  invoices = [],
  expenses = [],
  payrollRecords = [],
  advances = [],
  commissions = [],
  packages = [],
  hotels = [],
  flights = [],
  employees = [],
  settings,
  currentCurrency = 'EGP'
}: ReportsViewProps) {
  const [reportTab, setReportTab] = useState<'executive' | 'reservations' | 'hotels' | 'flights' | 'financial' | 'employees'>('executive');

  const baseCurr = normalizeCurrencyCode(currentCurrency || settings?.default_currency || 'EGP');
  const activeRates = settings?.exchange_rates?.length ? settings.exchange_rates : DEFAULT_EXCHANGE_RATES;
  const toBase = (amt: number, curr?: string) => convertCurrency(Number(amt) || 0, normalizeCurrencyCode(curr || 'EGP'), baseCurr, activeRates);

  // Consolidate Reservations + Vouchers without double-counting
  const allBookings = useMemo(() => {
    const seen = new Set<string>();
    const list: Array<any> = [];
    reservations.forEach(r => {
      if (r.id) seen.add(r.id);
      if (r.reservation_id) seen.add(r.reservation_id);
      if (r.voucher_number) seen.add(r.voucher_number);
      list.push(r);
    });
    vouchers.forEach(v => {
      if (seen.has(v.id) || (v.reservation_id && seen.has(v.reservation_id)) || (v.voucher_number && seen.has(v.voucher_number))) return;
      list.push({
        id: v.id,
        reservation_id: v.voucher_number || v.reservation_id || v.id,
        customer_name: v.customer_name,
        service_type: v.service_category,
        travel_date: v.travel_date,
        return_date: v.return_date || '',
        selling_price: v.selling_price,
        cost_price: v.cost_price,
        paid_amount: v.paid_amount,
        remaining_amount: v.remaining_amount,
        profit: (Number(v.selling_price) || 0) - (Number(v.cost_price) || 0),
        currency: v.currency || 'USD',
        reservation_status: v.status === 'Cancelled' ? 'Cancelled' : (v.reservation_status || 'Confirmed'),
        customer_invoice_id: v.customer_invoice_id
      });
    });
    return list;
  }, [reservations, vouchers]);

  const activeBookings = allBookings.filter(r => r.reservation_status !== 'Cancelled');
  const customerInvoices = invoices.filter(i => i.payment_status !== 'Cancelled' && (i.recipient_type || 'Customer') === 'Customer');
  const supplierInvoices = invoices.filter(i => i.payment_status !== 'Cancelled' && i.recipient_type === 'Supplier');

  const invoicedBookingRefs = new Set<string>();
  customerInvoices.forEach(inv => {
    if (inv.reservation_id) invoicedBookingRefs.add(inv.reservation_id);
  });

  const uninvoicedBookings = activeBookings.filter(
    b => !invoicedBookingRefs.has(b.id) && !invoicedBookingRefs.has(b.reservation_id)
  );

  // Synchronized Gross Sales & Net Operating Profit (matching Finance Dashboard & P&L)
  const grossSalesByCurrency = useMemo(() => {
    const map: Record<string, number> = {};
    customerInvoices.forEach(inv => {
      const code = normalizeCurrencyCode(inv.currency || 'USD');
      map[code] = (map[code] || 0) + (Number(inv.total_amount) || 0);
    });
    uninvoicedBookings.forEach(r => {
      const code = normalizeCurrencyCode(r.currency || 'USD');
      map[code] = (map[code] || 0) + (Number(r.selling_price) || 0);
    });
    return map;
  }, [customerInvoices, uninvoicedBookings]);

  const synchronizedFinancials = useMemo(() => {
    const totalRevenue =
      customerInvoices.reduce((s, i) => s + toBase(i.total_amount, i.currency), 0) +
      uninvoicedBookings.reduce((s, b) => s + toBase(b.selling_price, b.currency), 0);

    const directCosts =
      supplierInvoices.reduce((s, i) => s + toBase(i.total_amount, i.currency), 0) +
      activeBookings.reduce((s, b) => s + toBase(b.cost_price, b.currency), 0);

    const opex = expenses.reduce((s, e) => s + toBase(e.amount, e.currency), 0);
    const payrollBase = payrollRecords.reduce(
      (s, p) => s + toBase(Math.max(0, (Number(p.basic_salary) || 0) + (Number(p.allowances) || 0) + (Number(p.bonus) || 0) - (Number(p.deductions) || 0)), p.currency || 'EGP'),
      0
    );
    const commTotal = commissions.reduce((s, c) => s + toBase(c.commission_amount, c.currency || 'EGP'), 0);
    const advancesOutstanding = advances
      .filter(a => a.status === 'Outstanding' || a.status === 'Approved' || a.status === 'Partially Repaid')
      .reduce((s, a) => s + toBase(a.outstanding_amount ?? a.amount, a.currency || 'EGP'), 0);

    const netOperatingProfit = totalRevenue - directCosts - opex - payrollBase - commTotal;
    return {
      totalRevenue,
      directCosts,
      opex,
      payrollBase,
      commTotal,
      advancesOutstanding,
      netOperatingProfit
    };
  }, [customerInvoices, uninvoicedBookings, supplierInvoices, activeBookings, expenses, payrollRecords, commissions, advances, baseCurr, activeRates]);

  const collectionsByCurrency = useMemo(() => {
    const map: Record<string, number> = {};
    customerInvoices.forEach(i => {
      const code = normalizeCurrencyCode(i.currency || 'USD');
      map[code] = (map[code] || 0) + (Number(i.paid_amount) || 0);
    });
    uninvoicedBookings.forEach(b => {
      const code = normalizeCurrencyCode(b.currency || 'USD');
      map[code] = (map[code] || 0) + (Number(b.paid_amount) || 0);
    });
    return map;
  }, [customerInvoices, uninvoicedBookings]);

  const receivablesByCurrency = useMemo(() => {
    const map: Record<string, number> = {};
    customerInvoices.forEach(i => {
      const due = Math.max(0, Number(i.balance_due ?? ((Number(i.total_amount) || 0) - (Number(i.paid_amount) || 0))));
      if (due > 0) {
        const code = normalizeCurrencyCode(i.currency || 'USD');
        map[code] = (map[code] || 0) + due;
      }
    });
    uninvoicedBookings.forEach(b => {
      const due = Math.max(0, Number(b.remaining_amount ?? ((Number(b.selling_price) || 0) - (Number(b.paid_amount) || 0))));
      if (due > 0) {
        const code = normalizeCurrencyCode(b.currency || 'USD');
        map[code] = (map[code] || 0) + due;
      }
    });
    return map;
  }, [customerInvoices, uninvoicedBookings]);

  const payablesByCurrency = useMemo(() => {
    const map: Record<string, number> = {};
    supplierInvoices.forEach(i => {
      const due = Math.max(0, Number(i.balance_due ?? ((Number(i.total_amount) || 0) - (Number(i.paid_amount) || 0))));
      if (due > 0) {
        const code = normalizeCurrencyCode(i.currency || 'USD');
        map[code] = (map[code] || 0) + due;
      }
    });
    return map;
  }, [supplierInvoices]);

  const formatCurrencyMap = (map: Record<string, number>) => {
    const keys = Object.keys(map).filter(k => map[k] !== 0);
    if (keys.length === 0) return `${baseCurr} 0`;
    return keys.map(k => `${k} ${map[k].toLocaleString()}`).join(' | ');
  };

  const whatsappHref = useMemo(() => {
    const text = encodeURIComponent(
      `*SOFIA TRAVEL - EXECUTIVE MANAGER INTELLIGENCE REPORT*\n` +
      `=========================================\n` +
      `Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}\n` +
      `Company: ${settings?.company_name || 'Sofia Travel Egypt'}\n` +
      `=========================================\n\n` +
      `*1. KEY PERFORMANCE METRICS:*\n` +
      `• Total Bookings & Vouchers: ${allBookings.length}\n` +
      `• Customer & Supplier Invoices: ${invoices.length}\n` +
      `• Registered Clients: ${customers.length}\n` +
      `• Active Suppliers: ${suppliers.length}\n\n` +
      `*2. SYNCHRONIZED P&L SUMMARY (${baseCurr}):*\n` +
      `• *Total Revenue:* ${formatCurrency(synchronizedFinancials.totalRevenue, baseCurr)}\n` +
      `• *Operating Expenses:* ${formatCurrency(synchronizedFinancials.opex, baseCurr)}\n` +
      `• *Payroll & Commissions:* ${formatCurrency(synchronizedFinancials.payrollBase + synchronizedFinancials.commTotal, baseCurr)}\n` +
      `• *Net Operating Profit:* ${formatCurrency(synchronizedFinancials.netOperatingProfit, baseCurr)}\n` +
      `• *Collections:* ${formatCurrencyMap(collectionsByCurrency)}\n` +
      `• *Client Receivables:* ${formatCurrencyMap(receivablesByCurrency)}\n` +
      `• *Supplier Payables:* ${formatCurrencyMap(payablesByCurrency)}\n`
    );
    const phone = settings?.whatsapp?.replace(/[^0-9]/g, '') || '';
    return phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
  }, [allBookings.length, invoices.length, customers.length, suppliers.length, synchronizedFinancials, baseCurr, collectionsByCurrency, receivablesByCurrency, payablesByCurrency, settings]);

  // Export CSV Report
  const exportExecutiveCSV = () => {
    const headers = ['Report Category,Entity / Metric,Amount,Status'];
    const rows = [
      `"Profit & Loss","Total Synchronized Revenue","${formatCurrency(synchronizedFinancials.totalRevenue, baseCurr)}","Audited"`,
      `"Profit & Loss","Direct Supplier & Trip Costs","${formatCurrency(synchronizedFinancials.directCosts, baseCurr)}","Audited"`,
      `"Profit & Loss","Operating Expenses","${formatCurrency(synchronizedFinancials.opex, baseCurr)}","Audited"`,
      `"Profit & Loss","Payroll Base Salaries","${formatCurrency(synchronizedFinancials.payrollBase, baseCurr)}","Audited"`,
      `"Profit & Loss","Employee Commissions","${formatCurrency(synchronizedFinancials.commTotal, baseCurr)}","Audited"`,
      `"Profit & Loss","Net Operating Profit","${formatCurrency(synchronizedFinancials.netOperatingProfit, baseCurr)}","Audited"`,
      `"Balance Sheet","Employee Advances Outstanding","${formatCurrency(synchronizedFinancials.advancesOutstanding, baseCurr)}","Active"`,
      `"Collections","Collections Received","${formatCurrencyMap(collectionsByCurrency)}","Received"`,
      `"Receivables","Client Receivables","${formatCurrencyMap(receivablesByCurrency)}","Pending"`,
      `"Operations","Total Bookings & Vouchers",${allBookings.length},"Active"`,
      `"Operations","Total Invoices",${invoices.length},"Active"`
    ];

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sofia_manager_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Executive Manager Reports & Synchronized P&L</h1>
          <p className="text-sm text-slate-500">
            Comprehensive business intelligence synchronized with Invoices, Bookings, Expenses, Payroll, Advances, and Commissions.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Send to Manager via WhatsApp</span>
          </a>
          <button
            onClick={exportExecutiveCSV}
            className="flex items-center space-x-2 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center flex-wrap gap-2 border-b border-slate-200 pb-2">
        {[
          { id: 'executive', label: 'Executive & P&L Overview' },
          { id: 'reservations', label: `Bookings & Vouchers (${allBookings.length})` },
          { id: 'hotels', label: `Hotel Inventory (${hotels.length})` },
          { id: 'flights', label: `Flight Schedules (${flights.length})` },
          { id: 'financial', label: `Invoices & Billing (${invoices.length})` },
          { id: 'employees', label: `Staff Performance (${employees.length})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setReportTab(tab.id as any)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              reportTab === tab.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. EXECUTIVE DASHBOARD TAB */}
      {reportTab === 'executive' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                <span>Total Revenue ({baseCurr})</span>
                <TrendingUp className="w-4 h-4 text-cyan-600" />
              </div>
              <div className="text-xl font-black text-slate-900">
                {formatCurrency(synchronizedFinancials.totalRevenue, baseCurr)}
              </div>
              <p className="text-[11px] text-slate-400">Invoices + Uninvoiced Bookings</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                <span>Net Operating Profit (P&L)</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <div className={`text-xl font-black ${synchronizedFinancials.netOperatingProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatCurrency(synchronizedFinancials.netOperatingProfit, baseCurr)}
              </div>
              <p className="text-[11px] text-slate-400">After Costs, Expenses, Payroll & Commissions</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                <span>Collections Received</span>
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {Object.keys(collectionsByCurrency).length === 0 ? (
                  <span className="text-xl font-extrabold text-blue-600"><CurrencyHighlight amount={0} currency={baseCurr} /></span>
                ) : (
                  Object.keys(collectionsByCurrency).map(c => (
                    <span key={c} className="text-sm font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl">
                      <CurrencyHighlight amount={collectionsByCurrency[c]} currency={c} />
                    </span>
                  ))
                )}
              </div>
              <p className="text-[11px] text-slate-400">Collected invoice & booking funds</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                <span>Pending Receivables</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {Object.keys(receivablesByCurrency).length === 0 ? (
                  <span className="text-xl font-extrabold text-amber-600"><CurrencyHighlight amount={0} currency={baseCurr} /></span>
                ) : (
                  Object.keys(receivablesByCurrency).map(c => (
                    <span key={c} className="text-sm font-extrabold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-xl">
                      <CurrencyHighlight amount={receivablesByCurrency[c]} currency={c} />
                    </span>
                  ))
                )}
              </div>
              <p className="text-[11px] text-slate-400">Outstanding client balances</p>
            </div>
          </div>

          {/* Synchronized Financial System Breakdown */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-semibold">Supplier & Trip Costs</span>
              <div className="text-sm font-black text-rose-600 mt-1">{formatCurrency(synchronizedFinancials.directCosts, baseCurr)}</div>
            </div>
            <div>
              <span className="text-slate-400 font-semibold">Operating Expenses</span>
              <div className="text-sm font-black text-rose-600 mt-1">{formatCurrency(synchronizedFinancials.opex, baseCurr)}</div>
            </div>
            <div>
              <span className="text-slate-400 font-semibold">December Payroll Base</span>
              <div className="text-sm font-black text-indigo-700 mt-1">{formatCurrency(synchronizedFinancials.payrollBase, baseCurr)}</div>
            </div>
            <div>
              <span className="text-slate-400 font-semibold">Employee Commissions</span>
              <div className="text-sm font-black text-emerald-700 mt-1">{formatCurrency(synchronizedFinancials.commTotal, baseCurr)}</div>
            </div>
            <div>
              <span className="text-slate-400 font-semibold">Employee Advances</span>
              <div className="text-sm font-black text-amber-700 mt-1">{formatCurrency(synchronizedFinancials.advancesOutstanding, baseCurr)}</div>
            </div>
          </div>

          {/* System Inventory Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-cyan-900 font-bold text-sm">
                <Compass className="w-4 h-4 text-cyan-600" />
                <span>Tour Packages Portfolio</span>
              </div>
              <p className="text-xs text-slate-500">
                {packages.length} active multi-day tour programs with custom itineraries and instant booking.
              </p>
              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                {packages.slice(0, 3).map(p => (
                  <div key={p.id} className="flex justify-between font-medium">
                    <span className="text-slate-700 truncate max-w-[180px]">{p.package_name}</span>
                    <span className="font-bold text-slate-900"><CurrencyHighlight amount={p.selling_price || 0} currency={p.currency || 'USD'} /></span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-purple-900 font-bold text-sm">
                <HotelIcon className="w-4 h-4 text-purple-600" />
                <span>Hotel Partners & Contracts</span>
              </div>
              <p className="text-xs text-slate-500">
                {hotels.length} partner luxury hotels and resorts in Cairo, Hurghada, Sharm, and Luxor.
              </p>
              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                {hotels.slice(0, 3).map(h => (
                  <div key={h.id} className="flex justify-between font-medium">
                    <span className="text-slate-700 truncate max-w-[180px]">{h.hotel_name}</span>
                    <span className="font-bold text-purple-700"><CurrencyHighlight amount={h.selling_price || 0} currency={h.currency || 'USD'} /></span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
                <Plane className="w-4 h-4 text-blue-600" />
                <span>Airlines & Flight Blocks</span>
              </div>
              <p className="text-xs text-slate-500">
                {flights.length} scheduled flight sectors with EgyptAir, Saudia, Emirates, and Turkish Airlines.
              </p>
              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                {flights.slice(0, 3).map(f => (
                  <div key={f.id} className="flex justify-between font-medium">
                    <span className="text-slate-700 truncate max-w-[180px]">{f.airline} #{f.flight_number}</span>
                    <span className="font-bold text-blue-700"><CurrencyHighlight amount={f.selling_price || 0} currency={f.currency || 'USD'} /></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. RESERVATIONS REPORT */}
      {reportTab === 'reservations' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Booking / Voucher ID</th>
                <th className="py-3.5 px-4 font-semibold">Customer</th>
                <th className="py-3.5 px-4 font-semibold">Service Type</th>
                <th className="py-3.5 px-4 font-semibold">Dates</th>
                <th className="py-3.5 px-4 font-semibold">Selling Price</th>
                <th className="py-3.5 px-4 font-semibold">Cost Price</th>
                <th className="py-3.5 px-4 font-semibold">Net Profit</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allBookings.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{r.reservation_id}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{r.customer_name}</td>
                  <td className="py-3.5 px-4 text-xs text-slate-600">{r.service_type}</td>
                  <td className="py-3.5 px-4 text-xs text-slate-500">{r.travel_date} {r.return_date ? `→ ${r.return_date}` : ''}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900"><CurrencyHighlight amount={r.selling_price || 0} currency={r.currency || 'USD'} /></td>
                  <td className="py-3.5 px-4 text-xs text-slate-500"><CurrencyHighlight amount={r.cost_price || 0} currency={r.currency || 'USD'} /></td>
                  <td className="py-3.5 px-4 font-bold text-emerald-600"><CurrencyHighlight amount={r.profit !== undefined ? r.profit : ((r.selling_price || 0) - (r.cost_price || 0))} currency={r.currency || 'USD'} /></td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {r.reservation_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. HOTELS REPORT */}
      {reportTab === 'hotels' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Hotel Property</th>
                <th className="py-3.5 px-4 font-semibold">City / Country</th>
                <th className="py-3.5 px-4 font-semibold">Room Types</th>
                <th className="py-3.5 px-4 font-semibold">Contract Rate (Cost)</th>
                <th className="py-3.5 px-4 font-semibold">Selling Price</th>
                <th className="py-3.5 px-4 font-semibold">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hotels.map(h => (
                <tr key={h.id} className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{h.hotel_name}</td>
                  <td className="py-3.5 px-4 text-xs text-slate-600">{h.city}, {h.country}</td>
                  <td className="py-3.5 px-4 text-xs text-slate-600">{h.room_types}</td>
                  <td className="py-3.5 px-4 text-xs text-slate-500"><CurrencyHighlight amount={h.contract_price || 0} currency={h.currency || 'USD'} /></td>
                  <td className="py-3.5 px-4 font-bold text-slate-900"><CurrencyHighlight amount={h.selling_price || 0} currency={h.currency || 'USD'} /></td>
                  <td className="py-3.5 px-4 font-bold text-emerald-600">
                    <CurrencyHighlight amount={(h.selling_price || 0) - (h.contract_price || 0)} currency={h.currency || 'USD'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. FLIGHTS REPORT */}
      {reportTab === 'flights' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Airline & Flight #</th>
                <th className="py-3.5 px-4 font-semibold">Sector (From → To)</th>
                <th className="py-3.5 px-4 font-semibold">Dates & Times</th>
                <th className="py-3.5 px-4 font-semibold">PNR / Ref</th>
                <th className="py-3.5 px-4 font-semibold">Net Cost</th>
                <th className="py-3.5 px-4 font-semibold">Selling Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {flights.map(f => (
                <tr key={f.id} className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{f.airline} #{f.flight_number}</td>
                  <td className="py-3.5 px-4 text-xs font-semibold text-slate-800">{f.departure_airport} → {f.arrival_airport}</td>
                  <td className="py-3.5 px-4 text-xs text-slate-600">{f.departure_date} {f.departure_time}</td>
                  <td className="py-3.5 px-4 font-mono text-xs text-cyan-700 font-bold">{f.booking_reference}</td>
                  <td className="py-3.5 px-4 text-xs text-slate-500"><CurrencyHighlight amount={f.ticket_cost || 0} currency={f.currency || 'USD'} /></td>
                  <td className="py-3.5 px-4 font-bold text-slate-900"><CurrencyHighlight amount={f.selling_price || 0} currency={f.currency || 'USD'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. FINANCIAL & BILLING */}
      {reportTab === 'financial' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Invoice #</th>
                <th className="py-3.5 px-4 font-semibold">Recipient (Customer / Supplier)</th>
                <th className="py-3.5 px-4 font-semibold">Issue Date</th>
                <th className="py-3.5 px-4 font-semibold">Total Amount</th>
                <th className="py-3.5 px-4 font-semibold">Paid Amount</th>
                <th className="py-3.5 px-4 font-semibold">Balance Due</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{inv.invoice_number}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">
                    {inv.recipient_type === 'Supplier' ? inv.supplier_name : inv.customer_name}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-600">{inv.issue_date}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{formatCurrency(inv.total_amount, inv.currency)}</td>
                  <td className="py-3.5 px-4 font-semibold text-emerald-600">{formatCurrency(inv.paid_amount, inv.currency)}</td>
                  <td className="py-3.5 px-4 font-bold text-amber-600">{formatCurrency(inv.balance_due, inv.currency)}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800">
                      {inv.payment_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 6. STAFF PERFORMANCE */}
      {reportTab === 'employees' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Employee</th>
                <th className="py-3.5 px-4 font-semibold">Role & Department</th>
                <th className="py-3.5 px-4 font-semibold">December Salary (EGP)</th>
                <th className="py-3.5 px-4 font-semibold">Recorded Commissions</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map(emp => {
                const empComms = commissions
                  .filter(c => c.employee_id === emp.id || c.employee_name === emp.name)
                  .reduce((s, c) => s + toBase(c.commission_amount, c.currency || 'EGP'), 0);
                return (
                  <tr key={emp.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{emp.name}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-700">{emp.position} • {emp.department}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">{formatCurrency(emp.salary || 0, 'EGP')}</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700">{formatCurrency(empComms, baseCurr)}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {emp.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
