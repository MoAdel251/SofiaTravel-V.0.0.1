import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Filter, 
  Download, 
  Phone, 
  Mail, 
  FileText, 
  Trash2, 
  Edit, 
  Eye,
  MessageCircle,
  X,
  Printer,
  Calendar,
  Building,
  DollarSign,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Customer, CustomerType, Invoice, Reservation, CompanySettings } from '../types';
import { SofiaLogo } from './SofiaLogo';
import { ManagerSignature } from './ManagerSignature';
import { formatCurrency, convertCurrency, getCurrencySymbol } from '../utils/currency';

interface CustomersViewProps {
  customers: Customer[];
  invoices?: Invoice[];
  reservations?: Reservation[];
  settings?: CompanySettings;
  visas?: any[];
  flights?: any[];
  hotels?: any[];
  transfers?: any[];
  cruises?: any[];
  tours?: any[];
  dayTrips?: any[];
  onAddCustomer: (data: Partial<Customer>) => void;
  onUpdateCustomer: (id: string, data: Partial<Customer>) => void;
  onDeleteCustomer: (id: string) => void;
}

export function CustomersView({ 
  customers, 
  invoices = [], 
  reservations = [], 
  settings, 
  visas = [],
  flights = [],
  hotels = [],
  transfers = [],
  cruises = [],
  tours = [],
  dayTrips = [],
  onAddCustomer, 
  onUpdateCustomer, 
  onDeleteCustomer 
}: CustomersViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [statementCustomer, setStatementCustomer] = useState<Customer | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<Customer>>({
    full_name: '',
    passport_number: '',
    nationality: 'Egyptian',
    date_of_birth: '1990-01-01',
    gender: 'Male',
    phone: '',
    whatsapp_number: '',
    email: '',
    address: '',
    notes: '',
    customer_type: 'Individual'
  });

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = (c.full_name || "").toLowerCase().includes(( searchTerm || "" ).toLowerCase()) ||
                          (c.passport_number || "").toLowerCase().includes(( searchTerm || "" ).toLowerCase()) ||
                          (c.phone || "").includes(searchTerm) ||
                          (c.email || "").toLowerCase().includes(( searchTerm || "" ).toLowerCase()) ||
                          (c.customer_id || "").toLowerCase().includes(( searchTerm || "" ).toLowerCase());
    const matchesType = typeFilter === 'All' || c.customer_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    onAddCustomer(formData);
    setShowAddModal(false);
    setFormData({
      full_name: '',
      passport_number: '',
      nationality: 'Egyptian',
      date_of_birth: '1990-01-01',
      gender: 'Male',
      phone: '',
      whatsapp_number: '',
      email: '',
      address: '',
      notes: '',
      customer_type: 'Individual'
    });
  };

  const exportToCSV = () => {
    const headers = ['Customer ID,Full Name,Passport,Nationality,Type,Phone,Email,Outstanding Balance'];
    const rows = filteredCustomers.map(c => 
      `"${c.customer_id}","${c.full_name}","${c.passport_number}","${c.nationality}","${c.customer_type}","${c.phone}","${c.email}",${c.outstanding_balance}`
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sofia_travel_customers.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to compute customer-specific 3-currency balance
  const getCustomerFinancials = (cust: Customer) => {
    const custInvoices = invoices.filter(inv => inv.customer_id === cust.id || inv.customer_id === cust.customer_id);
    let totalDueUSD = 0;
    let totalPaidUSD = 0;
    let balanceUSD = cust.outstanding_balance || 0;

    if (custInvoices.length > 0) {
      totalDueUSD = custInvoices.reduce((acc, i) => acc + convertCurrency(i.total_amount, i.currency || 'USD', 'USD', settings?.exchange_rates), 0);
      totalPaidUSD = custInvoices.reduce((acc, i) => acc + convertCurrency(i.paid_amount, i.currency || 'USD', 'USD', settings?.exchange_rates), 0);
      balanceUSD = custInvoices.reduce((acc, i) => acc + convertCurrency(i.balance_due, i.currency || 'USD', 'USD', settings?.exchange_rates), 0);
    } else {
      totalDueUSD = balanceUSD;
    }

    return {
      usd: {
        total: totalDueUSD,
        paid: totalPaidUSD,
        balance: balanceUSD
      },
      egp: {
        total: convertCurrency(totalDueUSD, 'USD', 'EGP', settings?.exchange_rates),
        paid: convertCurrency(totalPaidUSD, 'USD', 'EGP', settings?.exchange_rates),
        balance: convertCurrency(balanceUSD, 'USD', 'EGP', settings?.exchange_rates)
      },
      eur: {
        total: convertCurrency(totalDueUSD, 'USD', 'EUR', settings?.exchange_rates),
        paid: convertCurrency(totalPaidUSD, 'USD', 'EUR', settings?.exchange_rates),
        balance: convertCurrency(balanceUSD, 'USD', 'EUR', settings?.exchange_rates)
      }
    };
  };

  const sendStatementWhatsApp = (cust: Customer) => {
    const financials = getCustomerFinancials(cust);
    const text = encodeURIComponent(
      `*SOFIA TRAVEL - CUSTOMER ACCOUNT STATEMENT*\n` +
      `-----------------------------------------\n` +
      `Customer: ${cust.full_name} (${cust.customer_id})\n` +
      `Passport: ${cust.passport_number}\n` +
      `Date: ${new Date().toLocaleDateString()}\n` +
      `-----------------------------------------\n` +
      `*ACCOUNT BALANCES IN ALL 3 CURRENCIES:*\n` +
      `• U.S. Dollar ($): Total Due: ${formatCurrency(financials.usd.total, 'USD')} | Paid: ${formatCurrency(financials.usd.paid, 'USD')} | *Balance: ${formatCurrency(financials.usd.balance, 'USD')}*\n` +
      `• Egyptian Pound (EGP): Total Due: ${formatCurrency(financials.egp.total, 'EGP')} | Paid: ${formatCurrency(financials.egp.paid, 'EGP')} | *Balance: ${formatCurrency(financials.egp.balance, 'EGP')}*\n` +
      `• Euro (€): Total Due: ${formatCurrency(financials.eur.total, 'EUR')} | Paid: ${formatCurrency(financials.eur.paid, 'EUR')} | *Balance: ${formatCurrency(financials.eur.balance, 'EUR')}*\n` +
      `-----------------------------------------\n` +
      `*Bank Wire Transfer Details:*\n` +
      `Bank: ${settings?.bank_name || 'National Bank of Egypt (NBE)'}\n` +
      `Account #: ${settings?.bank_account_number || 'EG540003001500000010987654321'}\n` +
      `SWIFT: ${settings?.bank_iban_swift || 'NBEGEGCX054'}\n` +
      `Thank you for traveling with Sofia Travel!`
    );
    const phone = cust.phone?.replace(/[^0-9]/g, '') || '';
    const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Customer Management & Statements</h1>
          <p className="text-sm text-slate-500">
            View profiles, issue statements in all 3 currencies (USD, EGP, EUR), and export client records.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={exportToCSV}
            className="flex items-center space-x-2 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-cyan-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, passport, customer ID, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-cyan-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-cyan-500"
          >
            <option value="All">All Customer Types</option>
            <option value="Individual">Individual</option>
            <option value="Family">Family</option>
            <option value="Corporate">Corporate</option>
            <option value="Travel Agent">Travel Agent</option>
            <option value="Partner">Partner</option>
          </select>
        </div>
      </div>

      {/* Customer List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Customer</th>
                <th className="py-3.5 px-4 font-semibold">Passport & Nationality</th>
                <th className="py-3.5 px-4 font-semibold">Contact Details</th>
                <th className="py-3.5 px-4 font-semibold">Type</th>
                <th className="py-3.5 px-4 font-semibold">Outstanding Balance</th>
                <th className="py-3.5 px-4 font-semibold text-right">3-Currency Statement & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map(cust => {
                const fin = getCustomerFinancials(cust);
                return (
                  <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{cust.full_name}</div>
                      <div className="text-[11px] text-cyan-600 font-semibold">{cust.customer_id}</div>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-700">
                      <div><span className="font-semibold text-slate-900">{cust.passport_number}</span></div>
                      <div className="text-slate-500 text-[11px]">{cust.nationality}</div>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      <div>{cust.phone}</div>
                      <div className="text-slate-400 text-[11px] truncate max-w-xs">{cust.email}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        cust.customer_type === 'Corporate' ? 'bg-indigo-100 text-indigo-800' :
                        cust.customer_type === 'Family' ? 'bg-purple-100 text-purple-800' :
                        cust.customer_type === 'Travel Agent' ? 'bg-amber-100 text-amber-800' :
                        cust.customer_type === 'Partner' ? 'bg-teal-100 text-teal-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {cust.customer_type}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-amber-600 text-xs">
                        {formatCurrency(fin.usd.balance, 'USD')}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {formatCurrency(fin.egp.balance, 'EGP')} • {formatCurrency(fin.eur.balance, 'EUR')}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* 3-Currency Statement Button (Requirement 9) */}
                        <button
                          onClick={() => setStatementCustomer(cust)}
                          className="flex items-center space-x-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-cyan-200"
                          title="View & Print Statement in 3 Currencies"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Statement</span>
                        </button>

                        <button
                          onClick={() => setSelectedCustomer(cust)}
                          className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors cursor-pointer"
                          title="View Full Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => sendStatementWhatsApp(cust)}
                          className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors cursor-pointer"
                          title="Send Statement via WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete customer ${cust.full_name}?`)) {
                              onDeleteCustomer(cust.id);
                            }
                          }}
                          className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title="Delete Customer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3-CURRENCY OFFICIAL CUSTOMER ACCOUNT STATEMENT MODAL */}
      {statementCustomer && (() => {
        const fin = getCustomerFinancials(statementCustomer);
        const custInvoices = invoices.filter(inv => inv.customer_id === statementCustomer.id || inv.customer_id === statementCustomer.customer_id);

        return (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-3xl w-full p-8 shadow-2xl border border-slate-200 my-8 max-h-[95vh] overflow-y-auto print:m-0 print:p-0 print:shadow-none print:border-none">
              {/* Header Action Bar */}
              <div className="flex items-center justify-between pb-6 border-b border-slate-200 print:hidden">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Official Account Statement</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-100 text-cyan-800">
                    3 Currencies (USD $, EGP, EUR €)
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => sendStatementWhatsApp(statementCustomer)}
                    className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Send via WhatsApp</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Statement</span>
                  </button>
                  <button
                    onClick={() => setStatementCustomer(null)}
                    className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* PRINTABLE STATEMENT BODY */}
              <div className="pt-6 space-y-6">
                {/* Sofia Logo & Company Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b-2 border-slate-900">
                  <div>
                    <SofiaLogo variant="horizontal" />
                    <p className="text-xs text-slate-500 mt-2 max-w-xs">{settings?.address}</p>
                    <p className="text-xs text-slate-500">Tel: {settings?.phone} • WhatsApp: {settings?.whatsapp}</p>
                    <p className="text-xs text-slate-500">Email: {settings?.email} • TRN: {settings?.tax_number}</p>
                  </div>

                  <div className="text-left sm:text-right">
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">STATEMENT OF ACCOUNT</h2>
                    <p className="text-xs font-bold text-cyan-700 mt-1">Client ID: {statementCustomer.customer_id}</p>
                    <p className="text-xs text-slate-600 mt-1">Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>

                {/* Customer Details Box */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Account Holder:</p>
                    <p className="font-bold text-base text-slate-900 mt-0.5">{statementCustomer.full_name}</p>
                    <p className="text-slate-600">Passport Number: <span className="font-semibold text-slate-900">{statementCustomer.passport_number}</span></p>
                    <p className="text-slate-600">Nationality: {statementCustomer.nationality}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Contact & Address:</p>
                    <p className="text-slate-800 font-medium mt-0.5">{statementCustomer.phone}</p>
                    <p className="text-slate-600">{statementCustomer.email}</p>
                    <p className="text-slate-600">{statementCustomer.address || 'Cairo, Egypt'}</p>
                  </div>
                </div>

                {/* 3-CURRENCY BALANCES BREAKDOWN TABLE (Requirement 9) */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Consolidated Balances in All Three Currencies
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="py-2.5 px-4">Currency</th>
                          <th className="py-2.5 px-4 text-right">Total Amount Due</th>
                          <th className="py-2.5 px-4 text-right">Total Amount Paid</th>
                          <th className="py-2.5 px-4 text-right">Outstanding Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        <tr className="bg-blue-50/40">
                          <td className="py-3 px-4 font-bold text-blue-900">U.S. Dollar ($)</td>
                          <td className="py-3 px-4 text-right">{formatCurrency(fin.usd.total, 'USD')}</td>
                          <td className="py-3 px-4 text-right text-emerald-700">{formatCurrency(fin.usd.paid, 'USD')}</td>
                          <td className="py-3 px-4 text-right font-bold text-amber-700">{formatCurrency(fin.usd.balance, 'USD')}</td>
                        </tr>
                        <tr className="bg-emerald-50/40">
                          <td className="py-3 px-4 font-bold text-emerald-900">Egyptian Pound (EGP)</td>
                          <td className="py-3 px-4 text-right">{formatCurrency(fin.egp.total, 'EGP')}</td>
                          <td className="py-3 px-4 text-right text-emerald-700">{formatCurrency(fin.egp.paid, 'EGP')}</td>
                          <td className="py-3 px-4 text-right font-bold text-amber-700">{formatCurrency(fin.egp.balance, 'EGP')}</td>
                        </tr>
                        <tr className="bg-purple-50/40">
                          <td className="py-3 px-4 font-bold text-purple-900">Euro (€)</td>
                          <td className="py-3 px-4 text-right">{formatCurrency(fin.eur.total, 'EUR')}</td>
                          <td className="py-3 px-4 text-right text-emerald-700">{formatCurrency(fin.eur.paid, 'EUR')}</td>
                          <td className="py-3 px-4 text-right font-bold text-amber-700">{formatCurrency(fin.eur.balance, 'EUR')}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Itemized Invoices & Billing History */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Invoicing & Transactions Ledger
                  </h4>
                  {custInvoices.length === 0 ? (
                    <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-400">
                      No invoices recorded under this customer. Initial balance applied.
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="py-2 px-3">Invoice #</th>
                            <th className="py-2 px-3">Date</th>
                            <th className="py-2 px-3">Status</th>
                            <th className="py-2 px-3 text-right">Total</th>
                            <th className="py-2 px-3 text-right">Paid</th>
                            <th className="py-2 px-3 text-right">Balance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {custInvoices.map((inv, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="py-2.5 px-3 font-bold text-slate-900">{inv.invoice_number}</td>
                              <td className="py-2.5 px-3 text-slate-600">{inv.issue_date}</td>
                              <td className="py-2.5 px-3">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  inv.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {inv.payment_status}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-semibold">{formatCurrency(inv.total_amount, inv.currency)}</td>
                              <td className="py-2.5 px-3 text-right text-emerald-700">{formatCurrency(inv.paid_amount, inv.currency)}</td>
                              <td className="py-2.5 px-3 text-right font-bold text-amber-700">{formatCurrency(inv.balance_due, inv.currency)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Company Official Bank Details Box */}
                <div className="bg-cyan-50/70 border border-cyan-200 rounded-xl p-4 text-xs space-y-1 text-slate-800">
                  <div className="flex items-center gap-2 text-cyan-900 font-bold">
                    <Building className="w-4 h-4 text-cyan-700" />
                    <span>Official Bank Settlement Details</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                    <p><strong>Bank:</strong> {settings?.bank_name || 'National Bank of Egypt (NBE) - Tahrir Branch'}</p>
                    <p><strong>Account #:</strong> <span className="font-mono font-bold">{settings?.bank_account_number || 'EG540003001500000010987654321'}</span></p>
                    <p><strong>Beneficiary:</strong> {settings?.bank_beneficiary_name || settings?.company_name}</p>
                    <p><strong>SWIFT:</strong> <span className="font-mono">{settings?.bank_iban_swift || 'SWIFT: NBEGEGCX054'}</span></p>
                  </div>
                </div>

                {/* Signatory Stamp */}
                <div className="flex flex-col sm:flex-row items-end justify-between gap-6 pt-4 border-t border-slate-200">
                  <div className="text-xs text-slate-400">
                    <p>Thank you for choosing Sofia Travel.</p>
                    <p className="text-[10px]">For inquiries, contact operations@sofiatravel.com</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <ManagerSignature managerName="Ahmed Ali" />
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-1">Authorized Agency Signatory</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Customer Profile View Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold text-lg">
                  {selectedCustomer.full_name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedCustomer.full_name}</h3>
                  <p className="text-xs text-slate-500">ID: {selectedCustomer.customer_id} • Passport: {selectedCustomer.passport_number}</p>
                </div>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500 font-medium">Customer Type</p>
                <p className="text-sm font-bold text-slate-900 mt-1">{selectedCustomer.customer_type}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500 font-medium">Nationality</p>
                <p className="text-sm font-bold text-slate-900 mt-1">{selectedCustomer.nationality}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500 font-medium">Outstanding Balance</p>
                <p className="text-sm font-bold text-amber-600 mt-1">{formatCurrency(selectedCustomer.outstanding_balance, 'USD')}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900">Contact Details</h4>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs text-slate-700">
                <p><strong>Phone:</strong> {selectedCustomer.phone}</p>
                <p><strong>WhatsApp:</strong> {selectedCustomer.whatsapp_number}</p>
                <p><strong>Email:</strong> {selectedCustomer.email}</p>
                <p><strong>Address:</strong> {selectedCustomer.address}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center justify-between">
                <span>Customer Services & Bookings (Standalone / Package)</span>
                <span className="text-xs bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded-full font-semibold">
                  {[
                    ...visas.filter(v => v.customer_id === selectedCustomer?.id || v.customer_name === selectedCustomer?.full_name),
                    ...flights.filter(f => f.customer_id === selectedCustomer?.id || f.customer_name === selectedCustomer?.full_name || f.passenger === selectedCustomer?.full_name),
                    ...hotels.filter(h => h.customer_id === selectedCustomer?.id || h.customer_name === selectedCustomer?.full_name),
                    ...transfers.filter(t => t.customer_id === selectedCustomer?.id || t.customer_name === selectedCustomer?.full_name),
                    ...cruises.filter(c => c.customer_id === selectedCustomer?.id || c.customer_name === selectedCustomer?.full_name),
                    ...tours.filter(tr => tr.customer_id === selectedCustomer?.id || tr.customer_name === selectedCustomer?.full_name),
                    ...dayTrips.filter(dt => dt.customer_id === selectedCustomer?.id || dt.customer_name === selectedCustomer?.full_name)
                  ].length} Services
                </span>
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {(() => {
                  const custServices = [
                    ...visas.filter(v => v.customer_id === selectedCustomer?.id || v.customer_name === selectedCustomer?.full_name).map(v => ({ title: v.visa_title || v.country, category: 'Visa', type: v.service_type || 'Standalone', price: v.selling_price, currency: v.currency, status: v.status })),
                    ...flights.filter(f => f.customer_id === selectedCustomer?.id || f.customer_name === selectedCustomer?.full_name || f.passenger === selectedCustomer?.full_name).map(f => ({ title: `${f.departure_airport} → ${f.arrival_airport} (${f.airline})`, category: 'Flight', type: f.service_type || 'Standalone', price: f.selling_price, currency: f.currency, status: f.status })),
                    ...hotels.filter(h => h.customer_id === selectedCustomer?.id || h.customer_name === selectedCustomer?.full_name).map(h => ({ title: h.hotel_name, category: 'Hotel', type: h.service_type || 'Standalone', price: h.selling_price, currency: h.currency, status: 'Active' })),
                    ...transfers.filter(t => t.customer_id === selectedCustomer?.id || t.customer_name === selectedCustomer?.full_name).map(t => ({ title: t.service_title, category: 'Transfer', type: t.service_type || 'Standalone', price: t.selling_price, currency: t.currency, status: t.status })),
                    ...cruises.filter(c => c.customer_id === selectedCustomer?.id || c.customer_name === selectedCustomer?.full_name).map(c => ({ title: c.cruise_name, category: 'Cruise', type: c.service_type || 'Standalone', price: c.selling_price, currency: c.currency, status: c.status })),
                    ...tours.filter(tr => tr.customer_id === selectedCustomer?.id || tr.customer_name === selectedCustomer?.full_name).map(tr => ({ title: tr.tour_title, category: 'Tour', type: tr.service_type || 'Standalone', price: tr.selling_price, currency: tr.currency, status: tr.status })),
                    ...dayTrips.filter(dt => dt.customer_id === selectedCustomer?.id || dt.customer_name === selectedCustomer?.full_name).map(dt => ({ title: dt.trip_title, category: 'Day Trip', type: dt.service_type || 'Standalone', price: dt.selling_price, currency: dt.currency, status: dt.status }))
                  ];
                  if (custServices.length === 0) {
                    return <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-slate-200">No services booked for this customer yet.</p>;
                  }
                  return custServices.map((srv, idx) => (
                    <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex items-center justify-between gap-2">
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span>{srv.title}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${srv.type === 'Standalone' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'}`}>
                            {srv.type} Service ({srv.category})
                          </span>
                        </div>
                        <p className="text-slate-500 mt-0.5">Status: {srv.status}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900">{formatCurrency(srv.price, srv.currency)}</div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => {
                  setStatementCustomer(selectedCustomer);
                  setSelectedCustomer(null);
                }}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-bold shadow-sm cursor-pointer"
              >
                View 3-Currency Statement
              </button>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Add New Customer</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Type</label>
                  <select
                    value={formData.customer_type}
                    onChange={(e) => setFormData({ ...formData, customer_type: e.target.value as CustomerType })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Individual">Individual</option>
                    <option value="Family">Family</option>
                    <option value="Corporate">Corporate</option>
                    <option value="Travel Agent">Travel Agent</option>
                    <option value="Partner">Partner</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Passport Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.passport_number}
                    onChange={(e) => setFormData({ ...formData, passport_number: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nationality *</label>
                  <input
                    type="text"
                    required
                    value={formData.nationality}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value, whatsapp_number: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-medium shadow-sm"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
