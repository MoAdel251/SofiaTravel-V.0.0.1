import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Printer, 
  DollarSign, 
  CreditCard, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Trash2, 
  Eye, 
  X, 
  Plane, 
  Hotel as HotelIcon, 
  Compass, 
  Sparkles, 
  MessageCircle, 
  Download,
  Building,
  User,
  ArrowRight,
  ShieldCheck,
  Truck,
  Layers,
  ChevronDown
} from 'lucide-react';
import { 
  Invoice, 
  InvoiceItem, 
  Customer, 
  Supplier, 
  TourPackage, 
  Hotel, 
  Flight, 
  UserRole, 
  CompanySettings 
} from '../types';
import { SofiaLogo } from './SofiaLogo';
import { ManagerSignature } from './ManagerSignature';
import { formatCurrency, getCurrencySymbol, convertCurrency } from '../utils/currency';

interface InvoicesViewProps {
  invoices: Invoice[];
  customers: Customer[];
  suppliers: Supplier[];
  packages: TourPackage[];
  hotels: Hotel[];
  flights: Flight[];
  settings: CompanySettings;
  onAddInvoice: (invoiceData: Partial<Invoice>) => void;
  onUpdateInvoice: (id: string, invoiceData: Partial<Invoice>) => void;
  onDeleteInvoice: (id: string) => void;
  userRole?: UserRole;
  currentCurrency?: string;
}

export function InvoicesView({
  invoices,
  customers,
  suppliers = [],
  packages,
  hotels,
  flights,
  settings,
  onAddInvoice,
  onUpdateInvoice,
  onDeleteInvoice,
  userRole = 'Administrator',
  currentCurrency = 'USD'
}: InvoicesViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [recipientFilter, setRecipientFilter] = useState<'All' | 'Customer' | 'Supplier'>('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);

  // Form State for creating new invoice
  const [recipientType, setRecipientType] = useState<'Customer' | 'Supplier'>('Customer');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(suppliers[0]?.id || '');
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [invoiceCurrency, setInvoiceCurrency] = useState<string>('USD');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('Bank Transfer');
  const [notes, setNotes] = useState<string>('Thank you for choosing Sofia Travel! We appreciate your business.');
  const [terms, setTerms] = useState<string>(
    'Payment is due within 14 days of issuance. Please reference invoice number on your bank transfer.'
  );

  // Selected quick-add helpers
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [selectedHotelId, setSelectedHotelId] = useState<string>('');
  const [selectedFlightId, setSelectedFlightId] = useState<string>('');

  // Calculations for form
  const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);
  const taxAmount = (subtotal - discount) > 0 ? ((subtotal - discount) * (taxRate / 100)) : 0;
  const totalAmount = Math.max(0, subtotal - discount + taxAmount);
  const balanceDue = Math.max(0, totalAmount - paidAmount);

  // Quick Add Item from Tour Package
  const handleAddTourPackage = (pkgId: string) => {
    const pkg = packages.find(p => p.id === pkgId);
    if (!pkg) return;
    const newItem: InvoiceItem = {
      id: 'ITEM-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
      item_type: 'Tour Package',
      item_reference_id: pkg.id,
      title: `${pkg.package_name} (${pkg.duration})`,
      description: `Destination: ${pkg.destination} • Hotel: ${pkg.hotel} • Activities: ${pkg.activities}`,
      quantity: 1,
      unit_price: recipientType === 'Supplier' ? (pkg.cost || pkg.selling_price) : pkg.selling_price,
      total_price: recipientType === 'Supplier' ? (pkg.cost || pkg.selling_price) : pkg.selling_price
    };
    setItems(prev => [...prev, newItem]);
    setSelectedPackageId('');
  };

  // Quick Add Item from Hotel
  const handleAddHotel = (hotelId: string) => {
    const hot = hotels.find(h => h.id === hotelId);
    if (!hot) return;
    const newItem: InvoiceItem = {
      id: 'ITEM-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
      item_type: 'Hotel',
      item_reference_id: hot.id,
      title: `${hot.hotel_name} - ${hot.room_types.split(',')[0]}`,
      description: `Location: ${hot.city}, ${hot.country} • Check-in: ${hot.check_in_time} • Check-out: ${hot.check_out_time}`,
      quantity: 1,
      unit_price: recipientType === 'Supplier' ? (hot.contract_price || hot.selling_price) : hot.selling_price,
      total_price: recipientType === 'Supplier' ? (hot.contract_price || hot.selling_price) : hot.selling_price
    };
    setItems(prev => [...prev, newItem]);
    setSelectedHotelId('');
  };

  // Quick Add Item from Flight
  const handleAddFlight = (flightId: string) => {
    const fl = flights.find(f => f.id === flightId);
    if (!fl) return;
    const newItem: InvoiceItem = {
      id: 'ITEM-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
      item_type: 'Flight',
      item_reference_id: fl.id,
      title: `${fl.airline} Flight ${fl.flight_number} (${fl.departure_airport} → ${fl.arrival_airport})`,
      description: `Departure: ${fl.departure_date} ${fl.departure_time} • Arrival: ${fl.arrival_date} ${fl.arrival_time} • Ref: ${fl.booking_reference}`,
      quantity: 1,
      unit_price: recipientType === 'Supplier' ? (fl.ticket_cost || fl.selling_price) : fl.selling_price,
      total_price: recipientType === 'Supplier' ? (fl.ticket_cost || fl.selling_price) : fl.selling_price
    };
    setItems(prev => [...prev, newItem]);
    setSelectedFlightId('');
  };

  // Add Custom Item
  const handleAddCustomItem = () => {
    const newItem: InvoiceItem = {
      id: 'ITEM-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
      item_type: 'Custom',
      title: 'Custom Travel Service / Supplement',
      description: 'Private airport transfer / VIP lounge access / Visa fee',
      quantity: 1,
      unit_price: 100,
      total_price: 100
    };
    setItems(prev => [...prev, newItem]);
  };

  const handleUpdateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'quantity' || field === 'unit_price') {
      const q = field === 'quantity' ? Number(value) : updated[index].quantity;
      const p = field === 'unit_price' ? Number(value) : updated[index].unit_price;
      updated[index].total_price = q * p;
    }
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Handle Form Submit
  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('Please add at least one line item (Tour Package, Hotel, Flight, or Custom).');
      return;
    }

    const customer = customers.find(c => c.id === selectedCustomerId);
    const supplier = suppliers.find(s => s.id === selectedSupplierId);

    const payment_status = balanceDue <= 0 ? 'Paid' : paidAmount > 0 ? 'Partially Paid' : 'Unpaid';

    const invoiceData: Partial<Invoice> = {
      recipient_type: recipientType,
      customer_id: recipientType === 'Customer' ? customer?.id : undefined,
      customer_name: recipientType === 'Customer' ? customer?.full_name : undefined,
      customer_email: recipientType === 'Customer' ? customer?.email : undefined,
      customer_phone: recipientType === 'Customer' ? customer?.phone : undefined,
      customer_address: recipientType === 'Customer' ? customer?.address : undefined,
      customer_passport: recipientType === 'Customer' ? customer?.passport_number : undefined,
      supplier_id: recipientType === 'Supplier' ? supplier?.id : undefined,
      supplier_name: recipientType === 'Supplier' ? supplier?.supplier_name : undefined,
      supplier_email: recipientType === 'Supplier' ? supplier?.email : undefined,
      supplier_phone: recipientType === 'Supplier' ? supplier?.phone : undefined,
      supplier_type: recipientType === 'Supplier' ? supplier?.type : undefined,
      issue_date: issueDate,
      due_date: dueDate,
      currency: invoiceCurrency,
      items,
      subtotal,
      discount,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      balance_due: balanceDue,
      payment_status,
      payment_method: paymentMethod as any,
      notes,
      terms,
      manager_name: "Ahmed Ali",
      created_by_employee: userRole === 'Administrator' ? 'IT (Admin)' : 'Staff'
    };

    onAddInvoice(invoiceData);
    setShowCreateModal(false);

    // Reset Form
    setItems([]);
    setDiscount(0);
    setTaxRate(0);
    setPaidAmount(0);
  };

  // Record Payment
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalInvoice) return;
    const newPaid = (paymentModalInvoice.paid_amount || 0) + Number(paymentAmount);
    const newBalance = Math.max(0, paymentModalInvoice.total_amount - newPaid);
    const newStatus = newBalance <= 0 ? 'Paid' : newPaid > 0 ? 'Partially Paid' : 'Unpaid';

    onUpdateInvoice(paymentModalInvoice.id, {
      paid_amount: newPaid,
      balance_due: newBalance,
      payment_status: newStatus
    });

    setPaymentModalInvoice(null);
    setPaymentAmount(0);
  };

  // Filter Invoices
  const filteredInvoices = invoices.filter(inv => {
    const recipient = inv.recipient_type === 'Supplier' ? (inv.supplier_name || '') : (inv.customer_name || '');
    const matchesSearch = 
      ( inv.invoice_number || "" ).toLowerCase().includes(( searchTerm || "" ).toLowerCase()) ||
      ( recipient || "" ).toLowerCase().includes(( searchTerm || "" ).toLowerCase()) ||
      (inv.customer_passport && ( inv.customer_passport || "" ).toLowerCase().includes(( searchTerm || "" ).toLowerCase()));

    const matchesStatus = statusFilter === 'All' || inv.payment_status === statusFilter;
    const matchesRecipient = recipientFilter === 'All' || 
      (recipientFilter === 'Supplier' && inv.recipient_type === 'Supplier') ||
      (recipientFilter === 'Customer' && inv.recipient_type !== 'Supplier');

    return matchesSearch && matchesStatus && matchesRecipient;
  });

  // Calculate Triple Currency Totals for TOP SCREEN BANNER (Requirement 5)
  // Currencies: USD ($), EGP (EGP), EUR (€)
  const calculateCurrencyTotals = (targetCur: 'USD' | 'EGP' | 'EUR') => {
    let totalInv = 0;
    let totalPaid = 0;
    let totalPending = 0;

    invoices.forEach(inv => {
      const invCur = inv.currency || 'USD';
      totalInv += convertCurrency(inv.total_amount || 0, invCur, targetCur, settings.exchange_rates);
      totalPaid += convertCurrency(inv.paid_amount || 0, invCur, targetCur, settings.exchange_rates);
      totalPending += convertCurrency(inv.balance_due || 0, invCur, targetCur, settings.exchange_rates);
    });

    return { totalInv, totalPaid, totalPending };
  };

  const usdTotals = calculateCurrencyTotals('USD');
  const egpTotals = calculateCurrencyTotals('EGP');
  const eurTotals = calculateCurrencyTotals('EUR');

  // WhatsApp Share Generator
  const shareWhatsApp = (inv: Invoice) => {
    const isSup = inv.recipient_type === 'Supplier';
    const recipient = isSup ? inv.supplier_name : inv.customer_name;
    const phone = (isSup ? inv.supplier_phone : inv.customer_phone)?.replace(/[^0-9]/g, '') || '';
    
    const text = encodeURIComponent(
      `*SOFIA TRAVEL - OFFICIAL INVOICE*\n` +
      `-----------------------------------------\n` +
      `Invoice #: ${inv.invoice_number}\n` +
      `Date: ${inv.issue_date}\n` +
      `Recipient: ${recipient}\n` +
      `Total Amount: ${formatCurrency(inv.total_amount, inv.currency)}\n` +
      `Amount Paid: ${formatCurrency(inv.paid_amount, inv.currency)}\n` +
      `*Outstanding Balance: ${formatCurrency(inv.balance_due, inv.currency)}*\n` +
      `Status: ${inv.payment_status}\n` +
      `-----------------------------------------\n` +
      `*Bank Wire Details:*\n` +
      `Bank: ${settings.bank_name || 'National Bank of Egypt'}\n` +
      `Account: ${settings.bank_account_number || 'EG540003001500000010987654321'}\n` +
      `SWIFT/IBAN: ${settings.bank_iban_swift || 'NBEGEGCX054'}\n` +
      `Thank you for traveling with Sofia Travel!`
    );

    const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Invoices & Billing Hub</h1>
          <p className="text-sm text-slate-500">
            Issue and manage customer invoices, supplier settlements, itemized drop-downs, and bank transfers.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-cyan-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Invoice</span>
          </button>
        </div>
      </div>

      {/* TOP SCREEN BANNER: Total Invoices, Total Paid, Total Pending in All 3 Currencies (USD $, EGP, EUR €) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-cyan-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Financial Summary (All 3 Currencies: USD $, EGP, EUR €)
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">Real-time consolidated balance</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* U.S. Dollar Card */}
          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                U.S. Dollar ($)
              </span>
              <span className="text-[11px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md">USD</span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Total Invoices:</span>
                <span className="font-bold text-slate-900">{formatCurrency(usdTotals.totalInv, 'USD')}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Total Paid:</span>
                <span className="font-bold">{formatCurrency(usdTotals.totalPaid, 'USD')}</span>
              </div>
              <div className="flex justify-between text-amber-700 font-bold border-t border-blue-200/60 pt-1">
                <span>Total Pending:</span>
                <span className="text-amber-700">{formatCurrency(usdTotals.totalPending, 'USD')}</span>
              </div>
            </div>
          </div>

          {/* Egyptian Pound Card */}
          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                Egyptian Pound (EGP)
              </span>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">EGP</span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Total Invoices:</span>
                <span className="font-bold text-slate-900">{formatCurrency(egpTotals.totalInv, 'EGP')}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Total Paid:</span>
                <span className="font-bold">{formatCurrency(egpTotals.totalPaid, 'EGP')}</span>
              </div>
              <div className="flex justify-between text-amber-700 font-bold border-t border-emerald-200/60 pt-1">
                <span>Total Pending:</span>
                <span className="text-amber-700">{formatCurrency(egpTotals.totalPending, 'EGP')}</span>
              </div>
            </div>
          </div>

          {/* Euro Card */}
          <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-100 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                Euro (€)
              </span>
              <span className="text-[11px] font-bold text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-md">EUR</span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Total Invoices:</span>
                <span className="font-bold text-slate-900">{formatCurrency(eurTotals.totalInv, 'EUR')}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Total Paid:</span>
                <span className="font-bold">{formatCurrency(eurTotals.totalPaid, 'EUR')}</span>
              </div>
              <div className="flex justify-between text-amber-700 font-bold border-t border-purple-200/60 pt-1">
                <span>Total Pending:</span>
                <span className="text-amber-700">{formatCurrency(eurTotals.totalPending, 'EUR')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Recipient Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by invoice #, customer, supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-cyan-500 focus:bg-white"
            />
          </div>

          {/* Recipient Filter Tab */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setRecipientFilter('All')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                recipientFilter === 'All' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Invoices ({invoices.length})
            </button>
            <button
              onClick={() => setRecipientFilter('Customer')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                recipientFilter === 'Customer' ? 'bg-white text-cyan-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Customers</span>
            </button>
            <button
              onClick={() => setRecipientFilter('Supplier')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                recipientFilter === 'Supplier' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Suppliers</span>
            </button>
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-cyan-500"
          >
            <option value="All">All Payment Statuses</option>
            <option value="Paid">Paid Only</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Unpaid">Unpaid / Due</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Invoices Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Invoice Details</th>
                <th className="py-3.5 px-4 font-semibold">Recipient (Customer / Supplier)</th>
                <th className="py-3.5 px-4 font-semibold">Issue / Due Date</th>
                <th className="py-3.5 px-4 font-semibold">Total Amount</th>
                <th className="py-3.5 px-4 font-semibold">Paid Amount</th>
                <th className="py-3.5 px-4 font-semibold">Balance Due</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No invoices match your search.</p>
                    <p className="text-xs text-slate-400 mt-1">Create a new customer or supplier invoice to get started.</p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const isSupplier = inv.recipient_type === 'Supplier';
                  const recipientName = isSupplier ? inv.supplier_name : inv.customer_name;
                  const currency = inv.currency || 'USD';

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <FileText className={`w-4 h-4 ${isSupplier ? 'text-purple-600' : 'text-cyan-600'}`} />
                          <span>{inv.invoice_number}</span>
                        </div>
                        <span className="text-[11px] text-slate-400">{inv.items?.length || 0} line items</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            isSupplier ? 'bg-purple-100 text-purple-800' : 'bg-cyan-100 text-cyan-800'
                          }`}>
                            {isSupplier ? 'Supplier' : 'Customer'}
                          </span>
                          <span className="font-semibold text-slate-800">{recipientName}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {isSupplier ? inv.supplier_type : (inv.customer_phone || inv.customer_email || 'Direct Client')}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        <div>Issue: {inv.issue_date}</div>
                        <div className="text-slate-400 text-[11px]">Due: {inv.due_date}</div>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {formatCurrency(inv.total_amount, currency)}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-emerald-600">
                        {formatCurrency(inv.paid_amount, currency)}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-amber-600">
                        {formatCurrency(inv.balance_due, currency)}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 ${
                          inv.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                          inv.payment_status === 'Partially Paid' ? 'bg-cyan-100 text-cyan-800' :
                          inv.payment_status === 'Overdue' ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {inv.payment_status === 'Paid' && <CheckCircle2 className="w-3 h-3" />}
                          {inv.payment_status === 'Partially Paid' && <Clock className="w-3 h-3" />}
                          {inv.payment_status === 'Unpaid' && <AlertCircle className="w-3 h-3" />}
                          <span>{inv.payment_status}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => setViewInvoice(inv)}
                            className="p-1.5 hover:bg-cyan-50 text-cyan-700 rounded-lg transition-colors cursor-pointer"
                            title="View & Print Official Invoice"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => shareWhatsApp(inv)}
                            className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors cursor-pointer"
                            title="Send Invoice via WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                          {inv.balance_due > 0 && (
                            <button
                              onClick={() => {
                                setPaymentModalInvoice(inv);
                                setPaymentAmount(inv.balance_due);
                              }}
                              className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors cursor-pointer"
                              title="Record Payment"
                            >
                              <CreditCard className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete invoice ${inv.invoice_number}?`)) {
                                onDeleteInvoice(inv.id);
                              }
                            }}
                            className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="Delete Invoice"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE INVOICE MODAL with Quick Dropdowns for Tour Packages, Hotels, Flights */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Issue New Invoice / Bill</h3>
                  <p className="text-xs text-slate-500">Auto-fill line items from Tour Packages, Hotels, and Flight bookings.</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-6 mt-6">
              {/* Recipient Type Switcher: Customer vs Supplier */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">Invoice Recipient</label>
                  <div className="flex items-center bg-white p-1 rounded-lg border border-slate-200 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setRecipientType('Customer')}
                      className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                        recipientType === 'Customer' ? 'bg-cyan-600 text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Customer Invoice
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecipientType('Supplier')}
                      className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                        recipientType === 'Supplier' ? 'bg-purple-600 text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Supplier Bill / Invoice
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {recipientType === 'Customer' ? (
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Select Customer *</label>
                      <select
                        required
                        value={selectedCustomerId}
                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-cyan-500 font-medium"
                      >
                        {customers.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.full_name} ({c.customer_id}) • {c.customer_type} • Passport: {c.passport_number}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Select Supplier *</label>
                      <select
                        required
                        value={selectedSupplierId}
                        onChange={(e) => setSelectedSupplierId(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-cyan-500 font-medium"
                      >
                        {suppliers.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.supplier_name} • {s.type} • Contact: {s.contact_person}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Currency *</label>
                    <select
                      value={invoiceCurrency}
                      onChange={(e) => setInvoiceCurrency(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-cyan-500 font-bold text-cyan-700"
                    >
                      <option value="USD">U.S. Dollar ($)</option>
                      <option value="EGP">Egyptian Pound (EGP)</option>
                      <option value="EUR">Euro (€)</option>
                      <option value="GBP">British Pound (£)</option>
                      <option value="SAR">Saudi Riyal (SAR)</option>
                      <option value="AED">UAE Dirham (AED)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Date</label>
                    <input
                      type="date"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* QUICK AUTO-POPULATE ITEM DROPDOWNS (Requirement: trip, hotel, flight from dropdowns) */}
              <div className="bg-cyan-50/50 p-4 rounded-2xl border border-cyan-200/80 space-y-3">
                <div className="flex items-center gap-2 text-cyan-900 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-cyan-600" />
                  <span>One-Click Auto-Populate from System Inventory</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Tour Package Dropdown */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Add Tour Package</label>
                    <select
                      value={selectedPackageId}
                      onChange={(e) => {
                        if (e.target.value) handleAddTourPackage(e.target.value);
                      }}
                      className="w-full bg-white border border-cyan-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-500"
                    >
                      <option value="">-- Choose Package --</option>
                      {packages.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.package_name} ({formatCurrency(p.selling_price, 'USD')})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Hotel Dropdown */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Add Hotel Booking</label>
                    <select
                      value={selectedHotelId}
                      onChange={(e) => {
                        if (e.target.value) handleAddHotel(e.target.value);
                      }}
                      className="w-full bg-white border border-cyan-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-500"
                    >
                      <option value="">-- Choose Hotel --</option>
                      {hotels.map(h => (
                        <option key={h.id} value={h.id}>
                          {h.hotel_name} - {h.city} ({formatCurrency(h.selling_price, 'USD')})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Flight Dropdown */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Add Flight Ticket</label>
                    <select
                      value={selectedFlightId}
                      onChange={(e) => {
                        if (e.target.value) handleAddFlight(e.target.value);
                      }}
                      className="w-full bg-white border border-cyan-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-500"
                    >
                      <option value="">-- Choose Flight --</option>
                      {flights.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.airline} #{f.flight_number} ({f.departure_airport}→{f.arrival_airport})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Invoice Line Items Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">Invoice Line Items</h4>
                  <button
                    type="button"
                    onClick={handleAddCustomItem}
                    className="text-xs text-cyan-700 hover:text-cyan-800 font-bold flex items-center gap-1 cursor-pointer bg-cyan-50 px-3 py-1.5 rounded-lg border border-cyan-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Custom Service Item</span>
                  </button>
                </div>

                {items.length === 0 ? (
                  <div className="p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center text-xs text-slate-500">
                    No items added yet. Select a Tour Package, Hotel, or Flight from the dropdowns above.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="py-2.5 px-3">Service / Item Description</th>
                          <th className="py-2.5 px-3 w-20">Qty</th>
                          <th className="py-2.5 px-3 w-28">Unit Price ({getCurrencySymbol(invoiceCurrency)})</th>
                          <th className="py-2.5 px-3 w-28">Total ({getCurrencySymbol(invoiceCurrency)})</th>
                          <th className="py-2.5 px-3 w-10 text-right"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {items.map((item, idx) => (
                          <tr key={item.id} className="bg-white">
                            <td className="py-2.5 px-3">
                              <input
                                type="text"
                                value={item.title}
                                onChange={(e) => handleUpdateItem(idx, 'title', e.target.value)}
                                className="w-full font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-cyan-500 focus:outline-none"
                              />
                              <input
                                type="text"
                                value={item.description || ''}
                                onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                                placeholder="Service details, voucher code, dates..."
                                className="w-full text-[11px] text-slate-500 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-cyan-500 focus:outline-none mt-0.5"
                              />
                            </td>
                            <td className="py-2.5 px-3">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleUpdateItem(idx, 'quantity', Number(e.target.value))}
                                className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-center font-bold"
                              />
                            </td>
                            <td className="py-2.5 px-3">
                              <input
                                type="number"
                                min="0"
                                value={item.unit_price}
                                onChange={(e) => handleUpdateItem(idx, 'unit_price', Number(e.target.value))}
                                className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-bold"
                              />
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-900">
                              {formatCurrency(item.total_price, invoiceCurrency)}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Financial Totals & Payment Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                    >
                      <option value="Bank Transfer">Bank Transfer (Wire)</option>
                      <option value="Cash">Cash at Office</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="InstaPay">InstaPay (Egypt)</option>
                      <option value="Other">Other Gateway</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Notes / Special Instructions</label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-bold text-slate-900">{formatCurrency(subtotal, invoiceCurrency)}</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600">
                    <span>Discount:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400">-</span>
                      <input
                        type="number"
                        min="0"
                        value={discount}
                        onChange={(e) => setDiscount(Number(e.target.value))}
                        className="w-20 bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-right font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-slate-600">
                    <span>Tax Rate (%):</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={taxRate}
                      onChange={(e) => setTaxRate(Number(e.target.value))}
                      className="w-20 bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-right font-bold"
                    />
                  </div>

                  <div className="flex justify-between text-slate-900 font-bold border-t border-slate-200 pt-2 text-sm">
                    <span>Total Amount:</span>
                    <span>{formatCurrency(totalAmount, invoiceCurrency)}</span>
                  </div>

                  <div className="flex justify-between items-center text-emerald-700 font-semibold pt-1">
                    <span>Amount Paid Now:</span>
                    <input
                      type="number"
                      min="0"
                      max={totalAmount}
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(Number(e.target.value))}
                      className="w-24 bg-white border border-emerald-300 rounded-lg px-2 py-0.5 text-right font-bold text-emerald-800"
                    />
                  </div>

                  <div className="flex justify-between text-amber-700 font-bold border-t border-slate-200 pt-2 text-sm">
                    <span>Balance Due:</span>
                    <span>{formatCurrency(balanceDue, invoiceCurrency)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-600/20 cursor-pointer"
                >
                  Issue & Save Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {paymentModalInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Record Payment</h3>
              <button onClick={() => setPaymentModalInvoice(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl space-y-1 text-xs text-slate-700">
                <p><strong>Invoice #:</strong> {paymentModalInvoice.invoice_number}</p>
                <p><strong>Recipient:</strong> {paymentModalInvoice.recipient_type === 'Supplier' ? paymentModalInvoice.supplier_name : paymentModalInvoice.customer_name}</p>
                <p><strong>Total Amount:</strong> {formatCurrency(paymentModalInvoice.total_amount, paymentModalInvoice.currency)}</p>
                <p><strong>Already Paid:</strong> {formatCurrency(paymentModalInvoice.paid_amount, paymentModalInvoice.currency)}</p>
                <p className="text-amber-700 font-bold"><strong>Current Balance:</strong> {formatCurrency(paymentModalInvoice.balance_due, paymentModalInvoice.currency)}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Amount ({getCurrencySymbol(paymentModalInvoice.currency)})
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={paymentModalInvoice.balance_due}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalInvoice(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW & PRINT OFFICIAL INVOICE MODAL (With Logo, Manager Signature, and Bank Account Details) */}
      {viewInvoice && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-8 shadow-2xl border border-slate-200 my-8 max-h-[95vh] overflow-y-auto print:m-0 print:p-0 print:shadow-none print:border-none">
            {/* Action Bar */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-200 print:hidden">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Invoice Preview</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  viewInvoice.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {viewInvoice.payment_status}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => shareWhatsApp(viewInvoice)}
                  className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / PDF</span>
                </button>
                <button
                  onClick={() => setViewInvoice(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* PRINTABLE INVOICE CONTENT */}
            <div className="pt-6 space-y-6">
              {/* Header with Sofia Logo & Company Info */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b-2 border-slate-900">
                <div>
                  <SofiaLogo variant="horizontal" />
                  <p className="text-xs text-slate-500 mt-2 max-w-xs">{settings.address}</p>
                  <p className="text-xs text-slate-500">Tel: {settings.phone} • WhatsApp: {settings.whatsapp}</p>
                  <p className="text-xs text-slate-500">Email: {settings.email} • TRN: {settings.tax_number}</p>
                </div>

                <div className="text-left sm:text-right">
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                    {viewInvoice.recipient_type === 'Supplier' ? 'SUPPLIER BILL' : 'TAX INVOICE'}
                  </h2>
                  <p className="text-sm font-bold text-cyan-700 mt-1">#{viewInvoice.invoice_number}</p>
                  <div className="text-xs text-slate-600 mt-2 space-y-0.5">
                    <p><strong>Issue Date:</strong> {viewInvoice.issue_date}</p>
                    <p><strong>Due Date:</strong> {viewInvoice.due_date}</p>
                    <p><strong>Currency:</strong> {viewInvoice.currency}</p>
                  </div>
                </div>
              </div>

              {/* Billed To / Recipient Info */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    {viewInvoice.recipient_type === 'Supplier' ? 'Issued To Supplier:' : 'Billed To Client:'}
                  </p>
                  <p className="font-bold text-sm text-slate-900 mt-1">
                    {viewInvoice.recipient_type === 'Supplier' ? viewInvoice.supplier_name : viewInvoice.customer_name}
                  </p>
                  {viewInvoice.customer_passport && (
                    <p className="text-slate-600">Passport: {viewInvoice.customer_passport}</p>
                  )}
                  {viewInvoice.customer_phone && (
                    <p className="text-slate-600">Phone: {viewInvoice.customer_phone}</p>
                  )}
                  {viewInvoice.customer_address && (
                    <p className="text-slate-600">Address: {viewInvoice.customer_address}</p>
                  )}
                </div>

                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Payment Status:</p>
                  <p className="font-bold text-sm text-slate-900 mt-1">{viewInvoice.payment_status}</p>
                  <p className="text-slate-600">Method: {viewInvoice.payment_method || 'Bank Transfer'}</p>
                  <p className="text-slate-600">Created by: {viewInvoice.created_by_employee || 'IT (Admin)'}</p>
                </div>
              </div>

              {/* Itemized Services Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Service Description</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Amount ({getCurrencySymbol(viewInvoice.currency)})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {viewInvoice.items?.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-900">{item.title}</p>
                          {item.description && (
                            <p className="text-[11px] text-slate-500 mt-0.5">{item.description}</p>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-semibold">{item.quantity}</td>
                        <td className="py-3 px-3 text-right font-semibold">
                          {formatCurrency(item.unit_price, viewInvoice.currency)}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-900">
                          {formatCurrency(item.total_price, viewInvoice.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Calculation Summary */}
              <div className="flex justify-end">
                <div className="w-full sm:w-72 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-bold text-slate-900">{formatCurrency(viewInvoice.subtotal, viewInvoice.currency)}</span>
                  </div>
                  {viewInvoice.discount > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Discount:</span>
                      <span className="font-bold">-{formatCurrency(viewInvoice.discount, viewInvoice.currency)}</span>
                    </div>
                  )}
                  {viewInvoice.tax_amount > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Tax ({viewInvoice.tax_rate}%):</span>
                      <span className="font-bold">{formatCurrency(viewInvoice.tax_amount, viewInvoice.currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-900 font-bold border-t border-slate-200 pt-2 text-sm">
                    <span>Total Amount:</span>
                    <span>{formatCurrency(viewInvoice.total_amount, viewInvoice.currency)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Amount Paid:</span>
                    <span>{formatCurrency(viewInvoice.paid_amount, viewInvoice.currency)}</span>
                  </div>
                  <div className="flex justify-between text-amber-700 font-bold border-t border-slate-200 pt-1 text-sm">
                    <span>Balance Due:</span>
                    <span>{formatCurrency(viewInvoice.balance_due, viewInvoice.currency)}</span>
                  </div>
                </div>
              </div>

              {/* OFFICIAL BANK DETAILS & WIRE TRANSFER INSTRUCTIONS (Requirement 4) */}
              <div className="bg-cyan-50/70 border border-cyan-200 rounded-xl p-4 text-xs space-y-1.5 text-slate-800">
                <div className="flex items-center gap-2 text-cyan-900 font-bold">
                  <Building className="w-4 h-4 text-cyan-700" />
                  <span>Official Bank Wire Transfer Details (Consistent across all invoices)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                  <p><strong>Bank Name:</strong> {settings.bank_name || 'National Bank of Egypt (NBE) - Tahrir Branch'}</p>
                  <p><strong>Account Number:</strong> <span className="font-mono font-bold text-slate-900">{settings.bank_account_number || 'EG540003001500000010987654321'}</span></p>
                  <p><strong>Beneficiary Name:</strong> {settings.bank_beneficiary_name || settings.company_name}</p>
                  <p><strong>SWIFT / IBAN:</strong> <span className="font-mono">{settings.bank_iban_swift || 'SWIFT: NBEGEGCX054'}</span></p>
                </div>
              </div>

              {/* Manager Signature Stamp & Terms */}
              <div className="flex flex-col sm:flex-row items-end justify-between gap-6 pt-4 border-t border-slate-200">
                <div className="text-xs text-slate-500 max-w-sm space-y-1">
                  <p className="font-bold text-slate-700">Terms & Conditions:</p>
                  <p className="text-[11px] leading-relaxed">{viewInvoice.terms || 'Payment is due within 14 days of issuance.'}</p>
                </div>

                <div className="flex flex-col items-center">
                  <ManagerSignature managerName={viewInvoice.manager_name || 'Ahmed Ali'} />
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-1">Authorized Agency Signatory</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
