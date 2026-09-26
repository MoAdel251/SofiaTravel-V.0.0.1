import React, { useState, useEffect } from 'react';
import { downloadElementAsPDF } from '../utils/pdfGenerator';
import { printElement } from '../utils/printHelper';
import { 
  BookmarkCheck, 
  Search, 
  Plus, 
  Filter, 
  Printer, 
  FileText, 
  MessageCircle, 
  Trash2, 
  Edit, 
  X,
  CheckCircle,
  CheckCircle2,
  DollarSign,
  Compass,
  Sparkles,
  Receipt,
  ArrowDown,
  Building2,
  User,
  ShieldCheck,
  ExternalLink,
  Info,
  Clock,
  AlertTriangle,
  Send,
  Download
} from 'lucide-react';
import { 
  Reservation, 
  ServiceType, 
  ReservationStatus, 
  Customer, 
  Supplier, 
  Employee, 
  TourPackage,
  Invoice,
  CompanySettings
} from '../types';
import { formatCurrency } from '../utils/currency';
import { SofiaLogo } from './SofiaLogo';

interface ReservationsViewProps {
  reservations: Reservation[];
  customers: Customer[];
  suppliers: Supplier[];
  employees: Employee[];
  packages?: TourPackage[];
  invoices?: Invoice[];
  initialPackage?: TourPackage | null;
  onClearInitialPackage?: () => void;
  onAddReservation: (data: Partial<Reservation>) => void;
  onUpdateReservation: (id: string, data: Partial<Reservation>) => void;
  onDeleteReservation: (id: string) => void;
  onTransferToInvoice?: (reservation: Reservation, targetRecipientType?: 'Customer' | 'Supplier') => void;
  onAddInvoice?: (invoiceData: Partial<Invoice>) => Promise<any> | void;
  settings?: CompanySettings;
}

export function ReservationsView({
  reservations,
  customers,
  suppliers,
  employees,
  packages = [],
  invoices = [],
  initialPackage = null,
  onClearInitialPackage,
  onAddReservation,
  onUpdateReservation,
  onDeleteReservation,
  onTransferToInvoice,
  onAddInvoice,
  settings
}: ReservationsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [autoPopulatedFrom, setAutoPopulatedFrom] = useState<string>('');
  const [confirmationModalRes, setConfirmationModalRes] = useState<Reservation | null>(null);
  const [invoiceModalRes, setInvoiceModalRes] = useState<Reservation | null>(null);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [deleteConfirmRes, setDeleteConfirmRes] = useState<Reservation | null>(null);
  const [convertModalRes, setConvertModalRes] = useState<Reservation | null>(null);
  const [selectedInvoicePreview, setSelectedInvoicePreview] = useState<Invoice | null>(null);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);

  // Helper filter for deleted items (Ensures deleted entities never appear in dropdown options)
  const isNotDeleted = (item: any) => {
    if (!item || !item.id) return false;
    if (item.is_deleted || item.deleted) return false;
    if (item.status === 'Deleted' || item.reservation_status === 'Deleted' || item.payment_status === 'Deleted') return false;
    return true;
  };

  const validCustomers = customers.filter(isNotDeleted);
  const validSuppliers = suppliers.filter(isNotDeleted);
  const validEmployees = employees.filter(e => isNotDeleted(e) && (e as any).status !== 'Terminated' && e.status !== 'Inactive');
  const validPackages = packages.filter(isNotDeleted);

  const [formData, setFormData] = useState<Partial<Reservation>>({
    customer_id: validCustomers[0]?.id || '',
    service_type: 'Travel Package',
    travel_date: '2026-09-15',
    return_date: '2026-09-22',
    number_of_travelers: 2,
    destination: 'Luxor & Aswan',
    supplier_id: validSuppliers[0]?.id || '',
    employee_id: validEmployees[0]?.id || '',
    selling_price: 1500,
    cost_price: 1000,
    paid_amount: 500,
    currency: '$',
    reservation_status: 'Confirmed',
    notes: ''
  });

  // Auto-populate when initialPackage is passed (e.g. from TourPackages page click)
  useEffect(() => {
    if (initialPackage) {
      applyTourPackage(initialPackage);
      setShowAddModal(true);
      if (onClearInitialPackage) onClearInitialPackage();
    }
  }, [initialPackage]);

  const applyTourPackage = (pkg: TourPackage) => {
    setSelectedPackageId(pkg.id);
    setAutoPopulatedFrom(pkg.package_name);

    // Look for matching supplier if available
    const matchedSupplier = suppliers.find(s => 
      ( s.supplier_name || "" ).toLowerCase().includes('nile') || 
      ( s.supplier_name || "" ).toLowerCase().includes('safari') ||
      ( s.supplier_name || "" ).toLowerCase().includes('pyramid')
    ) || suppliers[0];

    let pkgCurrency = pkg.currency || '$';
    if (pkgCurrency === 'USD') pkgCurrency = '$';
    else if (pkgCurrency.toUpperCase() === 'EGP') pkgCurrency = 'EGP';
    else if (pkgCurrency.toUpperCase() === 'EUR') pkgCurrency = 'EUR';

    setFormData(prev => ({
      ...prev,
      service_type: 'Travel Package',
      destination: `${pkg.package_name} (${pkg.destination})`,
      travel_date: pkg.start_date || prev.travel_date,
      return_date: pkg.end_date || prev.return_date,
      cost_price: pkg.cost,
      selling_price: pkg.selling_price,
      currency: pkgCurrency,
      supplier_id: matchedSupplier?.id || prev.supplier_id,
      notes: `Tour Package: ${pkg.package_name}\nDuration: ${pkg.duration}\nHotel: ${pkg.hotel}\nActivities: ${pkg.activities}\nIncluded: ${pkg.included_services?.join(', ')}`
    }));
  };

  const handlePackageDropdownChange = (pkgId: string) => {
    setSelectedPackageId(pkgId);
    if (!pkgId) {
      setAutoPopulatedFrom('');
      return;
    }
    const pkg = packages.find(p => p.id === pkgId);
    if (pkg) {
      applyTourPackage(pkg);
    }
  };

  const filteredReservations = reservations
    .filter(r => {
      const matchesSearch = ( r.reservation_id || "" ).toLowerCase().includes(( searchTerm || "" ).toLowerCase()) ||
                            ( r.destination || "" ).toLowerCase().includes(( searchTerm || "" ).toLowerCase()) ||
                            (r.customer_name && ( r.customer_name || "" ).toLowerCase().includes(( searchTerm || "" ).toLowerCase()));
      const matchesStatus = statusFilter === 'All' || r.reservation_status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // Sort descending: newest booking date first, then highest reservation ID
      const dateA = a.booking_date || '';
      const dateB = b.booking_date || '';
      if (dateA !== dateB) {
        return dateB.localeCompare(dateA);
      }
      return (b.reservation_id || b.id || '').localeCompare(a.reservation_id || a.id || '', undefined, { numeric: true, sensitivity: 'base' });
    });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find(c => c.id === formData.customer_id);
    const sup = suppliers.find(s => s.id === formData.supplier_id);
    const emp = employees.find(e => e.id === formData.employee_id);

    let currencyCode = formData.currency || '$';
    if (currencyCode === 'USD') currencyCode = '$';
    else if (currencyCode.toUpperCase() === 'EGP') currencyCode = 'EGP';
    else if (currencyCode.toUpperCase() === 'EUR') currencyCode = 'EUR';

    onAddReservation({
      ...formData,
      currency: currencyCode,
      customer_name: cust?.full_name,
      supplier_name: sup?.supplier_name,
      employee_name: emp?.name
    });
    setShowAddModal(false);
    setAutoPopulatedFrom('');
    setSelectedPackageId('');
  };

  // Helper to find generated customer & supplier invoices for a reservation
  const getReservationInvoices = (res: Reservation) => {
    // 1. Customer invoice matching
    const customerInvoice = invoices.find(inv => 
      (inv.reservation_id === res.id || inv.reservation_id === res.reservation_id || res.customer_invoice_id === inv.id || res.customer_invoice_number === inv.invoice_number) &&
      (inv.recipient_type === 'Customer' || (!inv.recipient_type && !inv.supplier_id))
    );

    // 2. Supplier invoice matching (Company Payment Liability)
    const supplierInvoice = invoices.find(inv => 
      (inv.reservation_id === res.id || inv.reservation_id === res.reservation_id || res.supplier_invoice_id === inv.id || res.supplier_invoice_number === inv.invoice_number) &&
      (inv.recipient_type === 'Supplier' || (inv.supplier_id && !inv.customer_id))
    );

    const hasCustomerInvoice = Boolean(customerInvoice || res.customer_invoice_id || res.customer_invoice_number);
    const hasSupplierInvoice = Boolean(supplierInvoice || res.supplier_invoice_id || res.supplier_invoice_number);
    const hasBothInvoices = hasCustomerInvoice && hasSupplierInvoice;

    return {
      customerInvoice,
      supplierInvoice,
      hasCustomerInvoice,
      hasSupplierInvoice,
      hasBothInvoices
    };
  };

  // Instant 1-Click Invoice Generation from Reservation
  const handleInstantGenerateInvoice = async (targetRes: Reservation, recipientType: 'Customer' | 'Supplier') => {
    if (!onAddInvoice) return;
    setIsGeneratingInvoice(true);
    try {
      const isSupp = recipientType === 'Supplier';
      const cust = customers.find(c => c.id === targetRes.customer_id);
      const supp = suppliers.find(s => s.id === targetRes.supplier_id);
      
      const qty = Number(targetRes.number_of_travelers) || 1;
      const totalAmt = isSupp ? (Number(targetRes.cost_price) || 0) : (Number(targetRes.selling_price) || 0);
      const unitAmt = qty > 0 ? totalAmt / qty : totalAmt;

      let resCurrency = targetRes.currency || '$';
      if (resCurrency === 'USD') resCurrency = '$';
      else if (resCurrency.toUpperCase() === 'EGP') resCurrency = 'EGP';
      else if (resCurrency.toUpperCase() === 'EUR') resCurrency = 'EUR';

      const lineItem = {
        id: 'ITEM-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
        item_type: 'Custom' as const,
        item_reference_id: targetRes.reservation_id || targetRes.id,
        title: isSupp 
          ? `${targetRes.service_type} - ${targetRes.destination} (Supplier Cost / Payable Liability)`
          : `${targetRes.service_type} - ${targetRes.destination}`,
        description: isSupp
          ? `Reservation #${targetRes.reservation_id} • Payable to: ${targetRes.supplier_name || 'Supplier'} • Company Payment Liability • Travelers: ${qty} • Travel: ${targetRes.travel_date} to ${targetRes.return_date}`
          : `Reservation #${targetRes.reservation_id} • Customer: ${targetRes.customer_name || 'Client'} • Travelers: ${qty} • Travel Date: ${targetRes.travel_date} to ${targetRes.return_date}`,
        quantity: qty,
        unit_price: Math.round(unitAmt * 100) / 100,
        total_price: totalAmt
      };

      const invoiceData: Partial<Invoice> = {
        recipient_type: recipientType,
        reservation_id: targetRes.id || targetRes.reservation_id,
        customer_id: !isSupp ? (cust?.id || targetRes.customer_id) : undefined,
        customer_name: !isSupp ? (cust?.full_name || targetRes.customer_name) : undefined,
        customer_email: !isSupp ? cust?.email : undefined,
        customer_phone: !isSupp ? cust?.phone : undefined,
        customer_address: !isSupp ? cust?.address : undefined,
        customer_passport: !isSupp ? cust?.passport_number : undefined,
        supplier_id: isSupp ? (supp?.id || targetRes.supplier_id) : undefined,
        supplier_name: isSupp ? (supp?.supplier_name || targetRes.supplier_name) : undefined,
        supplier_email: isSupp ? supp?.email : undefined,
        supplier_phone: isSupp ? supp?.phone : undefined,
        supplier_type: isSupp ? supp?.type : undefined,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        currency: resCurrency,
        items: [lineItem],
        subtotal: totalAmt,
        discount: 0,
        tax_rate: 0,
        tax_amount: 0,
        total_amount: totalAmt,
        paid_amount: !isSupp ? (Number(targetRes.paid_amount) || 0) : 0,
        balance_due: !isSupp ? Math.max(0, totalAmt - (Number(targetRes.paid_amount) || 0)) : totalAmt,
        payment_status: !isSupp && (Number(targetRes.paid_amount) || 0) >= totalAmt ? 'Paid' : (!isSupp && (Number(targetRes.paid_amount) || 0) > 0 ? 'Partially Paid' : 'Unpaid'),
        payment_method: 'Bank Transfer',
        notes: isSupp 
          ? `Supplier invoice payable to ${targetRes.supplier_name || 'supplier'}. Counted as part of company liabilities and payment obligations for Reservation #${targetRes.reservation_id}.`
          : `Customer invoice for Reservation #${targetRes.reservation_id} (${targetRes.destination}).`,
        terms: isSupp
          ? `Company payment obligation payable to supplier within agreed contractual settlement terms.`
          : `Standard booking payment terms apply.`,
        manager_name: "Ahmed Ali",
        created_by_employee: 'Staff'
      };

      await onAddInvoice(invoiceData);
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  const handleGenerateBothInvoices = async (targetRes: Reservation) => {
    setIsGeneratingInvoice(true);
    try {
      await handleInstantGenerateInvoice(targetRes, 'Customer');
      await handleInstantGenerateInvoice(targetRes, 'Supplier');
      setConvertModalRes(null);
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  return (
    <div className="p-8 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reservations Management</h1>
          <p className="text-sm text-slate-500">Track flights, hotels, tours, packages, financial margins, and statuses.</p>
        </div>
        <div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Reservation</span>
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID, destination, customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <span className="text-xs font-medium px-2.5 py-1.5 bg-slate-100 text-slate-600 rounded-xl flex items-center gap-1 border border-slate-200">
            <ArrowDown className="w-3.5 h-3.5 text-cyan-600" />
            <span>Sorted: <strong className="text-slate-800 font-bold">Descending</strong></span>
          </span>
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-cyan-500"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Paid">Paid</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Reservations Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold">ID</th>
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-4 font-semibold">Service</th>
                <th className="py-3 px-4 font-semibold">Destination</th>
                <th className="py-3 px-4 font-semibold">Travel Date</th>
                <th className="py-3 px-4 font-semibold">Selling / Profit</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold min-w-[220px]">Generated Invoices</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReservations.map(res => {
                const { 
                  customerInvoice, 
                  supplierInvoice, 
                  hasCustomerInvoice, 
                  hasSupplierInvoice, 
                  hasBothInvoices 
                } = getReservationInvoices(res);

                return (
                  <tr key={res.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{res.reservation_id}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{res.customer_name || 'Customer'}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {res.service_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{res.destination}</td>
                    <td className="py-3.5 px-4 text-slate-600">{res.travel_date}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{formatCurrency(res.selling_price, res.currency || '$')}</div>
                      <div className="text-[10px] text-emerald-600 font-medium">Profit: {formatCurrency(res.profit, res.currency || '$')}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        res.reservation_status === 'Confirmed' ? 'bg-emerald-100 text-emerald-800' :
                        res.reservation_status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                        res.reservation_status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {res.reservation_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 min-w-[220px]">
                      <div className="flex flex-col gap-1.5">
                        {/* Customer Invoice Indicator */}
                        {hasCustomerInvoice ? (
                          <div 
                            onClick={() => customerInvoice && setSelectedInvoicePreview(customerInvoice)}
                            className={`group flex items-center justify-between gap-1.5 px-2.5 py-1 bg-emerald-50/90 border border-emerald-300 rounded-lg transition-all shadow-2xs ${
                              customerInvoice ? 'cursor-pointer hover:bg-emerald-100 hover:border-emerald-400' : ''
                            }`}
                            title={
                              customerInvoice 
                                ? `Customer Invoice #${customerInvoice.invoice_number} • Amount: ${formatCurrency(customerInvoice.total_amount, customerInvoice.currency)} • Status: ${customerInvoice.payment_status} (Click to inspect official invoice)`
                                : `Customer Invoice #${res.customer_invoice_number || 'Generated'}`
                            }
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <User className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                              <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-tight">Cust Inv:</span>
                                  <span className="text-xs font-mono font-extrabold text-emerald-950 truncate">
                                    {customerInvoice?.invoice_number || res.customer_invoice_number || 'Generated'}
                                  </span>
                                </div>
                                {customerInvoice && (
                                  <span className="text-[10px] text-emerald-700 font-medium">
                                    {formatCurrency(customerInvoice.total_amount, customerInvoice.currency)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0 ${
                              customerInvoice?.payment_status === 'Paid' ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-100 text-amber-900 border border-amber-300'
                            }`}>
                              {customerInvoice?.payment_status || 'Issued'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between px-2 py-1 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-slate-400 text-[10px]">
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-400" />
                              <span className="font-medium">Cust Invoice:</span>
                            </div>
                            <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">Pending</span>
                          </div>
                        )}

                        {/* Supplier Invoice Indicator (Payable Liability) */}
                        {hasSupplierInvoice ? (
                          <div 
                            onClick={() => supplierInvoice && setSelectedInvoicePreview(supplierInvoice)}
                            className={`group flex items-center justify-between gap-1.5 px-2.5 py-1 bg-amber-50/90 border border-amber-300 rounded-lg transition-all shadow-2xs ${
                              supplierInvoice ? 'cursor-pointer hover:bg-amber-100 hover:border-amber-400' : ''
                            }`}
                            title={
                              supplierInvoice 
                                ? `Supplier Invoice #${supplierInvoice.invoice_number} • Payable to ${supplierInvoice.supplier_name || res.supplier_name || 'Supplier'} • Company Payment Liability • Cost: ${formatCurrency(supplierInvoice.total_amount, supplierInvoice.currency)} • Status: ${supplierInvoice.payment_status} (Click to inspect)`
                                : `Supplier Liability Invoice #${res.supplier_invoice_number || 'Generated'} (Company Payment Liability)`
                            }
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Building2 className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                              <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] font-bold text-amber-900 uppercase tracking-tight">Supp Inv:</span>
                                  <span className="text-xs font-mono font-extrabold text-amber-950 truncate">
                                    {supplierInvoice?.invoice_number || res.supplier_invoice_number || 'Generated'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-[10px] text-amber-800 font-semibold">
                                  {supplierInvoice && (
                                    <span>{formatCurrency(supplierInvoice.total_amount, supplierInvoice.currency)}</span>
                                  )}
                                  <span className="text-[9px] bg-amber-200/90 text-amber-950 px-1 rounded font-bold">Liability</span>
                                </div>
                              </div>
                            </div>
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0 ${
                              supplierInvoice?.payment_status === 'Paid' ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-100 text-rose-900 border border-rose-300'
                            }`}>
                              {supplierInvoice?.payment_status || 'Liability'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between px-2 py-1 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-slate-400 text-[10px]">
                            <div className="flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-slate-400" />
                              <span className="font-medium">Supp Liability:</span>
                            </div>
                            <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">Pending</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* Convert Reservation to Invoice Button / Fully Invoiced Indicator */}
                        {hasBothInvoices ? (
                          <div
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold whitespace-nowrap shadow-2xs select-none"
                            title="Both Customer and Supplier invoices have been generated for this reservation. The 'Convert Reservation to Invoice' button is hidden to prevent duplicate invoicing."
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Fully Invoiced</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConvertModalRes(res)}
                            className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer whitespace-nowrap ${
                              hasCustomerInvoice
                                ? 'bg-linear-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white'
                                : hasSupplierInvoice
                                  ? 'bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white'
                                  : 'bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white'
                            }`}
                            title={
                              hasCustomerInvoice
                                ? `Customer invoice already generated (#${customerInvoice?.invoice_number || res.customer_invoice_number}). Click to generate Supplier Invoice (Company Payment Liability)`
                                : hasSupplierInvoice
                                  ? `Supplier liability invoice already generated (#${supplierInvoice?.invoice_number || res.supplier_invoice_number}). Click to generate Customer Invoice`
                                  : "Convert Reservation to Invoice (Customer & Supplier)"
                            }
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>
                              {hasCustomerInvoice 
                                ? '+ Supp Invoice (Liability)' 
                                : hasSupplierInvoice 
                                  ? '+ Customer Invoice' 
                                  : 'To Invoice'}
                            </span>
                          </button>
                        )}
                        <button
                          onClick={() => setEditingReservation({ ...res })}
                          className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                          title="Edit Reservation"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmationModalRes(res)}
                          className="p-1.5 hover:bg-cyan-50 text-cyan-600 rounded-lg transition-colors cursor-pointer"
                          title="Booking Confirmation"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setInvoiceModalRes(res)}
                          className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors cursor-pointer"
                          title="Invoice"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <a
                          href={`https://wa.me/?text=Booking%20Confirmation%20%23${res.reservation_id}%0ADestination:%20${encodeURIComponent(res.destination)}%0ATravel%20Date:%20${res.travel_date}%0ATotal:%20${encodeURIComponent(formatCurrency(res.selling_price, res.currency || '$'))}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors cursor-pointer"
                          title="Send WhatsApp Confirmation"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => setDeleteConfirmRes(res)}
                          className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title="Delete Reservation"
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

      {/* Add Reservation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Create New Reservation</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              {/* Tour Package Auto-population Dropdown */}
              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5 uppercase tracking-wider">
                    <Compass className="w-4 h-4 text-amber-600" />
                    <span>Auto-Populate from Available Tour Packages</span>
                  </label>
                  {autoPopulatedFrom && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <Sparkles className="w-3 h-3" />
                      <span>Loaded: {autoPopulatedFrom}</span>
                    </span>
                  )}
                </div>

                <select
                  value={selectedPackageId}
                  onChange={(e) => handlePackageDropdownChange(e.target.value)}
                  className="w-full bg-white border border-amber-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer shadow-2xs"
                >
                  <option value="">-- Choose a tour package to automatically fill details --</option>
                  {validPackages.map(pkg => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.package_name} ({pkg.destination} • {pkg.duration} • ${pkg.selling_price})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Customer</label>
                  <select
                    value={formData.customer_id}
                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  >
                    {validCustomers.map(c => (
                      <option key={c.id} value={c.id}>{c.full_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Service Type</label>
                  <select
                    value={formData.service_type}
                    onChange={(e) => setFormData({ ...formData, service_type: e.target.value as ServiceType })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Flight">Flight</option>
                    <option value="Hotel">Hotel</option>
                    <option value="Tour">Tour</option>
                    <option value="Transfer">Transfer</option>
                    <option value="Visa">Visa</option>
                    <option value="Cruise">Cruise</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Travel Package">Travel Package</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Destination</label>
                  <input
                    type="text"
                    required
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Number of Travelers</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.number_of_travelers}
                    onChange={(e) => setFormData({ ...formData, number_of_travelers: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Travel Date</label>
                  <input
                    type="date"
                    value={formData.travel_date}
                    onChange={(e) => setFormData({ ...formData, travel_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Return Date</label>
                  <input
                    type="date"
                    value={formData.return_date}
                    onChange={(e) => setFormData({ ...formData, return_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier</label>
                  <select
                    value={formData.supplier_id}
                    onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  >
                    {validSuppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.supplier_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Employee</label>
                  <select
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  >
                    {validEmployees.map(e => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Selling Price ({formData.currency || '$'}) *
                  </label>
                  <input
                    type="number"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cost Price ({formData.currency || '$'}) *
                  </label>
                  <input
                    type="number"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Paid Amount ({formData.currency || '$'})
                  </label>
                  <input
                    type="number"
                    value={formData.paid_amount}
                    onChange={(e) => setFormData({ ...formData, paid_amount: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Transaction Currency Code *
                  </label>
                  <select
                    value={formData.currency || '$'}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="EGP">EGP (Egyptian Pound)</option>
                    <option value="$">$ (U.S. Dollar)</option>
                    <option value="EUR">EUR (Euro)</option>
                  </select>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, currency: 'EGP' })}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                        formData.currency === 'EGP'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      EGP
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, currency: '$' })}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                        formData.currency === '$' || formData.currency === 'USD'
                          ? 'bg-cyan-100 text-cyan-800 border-cyan-300'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      $
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, currency: 'EUR' })}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                        formData.currency === 'EUR'
                          ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      EUR
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.reservation_status}
                    onChange={(e) => setFormData({ ...formData, reservation_status: e.target.value as ReservationStatus })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Paid">Paid</option>
                    <option value="Partially Paid">Partially Paid</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                  Save Reservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Booking Confirmation Modal */}
      {confirmationModalRes && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-8 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <SofiaLogo size="sm" />
                <div>
                  <h2 className="text-xl font-black text-slate-900">Sofia Travel</h2>
                  <p className="text-xs text-slate-500">Official Booking Confirmation Voucher</p>
                </div>
              </div>
              <button onClick={() => setConfirmationModalRes(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div id="reservation-a4-preview-card" className="printable-a4 avoid-page-break space-y-4 text-xs text-slate-700 p-2">
              <div className="flex justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <p className="font-semibold text-slate-900">Reservation ID:</p>
                  <p className="text-cyan-600 font-bold text-sm">{confirmationModalRes.reservation_id}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Booking Date:</p>
                  <p>{confirmationModalRes.booking_date}</p>
                </div>
              </div>

              <div>
                <p className="font-bold text-slate-900 mb-1">Customer Information:</p>
                <p>Name: {confirmationModalRes.customer_name}</p>
                <p>Travelers: {confirmationModalRes.number_of_travelers}</p>
              </div>

              <div>
                <p className="font-bold text-slate-900 mb-1">Trip Itinerary:</p>
                <p>Service: {confirmationModalRes.service_type}</p>
                <p>Destination: {confirmationModalRes.destination}</p>
                <p>Travel Date: {confirmationModalRes.travel_date} → Return: {confirmationModalRes.return_date}</p>
              </div>

              <div className="bg-cyan-50 p-4 rounded-xl border border-cyan-100 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-cyan-900">Total Price: {formatCurrency(confirmationModalRes.selling_price, confirmationModalRes.currency || '$')}</p>
                  <p className="text-[11px] text-cyan-700">Paid: {formatCurrency(confirmationModalRes.paid_amount, confirmationModalRes.currency || '$')} • Remaining: {formatCurrency(confirmationModalRes.remaining_amount, confirmationModalRes.currency || '$')}</p>
                </div>
                <span className="px-3 py-1 bg-cyan-600 text-white font-bold rounded-lg text-xs">{confirmationModalRes.reservation_status}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-4 border-t border-slate-200">
              <button
                onClick={() => {
                  const phone = (confirmationModalRes.customer_phone || '').replace(/[^0-9]/g, '');
                  const text = encodeURIComponent(`✈️ *SOFIA TRAVEL - BOOKING CONFIRMATION*\nReservation #: ${confirmationModalRes.reservation_id}\nCustomer: ${confirmationModalRes.customer_name}\nDestination: ${confirmationModalRes.destination}\nTravel Date: ${confirmationModalRes.travel_date}\nStatus: ${confirmationModalRes.reservation_status}\n\nThank you for choosing Sofia Travel!`);
                  window.open(phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`, '_blank');
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Send via WhatsApp</span>
              </button>
              <button
                onClick={() => downloadElementAsPDF({
                  elementId: 'reservation-a4-preview-card',
                  filename: `Sofia_Travel_Confirmation_${confirmationModalRes.reservation_id}.pdf`
                })}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>
              <button
                onClick={() => printElement('reservation-a4-preview-card', `Sofia_Travel_Confirmation_${confirmationModalRes.reservation_id}`)}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-medium flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print A4 Voucher</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {invoiceModalRes && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-8 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <SofiaLogo size="sm" />
                <div>
                  <h2 className="text-xl font-black text-slate-900">Sofia Travel</h2>
                  <p className="text-xs text-slate-500">Tax Invoice #INV-2026-{invoiceModalRes.reservation_id}</p>
                </div>
              </div>
              <button onClick={() => setInvoiceModalRes(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700">
              <div className="flex justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <p className="font-semibold text-slate-900">Billed To:</p>
                  <p className="text-sm font-bold">{invoiceModalRes.customer_name}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Date:</p>
                  <p>{invoiceModalRes.booking_date}</p>
                </div>
              </div>

              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2">Description</th>
                    <th className="py-2 text-right">Qty</th>
                    <th className="py-2 text-right">Price</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="py-2 font-medium">{invoiceModalRes.service_type} - {invoiceModalRes.destination}</td>
                    <td className="py-2 text-right">{invoiceModalRes.number_of_travelers}</td>
                    <td className="py-2 text-right font-bold">{formatCurrency(invoiceModalRes.selling_price, invoiceModalRes.currency || '$')}</td>
                  </tr>
                </tbody>
              </table>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>Total Due:</span>
                  <span>{formatCurrency(invoiceModalRes.selling_price, invoiceModalRes.currency || '$')}</span>
                </div>
                <div className="flex justify-between text-emerald-600">
                  <span>Paid Amount:</span>
                  <span>{formatCurrency(invoiceModalRes.paid_amount, invoiceModalRes.currency || '$')}</span>
                </div>
                <div className="flex justify-between text-amber-600 font-bold">
                  <span>Remaining Balance:</span>
                  <span>{formatCurrency(invoiceModalRes.remaining_amount, invoiceModalRes.currency || '$')}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-medium flex items-center space-x-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Reservation Modal */}
      {editingReservation && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">Edit Reservation</h3>
                <p className="text-xs text-slate-500">Ref: #{editingReservation.reservation_id || editingReservation.id.slice(0, 6)}</p>
              </div>
              <button onClick={() => setEditingReservation(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onUpdateReservation(editingReservation.id, editingReservation);
                setEditingReservation(null);
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Customer</label>
                  <select
                    value={editingReservation.customer_id || ''}
                    onChange={(e) => {
                      const cust = validCustomers.find(c => c.id === e.target.value);
                      setEditingReservation({
                        ...editingReservation,
                        customer_id: e.target.value,
                        customer_name: cust?.full_name || editingReservation.customer_name
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  >
                    {validCustomers.map(c => (
                      <option key={c.id} value={c.id}>{c.full_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Employee</label>
                  <select
                    value={editingReservation.employee_id || ''}
                    onChange={(e) => {
                      const emp = validEmployees.find(em => em.id === e.target.value);
                      setEditingReservation({
                        ...editingReservation,
                        employee_id: e.target.value,
                        employee_name: emp?.name || editingReservation.employee_name
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">-- Keep Current / Unassigned --</option>
                    {validEmployees.map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({e.position || 'Staff'})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier</label>
                  <select
                    value={editingReservation.supplier_id || ''}
                    onChange={(e) => {
                      const supp = validSuppliers.find(s => s.id === e.target.value);
                      setEditingReservation({
                        ...editingReservation,
                        supplier_id: e.target.value,
                        supplier_name: supp?.supplier_name || editingReservation.supplier_name
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">-- Select Supplier --</option>
                    {validSuppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.supplier_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Service Type</label>
                  <select
                    value={editingReservation.service_type || 'Travel Package'}
                    onChange={(e) => setEditingReservation({ ...editingReservation, service_type: e.target.value as ServiceType })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Flight">Flight</option>
                    <option value="Hotel">Hotel</option>
                    <option value="Tour">Tour</option>
                    <option value="Transfer">Transfer</option>
                    <option value="Visa">Visa</option>
                    <option value="Cruise">Cruise</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Travel Package">Travel Package</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Destination *</label>
                  <input
                    type="text"
                    required
                    value={editingReservation.destination || ''}
                    onChange={(e) => setEditingReservation({ ...editingReservation, destination: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Travelers Count *</label>
                  <input
                    type="number"
                    min={1}
                    value={editingReservation.number_of_travelers || 1}
                    onChange={(e) => setEditingReservation({ ...editingReservation, number_of_travelers: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Travel Date</label>
                  <input
                    type="date"
                    value={editingReservation.travel_date || ''}
                    onChange={(e) => setEditingReservation({ ...editingReservation, travel_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Return Date</label>
                  <input
                    type="date"
                    value={editingReservation.return_date || ''}
                    onChange={(e) => setEditingReservation({ ...editingReservation, return_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Currency Code *
                  </label>
                  <select
                    value={editingReservation.currency || '$'}
                    onChange={(e) => setEditingReservation({ ...editingReservation, currency: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="EGP">EGP (Egyptian Pound)</option>
                    <option value="$">$ (U.S. Dollar)</option>
                    <option value="EUR">EUR (Euro)</option>
                  </select>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setEditingReservation({ ...editingReservation, currency: 'EGP' })}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                        editingReservation.currency === 'EGP'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      EGP
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingReservation({ ...editingReservation, currency: '$' })}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                        editingReservation.currency === '$' || editingReservation.currency === 'USD'
                          ? 'bg-cyan-100 text-cyan-800 border-cyan-300'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      $
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingReservation({ ...editingReservation, currency: 'EUR' })}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                        editingReservation.currency === 'EUR'
                          ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      EUR
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Selling Price ({editingReservation.currency || '$'}) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editingReservation.selling_price || 0}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      const paid = editingReservation.paid_amount || 0;
                      setEditingReservation({ 
                        ...editingReservation, 
                        selling_price: val,
                        remaining_amount: Math.max(0, val - paid)
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 font-bold text-cyan-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cost Price ({editingReservation.currency || '$'}) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editingReservation.cost_price || 0}
                    onChange={(e) => setEditingReservation({ ...editingReservation, cost_price: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Paid Amount ({editingReservation.currency || '$'})</label>
                  <input
                    type="number"
                    min={0}
                    value={editingReservation.paid_amount || 0}
                    onChange={(e) => {
                      const paid = Number(e.target.value);
                      const selling = editingReservation.selling_price || 0;
                      setEditingReservation({ 
                        ...editingReservation, 
                        paid_amount: paid,
                        remaining_amount: Math.max(0, selling - paid)
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={editingReservation.reservation_status || 'Confirmed'}
                    onChange={(e) => setEditingReservation({ ...editingReservation, reservation_status: e.target.value as ReservationStatus })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Paid">Paid</option>
                    <option value="Partially Paid">Partially Paid</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Special Requests</label>
                <textarea
                  rows={2}
                  value={editingReservation.notes || ''}
                  onChange={(e) => setEditingReservation({ ...editingReservation, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingReservation(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors cursor-pointer"
                >
                  Save Changes / Request Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmRes && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Delete Reservation</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to delete reservation <span className="font-semibold text-slate-800">#{deleteConfirmRes.reservation_id || deleteConfirmRes.id.slice(0, 6)}</span> for <span className="font-semibold text-slate-800">{deleteConfirmRes.customer_name}</span>?
                <br />(Manager authorization will be requested if not authorized)
              </p>
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmRes(null)}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteReservation(deleteConfirmRes.id);
                  setDeleteConfirmRes(null);
                }}
                className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Convert Reservation to Invoice Modal with Safeguards & Liability Clarification */}
      {convertModalRes && (() => {
        const { 
          customerInvoice, 
          supplierInvoice, 
          hasCustomerInvoice, 
          hasSupplierInvoice, 
          hasBothInvoices 
        } = getReservationInvoices(convertModalRes);

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 my-8">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Convert Reservation to Invoice</h3>
                    <p className="text-xs text-slate-500">
                      Booking Ref: <strong className="text-slate-800 font-mono">#{convertModalRes.reservation_id}</strong> • Destination: <strong className="text-slate-800">{convertModalRes.destination}</strong>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setConvertModalRes(null)}
                  className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Policy & Safeguard Banner */}
              <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-amber-900">Duplicate Invoicing Safeguard & Liabilities Policy</div>
                  <p className="text-amber-800 leading-relaxed">
                    <strong>Customer Invoices</strong> represent receivables from clients. <strong>Supplier Invoices</strong> are payable to the supplier and are <strong>counted as part of company liabilities (payment obligations)</strong>.
                  </p>
                  <p className="text-amber-700 text-[11px]">
                    To prevent double-billing or duplicate liabilities, each party can only be invoiced once per reservation. When both invoices exist, conversion is finalized and locked.
                  </p>
                </div>
              </div>

              {/* Invoices Status & Action Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Customer Invoice Card */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  hasCustomerInvoice 
                    ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-200' 
                    : 'bg-white border-slate-200 shadow-xs'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        hasCustomerInvoice ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Customer Invoice</div>
                        <div className="text-[10px] text-slate-500">Accounts Receivable</div>
                      </div>
                    </div>
                    {hasCustomerInvoice ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        <span>Created</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md">
                        Pending
                      </span>
                    )}
                  </div>

                  {hasCustomerInvoice ? (
                    <div className="space-y-2.5">
                      <div className="bg-white p-3 rounded-xl border border-emerald-200 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Invoice Ref:</span>
                          <span className="font-mono font-bold text-emerald-900">
                            #{customerInvoice?.invoice_number || convertModalRes.customer_invoice_number}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Billed To:</span>
                          <span className="font-semibold text-slate-800 truncate max-w-[150px]">
                            {convertModalRes.customer_name || 'Customer'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Total Billed:</span>
                          <span className="font-bold text-emerald-700">
                            {formatCurrency(customerInvoice?.total_amount || convertModalRes.selling_price, convertModalRes.currency)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t border-emerald-100">
                          <span className="text-slate-500">Status:</span>
                          <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">
                            {customerInvoice?.payment_status || 'Issued'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        {customerInvoice && (
                          <button
                            type="button"
                            onClick={() => setSelectedInvoicePreview(customerInvoice)}
                            className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>View Invoice</span>
                          </button>
                        )}
                        <span className="text-[10px] text-emerald-700 font-medium text-center">
                          🔒 Duplicate invoice prevented
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Client:</span>
                          <span className="font-semibold text-slate-800">{convertModalRes.customer_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Selling Price:</span>
                          <span className="font-bold text-slate-900">
                            {formatCurrency(convertModalRes.selling_price, convertModalRes.currency)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Travelers:</span>
                          <span className="font-semibold text-slate-800">{convertModalRes.number_of_travelers || 1}</span>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <button
                          type="button"
                          disabled={isGeneratingInvoice}
                          onClick={() => handleInstantGenerateInvoice(convertModalRes, 'Customer')}
                          className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>⚡ 1-Click Generate Customer Inv</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (onTransferToInvoice) {
                              onTransferToInvoice(convertModalRes, 'Customer');
                              setConvertModalRes(null);
                            }
                          }}
                          className="w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          <span>Transfer to Hub (Customize Lines)</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Supplier Invoice Card (Company Payment Liability) */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  hasSupplierInvoice 
                    ? 'bg-amber-50/60 border-amber-300 ring-1 ring-amber-200' 
                    : 'bg-white border-slate-200 shadow-xs'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        hasSupplierInvoice ? 'bg-amber-200 text-amber-900' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Supplier Invoice</div>
                        <div className="text-[10px] text-amber-800 font-semibold">Payable Liability (Obligation)</div>
                      </div>
                    </div>
                    {hasSupplierInvoice ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md">
                        <CheckCircle className="w-3 h-3 text-amber-700" />
                        <span>Recorded</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md">
                        Pending
                      </span>
                    )}
                  </div>

                  {hasSupplierInvoice ? (
                    <div className="space-y-2.5">
                      <div className="bg-white p-3 rounded-xl border border-amber-200 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Invoice Ref:</span>
                          <span className="font-mono font-bold text-amber-950">
                            #{supplierInvoice?.invoice_number || convertModalRes.supplier_invoice_number}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Payable To:</span>
                          <span className="font-semibold text-slate-800 truncate max-w-[150px]">
                            {convertModalRes.supplier_name || 'Supplier'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Liability Amount:</span>
                          <span className="font-bold text-rose-700">
                            {formatCurrency(supplierInvoice?.total_amount || convertModalRes.cost_price, convertModalRes.currency)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t border-amber-100">
                          <span className="text-slate-500">Obligation:</span>
                          <span className="px-1.5 py-0.5 bg-amber-200 text-amber-950 rounded text-[10px] font-bold">
                            Company Liability
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        {supplierInvoice && (
                          <button
                            type="button"
                            onClick={() => setSelectedInvoicePreview(supplierInvoice)}
                            className="flex-1 py-1.5 px-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>View Invoice</span>
                          </button>
                        )}
                        <span className="text-[10px] text-amber-800 font-medium text-center">
                          🔒 Duplicate liability prevented
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-amber-50/50 p-2.5 rounded-xl border border-amber-100 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Supplier:</span>
                          <span className="font-semibold text-slate-800">{convertModalRes.supplier_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Cost Price (Payable):</span>
                          <span className="font-bold text-rose-600">
                            {formatCurrency(convertModalRes.cost_price, convertModalRes.currency)}
                          </span>
                        </div>
                        <div className="text-[10px] text-amber-700 pt-0.5 font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                          <span>Recorded as company payment liability</span>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <button
                          type="button"
                          disabled={isGeneratingInvoice}
                          onClick={() => handleInstantGenerateInvoice(convertModalRes, 'Supplier')}
                          className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>⚡ 1-Click Generate Supplier Inv</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (onTransferToInvoice) {
                              onTransferToInvoice(convertModalRes, 'Supplier');
                              setConvertModalRes(null);
                            }
                          }}
                          className="w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          <span>Transfer to Hub (Customize Lines)</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
                {!hasBothInvoices && !hasCustomerInvoice && !hasSupplierInvoice ? (
                  <button
                    type="button"
                    disabled={isGeneratingInvoice}
                    onClick={() => handleGenerateBothInvoices(convertModalRes)}
                    className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white rounded-xl text-xs font-extrabold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>⚡ Generate Both Invoices (1-Click Complete)</span>
                  </button>
                ) : hasBothInvoices ? (
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>All Invoices Complete: 'Convert' button is hidden in table.</span>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500">
                    Generate the remaining invoice above to complete reservation billing.
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setConvertModalRes(null)}
                  className="w-full sm:w-auto px-5 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Official Invoice Preview Modal (Opened from Reservation Table Badges) */}
      {selectedInvoicePreview && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 space-y-6 animate-in fade-in zoom-in-95 my-8">
            {/* Top Bar */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-5">
              <div className="space-y-1">
                <SofiaLogo className="h-8" />
                <div className="text-xs text-slate-500">
                  {settings?.company_name || "Sofia Tours & Travel Agency"}
                </div>
                <div className="text-[11px] text-slate-400">
                  {settings?.address || "Luxor Corniche, Luxor, Egypt"} • Tax ID: {settings?.tax_number || "EG-902-881-X"}
                </div>
              </div>

              <div className="text-right space-y-1">
                <div className="flex items-center justify-end gap-2">
                  <span className="text-sm font-bold text-slate-400">INVOICE</span>
                  <span className="font-mono font-extrabold text-lg text-slate-900">
                    #{selectedInvoicePreview.invoice_number}
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  Date: <strong className="text-slate-800">{selectedInvoicePreview.issue_date}</strong>
                </div>
                <div className="text-xs text-slate-500">
                  Due: <strong className="text-slate-800">{selectedInvoicePreview.due_date}</strong>
                </div>

                {/* Recipient Classification Banner */}
                <div className="pt-1">
                  {selectedInvoicePreview.recipient_type === 'Supplier' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 bg-amber-100 text-amber-950 border border-amber-300 rounded-lg shadow-2xs">
                      <Building2 className="w-3.5 h-3.5 text-amber-700" />
                      <span>Supplier Payable Liability (Company Obligation)</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 bg-emerald-100 text-emerald-950 border border-emerald-300 rounded-lg shadow-2xs">
                      <User className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Customer Invoice (Accounts Receivable)</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Recipient Details */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  {selectedInvoicePreview.recipient_type === 'Supplier' ? 'Payable To (Supplier)' : 'Billed To (Customer)'}
                </span>
                <div className="font-bold text-slate-900 text-sm">
                  {selectedInvoicePreview.recipient_type === 'Supplier' 
                    ? selectedInvoicePreview.supplier_name 
                    : selectedInvoicePreview.customer_name}
                </div>
                {(selectedInvoicePreview.customer_email || selectedInvoicePreview.supplier_email) && (
                  <div className="text-slate-500">
                    {selectedInvoicePreview.recipient_type === 'Supplier' ? selectedInvoicePreview.supplier_email : selectedInvoicePreview.customer_email}
                  </div>
                )}
                {(selectedInvoicePreview.customer_phone || selectedInvoicePreview.supplier_phone) && (
                  <div className="text-slate-500">
                    {selectedInvoicePreview.recipient_type === 'Supplier' ? selectedInvoicePreview.supplier_phone : selectedInvoicePreview.customer_phone}
                  </div>
                )}
                {selectedInvoicePreview.customer_passport && (
                  <div className="text-slate-500">Passport: {selectedInvoicePreview.customer_passport}</div>
                )}
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Accounting Status & Booking Ref
                </span>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Reservation Ref:</span>
                    <span className="font-mono font-bold text-slate-800">
                      #{selectedInvoicePreview.reservation_id || 'Direct'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Status:</span>
                    <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                      selectedInvoicePreview.payment_status === 'Paid' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-amber-100 text-amber-900'
                    }`}>
                      {selectedInvoicePreview.payment_status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Classification:</span>
                    <span className="font-semibold text-slate-700">
                      {selectedInvoicePreview.recipient_type === 'Supplier' ? 'Company Liability' : 'Receivable'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Item & Description</th>
                    <th className="py-2.5 px-4 text-center">Qty</th>
                    <th className="py-2.5 px-4 text-right">Unit Price</th>
                    <th className="py-2.5 px-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedInvoicePreview.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{item.title}</div>
                        {item.description && (
                          <div className="text-[11px] text-slate-500 leading-tight mt-0.5">{item.description}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-700 font-semibold">{item.quantity}</td>
                      <td className="py-3 px-4 text-right text-slate-700 font-medium">
                        {formatCurrency(item.unit_price, selectedInvoicePreview.currency)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatCurrency(item.total_price, selectedInvoicePreview.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary & Liabilities Clause */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-600" />
                  <span>Notes & Obligations</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  {selectedInvoicePreview.notes || (
                    selectedInvoicePreview.recipient_type === 'Supplier'
                      ? 'Official supplier liability voucher. Counted under Sofia Travel company settlement liabilities.'
                      : 'Thank you for choosing Sofia Tours. We appreciate your business!'
                  )}
                </p>
                {selectedInvoicePreview.recipient_type === 'Supplier' && (
                  <div className="p-2 bg-amber-100/70 border border-amber-300 text-amber-950 text-[10px] rounded-xl font-medium">
                    ⚠️ Accounting Note: Counts against company payment obligations. Recorded as Accounts Payable liability.
                  </div>
                )}
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold">{formatCurrency(selectedInvoicePreview.subtotal, selectedInvoicePreview.currency)}</span>
                </div>
                {selectedInvoicePreview.tax_amount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Tax:</span>
                    <span className="font-semibold">{formatCurrency(selectedInvoicePreview.tax_amount, selectedInvoicePreview.currency)}</span>
                  </div>
                )}
                {selectedInvoicePreview.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount:</span>
                    <span>-{formatCurrency(selectedInvoicePreview.discount, selectedInvoicePreview.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Amount:</span>
                  <span className="text-base text-cyan-800">
                    {formatCurrency(selectedInvoicePreview.total_amount, selectedInvoicePreview.currency)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-600 pt-1">
                  <span>Paid Amount:</span>
                  <span className="font-bold text-emerald-600">
                    {formatCurrency(selectedInvoicePreview.paid_amount, selectedInvoicePreview.currency)}
                  </span>
                </div>
                <div className="flex justify-between text-xs font-bold text-rose-600 pt-0.5">
                  <span>Balance Due:</span>
                  <span>{formatCurrency(selectedInvoicePreview.balance_due, selectedInvoicePreview.currency)}</span>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span>Print Document</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedInvoicePreview(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
