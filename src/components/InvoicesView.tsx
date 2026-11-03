import React, { useState, useEffect } from 'react';
import { downloadElementAsPDF } from '../utils/pdfGenerator';
import { printElement } from '../utils/printHelper';
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
  Edit3,
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
  ChevronDown,
  Users,
  Building2
} from 'lucide-react';
import { 
  Invoice, 
  InvoiceItem, 
  Customer, 
  Supplier, 
  TourPackage, 
  Hotel, 
  Flight, 
  Reservation,
  Voucher,
  UserRole, 
  CompanySettings 
} from '../types';
import { SofiaLogo } from './SofiaLogo';
import { ManagerSignature } from './ManagerSignature';
import { formatCurrency, getCurrencySymbol, convertCurrency, formatTripleCurrencyString } from '../utils/currency';

interface InvoicesViewProps {
  invoices: Invoice[];
  customers: Customer[];
  suppliers: Supplier[];
  packages: TourPackage[];
  hotels: Hotel[];
  flights: Flight[];
  reservations?: Reservation[];
  vouchers?: Voucher[];
  initialReservation?: any;
  onClearInitialReservation?: () => void;
  settings: CompanySettings;
  onAddInvoice: (invoiceData: Partial<Invoice>) => void;
  onUpdateInvoice: (id: string, invoiceData: Partial<Invoice>) => void;
  onDeleteInvoice: (id: string) => void;
  onUpdateReservation?: (id: string, data: Partial<Reservation>) => void;
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
  reservations = [],
  vouchers = [],
  initialReservation = null,
  onClearInitialReservation,
  settings,
  onAddInvoice,
  onUpdateInvoice,
  onDeleteInvoice,
  onUpdateReservation,
  userRole = 'Administrator',
  currentCurrency = 'USD'
}: InvoicesViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [activeSectionTab, setActiveSectionTab] = useState<'All' | 'Customer' | 'Supplier'>('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);

  // Helper filter for deleted items (Ensures deleted entities never appear in dropdown options)
  const isNotDeleted = (item: any) => {
    if (!item) return false;
    if (!item.id && !item.voucher_number && !item.reservation_id) return false;
    if (item.is_deleted || item.deleted) return false;
    if (item.status === 'Deleted' || item.reservation_status === 'Deleted' || item.payment_status === 'Deleted') return false;
    return true;
  };

  const validCustomers = customers.filter(isNotDeleted);
  const validSuppliers = suppliers.filter(isNotDeleted);
  const validPackages = packages.filter(isNotDeleted);
  const validHotels = hotels.filter(isNotDeleted);
  const validFlights = flights.filter(isNotDeleted);

  // Combine vouchers and reservations, filter out deleted items
  const rawVouchers = [...(vouchers || []), ...(reservations || [])].filter(isNotDeleted);

  // Deduplicate vouchers by unique ID or voucher_number / reservation_id
  const voucherMap = new Map<string, any>();
  rawVouchers.forEach(v => {
    const key = v.id || v.voucher_number || v.reservation_id;
    if (key && !voucherMap.has(key)) {
      voucherMap.set(key, v);
    }
  });
  const uniqueVouchers = Array.from(voucherMap.values());

  // Extract numeric digits for automatic descending sorting by voucher number
  const extractVoucherNumber = (v: any): number => {
    const numStr = String(v.voucher_number || v.reservation_id || v.id || '');
    const matches = numStr.match(/\d+/g);
    if (matches && matches.length > 0) {
      return parseInt(matches.join(''), 10);
    }
    return 0;
  };

  // Sort actually created vouchers automatically in descending order by voucher number
  const validVouchers = uniqueVouchers.sort((a, b) => {
    const numA = extractVoucherNumber(a);
    const numB = extractVoucherNumber(b);
    if (numA !== numB) {
      return numB - numA; // Descending order (highest voucher numbers first)
    }
    const strA = String(a.voucher_number || a.reservation_id || a.id || '');
    const strB = String(b.voucher_number || b.reservation_id || b.id || '');
    return strB.localeCompare(strA, undefined, { numeric: true, sensitivity: 'base' });
  });

  const validReservations = validVouchers; // Alias for backward compatibility

  // Form State for creating new invoice
  const [recipientType, setRecipientType] = useState<'Customer' | 'Supplier'>('Customer');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(validCustomers[0]?.id || '');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(validSuppliers[0]?.id || '');
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [invoiceCurrency, setInvoiceCurrency] = useState<string>('EGP');
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
  const [selectedVoucherId, setSelectedVoucherId] = useState<string>('');
  const [selectedReservationId, setSelectedReservationId] = useState<string>('');
  const [transferredFromRes, setTransferredFromRes] = useState<any | null>(null);

  // Auto-fill and transfer data when initialReservation is passed
  useEffect(() => {
    if (initialReservation) {
      const isSupplierTarget = (initialReservation as any).targetRecipientType === 'Supplier';
      setTransferredFromRes(initialReservation);

      // Check if invoice of this type already exists to prevent duplicate invoicing
      const existingCustInv = invoices.find(inv => 
        (inv.reservation_id === initialReservation.id || inv.reservation_id === initialReservation.reservation_id || initialReservation.customer_invoice_id === inv.id || initialReservation.customer_invoice_number === inv.invoice_number) &&
        (inv.recipient_type === 'Customer' || (!inv.recipient_type && !inv.supplier_id))
      );
      const existingSuppInv = invoices.find(inv => 
        (inv.reservation_id === initialReservation.id || inv.reservation_id === initialReservation.reservation_id || initialReservation.supplier_invoice_id === inv.id || initialReservation.supplier_invoice_number === inv.invoice_number) &&
        (inv.recipient_type === 'Supplier' || (inv.supplier_id && !inv.customer_id))
      );

      if (isSupplierTarget && existingSuppInv) {
        alert(`⚠️ Duplicate Invoice Prevention Notice:\nA Supplier Liability Invoice (#${existingSuppInv.invoice_number}) has already been generated for Reservation #${initialReservation.reservation_id}.\nTo prevent recording duplicate payment liabilities, another supplier invoice cannot be generated for this reservation.`);
        if (onClearInitialReservation) onClearInitialReservation();
        return;
      }

      if (!isSupplierTarget && existingCustInv) {
        alert(`⚠️ Duplicate Invoice Prevention Notice:\nA Customer Invoice (#${existingCustInv.invoice_number}) has already been generated for Reservation #${initialReservation.reservation_id}.\nTo prevent double billing the customer, another customer invoice cannot be generated for this reservation.`);
        if (onClearInitialReservation) onClearInitialReservation();
        return;
      }

      let resCurrency = initialReservation.currency || '$';
      if (resCurrency === 'USD') resCurrency = '$';
      else if (resCurrency.toUpperCase() === 'EGP') resCurrency = 'EGP';
      else if (resCurrency.toUpperCase() === 'EUR') resCurrency = 'EUR';
      setInvoiceCurrency(resCurrency);

      const qty = Number(initialReservation.number_of_travelers) || 1;

      if (isSupplierTarget) {
        // Supplier Invoice: Company Payment Liability
        setRecipientType('Supplier');

        if (initialReservation.supplier_id) {
          setSelectedSupplierId(initialReservation.supplier_id);
        } else if (initialReservation.supplier_name) {
          const found = validSuppliers.find(s => s.supplier_name?.toLowerCase() === initialReservation.supplier_name?.toLowerCase());
          if (found) setSelectedSupplierId(found.id);
        }

        const costPrice = Number(initialReservation.cost_price) || 0;
        const unitCost = qty > 0 ? costPrice / qty : costPrice;

        const newItem: InvoiceItem = {
          id: 'ITEM-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
          item_type: 'Custom',
          item_reference_id: initialReservation.reservation_id || initialReservation.id,
          title: `${initialReservation.service_type} - ${initialReservation.destination} (Supplier Cost / Payable)`,
          description: `Reservation #${initialReservation.reservation_id} • Payable to: ${initialReservation.supplier_name || 'Supplier'} • Company Payment Liability • Travelers: ${qty} • Travel: ${initialReservation.travel_date} to ${initialReservation.return_date}`,
          quantity: qty,
          unit_price: Math.round(unitCost * 100) / 100,
          total_price: costPrice
        };

        setItems([newItem]);
        setPaidAmount(0);
        setNotes(`Supplier invoice payable to ${initialReservation.supplier_name || 'supplier'} for Reservation #${initialReservation.reservation_id}. Counted as part of Sofia Travel company liabilities and payment obligations.`);
        setTerms(`Company payment obligation payable to supplier in accordance with contractual terms.`);
      } else {
        // Customer Invoice: Accounts Receivable
        setRecipientType('Customer');

        if (initialReservation.customer_id) {
          const found = validCustomers.find(c => c.id === initialReservation.customer_id || c.customer_id === initialReservation.customer_id);
          if (found) setSelectedCustomerId(found.id);
          else setSelectedCustomerId(initialReservation.customer_id);
        } else if (initialReservation.customer_name) {
          const found = validCustomers.find(c => (c.full_name || c.name)?.toLowerCase() === initialReservation.customer_name.toLowerCase() || c.customer_id === initialReservation.customer_name);
          if (found) setSelectedCustomerId(found.id);
        }

        const sellPrice = Number(initialReservation.selling_price) || 0;
        const unitPrice = qty > 0 ? sellPrice / qty : sellPrice;

        const newItem: InvoiceItem = {
          id: 'ITEM-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
          item_type: 'Custom',
          item_reference_id: initialReservation.reservation_id || initialReservation.id,
          title: `${initialReservation.service_type} - ${initialReservation.destination}`,
          description: `Reservation #${initialReservation.reservation_id} • Customer: ${initialReservation.customer_name || 'Client'} • Travelers: ${qty} • Travel Date: ${initialReservation.travel_date} to ${initialReservation.return_date}`,
          quantity: qty,
          unit_price: Math.round(unitPrice * 100) / 100,
          total_price: sellPrice
        };

        setItems([newItem]);
        setPaidAmount(Number(initialReservation.paid_amount) || 0);
        setNotes(`Invoice created for Reservation #${initialReservation.reservation_id} (${initialReservation.destination}). Thank you for booking with Sofia Travel!`);
        setTerms(`Standard payment terms apply.`);
      }

      setShowCreateModal(true);

      if (onClearInitialReservation) {
        onClearInitialReservation();
      }
    }
  }, [initialReservation]);

  // Calculations for form
  const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);
  const taxAmount = (subtotal - discount) > 0 ? ((subtotal - discount) * (taxRate / 100)) : 0;
  const totalAmount = Math.max(0, subtotal - discount + taxAmount);
  const balanceDue = Math.max(0, totalAmount - paidAmount);

  // Quick Add Item from Tour Package
  const handleAddTourPackage = (pkgId: string) => {
    const pkg = validPackages.find(p => p.id === pkgId);
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
    const hot = validHotels.find(h => h.id === hotelId);
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
    const fl = validFlights.find(f => f.id === flightId);
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

  // Handle dynamic recipient type change (Customer vs Supplier Invoice)
  const handleRecipientTypeChange = (newType: 'Customer' | 'Supplier') => {
    setRecipientType(newType);

    if (transferredFromRes) {
      const v = transferredFromRes;
      const vNum = v.voucher_number || v.reservation_id || v.id;
      const qty = Number(v.number_of_travelers) || 1;
      const isSupp = newType === 'Supplier';
      const itemTotal = isSupp ? (Number(v.cost_price) || 0) : (Number(v.selling_price) || 0);
      const unitPrice = qty > 0 ? itemTotal / qty : itemTotal;
      const sCat = v.service_category || v.service_type || 'Travel Service';

      setItems(prevItems => {
        if (prevItems.length === 0) return prevItems;
        return prevItems.map(item => {
          if (item.item_reference_id === vNum || item.title.includes(vNum) || item.description.includes(vNum)) {
            return {
              ...item,
              title: isSupp
                ? `${sCat} - ${v.destination} (Supplier Net Price / Cost)`
                : `${sCat} - ${v.destination}`,
              description: isSupp
                ? `Voucher #${vNum} • Payable to: ${v.supplier_name || 'Supplier'} • Net Price: ${itemTotal} ${v.currency || 'USD'} • Travelers: ${qty}`
                : `Voucher #${vNum} • Customer: ${v.customer_name || 'Client'} • Travelers: ${qty}`,
              unit_price: Math.round(unitPrice * 100) / 100,
              total_price: itemTotal
            };
          }
          return item;
        });
      });

      if (isSupp) {
        if (v.supplier_id) {
          setSelectedSupplierId(v.supplier_id);
        } else if (v.supplier_name) {
          const suppFound = validSuppliers.find(s => s.supplier_name?.toLowerCase() === v.supplier_name?.toLowerCase());
          if (suppFound) setSelectedSupplierId(suppFound.id);
        }
        setNotes(`Supplier invoice payable at net price (${itemTotal} ${v.currency || 'USD'}) for Voucher #${vNum}. Counted as company liabilities.`);
        setTerms(`Company payment obligation payable to supplier at entered net contract price.`);
      } else {
        if (v.customer_id) {
          const custFound = validCustomers.find(c => c.id === v.customer_id || c.customer_id === v.customer_id);
          if (custFound) setSelectedCustomerId(custFound.id);
        }
        setPaidAmount(Number(v.paid_amount) || 0);
        setNotes(`Customer sales invoice for Voucher #${vNum} (${v.destination}). Thank you for choosing Sofia Travel!`);
      }
    }
  };

  // Quick Add Item from Actually Created Voucher
  const handleAddVoucherItem = (vId: string) => {
    const voucher = validVouchers.find(v => v.id === vId || v.voucher_number === vId || v.reservation_id === vId);
    if (!voucher) return;

    const isSupp = recipientType === 'Supplier';
    const vNum = voucher.voucher_number || voucher.reservation_id || voucher.id;

    // Check duplicate invoice prevention
    const existingCustInv = invoices.find(inv => 
      (inv.reservation_id === voucher.id || inv.reservation_id === voucher.reservation_id || voucher.customer_invoice_id === inv.id || voucher.customer_invoice_number === inv.invoice_number) &&
      (inv.recipient_type === 'Customer' || (!inv.recipient_type && !inv.supplier_id))
    );
    const existingSuppInv = invoices.find(inv => 
      (inv.reservation_id === voucher.id || inv.reservation_id === voucher.reservation_id || voucher.supplier_invoice_id === inv.id || voucher.supplier_invoice_number === inv.invoice_number) &&
      (inv.recipient_type === 'Supplier' || (inv.supplier_id && !inv.customer_id))
    );

    if (recipientType === 'Customer' && existingCustInv) {
      alert(`⚠️ Duplicate Invoice Prevention:\nA Customer Invoice (#${existingCustInv.invoice_number}) has already been generated for Voucher #${vNum}.\nTo prevent billing the customer twice, duplicate customer invoice creation is blocked.`);
      setSelectedVoucherId('');
      setSelectedReservationId('');
      return;
    }

    if (recipientType === 'Supplier' && existingSuppInv) {
      alert(`⚠️ Duplicate Liability Prevention:\nA Supplier Liability Invoice (#${existingSuppInv.invoice_number}) has already been generated for Voucher #${vNum}.\nTo prevent recording duplicate payment liabilities, duplicate supplier invoice creation is blocked.`);
      setSelectedVoucherId('');
      setSelectedReservationId('');
      return;
    }

    setTransferredFromRes(voucher);

    const qty = Number(voucher.number_of_travelers) || 1;
    // For Supplier invoices, the unit/item price is the ENTERED NET PRICE (cost_price). For Customer invoices, it's selling_price.
    const itemTotal = isSupp ? (Number(voucher.cost_price) || 0) : (Number(voucher.selling_price) || 0);
    const unitPrice = qty > 0 ? itemTotal / qty : itemTotal;

    let vCurrency = voucher.currency || 'USD';
    if (vCurrency === '$') vCurrency = 'USD';
    else if (vCurrency.toUpperCase() === 'EGP') vCurrency = 'EGP';
    else if (vCurrency.toUpperCase() === 'EUR') vCurrency = 'EUR';
    setInvoiceCurrency(vCurrency);

    const sCat = voucher.service_category || (voucher as any).service_type || 'Travel Service';

    const newItem: InvoiceItem = {
      id: 'ITEM-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
      item_type: 'Custom',
      item_reference_id: vNum,
      title: isSupp
        ? `${sCat} - ${voucher.destination} (Supplier Net Cost / Payable)`
        : `${sCat} - ${voucher.destination}`,
      description: isSupp
        ? `Voucher #${vNum} • Payable to: ${voucher.supplier_name || 'Supplier'} • Net Price: ${itemTotal} ${vCurrency} • Travelers: ${qty} • Travel: ${voucher.travel_date || 'N/A'}`
        : `Voucher #${vNum} • Customer: ${voucher.customer_name || 'Client'} • Travelers: ${qty} • Travel: ${voucher.travel_date || 'N/A'}`,
      quantity: qty,
      unit_price: Math.round(unitPrice * 100) / 100,
      total_price: itemTotal
    };

    setItems(prev => [...prev, newItem]);

    if (isSupp) {
      if (voucher.supplier_id) {
        setSelectedSupplierId(voucher.supplier_id);
      } else if (voucher.supplier_name) {
        const suppFound = validSuppliers.find(s => s.supplier_name?.toLowerCase() === voucher.supplier_name?.toLowerCase());
        if (suppFound) setSelectedSupplierId(suppFound.id);
      }
      setNotes(`Supplier invoice payable at net price (${itemTotal} ${vCurrency}) for Voucher #${vNum} (${voucher.destination}). Counted as company liabilities.`);
      setTerms(`Company payment obligation payable to supplier at entered net contract price.`);
    } else {
      if (voucher.customer_id) {
        const custFound = validCustomers.find(c => c.id === voucher.customer_id || c.customer_id === voucher.customer_id);
        if (custFound) setSelectedCustomerId(custFound.id);
        else setSelectedCustomerId(voucher.customer_id);
      }
      setPaidAmount(Number(voucher.paid_amount) || 0);
      setNotes(`Customer invoice for Voucher #${vNum} (${voucher.destination}). Thank you for choosing Sofia Travel!`);
    }

    setSelectedVoucherId('');
    setSelectedReservationId('');
  };

  const handleAddReservationItem = handleAddVoucherItem; // Alias for backward compatibility

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

  // Open Edit Modal with Pre-populated Invoice Data
  const handleOpenEditModal = (inv: Invoice) => {
    setEditingInvoice(inv);
    const rType = inv.recipient_type || (inv.supplier_id ? 'Supplier' : 'Customer');
    setRecipientType(rType);

    if (rType === 'Customer') {
      const cust = validCustomers.find(c => c.id === inv.customer_id || c.customer_id === inv.customer_id || c.full_name === inv.customer_name);
      setSelectedCustomerId(cust?.id || inv.customer_id || validCustomers[0]?.id || '');
    } else {
      const supp = validSuppliers.find(s => s.id === inv.supplier_id || s.supplier_name === inv.supplier_name);
      setSelectedSupplierId(supp?.id || inv.supplier_id || validSuppliers[0]?.id || '');
    }

    setIssueDate(inv.issue_date || new Date().toISOString().split('T')[0]);
    setDueDate(inv.due_date || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setInvoiceCurrency(inv.currency || 'EGP');
    setItems(inv.items ? JSON.parse(JSON.stringify(inv.items)) : []);
    setDiscount(inv.discount || 0);
    setTaxRate(inv.tax_rate || 0);
    setPaidAmount(inv.paid_amount || 0);
    setPaymentMethod(inv.payment_method || 'Bank Transfer');
    setNotes(inv.notes || '');
    setTerms(inv.terms || '');
    setShowCreateModal(true);
  };

  // Handle Form Submit (Create or Edit)
  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('Please add at least one line item (Tour Package, Hotel, Flight, or Custom).');
      return;
    }

    const customer = validCustomers.find(c => c.id === selectedCustomerId || c.customer_id === selectedCustomerId);
    const supplier = validSuppliers.find(s => s.id === selectedSupplierId);

    const payment_status = balanceDue <= 0 ? 'Paid' : paidAmount > 0 ? 'Partially Paid' : 'Unpaid';

    const linkedResId = transferredFromRes?.id || transferredFromRes?.reservation_id || editingInvoice?.reservation_id || undefined;

    const invoiceData: Partial<Invoice> = {
      recipient_type: recipientType,
      reservation_id: linkedResId,
      customer_id: customer?.customer_id || customer?.id || selectedCustomerId || transferredFromRes?.customer_id || editingInvoice?.customer_id || undefined,
      customer_name: customer?.full_name || customer?.name || transferredFromRes?.customer_name || editingInvoice?.customer_name || undefined,
      customer_email: customer?.email || transferredFromRes?.customer_email || editingInvoice?.customer_email || undefined,
      customer_phone: customer?.phone || transferredFromRes?.customer_phone || editingInvoice?.customer_phone || undefined,
      customer_address: customer?.address || editingInvoice?.customer_address || undefined,
      customer_passport: customer?.passport_number || transferredFromRes?.customer_passport || editingInvoice?.customer_passport || undefined,
      file_number: customer?.file_number || transferredFromRes?.file_number || editingInvoice?.file_number || undefined,
      supplier_id: recipientType === 'Supplier' ? (supplier?.id || selectedSupplierId) : undefined,
      supplier_name: recipientType === 'Supplier' ? (supplier?.supplier_name || editingInvoice?.supplier_name) : undefined,
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
      notes: notes || (recipientType === 'Supplier' ? `Payable to supplier ${supplier?.supplier_name || ''}. Counted as company liabilities and payment obligations.` : undefined),
      terms: terms || (recipientType === 'Supplier' ? `Company payment obligation payable to supplier according to contractual terms.` : undefined),
      manager_name: editingInvoice?.manager_name || "Ahmed Ali",
      created_by_employee: editingInvoice?.created_by_employee || (userRole === 'Administrator' ? 'IT (Admin)' : 'Staff')
    };

    if (editingInvoice) {
      onUpdateInvoice(editingInvoice.id, invoiceData);
    } else {
      onAddInvoice(invoiceData);
    }

    if (transferredFromRes && onUpdateReservation) {
      if (recipientType === 'Supplier') {
        onUpdateReservation(transferredFromRes.id, {
          supplier_invoice_id: 'pending'
        });
      } else {
        onUpdateReservation(transferredFromRes.id, {
          customer_invoice_id: 'pending'
        });
      }
    }

    setShowCreateModal(false);

    // Reset Form
    setEditingInvoice(null);
    setTransferredFromRes(null);
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

  // Separate Customer and Supplier Invoices
  const customerInvoices = invoices.filter(inv => inv.recipient_type !== 'Supplier');
  const supplierInvoices = invoices.filter(inv => inv.recipient_type === 'Supplier');

  // Filter Customer Invoices
  const filteredCustomerInvoices = customerInvoices.filter(inv => {
    const recipient = inv.customer_name || '';
    const matchesSearch = 
      ( inv.invoice_number || "" ).toLowerCase().includes(( searchTerm || "" ).toLowerCase()) ||
      ( recipient || "" ).toLowerCase().includes(( searchTerm || "" ).toLowerCase()) ||
      (inv.customer_passport && ( inv.customer_passport || "" ).toLowerCase().includes(( searchTerm || "" ).toLowerCase()));

    const matchesStatus = statusFilter === 'All' || inv.payment_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filter Supplier Invoices
  const filteredSupplierInvoices = supplierInvoices.filter(inv => {
    const recipient = inv.supplier_name || '';
    const matchesSearch = 
      ( inv.invoice_number || "" ).toLowerCase().includes(( searchTerm || "" ).toLowerCase()) ||
      ( recipient || "" ).toLowerCase().includes(( searchTerm || "" ).toLowerCase()) ||
      (inv.supplier_type && ( inv.supplier_type || "" ).toLowerCase().includes(( searchTerm || "" ).toLowerCase()));

    const matchesStatus = statusFilter === 'All' || inv.payment_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate Currency Totals for a subset of invoices
  const calculateTotalsForList = (list: Invoice[], targetCur: 'USD' | 'EGP' | 'EUR') => {
    let totalInv = 0;
    let totalPaid = 0;
    let totalPending = 0;

    list.forEach(inv => {
      let invCur = (inv.currency || 'EGP').toUpperCase();
      if (invCur === '$') invCur = 'USD';
      if (invCur === targetCur) {
        totalInv += Number(inv.total_amount || 0);
        totalPaid += Number(inv.paid_amount || 0);
        totalPending += Number(inv.balance_due || 0);
      }
    });

    return { totalInv, totalPaid, totalPending };
  };

  // Consolidated Overall Totals
  const usdTotals = calculateTotalsForList(invoices, 'USD');
  const egpTotals = calculateTotalsForList(invoices, 'EGP');
  const eurTotals = calculateTotalsForList(invoices, 'EUR');

  // Customer Section Specific Totals
  const custUsdTotals = calculateTotalsForList(customerInvoices, 'USD');
  const custEgpTotals = calculateTotalsForList(customerInvoices, 'EGP');

  // Supplier Section Specific Totals
  const suppUsdTotals = calculateTotalsForList(supplierInvoices, 'USD');
  const suppEgpTotals = calculateTotalsForList(supplierInvoices, 'EGP');

  // WhatsApp Share Generator
  const shareWhatsApp = (inv: Invoice) => {
    const isSup = inv.recipient_type === 'Supplier';
    const recipient = isSup ? inv.supplier_name : inv.customer_name;
    const phone = (isSup ? inv.supplier_phone : inv.customer_phone)?.replace(/[^0-9]/g, '') || '';
    const matchedCust = !isSup ? validCustomers.find(c => c.id === inv.customer_id || c.customer_id === inv.customer_id || c.full_name === inv.customer_name) : null;
    const custCode = matchedCust?.customer_id || inv.customer_id;
    
    const text = encodeURIComponent(
      `*SOFIA TRAVEL - OFFICIAL INVOICE / RECEIPT*\n` +
      `-----------------------------------------\n` +
      `Invoice #: ${inv.invoice_number}\n` +
      `Date: ${inv.issue_date}\n` +
      `Recipient: ${recipient}${custCode ? `\nCustomer Code: ${custCode}` : ''}\n` +
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
    <div className="p-6 sm:p-8 space-y-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-7 h-7 text-cyan-600" />
            <span>Invoices & Billing Hub</span>
          </h1>
          <p className="text-sm text-slate-500">
            Issue and manage customer receivables and supplier liability invoices in separate detailed sections.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setEditingInvoice(null);
              setTransferredFromRes(null);
              setRecipientType('Customer');
              setSelectedCustomerId(validCustomers[0]?.id || '');
              setItems([]);
              setDiscount(0);
              setTaxRate(0);
              setPaidAmount(0);
              setShowCreateModal(true);
            }}
            className="flex items-center space-x-2 bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-cyan-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Customer Invoice</span>
          </button>

          <button
            onClick={() => {
              setEditingInvoice(null);
              setTransferredFromRes(null);
              setRecipientType('Supplier');
              setSelectedSupplierId(validSuppliers[0]?.id || '');
              setItems([]);
              setDiscount(0);
              setTaxRate(0);
              setPaidAmount(0);
              setShowCreateModal(true);
            }}
            className="flex items-center space-x-2 bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-purple-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Supplier Invoice</span>
          </button>
        </div>
      </div>

      {/* TOP CONSOLIDATED BANNER */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-cyan-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Consolidated Financial Summary (USD $, EGP, EUR €)
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">Real-time overall accounts balance</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* USD Card */}
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

          {/* EGP Card */}
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

          {/* EUR Card */}
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

      {/* SEARCH, STATUS & SECTION VIEW SWITCHER BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search invoices by #, name, passport..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-cyan-500 focus:bg-white"
            />
          </div>

          {/* Section View Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setActiveSectionTab('All')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeSectionTab === 'All' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Both Sections ({invoices.length})
            </button>
            <button
              onClick={() => setActiveSectionTab('Customer')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                activeSectionTab === 'Customer' ? 'bg-white text-cyan-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>1. Customers Only ({customerInvoices.length})</span>
            </button>
            <button
              onClick={() => setActiveSectionTab('Supplier')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                activeSectionTab === 'Supplier' ? 'bg-white text-purple-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>2. Suppliers Only ({supplierInvoices.length})</span>
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

      {/* ========================================================================= */}
      {/* SECTION 1: CUSTOMERS INVOICES (ACCOUNTS RECEIVABLE) */}
      {/* ========================================================================= */}
      {(activeSectionTab === 'All' || activeSectionTab === 'Customer') && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-gradient-to-r from-cyan-900 to-blue-900 text-white p-4 sm:p-5 rounded-2xl shadow-sm gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-xs">
                <Users className="w-6 h-6 text-cyan-300" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold tracking-tight flex items-center gap-2">
                  <span>1. Customer Invoices Section (Accounts Receivable)</span>
                  <span className="text-xs bg-cyan-500/30 text-cyan-200 border border-cyan-400/30 px-2.5 py-0.5 rounded-full font-bold">
                    {filteredCustomerInvoices.length} Records
                  </span>
                </h2>
                <p className="text-xs text-cyan-100/80">
                  Detailed billing, traveler sales invoices, payment collection, and outstanding customer balances.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs bg-cyan-950/50 p-2.5 rounded-xl border border-cyan-700/40">
              <span className="text-cyan-200 font-semibold">USD Billed:</span>
              <span className="font-bold text-white">{formatCurrency(custUsdTotals.totalInv, 'USD')}</span>
              <span className="text-cyan-400 mx-1">|</span>
              <span className="text-cyan-200 font-semibold">EGP Billed:</span>
              <span className="font-bold text-emerald-300">{formatCurrency(custEgpTotals.totalInv, 'EGP')}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Invoice Details</th>
                    <th className="py-3.5 px-4 font-semibold">Customer / Traveler Information</th>
                    <th className="py-3.5 px-4 font-semibold">Dates & Currency</th>
                    <th className="py-3.5 px-4 font-semibold">Total Sales Amount</th>
                    <th className="py-3.5 px-4 font-semibold">Paid Amount</th>
                    <th className="py-3.5 px-4 font-semibold">Balance Due</th>
                    <th className="py-3.5 px-4 font-semibold">Payment Status</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCustomerInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400">
                        <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        <p className="font-semibold text-slate-600 text-xs">No customer invoices match your search filter.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredCustomerInvoices.map((inv) => {
                      const matchedCust = validCustomers.find(c => c.id === inv.customer_id || c.customer_id === inv.customer_id || c.full_name === inv.customer_name);
                      const custCode = matchedCust?.customer_id || inv.customer_id;

                      return (
                        <tr key={inv.id} className="hover:bg-cyan-50/30 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <FileText className="w-4 h-4 text-cyan-600" />
                              <span>{inv.invoice_number}</span>
                            </div>
                            <span className="text-[11px] text-slate-400">{inv.items?.length || 0} service item(s)</span>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900">{inv.customer_name || 'Client'}</span>
                              {custCode && (
                                <span className="text-[10px] bg-cyan-100 text-cyan-900 border border-cyan-300 font-mono font-bold px-1.5 py-0.5 rounded">
                                  {custCode}
                                </span>
                              )}
                              {inv.reservation_id && (
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-medium border border-slate-200">
                                  Res #{inv.reservation_id}
                                </span>
                              )}
                              {inv.file_number && (
                                <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                  File #: {inv.file_number}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {inv.customer_phone || inv.customer_email || 'Direct Client'} 
                              {inv.customer_passport && ` • Passport: ${inv.customer_passport}`}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-xs text-slate-600">
                            <div>Issue: {inv.issue_date}</div>
                            <div className="text-slate-400 text-[11px]">Due: {inv.due_date}</div>
                            <span className="text-[10px] font-bold text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-200 mt-1 inline-block">
                              {inv.currency || 'USD'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            <div>{formatCurrency(inv.total_amount, inv.currency)}</div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              {formatTripleCurrencyString(inv.total_amount, inv.currency, settings?.exchange_rates)}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-semibold text-emerald-600">
                            {formatCurrency(inv.paid_amount, inv.currency)}
                          </td>

                          <td className="py-3.5 px-4 font-bold text-amber-600">
                            {formatCurrency(inv.balance_due, inv.currency)}
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
                                title="View & Print Customer Invoice"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => shareWhatsApp(inv)}
                                className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors cursor-pointer"
                                title="Send Customer Invoice via WhatsApp"
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
                                  title="Record Customer Payment"
                                >
                                  <CreditCard className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenEditModal(inv)}
                                className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors cursor-pointer"
                                title="Edit Customer Invoice"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (userRole === 'Administrator' || userRole === 'Manager' || userRole === 'Accountant') {
                                    if (window.confirm(`Delete customer invoice ${inv.invoice_number}?`)) {
                                      onDeleteInvoice(inv.id);
                                    }
                                  } else {
                                    onDeleteInvoice(inv.id);
                                  }
                                }}
                                className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors cursor-pointer"
                                title="Delete Customer Invoice"
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: SUPPLIER INVOICES (COMPANY PAYMENT LIABILITIES) */}
      {/* ========================================================================= */}
      {(activeSectionTab === 'All' || activeSectionTab === 'Supplier') && (
        <div className="space-y-4 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-4 sm:p-5 rounded-2xl shadow-sm gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-xs">
                <Truck className="w-6 h-6 text-purple-300" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold tracking-tight flex items-center gap-2">
                  <span>2. Supplier Invoices Section (Company Payment Liabilities)</span>
                  <span className="text-xs bg-purple-500/30 text-purple-200 border border-purple-400/30 px-2.5 py-0.5 rounded-full font-bold">
                    {filteredSupplierInvoices.length} Records
                  </span>
                </h2>
                <p className="text-xs text-purple-100/80">
                  Itemized supplier cost obligations, partner settlements, airline/hotel invoices, and company liabilities.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs bg-purple-950/50 p-2.5 rounded-xl border border-purple-700/40">
              <span className="text-purple-200 font-semibold">USD Payable:</span>
              <span className="font-bold text-white">{formatCurrency(suppUsdTotals.totalInv, 'USD')}</span>
              <span className="text-purple-400 mx-1">|</span>
              <span className="text-purple-200 font-semibold">EGP Payable:</span>
              <span className="font-bold text-amber-300">{formatCurrency(suppEgpTotals.totalInv, 'EGP')}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Invoice Details</th>
                    <th className="py-3.5 px-4 font-semibold">Supplier Partner Details</th>
                    <th className="py-3.5 px-4 font-semibold">Dates & Currency</th>
                    <th className="py-3.5 px-4 font-semibold">Total Liability Amount</th>
                    <th className="py-3.5 px-4 font-semibold">Paid Amount</th>
                    <th className="py-3.5 px-4 font-semibold">Outstanding Obligation</th>
                    <th className="py-3.5 px-4 font-semibold">Status</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSupplierInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400">
                        <Truck className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        <p className="font-semibold text-slate-600 text-xs">No supplier invoices match your search filter.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredSupplierInvoices.map((inv) => {
                      return (
                        <tr key={inv.id} className="hover:bg-purple-50/30 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <FileText className="w-4 h-4 text-purple-600" />
                              <span>{inv.invoice_number}</span>
                            </div>
                            <span className="text-[11px] text-slate-400">{inv.items?.length || 0} line items</span>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900">{inv.supplier_name || 'Supplier'}</span>
                              <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded font-bold">
                                {inv.supplier_type || 'Supplier Partner'}
                              </span>
                              {inv.reservation_id && (
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-medium border border-slate-200">
                                  Res #{inv.reservation_id}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-purple-800 font-semibold mt-0.5">
                              Company Payable Obligation • {inv.supplier_phone || inv.supplier_email || 'Direct Vendor'}
                            </div>
                            {inv.customer_name && (
                              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                <span className="text-[11px] font-bold text-cyan-900 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                                  <User className="w-3 h-3 text-cyan-600" />
                                  <span>Customer: <strong>{inv.customer_name}</strong></span>
                                </span>
                                {inv.file_number && (
                                  <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                    File #: {inv.file_number}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-xs text-slate-600">
                            <div>Issue: {inv.issue_date}</div>
                            <div className="text-slate-400 text-[11px]">Due: {inv.due_date}</div>
                            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 mt-1 inline-block">
                              {inv.currency || 'USD'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            <div>{formatCurrency(inv.total_amount, inv.currency)}</div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              {formatTripleCurrencyString(inv.total_amount, inv.currency, settings?.exchange_rates)}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-semibold text-emerald-600">
                            {formatCurrency(inv.paid_amount, inv.currency)}
                          </td>

                          <td className="py-3.5 px-4 font-bold text-rose-600">
                            {formatCurrency(inv.balance_due, inv.currency)}
                          </td>

                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 ${
                              inv.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                              inv.payment_status === 'Partially Paid' ? 'bg-purple-100 text-purple-800' :
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
                                className="p-1.5 hover:bg-purple-50 text-purple-700 rounded-lg transition-colors cursor-pointer"
                                title="View & Print Supplier Liability Bill"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => shareWhatsApp(inv)}
                                className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors cursor-pointer"
                                title="Send Supplier Bill via WhatsApp"
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
                                  title="Record Payment to Supplier"
                                >
                                  <CreditCard className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenEditModal(inv)}
                                className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors cursor-pointer"
                                title="Edit Supplier Invoice"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (userRole === 'Administrator' || userRole === 'Manager' || userRole === 'Accountant') {
                                    if (window.confirm(`Delete supplier invoice ${inv.invoice_number}?`)) {
                                      onDeleteInvoice(inv.id);
                                    }
                                  } else {
                                    onDeleteInvoice(inv.id);
                                  }
                                }}
                                className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors cursor-pointer"
                                title="Delete Supplier Invoice"
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
        </div>
      )}

      {/* CREATE NEW INVOICE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-600" />
                <span>{editingInvoice ? `Edit Invoice #${editingInvoice.invoice_number}` : 'Create New Invoice / Bill'}</span>
              </h3>
              <button 
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingInvoice(null);
                  setTransferredFromRes(null);
                }} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4 mt-4">
              {/* Recipient Type Toggle */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Invoice Recipient Category
                  </label>
                  <div className="flex items-center bg-slate-200/80 p-1 rounded-lg text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => handleRecipientTypeChange('Customer')}
                      className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                        recipientType === 'Customer' ? 'bg-cyan-600 text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Customer Invoice
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRecipientTypeChange('Supplier')}
                      className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                        recipientType === 'Supplier' ? 'bg-purple-600 text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Supplier Bill / Invoice
                    </button>
                  </div>
                </div>

                {/* Transferred Reservation Notification Banner */}
                {transferredFromRes && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between text-xs text-emerald-800 shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <p className="font-bold text-emerald-900">
                          Data Transferred from Reservation #{transferredFromRes.reservation_id}
                        </p>
                        <p className="text-emerald-700 text-[11px]">
                          Customer, dates, currency, and line items were auto-populated. You can add more line items or modify prices, then confirm the invoice below.
                        </p>
                      </div>
                    </div>
                    <span className="font-bold uppercase px-2.5 py-1 bg-emerald-200/80 text-emerald-900 rounded-md text-[10px] tracking-wide shrink-0">
                      Ready to Confirm
                    </span>
                  </div>
                )}

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
                        <option value="">-- Select Registered Customer --</option>
                        {validCustomers.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.full_name || c.name || 'Customer'} (Code: {c.customer_id || c.id}) • {c.customer_type || 'Individual'} • Passport: {c.passport_number || 'N/A'}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Select Supplier *</label>
                        <select
                          required
                          value={selectedSupplierId}
                          onChange={(e) => setSelectedSupplierId(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-cyan-500 font-medium"
                        >
                          <option value="">-- Select Supplier --</option>
                          {validSuppliers.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.supplier_name} • {s.type}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Associated Customer / Client Dossier</label>
                        <select
                          value={selectedCustomerId}
                          onChange={(e) => setSelectedCustomerId(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-cyan-500 font-medium"
                        >
                          <option value="">-- Select Associated Customer --</option>
                          {validCustomers.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.full_name || c.name || 'Customer'} (Code: {c.customer_id || c.id})
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Currency *</label>
                    <select
                      value={invoiceCurrency}
                      onChange={(e) => setInvoiceCurrency(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-cyan-500 font-bold text-cyan-700"
                    >
                      <option value="EGP">Egyptian Pound (EGP)</option>
                      <option value="$">US Dollar ($)</option>
                      <option value="EUR">Euro (EUR)</option>
                      <option value="USD">US Dollar (USD)</option>
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

              {/* QUICK AUTO-POPULATE ITEM DROPDOWNS */}
              <div className="bg-cyan-50/50 p-4 rounded-2xl border border-cyan-200/80 space-y-3">
                <div className="flex items-center gap-2 text-cyan-900 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-cyan-600" />
                  <span>One-Click Auto-Populate from Reservations & Inventory</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Created Voucher Dropdown */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      {recipientType === 'Supplier' ? 'Add Voucher (Net Price)' : 'Add Voucher (Selling Price)'}
                    </label>
                    <select
                      value={selectedVoucherId}
                      onChange={(e) => {
                        if (e.target.value) handleAddVoucherItem(e.target.value);
                      }}
                      className="w-full bg-white border border-cyan-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-500 font-medium"
                    >
                      <option value="">-- Choose Created Voucher --</option>
                      {validVouchers.map(v => {
                        const vNum = v.voucher_number || v.reservation_id || v.id;
                        const vCost = Number(v.cost_price || 0);
                        const vSell = Number(v.selling_price || 0);
                        const vCur = v.currency || 'USD';

                        const hasCust = invoices.some(inv => 
                          (inv.reservation_id === v.id || inv.reservation_id === v.reservation_id || v.customer_invoice_id === inv.id || v.customer_invoice_number === inv.invoice_number) &&
                          (inv.recipient_type === 'Customer' || (!inv.recipient_type && !inv.supplier_id))
                        );
                        const hasSupp = invoices.some(inv => 
                          (inv.reservation_id === v.id || inv.reservation_id === v.reservation_id || v.supplier_invoice_id === inv.id || v.supplier_invoice_number === inv.invoice_number) &&
                          (inv.recipient_type === 'Supplier' || (inv.supplier_id && !inv.customer_id))
                        );
                        const statusTag = hasCust && hasSupp 
                          ? ' [Fully Invoiced]' 
                          : hasCust 
                            ? ' [Cust Invoiced]' 
                            : hasSupp 
                              ? ' [Supp Invoiced]' 
                              : ' [No Invoice]';

                        const sCat = v.service_category || (v as any).service_type || 'Service';

                        return (
                          <option key={v.id} value={v.id}>
                            #{vNum} - {v.customer_name || 'Client'} ({sCat}) • Net: {formatCurrency(vCost, vCur)} | Sell: {formatCurrency(vSell, vCur)}{statusTag}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Tour Package Dropdown */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Add Tour Package</label>
                    <select
                      value={selectedPackageId}
                      onChange={(e) => {
                        if (e.target.value) handleAddTourPackage(e.target.value);
                      }}
                      className="w-full bg-white border border-cyan-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-500 font-medium"
                    >
                      <option value="">-- Choose Package --</option>
                      {validPackages.map(p => (
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
                      className="w-full bg-white border border-cyan-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-500 font-medium"
                    >
                      <option value="">-- Choose Hotel --</option>
                      {validHotels.map(h => (
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
                      className="w-full bg-white border border-cyan-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-500 font-medium"
                    >
                      <option value="">-- Choose Flight --</option>
                      {validFlights.map(f => (
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
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="py-2.5 px-3">Item / Service Title</th>
                          <th className="py-2.5 px-3 w-20">Qty</th>
                          <th className="py-2.5 px-3 w-28">Unit Price</th>
                          <th className="py-2.5 px-3 w-28">Total</th>
                          <th className="py-2.5 px-3 text-right w-12">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
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
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingInvoice(null);
                    setTransferredFromRes(null);
                  }}
                  className="px-5 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingInvoice ? 'Save & Update Invoice' : 'Confirm & Issue Invoice'}</span>
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

      {/* VIEW & PRINT OFFICIAL INVOICE MODAL */}
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
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => shareWhatsApp(viewInvoice)}
                  className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer"
                  title="Share Invoice via WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Send via WhatsApp</span>
                </button>
                <button
                  onClick={() => downloadElementAsPDF({
                    elementId: 'invoice-a4-preview-card',
                    filename: `Sofia_Travel_Invoice_${viewInvoice.invoice_number || 'INV'}.pdf`
                  })}
                  className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer shadow-xs"
                  title="Download Invoice as PDF file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={() => printElement('invoice-a4-preview-card', `Sofia_Travel_Invoice_${viewInvoice.invoice_number || 'INV'}`)}
                  className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer shadow-xs"
                  title="Print Invoice on A4 Paper"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print A4 Invoice</span>
                </button>
                <button
                  onClick={() => setViewInvoice(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
                  title="Close Invoice"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* PRINTABLE INVOICE CONTENT */}
            <div id="invoice-a4-preview-card" className="printable-a4 avoid-page-break pt-4 space-y-6">
              {/* Header with Sofia Logo & Company Info */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b-2 border-slate-900">
                <div>
                  <SofiaLogo variant="horizontal" />
                  <p className="text-xs text-slate-500 mt-2 max-w-xs">{settings.address}</p>
                  <p className="text-xs text-slate-500">Tel: {settings.phone} • WhatsApp: {settings.whatsapp}</p>
                  <p className="text-xs text-slate-500">Email: {settings.email} • TRN: {settings.tax_number}</p>
                  <p className="text-xs text-slate-600 font-medium">Instagram: <a href={settings.instagram_url || "https://www.instagram.com/sofiatravel?stkn=MWt1ZGk1NGllams1cg=="} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:text-pink-800 underline font-semibold">(https://www.instagram.com/sofiatravel?stkn=MWt1ZGk1NGllams1cg==)</a></p>
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
                  {viewInvoice.recipient_type === 'Supplier' && viewInvoice.customer_name && (
                    <div className="mt-2 p-2 bg-cyan-50 border border-cyan-200 rounded-lg space-y-0.5">
                      <p className="text-[10px] uppercase font-bold text-cyan-800">Associated Client / Customer Name:</p>
                      <p className="text-xs font-black text-cyan-950">{viewInvoice.customer_name}</p>
                      {viewInvoice.file_number && (
                        <p className="text-[10px] text-cyan-700 font-mono font-bold">File Number: {viewInvoice.file_number}</p>
                      )}
                    </div>
                  )}
                  {viewInvoice.file_number && viewInvoice.recipient_type !== 'Supplier' && (
                    <p className="text-xs font-mono font-bold text-slate-700 mt-1">File #: {viewInvoice.file_number}</p>
                  )}
                  {viewInvoice.recipient_type !== 'Supplier' && (() => {
                    const matched = validCustomers.find(c => c.id === viewInvoice.customer_id || c.customer_id === viewInvoice.customer_id || c.full_name === viewInvoice.customer_name);
                    const code = matched?.customer_id || viewInvoice.customer_id;
                    return code ? (
                      <div className="mt-1 mb-1.5 flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Customer Code:</span>
                        <span className="font-mono font-black text-cyan-800 bg-cyan-100 border border-cyan-300 px-2 py-0.5 rounded text-[11px] tracking-wide">
                          {code}
                        </span>
                      </div>
                    ) : null;
                  })()}
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
                    <div className="text-right">
                      <div>{formatCurrency(viewInvoice.total_amount, viewInvoice.currency)}</div>
                      <div className="text-[10px] text-slate-500 font-mono font-normal">
                        {formatTripleCurrencyString(viewInvoice.total_amount, viewInvoice.currency, settings?.exchange_rates)}
                      </div>
                    </div>
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

              {/* OFFICIAL BANK DETAILS */}
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
