import React, { useState } from 'react';
import { 
  BarChart3, 
  Printer, 
  Download, 
  FileText, 
  MessageCircle, 
  DollarSign, 
  Calendar, 
  Plane, 
  Hotel as HotelIcon, 
  Compass, 
  Users, 
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Building
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
  CompanySettings 
} from '../types';
import { SofiaLogo } from './SofiaLogo';
import { ManagerSignature } from './ManagerSignature';
import { formatCurrency, convertCurrency } from '../utils/currency';
import { CurrencyHighlight } from './CurrencyHighlight';

interface ReportsViewProps {
  reservations: Reservation[];
  customers: Customer[];
  suppliers: Supplier[];
  invoices?: Invoice[];
  packages?: TourPackage[];
  hotels?: Hotel[];
  flights?: Flight[];
  employees?: Employee[];
  settings?: CompanySettings;
  currentCurrency?: string;
}

export function ReportsView({ 
  reservations = [], 
  customers = [], 
  suppliers = [],
  invoices = [],
  packages = [],
  hotels = [],
  flights = [],
  employees = [],
  settings,
  currentCurrency = 'USD'
}: ReportsViewProps) {
  const [reportTab, setReportTab] = useState<'executive' | 'reservations' | 'hotels' | 'flights' | 'financial' | 'employees'>('executive');
  const [dateRange, setDateRange] = useState<'month' | 'quarter' | 'year' | 'all'>('month');

  // Group metrics by currency code
  const totalReservationsCount = reservations.length;
  const confirmedReservations = reservations.filter(r => r.reservation_status === 'Confirmed' || r.reservation_status === 'Completed' || r.reservation_status === 'Paid');
  
  const grossSalesByCurrency = reservations.reduce((acc, r) => {
    const code = (r.currency || 'USD').toUpperCase();
    acc[code] = (acc[code] || 0) + (r.selling_price || 0);
    return acc;
  }, {} as Record<string, number>);

  const netProfitByCurrency = reservations.reduce((acc, r) => {
    const code = (r.currency || 'USD').toUpperCase();
    const profit = r.profit !== undefined ? r.profit : ((r.selling_price || 0) - (r.cost_price || 0));
    acc[code] = (acc[code] || 0) + profit;
    return acc;
  }, {} as Record<string, number>);

  const collectionsByCurrency = invoices.reduce((acc, i) => {
    const code = (i.currency || 'USD').toUpperCase();
    acc[code] = (acc[code] || 0) + (i.paid_amount || 0);
    return acc;
  }, {} as Record<string, number>);

  const receivablesByCurrency = invoices.filter(i => i.recipient_type !== 'Supplier').reduce((acc, i) => {
    const code = (i.currency || 'USD').toUpperCase();
    acc[code] = (acc[code] || 0) + (i.balance_due || 0);
    return acc;
  }, {} as Record<string, number>);

  const payablesByCurrency = invoices.filter(i => i.recipient_type === 'Supplier').reduce((acc, i) => {
    const code = (i.currency || 'USD').toUpperCase();
    acc[code] = (acc[code] || 0) + (i.balance_due || 0);
    return acc;
  }, {} as Record<string, number>);

  const formatCurrencyMap = (map: Record<string, number>) => {
    const keys = Object.keys(map);
    if (keys.length === 0) return 'USD 0';
    return keys.map(k => `${k} ${map[k].toLocaleString()}`).join(' | ');
  };

  // WhatsApp Manager Report Dispatcher (Requirement 12)
  const sendManagerReportWhatsApp = () => {
    const text = encodeURIComponent(
      `*SOFIA TRAVEL - EXECUTIVE MANAGER INTELLIGENCE REPORT*\n` +
      `=========================================\n` +
      `Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}\n` +
      `Company: ${settings?.company_name || 'Sofia Travel Egypt'}\n` +
      `=========================================\n\n` +
      `*1. KEY PERFORMANCE METRICS:*\n` +
      `• Total Reservations: ${totalReservationsCount} (${confirmedReservations.length} Confirmed)\n` +
      `• Registered Clients: ${customers.length}\n` +
      `• Active Suppliers/Hotels/Airlines: ${suppliers.length}\n` +
      `• Available Tour Packages: ${packages.length}\n\n` +
      `*2. FINANCIAL PERFORMANCE BY CURRENCY:*\n` +
      `• *Gross Sales:* ${formatCurrencyMap(grossSalesByCurrency)}\n` +
      `• *Operating Net Profit:* ${formatCurrencyMap(netProfitByCurrency)}\n` +
      `• *Total Collections:* ${formatCurrencyMap(collectionsByCurrency)}\n` +
      `• *Customer Receivables Pending:* ${formatCurrencyMap(receivablesByCurrency)}\n` +
      `• *Supplier Payables Pending:* ${formatCurrencyMap(payablesByCurrency)}\n\n` +
      `*3. OPERATIONAL INVENTORY HIGHLIGHTS:*\n` +
      `• Partner Hotel Contracts: ${hotels.length} verified properties\n` +
      `• Active Flight Routes: ${flights.length} scheduled sectors\n\n` +
      `*Bank Wire Confirmation:*\n` +
      `Bank: ${settings?.bank_name || 'National Bank of Egypt (NBE)'}\n` +
      `Account: ${settings?.bank_account_number || 'EG540003001500000010987654321'}\n` +
      `=========================================\n` +
      `Report Generated for Executive General Manager`
    );

    const phone = settings?.whatsapp?.replace(/[^0-9]/g, '') || '';
    const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  // Export CSV Report
  const exportExecutiveCSV = () => {
    const headers = ['Report Category,Entity / Metric,Amounts By Currency,Status'];
    const rows = [
      `"Financial","Gross Sales","${formatCurrencyMap(grossSalesByCurrency)}","Audited"`,
      `"Financial","Net Profit","${formatCurrencyMap(netProfitByCurrency)}","Audited"`,
      `"Financial","Collections Received","${formatCurrencyMap(collectionsByCurrency)}","Received"`,
      `"Financial","Client Receivables","${formatCurrencyMap(receivablesByCurrency)}","Pending"`,
      `"Operations","Total Reservations",${totalReservationsCount},"Active"`,
      `"Operations","Total Customers",${customers.length},"Active"`,
      `"Operations","Active Tour Packages",${packages.length},"Inventory"`,
      `"Operations","Partner Hotels",${hotels.length},"Inventory"`,
      `"Operations","Flight Schedules",${flights.length},"Inventory"`
    ];

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
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
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Executive Manager Reports & WhatsApp</h1>
          <p className="text-sm text-slate-500">
            Comprehensive business intelligence aggregating reservations, hotels, flights, financials, and employee performance.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={sendManagerReportWhatsApp}
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Send to Manager via WhatsApp</span>
          </button>
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
          { id: 'executive', label: 'Executive Overview' },
          { id: 'reservations', label: `Reservations (${reservations.length})` },
          { id: 'hotels', label: `Hotel Inventory (${hotels.length})` },
          { id: 'flights', label: `Flight Schedules (${flights.length})` },
          { id: 'financial', label: 'Financial & Billing' },
          { id: 'employees', label: 'Staff Performance' },
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
          {/* Executive Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                <span>Gross Revenue</span>
                <TrendingUp className="w-4 h-4 text-cyan-600" />
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {Object.keys(grossSalesByCurrency).length === 0 ? (
                  <span className="text-xl font-extrabold text-slate-900"><CurrencyHighlight amount={0} currency="USD" /></span>
                ) : (
                  Object.keys(grossSalesByCurrency).map(c => (
                    <span key={c} className="text-sm font-extrabold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-xl">
                      <CurrencyHighlight amount={grossSalesByCurrency[c]} currency={c} />
                    </span>
                  ))
                )}
              </div>
              <p className="text-[11px] text-slate-400">Exact booked revenue per currency</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                <span>Operating Net Profit</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {Object.keys(netProfitByCurrency).length === 0 ? (
                  <span className="text-xl font-extrabold text-emerald-600"><CurrencyHighlight amount={0} currency="USD" /></span>
                ) : (
                  Object.keys(netProfitByCurrency).map(c => (
                    <span key={c} className="text-sm font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl">
                      <CurrencyHighlight amount={netProfitByCurrency[c]} currency={c} />
                    </span>
                  ))
                )}
              </div>
              <p className="text-[11px] text-slate-400">Net earnings per currency</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                <span>Collections Received</span>
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {Object.keys(collectionsByCurrency).length === 0 ? (
                  <span className="text-xl font-extrabold text-blue-600"><CurrencyHighlight amount={0} currency="USD" /></span>
                ) : (
                  Object.keys(collectionsByCurrency).map(c => (
                    <span key={c} className="text-sm font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl">
                      <CurrencyHighlight amount={collectionsByCurrency[c]} currency={c} />
                    </span>
                  ))
                )}
              </div>
              <p className="text-[11px] text-slate-400">Collected invoice funds</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                <span>Pending Receivables</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {Object.keys(receivablesByCurrency).length === 0 ? (
                  <span className="text-xl font-extrabold text-amber-600"><CurrencyHighlight amount={0} currency="USD" /></span>
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
                <th className="py-3.5 px-4 font-semibold">Reservation ID</th>
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
              {reservations.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{r.reservation_id}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{r.customer_name}</td>
                  <td className="py-3.5 px-4 text-xs text-slate-600">{r.service_type}</td>
                  <td className="py-3.5 px-4 text-xs text-slate-500">{r.travel_date} → {r.return_date}</td>
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
                <th className="py-3.5 px-4 font-semibold">Contact Details</th>
                <th className="py-3.5 px-4 font-semibold">System Actions Logged</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map(emp => (
                <tr key={emp.id} className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{emp.name}</td>
                  <td className="py-3.5 px-4 text-xs text-slate-700">{emp.position} • {emp.department}</td>
                  <td className="py-3.5 px-4 text-xs text-slate-600">{emp.email} • {emp.phone}</td>
                  <td className="py-3.5 px-4 font-semibold text-cyan-700 text-xs">Active Contributor</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {emp.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
