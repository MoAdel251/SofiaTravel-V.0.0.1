import React, { useState } from 'react';
import { 
  Truck, 
  Search, 
  Plus, 
  Filter, 
  Download, 
  Phone, 
  Mail, 
  FileText, 
  Printer, 
  MessageCircle, 
  X, 
  Building, 
  CreditCard,
  DollarSign
} from 'lucide-react';
import { Supplier, Invoice, Reservation, CompanySettings } from '../types';
import { SofiaLogo } from './SofiaLogo';
import { ManagerSignature } from './ManagerSignature';
import { formatCurrency, convertCurrency, getCurrencySymbol } from '../utils/currency';

interface SuppliersViewProps {
  suppliers: Supplier[];
  invoices?: Invoice[];
  reservations?: Reservation[];
  settings?: CompanySettings;
  onAddSupplier: (data: Partial<Supplier>) => void;
}

export function SuppliersView({ 
  suppliers, 
  invoices = [], 
  reservations = [], 
  settings, 
  onAddSupplier 
}: SuppliersViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [statementSupplier, setStatementSupplier] = useState<Supplier | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<Supplier>>({
    supplier_name: '',
    type: 'Hotel',
    contact_person: '',
    phone: '',
    email: '',
    country: 'Egypt',
    city: 'Cairo',
    address: '',
    bank_account_details: '',
    payment_terms: 'Net 30'
  });

  const filteredSuppliers = suppliers.filter(s => {
    const matchesSearch = ( s.supplier_name || "" ).toLowerCase().includes(( searchTerm || "" ).toLowerCase()) ||
                          ( s.contact_person || "" ).toLowerCase().includes(( searchTerm || "" ).toLowerCase()) ||
                          ( s.email || "" ).toLowerCase().includes(( searchTerm || "" ).toLowerCase()) ||
                          s.phone.includes(searchTerm);
    const matchesType = typeFilter === 'All' || s.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    onAddSupplier(formData);
    setShowAddModal(false);
    setFormData({
      supplier_name: '',
      type: 'Hotel',
      contact_person: '',
      phone: '',
      email: '',
      country: 'Egypt',
      city: 'Cairo',
      address: '',
      bank_account_details: '',
      payment_terms: 'Net 30'
    });
  };

  // Helper to calculate supplier-specific 3-currency balance
  const getSupplierFinancials = (sup: Supplier) => {
    const supInvoices = invoices.filter(inv => 
      inv.supplier_id === sup.id || 
      (inv.supplier_name && ( inv.supplier_name || "" ).toLowerCase() === ( sup.supplier_name || "" ).toLowerCase())
    );

    let totalDueUSD = 0;
    let totalPaidUSD = 0;
    let balanceUSD = sup.outstanding_balance || 0;

    if (supInvoices.length > 0) {
      totalDueUSD = supInvoices.reduce((acc, i) => acc + convertCurrency(i.total_amount, i.currency || 'USD', 'USD', settings?.exchange_rates), 0);
      totalPaidUSD = supInvoices.reduce((acc, i) => acc + convertCurrency(i.paid_amount, i.currency || 'USD', 'USD', settings?.exchange_rates), 0);
      balanceUSD = supInvoices.reduce((acc, i) => acc + convertCurrency(i.balance_due, i.currency || 'USD', 'USD', settings?.exchange_rates), 0);
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

  const sendSupplierWhatsApp = (sup: Supplier) => {
    const fin = getSupplierFinancials(sup);
    const text = encodeURIComponent(
      `*SOFIA TRAVEL - SUPPLIER STATEMENT OF ACCOUNT*\n` +
      `-----------------------------------------\n` +
      `Supplier: ${sup.supplier_name} (${sup.type})\n` +
      `Contact Person: ${sup.contact_person}\n` +
      `Date: ${new Date().toLocaleDateString()}\n` +
      `-----------------------------------------\n` +
      `*SETTLEMENT BALANCES IN ALL 3 CURRENCIES:*\n` +
      `• U.S. Dollar ($): Total Billed: ${formatCurrency(fin.usd.total, 'USD')} | Paid: ${formatCurrency(fin.usd.paid, 'USD')} | *Balance Payable: ${formatCurrency(fin.usd.balance, 'USD')}*\n` +
      `• Egyptian Pound (EGP): Total Billed: ${formatCurrency(fin.egp.total, 'EGP')} | Paid: ${formatCurrency(fin.egp.paid, 'EGP')} | *Balance Payable: ${formatCurrency(fin.egp.balance, 'EGP')}*\n` +
      `• Euro (€): Total Billed: ${formatCurrency(fin.eur.total, 'EUR')} | Paid: ${formatCurrency(fin.eur.paid, 'EUR')} | *Balance Payable: ${formatCurrency(fin.eur.balance, 'EUR')}*\n` +
      `-----------------------------------------\n` +
      `Bank Wire Reference: ${settings?.bank_name || 'National Bank of Egypt'}\n` +
      `Thank you for partnering with Sofia Travel!`
    );
    const phone = sup.phone?.replace(/[^0-9]/g, '') || '';
    const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Suppliers & Settlements</h1>
          <p className="text-sm text-slate-500">
            Manage partner airlines, hotel chains, transport providers, and print supplier statements in 3 currencies.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-cyan-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Supplier</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search suppliers by name, contact person, email..."
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
            <option value="All">All Supplier Types</option>
            <option value="Hotel">Hotel</option>
            <option value="Airline">Airline</option>
            <option value="Transport">Transport</option>
            <option value="Tour Operator">Tour Operator</option>
            <option value="Visa Service">Visa Service</option>
          </select>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Supplier Name</th>
                <th className="py-3.5 px-4 font-semibold">Type</th>
                <th className="py-3.5 px-4 font-semibold">Contact Person</th>
                <th className="py-3.5 px-4 font-semibold">Location</th>
                <th className="py-3.5 px-4 font-semibold">Balance Payable</th>
                <th className="py-3.5 px-4 font-semibold text-right">3-Currency Statement & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSuppliers.map(sup => {
                const fin = getSupplierFinancials(sup);
                return (
                  <tr key={sup.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{sup.supplier_name}</div>
                      <div className="text-[11px] text-slate-400">{sup.email}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        sup.type === 'Hotels' ? 'bg-amber-100 text-amber-800' :
                        sup.type === 'Airlines' ? 'bg-blue-100 text-blue-800' :
                        sup.type === 'Transportation Companies' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {sup.type}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-700">
                      <div className="font-semibold text-slate-900">{sup.contact_person}</div>
                      <div className="text-slate-500 text-[11px]">{sup.phone}</div>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      <div>{sup.address || 'Egypt Operations'}</div>
                      <div className="text-slate-400 text-[11px]">{sup.payment_terms}</div>
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
                      <div className="flex items-center justify-end space-x-2">
                        {/* 3-Currency Statement Button (Requirement 8) */}
                        <button
                          onClick={() => setStatementSupplier(sup)}
                          className="flex items-center space-x-1 bg-purple-50 hover:bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-purple-200"
                          title="View & Print Statement in 3 Currencies"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Statement</span>
                        </button>

                        <button
                          onClick={() => sendSupplierWhatsApp(sup)}
                          className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors cursor-pointer"
                          title="Send Statement via WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
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

      {/* 3-CURRENCY OFFICIAL SUPPLIER ACCOUNT STATEMENT MODAL (Requirement 8) */}
      {statementSupplier && (() => {
        const fin = getSupplierFinancials(statementSupplier);
        const supInvoices = invoices.filter(inv => 
          inv.supplier_id === statementSupplier.id || 
          (inv.supplier_name && ( inv.supplier_name || "" ).toLowerCase() === ( statementSupplier.supplier_name || "" ).toLowerCase())
        );

        return (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-3xl w-full p-8 shadow-2xl border border-slate-200 my-8 max-h-[95vh] overflow-y-auto print:m-0 print:p-0 print:shadow-none print:border-none">
              {/* Header Action Bar */}
              <div className="flex items-center justify-between pb-6 border-b border-slate-200 print:hidden">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Supplier Statement of Account</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                    3 Currencies (USD $, EGP, EUR €)
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => sendSupplierWhatsApp(statementSupplier)}
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
                    onClick={() => setStatementSupplier(null)}
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
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">SUPPLIER STATEMENT</h2>
                    <p className="text-xs font-bold text-purple-700 mt-1">Vendor: {statementSupplier.supplier_name}</p>
                    <p className="text-xs text-slate-600 mt-1">Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>

                {/* Supplier Details Box */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Supplier / Vendor:</p>
                    <p className="font-bold text-base text-slate-900 mt-0.5">{statementSupplier.supplier_name}</p>
                    <p className="text-slate-600">Category: <span className="font-semibold text-slate-900">{statementSupplier.type}</span></p>
                    <p className="text-slate-600">Contact: {statementSupplier.contact_person}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Payment & Banking:</p>
                    <p className="text-slate-800 font-medium mt-0.5">{statementSupplier.phone} • {statementSupplier.email}</p>
                    <p className="text-slate-600">Terms: {statementSupplier.payment_terms}</p>
                    <p className="text-slate-600">{statementSupplier.bank_account_details || 'Settlement via Wire Transfer'}</p>
                  </div>
                </div>

                {/* 3-CURRENCY BALANCES BREAKDOWN TABLE (Requirement 8) */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Consolidated Payable Balances in All Three Currencies
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="py-2.5 px-4">Currency</th>
                          <th className="py-2.5 px-4 text-right">Total Invoiced / Billed</th>
                          <th className="py-2.5 px-4 text-right">Total Settled / Paid</th>
                          <th className="py-2.5 px-4 text-right">Outstanding Balance Payable</th>
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
                    Invoicing & Settlement Ledger
                  </h4>
                  {supInvoices.length === 0 ? (
                    <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-400">
                      No supplier invoices issued yet. Outstanding balance applied.
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="py-2 px-3">Bill / Invoice #</th>
                            <th className="py-2 px-3">Date</th>
                            <th className="py-2 px-3">Status</th>
                            <th className="py-2 px-3 text-right">Total</th>
                            <th className="py-2 px-3 text-right">Paid</th>
                            <th className="py-2 px-3 text-right">Balance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {supInvoices.map((inv, idx) => (
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
                <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-4 text-xs space-y-1 text-slate-800">
                  <div className="flex items-center gap-2 text-purple-900 font-bold">
                    <Building className="w-4 h-4 text-purple-700" />
                    <span>Sofia Travel Bank Settlement Account</span>
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
                    <p>Sofia Travel Accounting & Procurement Division</p>
                    <p className="text-[10px]">For settlements: finance@sofiatravel.com</p>
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

      {/* Add Supplier Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Add New Supplier</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier Name *</label>
                <input
                  type="text"
                  required
                  value={formData.supplier_name}
                  onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Hotel">Hotel</option>
                    <option value="Airline">Airline</option>
                    <option value="Transport">Transport</option>
                    <option value="Tour Operator">Tour Operator</option>
                    <option value="Visa Service">Visa Service</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Person *</label>
                  <input
                    type="text"
                    required
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
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
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
