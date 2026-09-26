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
import { 
  Customer, 
  CustomerType, 
  Invoice, 
  Reservation, 
  CompanySettings,
  Voucher,
  CustomerPayment,
  CustomerInquiry,
  Employee,
  ActivityLog
} from '../types';
import { SofiaLogo } from './SofiaLogo';
import { ManagerSignature } from './ManagerSignature';
import { formatCurrency, convertCurrency, getCurrencySymbol } from '../utils/currency';
import { CustomerOverviewModal } from './CustomerOverviewModal';

interface CustomersViewProps {
  customers: Customer[];
  invoices?: Invoice[];
  reservations?: Reservation[];
  vouchers?: Voucher[];
  customerPayments?: CustomerPayment[];
  customerInquiries?: CustomerInquiry[];
  employees?: Employee[];
  activityLogs?: ActivityLog[];
  currentUsername?: string;
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
  onLogCommunication?: (customerId: string, communication: any) => Promise<void>;
}

export function CustomersView({ 
  customers, 
  invoices = [], 
  reservations = [], 
  vouchers = [],
  customerPayments = [],
  customerInquiries = [],
  employees = [],
  activityLogs = [],
  currentUsername = 'Staff Member',
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
  onDeleteCustomer,
  onLogCommunication
}: CustomersViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'dossiers' | 'list'>('dossiers');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [statementCustomer, setStatementCustomer] = useState<Customer | null>(null);

  // Helper to generate or retrieve sequential file number
  const getCustomerFileNumber = (cust: Customer, idx: number) => {
    if (cust.file_number) return cust.file_number;
    const numStr = String(cust.customer_id || cust.id || '').replace(/[^0-9]/g, '');
    const num = numStr ? parseInt(numStr, 10) : (idx + 1001);
    return `FILE-2026-${String(num).padStart(4, '0')}`;
  };

  const extractFileNum = (cust: Customer, idx: number): number => {
    const fNum = getCustomerFileNumber(cust, idx);
    const matches = fNum.match(/\d+/g);
    if (matches && matches.length > 0) {
      return parseInt(matches.join(''), 10);
    }
    return 0;
  };

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
    const fileNum = c.file_number || '';
    const matchesSearch = (c.full_name || "").toLowerCase().includes(( searchTerm || "" ).toLowerCase()) ||
                          (c.passport_number || "").toLowerCase().includes(( searchTerm || "" ).toLowerCase()) ||
                          (c.phone || "").includes(searchTerm) ||
                          (c.email || "").toLowerCase().includes(( searchTerm || "" ).toLowerCase()) ||
                          (fileNum || "").toLowerCase().includes(( searchTerm || "" ).toLowerCase()) ||
                          (c.customer_id || "").toLowerCase().includes(( searchTerm || "" ).toLowerCase());
    const matchesType = typeFilter === 'All' || c.customer_type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Automatically sort customer master files in DESCENDING order by sequential File Number
  const sortedDossierCustomers = [...filteredCustomers].sort((a, b) => {
    const idxA = customers.indexOf(a);
    const idxB = customers.indexOf(b);
    const numA = extractFileNum(a, idxA);
    const numB = extractFileNum(b, idxB);
    return numB - numA; // Descending order (highest/newest file numbers first)
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

  // Helper to compute customer-specific currency totals from ACTUAL created invoices
  const getCustomerFinancialsByCurrency = (cust: Customer) => {
    const custInvoices = invoices.filter(inv => inv.customer_id === cust.id || inv.customer_id === cust.customer_id);
    const totalsByCurrency: Record<string, { total: number; paid: number; balance: number }> = {};

    if (custInvoices.length > 0) {
      custInvoices.forEach(i => {
        const curr = (i.currency || 'USD').toUpperCase();
        if (!totalsByCurrency[curr]) {
          totalsByCurrency[curr] = { total: 0, paid: 0, balance: 0 };
        }
        totalsByCurrency[curr].total += Number(i.total_amount) || 0;
        totalsByCurrency[curr].paid += Number(i.paid_amount) || 0;
        totalsByCurrency[curr].balance += Number(i.balance_due) || 0;
      });
    } else {
      const baseCurr = (cust.currency || 'USD').toUpperCase();
      const bal = Number(cust.outstanding_balance) || 0;
      totalsByCurrency[baseCurr] = {
        total: bal,
        paid: 0,
        balance: bal
      };
    }

    return totalsByCurrency;
  };

  const sendStatementWhatsApp = (cust: Customer) => {
    const finByCurr = getCustomerFinancialsByCurrency(cust);
    const balanceLines = Object.entries(finByCurr)
      .map(([curr, vals]) => `• ${curr}: Total Invoiced: ${formatCurrency(vals.total, curr)} | Paid: ${formatCurrency(vals.paid, curr)} | *Balance: ${formatCurrency(vals.balance, curr)}*`)
      .join('\n');

    const text = encodeURIComponent(
      `*SOFIA TRAVEL - CUSTOMER ACCOUNT STATEMENT*\n` +
      `-----------------------------------------\n` +
      `Customer: ${cust.full_name} (${cust.customer_id})\n` +
      `Passport: ${cust.passport_number}\n` +
      `Date: ${new Date().toLocaleDateString()}\n` +
      `-----------------------------------------\n` +
      `*INVOICED BALANCES BY CURRENCY:*\n` +
      `${balanceLines}\n` +
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

      {/* Search, Filters, and View Mode Toggle */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Customer Name, File #, Passport, ID, Phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-cyan-500 focus:bg-white font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-200/80 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setViewMode('dossiers')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'dossiers'
                  ? 'bg-cyan-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="View Customer Files & Master Dossiers (Sorted Descending by Sequential File Number)"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Customer Files & Dossiers</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                viewMode === 'dossiers' ? 'bg-white/20 text-white font-black' : 'bg-slate-300 text-slate-700'
              }`}>
                {filteredCustomers.length}
              </span>
            </button>

            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'list'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="View Customer Profiles Table List"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Profiles Table</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
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
      </div>

      {/* ========================================================================= */}
      {/* VIEW MODE A: CUSTOMER MASTER DOSSIERS (SORTED DESCENDING BY FILE NUMBER) */}
      {/* ========================================================================= */}
      {viewMode === 'dossiers' && (
        <div className="space-y-4">
          <div className="bg-linear-to-r from-slate-900 via-cyan-950 to-slate-900 text-white p-4.5 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-cyan-500/20 border border-cyan-400/30 rounded-xl">
                <FileText className="w-6 h-6 text-cyan-300" />
              </div>
              <div>
                <h2 className="text-base font-extrabold tracking-tight flex items-center gap-2">
                  <span>Customer Master Files & Dossiers Hub</span>
                  <span className="text-[10px] bg-cyan-500/30 text-cyan-200 border border-cyan-400/30 px-2 py-0.5 rounded-full font-bold">
                    Auto-Sorted Descending by File #
                  </span>
                </h2>
                <p className="text-xs text-slate-300">
                  Displays customer name, sequential file numbers, linked vouchers (services & packages), customer sales invoices, and supplier liability bills.
                </p>
              </div>
            </div>

            <div className="text-xs text-cyan-200 font-medium bg-white/10 px-3 py-1.5 rounded-xl border border-white/20 self-start sm:self-auto">
              Total Active Customer Dossiers: <strong>{sortedDossierCustomers.length}</strong>
            </div>
          </div>

          {sortedDossierCustomers.length === 0 ? (
            <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-400">
              <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-slate-700 text-sm">No customer dossiers match your search criteria.</p>
              <p className="text-xs text-slate-500 mt-1">Try adjusting your search terms or filter selections above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedDossierCustomers.map((cust, idx) => {
                const custFileNum = getCustomerFileNumber(cust, customers.indexOf(cust));
                
                // Match created vouchers / reservations for this customer
                const custVouchers = vouchers.filter(v => 
                  v.customer_id === cust.id || 
                  v.customer_id === cust.customer_id || 
                  (v.customer_name && v.customer_name.toLowerCase() === cust.full_name.toLowerCase())
                );

                // Match invoices for this customer
                const custAllInvoices = invoices.filter(inv => 
                  inv.customer_id === cust.id || 
                  inv.customer_id === cust.customer_id ||
                  (inv.customer_name && inv.customer_name.toLowerCase() === cust.full_name.toLowerCase())
                );

                const custSalesInvoices = custAllInvoices.filter(i => i.recipient_type !== 'Supplier');
                const custSupplierInvoices = custAllInvoices.filter(i => i.recipient_type === 'Supplier');

                const finByCurr = getCustomerFinancialsByCurrency(cust);
                const activeCurrencies = Object.entries(finByCurr);

                return (
                  <div key={cust.id} className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden hover:border-cyan-400/80 transition-all">
                    {/* DOSSIER HEADER */}
                    <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center space-x-3.5">
                        <div className="w-11 h-11 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 font-extrabold text-lg shadow-inner shrink-0">
                          {cust.full_name?.charAt(0)?.toUpperCase() || 'C'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-extrabold tracking-tight text-white">{cust.full_name}</h3>
                            {/* Sequential File Number Badge */}
                            <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-black bg-cyan-400 text-slate-950 shadow-xs">
                              {custFileNum}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-cyan-200">
                              {cust.customer_id}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-900/60 text-cyan-200 border border-cyan-700/50">
                              {cust.customer_type || 'Individual'} Client
                            </span>
                          </div>
                          <div className="flex items-center gap-2.5 text-xs text-slate-300 mt-1 flex-wrap font-medium">
                            <span>Passport: <strong className="text-white font-mono">{cust.passport_number || 'N/A'}</strong></span>
                            <span>•</span>
                            <span>Phone: <strong className="text-white">{cust.phone || 'N/A'}</strong></span>
                            <span>•</span>
                            <span>Email: <strong className="text-white">{cust.email || 'N/A'}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Header Quick Actions */}
                      <div className="flex items-center space-x-2 shrink-0 self-start md:self-auto">
                        <button
                          onClick={() => setSelectedCustomer(cust)}
                          className="flex items-center space-x-1 bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                          title="Open Full Customer Overview & Continuity History"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Open Dossier File</span>
                        </button>
                        <button
                          onClick={() => setStatementCustomer(cust)}
                          className="flex items-center space-x-1 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl text-xs font-bold border border-white/20 transition-colors cursor-pointer"
                          title="Print Official 3-Currency Account Statement"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Statement</span>
                        </button>
                        <button
                          onClick={() => sendStatementWhatsApp(cust)}
                          className="p-2 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-xl transition-colors cursor-pointer"
                          title="Send Statement via WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* DOSSIER CONTENTS GRID */}
                    <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-5 bg-slate-50/50">
                      
                      {/* SECTION 1: CREATED VOUCHERS (SERVICES & PACKAGES) */}
                      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-cyan-600" />
                            <span>1. Created Vouchers & Bookings ({custVouchers.length})</span>
                          </h4>
                          <span className="text-[10px] text-cyan-700 font-bold bg-cyan-50 px-2 py-0.5 rounded">
                            Services / Packages
                          </span>
                        </div>

                        {custVouchers.length === 0 ? (
                          <p className="text-xs text-slate-400 italic py-2">No vouchers created yet for this customer file.</p>
                        ) : (
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {custVouchers.map(v => (
                              <div key={v.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                                <div className="flex items-center justify-between font-bold text-slate-900">
                                  <span className="text-cyan-700 font-mono">#{v.voucher_number || v.reservation_id || v.id}</span>
                                  <span className="text-slate-800">{formatCurrency(v.selling_price, v.currency)}</span>
                                </div>
                                <p className="font-semibold text-slate-800 truncate">{v.service_title}</p>
                                <div className="flex items-center justify-between text-[11px] text-slate-500">
                                  <span>{v.service_category} • {v.travel_date || 'Date TBD'}</span>
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-cyan-100 text-cyan-900">
                                    {v.status || 'Confirmed'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* SECTION 2: CUSTOMER SALES INVOICES */}
                      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <span>2. Customer Invoices ({custSalesInvoices.length})</span>
                          </h4>
                          <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded">
                            Receivables
                          </span>
                        </div>

                        {custSalesInvoices.length === 0 ? (
                          <p className="text-xs text-slate-400 italic py-2">No customer sales invoices generated yet.</p>
                        ) : (
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {custSalesInvoices.map(inv => (
                              <div key={inv.id} className="p-2.5 rounded-lg bg-blue-50/40 border border-blue-200/80 text-xs space-y-1">
                                <div className="flex items-center justify-between font-bold text-slate-900">
                                  <span className="text-blue-700 font-mono">#{inv.invoice_number}</span>
                                  <span>{formatCurrency(inv.total_amount, inv.currency)}</span>
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-slate-600">
                                  <span>Issued: {inv.issue_date}</span>
                                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                    inv.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {inv.payment_status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* SECTION 3: SUPPLIER INVOICES (FOR THIS CUSTOMER'S VOUCHER) */}
                      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
                            <Building className="w-4 h-4 text-purple-600" />
                            <span>3. Supplier Bills ({custSupplierInvoices.length})</span>
                          </h4>
                          <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded">
                            Company Liabilities
                          </span>
                        </div>

                        {custSupplierInvoices.length === 0 ? (
                          <p className="text-xs text-slate-400 italic py-2">No supplier bills issued for this customer file.</p>
                        ) : (
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {custSupplierInvoices.map(inv => (
                              <div key={inv.id} className="p-2.5 rounded-lg bg-purple-50/40 border border-purple-200/80 text-xs space-y-1">
                                <div className="flex items-center justify-between font-bold text-slate-900">
                                  <span className="text-purple-700 font-mono">#{inv.invoice_number}</span>
                                  <span>{formatCurrency(inv.total_amount, inv.currency)}</span>
                                </div>
                                <p className="font-semibold text-purple-900 truncate">
                                  Supplier: {inv.supplier_name || 'Vendor Partner'}
                                </p>
                                <div className="flex items-center justify-between text-[11px] text-slate-600">
                                  <span>Customer: <strong className="text-cyan-900">{cust.full_name}</strong></span>
                                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                    inv.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-900'
                                  }`}>
                                    {inv.payment_status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>

                    {/* DOSSIER FOOTER: FINANCIAL SUMMARY BY CURRENCY */}
                    <div className="px-5 py-3 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-slate-700 uppercase tracking-wider text-[11px]">
                          Customer Financial Balances:
                        </span>
                        {activeCurrencies.length === 0 ? (
                          <span className="text-slate-400 italic">Zero Active Invoiced Balance</span>
                        ) : (
                          <div className="flex items-center gap-2 flex-wrap">
                            {activeCurrencies.map(([code, f]) => (
                              <span key={code} className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-bold text-slate-800 shadow-2xs">
                                {code}: Total Invoiced: {formatCurrency(f.total, code)} | Paid: {formatCurrency(f.paid, code)} | <strong className="text-amber-600">Due: {formatCurrency(f.balance, code)}</strong>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => setSelectedCustomer(cust)}
                        className="text-cyan-700 hover:text-cyan-900 font-bold text-xs flex items-center gap-1 underline cursor-pointer self-start sm:self-auto"
                      >
                        <span>View Complete Customer Profile & Records</span>
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW MODE B: CUSTOMER PROFILES TABLE LIST */}
      {/* ========================================================================= */}
      {viewMode === 'list' && (
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
                const finByCurr = getCustomerFinancialsByCurrency(cust);
                const activeCurrencies = Object.entries(finByCurr);

                return (
                  <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{cust.full_name}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] text-cyan-600 font-semibold">{cust.customer_id}</span>
                        <span className="text-[10px] font-mono font-bold bg-cyan-100 text-cyan-900 px-1.5 py-0.2 rounded border border-cyan-300">
                          {getCustomerFileNumber(cust, customers.indexOf(cust))}
                        </span>
                      </div>
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
                      {activeCurrencies.length === 0 ? (
                        <span className="text-xs text-slate-400 italic">No Invoices Created</span>
                      ) : (
                        <div className="space-y-0.5">
                          {activeCurrencies.map(([code, f]) => (
                            <div key={code} className="text-xs font-bold text-amber-600">
                              {formatCurrency(f.balance, code)}
                            </div>
                          ))}
                        </div>
                      )}
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
      )}

      {/* OFFICIAL CUSTOMER ACCOUNT STATEMENT MODAL */}
      {statementCustomer && (() => {
        const finByCurr = getCustomerFinancialsByCurrency(statementCustomer);
        const custInvoices = invoices.filter(inv => inv.customer_id === statementCustomer.id || inv.customer_id === statementCustomer.customer_id);

        return (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-3xl w-full p-8 shadow-2xl border border-slate-200 my-8 max-h-[95vh] overflow-y-auto print:m-0 print:p-0 print:shadow-none print:border-none">
              {/* Header Action Bar */}
              <div className="flex items-center justify-between pb-6 border-b border-slate-200 print:hidden">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Official Account Statement</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-100 text-cyan-800">
                    Active Invoice Currencies
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

                {/* INVOICED BALANCES BREAKDOWN TABLE */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Consolidated Invoiced Balances by Currency
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="py-2.5 px-4">Currency</th>
                          <th className="py-2.5 px-4 text-right">Total Invoiced Amount</th>
                          <th className="py-2.5 px-4 text-right">Total Amount Paid</th>
                          <th className="py-2.5 px-4 text-right">Outstanding Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {Object.entries(finByCurr).map(([curr, vals]) => (
                          <tr key={curr} className="hover:bg-slate-50">
                            <td className="py-3 px-4 font-bold text-cyan-900 flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-100 text-cyan-800 font-black">{curr}</span>
                              <span>{curr === 'USD' ? 'U.S. Dollar ($)' : curr === 'EGP' ? 'Egyptian Pound (EGP)' : curr === 'EUR' ? 'Euro (€)' : curr}</span>
                            </td>
                            <td className="py-3 px-4 text-right">{formatCurrency(vals.total, curr)}</td>
                            <td className="py-3 px-4 text-right text-emerald-700">{formatCurrency(vals.paid, curr)}</td>
                            <td className="py-3 px-4 text-right font-bold text-amber-700">{formatCurrency(vals.balance, curr)}</td>
                          </tr>
                        ))}
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

      {/* Customer Comprehensive Overview Modal */}
      {selectedCustomer && (
        <CustomerOverviewModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          invoices={invoices}
          reservations={reservations}
          vouchers={vouchers}
          customerPayments={customerPayments}
          customerInquiries={customerInquiries}
          employees={employees}
          activityLogs={activityLogs}
          visas={visas}
          flights={flights}
          hotels={hotels}
          transfers={transfers}
          cruises={cruises}
          tours={tours}
          dayTrips={dayTrips}
          settings={settings}
          currentUsername={currentUsername}
          onUpdateCustomer={onUpdateCustomer}
          onOpenStatement={(cust) => {
            setStatementCustomer(cust);
            setSelectedCustomer(null);
          }}
          onLogCommunication={onLogCommunication}
        />
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
