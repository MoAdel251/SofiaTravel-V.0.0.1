import React, { useState } from 'react';
import { 
  Ticket, 
  Search, 
  Plus, 
  Filter, 
  Send, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Users, 
  Calendar, 
  Trash2, 
  Edit3, 
  X, 
  Printer, 
  Share2, 
  MessageSquare, 
  Mail, 
  CreditCard, 
  FileCheck2, 
  ArrowRight, 
  Layers, 
  Building2, 
  Globe2, 
  Car, 
  Ship, 
  Compass, 
  Sun, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle,
  Eye,
  Check,
  Percent,
  Copy,
  Download
} from 'lucide-react';
import { 
  Voucher, 
  VoucherStatus, 
  Customer, 
  Supplier, 
  Employee, 
  CompanySettings, 
  InstallmentDetails, 
  TourPackage,
  VisaService,
  TransferService,
  CruiseService,
  TourService,
  DayTripService,
  Hotel,
  Flight
} from '../types';
import { formatCurrency } from '../utils/currency';

interface VouchersViewProps {
  vouchers: Voucher[];
  customers: Customer[];
  suppliers?: Supplier[];
  employees?: Employee[];
  settings?: CompanySettings;
  invoices?: any[];
  currentCurrency?: string;
  packages?: TourPackage[];
  visas?: VisaService[];
  transfers?: TransferService[];
  cruises?: CruiseService[];
  tours?: TourService[];
  dayTrips?: DayTripService[];
  hotels?: Hotel[];
  flights?: Flight[];
  currentEmployee?: Employee | null;
  onAddVoucher: (data: Partial<Voucher>) => void;
  onUpdateVoucher: (id: string, data: Partial<Voucher>) => void;
  onDeleteVoucher: (id: string) => void;
  onSendVoucher: (id: string, channel: 'WhatsApp' | 'Email' | 'Print', notes?: string) => void;
  onConvertVoucher: (id: string, trip_title?: string, notes?: string) => void;
  onTransferToInvoice?: (reservationOrVoucher: any, targetType?: 'Customer' | 'Supplier') => void;
  onAddInvoice?: (invoiceData: any) => void;
  onNavigateToServices?: () => void;
}

export function VouchersView({
  vouchers = [],
  customers = [],
  suppliers = [],
  employees = [],
  settings,
  packages = [],
  visas = [],
  transfers = [],
  cruises = [],
  tours = [],
  dayTrips = [],
  hotels = [],
  flights = [],
  currentEmployee,
  onAddVoucher,
  onUpdateVoucher,
  onDeleteVoucher,
  onSendVoucher,
  onConvertVoucher
}: VouchersViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [previewVoucher, setPreviewVoucher] = useState<Voucher | null>(null);
  const [sendModalVoucher, setSendModalVoucher] = useState<Voucher | null>(null);
  const [convertModalVoucher, setConvertModalVoucher] = useState<Voucher | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Send modal state
  const [sendChannel, setSendChannel] = useState<'WhatsApp' | 'Email' | 'Print'>('WhatsApp');
  const [customSendNote, setCustomSendNote] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Convert modal state
  const [convertTripTitle, setConvertTripTitle] = useState('');
  const [convertNotes, setConvertNotes] = useState('');

  // Voucher Form State
  const [formData, setFormData] = useState<Partial<Voucher>>({
    service_category: 'Tour Package',
    service_title: 'Classical Egypt Cairo & Nile Cruise 7-Day Package',
    destination: 'Cairo, Luxor & Aswan',
    number_of_travelers: 2,
    adults_count: 2,
    children_count: 0,
    infants_count: 0,
    travel_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    return_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    issue_date: new Date().toISOString().split('T')[0],
    valid_until: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    cost_price: 1200,
    selling_price: 1850,
    paid_amount: 500,
    currency: 'USD',
    payment_method: 'Cash',
    status: 'Draft',
    itinerary_or_details: '7-Day classical program including Giza Pyramids, 4-night 5-star Nile cruise, all transfers and domestic flights.',
    inclusions: ['5-Star Hotels & Nile Cruise', 'Domestic Flights (CAI-LXR / ASW-CAI)', 'Egyptologist Guided Tours', 'Private Airport Transfers'],
    exclusions: ['International Flight Tickets', 'Personal Expenses & Gratuities'],
    terms_conditions: 'Deposit of 30% required upon confirmation. Free cancellation up to 14 days before departure.'
  });

  // Installment Calculator internal state inside form
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [selectedPlanMonths, setSelectedPlanMonths] = useState<number>(6);
  const [downPaymentAmount, setDownPaymentAmount] = useState<number>(0);

  const filteredVouchers = vouchers.filter(v => {
    const matchesSearch = 
      v.voucher_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.service_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.destination?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || v.status === statusFilter;
    const matchesCategory = categoryFilter === 'All' || v.service_category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Calculate Installment Details based on partner rules
  const activePartners = settings?.installment_partners?.filter(p => p.is_active) || [];

  const handleRecalculateInstallment = (
    partnerName: 'ValU' | 'TRU',
    totalPrice: number,
    months: number,
    downPay: number
  ): InstallmentDetails | null => {
    const partner = settings?.installment_partners?.find(p => p.partner_name === partnerName);
    if (!partner) return null;

    const plan = partner.plans?.find(pl => pl.months === months) || partner.plans?.[0];
    if (!plan) return null;

    const financedAmount = Math.max(0, totalPrice - downPay);
    const totalInterest = financedAmount * (plan.interest_rate_percent / 100) * (months / 12);
    const adminFee = financedAmount * (plan.admin_fee_percent / 100);
    const totalPayable = financedAmount + totalInterest + adminFee;
    const monthlyAmount = months > 0 ? totalPayable / months : 0;
    const merchantFee = totalPrice * (plan.merchant_fee_percent / 100);

    return {
      partner_name: partnerName,
      contract_number: partner.contract_number,
      plan_months: months,
      down_payment_amount: downPay,
      financed_amount: financedAmount,
      monthly_installment_amount: Math.round(monthlyAmount * 100) / 100,
      admin_fee_amount: Math.round(adminFee * 100) / 100,
      interest_rate_percent: plan.interest_rate_percent,
      total_interest_amount: Math.round(totalInterest * 100) / 100,
      total_payable_by_customer: Math.round((totalPayable + downPay) * 100) / 100,
      merchant_commission_deducted: Math.round(merchantFee * 100) / 100,
      approval_status: 'Approved',
      transaction_reference: `${partnerName.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`
    };
  };

  const handleOpenAdd = () => {
    setEditingVoucher(null);
    setSelectedPartnerId('');
    setFormData({
      voucher_number: `${settings?.voucher_prefix || 'VCH-2026-'}${Math.floor(1000 + Math.random() * 9000)}`,
      service_category: 'Tour Package',
      service_title: 'Full Egypt Discovery Experience',
      destination: 'Cairo, Nile & Red Sea',
      number_of_travelers: 2,
      adults_count: 2,
      children_count: 0,
      infants_count: 0,
      travel_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      return_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      issue_date: new Date().toISOString().split('T')[0],
      valid_until: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      cost_price: 1000,
      selling_price: 1600,
      paid_amount: 0,
      currency: 'USD',
      payment_method: 'Cash',
      status: 'Draft',
      employee_id: currentEmployee?.id || '',
      employee_name: currentEmployee?.name || 'Sofia Travel Staff',
      itinerary_or_details: '',
      inclusions: ['Hotel Accommodations', 'Private Transport', 'Sightseeing Entrance Fees'],
      terms_conditions: 'Voucher valid until specified validity date. Non-refundable after flight ticketing.'
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (v: Voucher) => {
    setEditingVoucher(v);
    setFormData({ ...v });
    if (v.installment_details) {
      const partner = settings?.installment_partners?.find(p => p.partner_name === v.installment_details?.partner_name);
      if (partner) setSelectedPartnerId(partner.id);
      setSelectedPlanMonths(v.installment_details.plan_months);
      setDownPaymentAmount(v.installment_details.down_payment_amount || 0);
    } else {
      setSelectedPartnerId('');
    }
    setShowAddModal(true);
  };

  const handleSelectPredefinedService = (category: string, serviceId: string) => {
    if (category === 'Tour Package') {
      const p = packages.find(pkg => pkg.id === serviceId);
      if (p) {
        setFormData(prev => ({
          ...prev,
          service_category: 'Tour Package',
          service_title: p.title,
          destination: p.destination,
          cost_price: p.cost_price,
          selling_price: p.selling_price,
          currency: p.currency,
          itinerary_or_details: p.itinerary,
          inclusions: p.included,
          exclusions: p.excluded
        }));
      }
    } else if (category === 'Visa') {
      const vi = visas.find(v => v.id === serviceId);
      if (vi) {
        setFormData(prev => ({
          ...prev,
          service_category: 'Visa',
          service_title: `${vi.country} - ${vi.visa_title}`,
          destination: vi.country,
          cost_price: vi.cost_price,
          selling_price: vi.selling_price,
          currency: vi.currency,
          itinerary_or_details: `Processing Time: ${vi.processing_time} | Method: ${vi.submission_method} | Validity: ${vi.validity_duration}`,
          inclusions: vi.required_documents || []
        }));
      }
    } else if (category === 'Transfer') {
      const tr = transfers.find(t => t.id === serviceId);
      if (tr) {
        setFormData(prev => ({
          ...prev,
          service_category: 'Transfer',
          service_title: tr.service_title,
          destination: `${tr.pickup_location} → ${tr.dropoff_location}`,
          cost_price: tr.cost_price,
          selling_price: tr.selling_price,
          currency: tr.currency,
          itinerary_or_details: `Vehicle: ${tr.vehicle_type} | Duration: ${tr.estimated_duration} | Max Pax: ${tr.max_passengers}`,
          inclusions: tr.amenities || []
        }));
      }
    } else if (category === 'Cruise') {
      const cr = cruises.find(c => c.id === serviceId);
      if (cr) {
        setFormData(prev => ({
          ...prev,
          service_category: 'Cruise',
          service_title: `${cr.cruise_name} (${cr.duration_nights} Nights)`,
          destination: cr.route_itinerary,
          cost_price: cr.cost_price,
          selling_price: cr.selling_price,
          currency: cr.currency,
          itinerary_or_details: `Ship: ${cr.cruise_name} | Cabin: ${cr.cabin_type} | Board: ${cr.board_basis}`,
          inclusions: cr.inclusions || []
        }));
      }
    } else if (category === 'Tour') {
      const tu = tours.find(t => t.id === serviceId);
      if (tu) {
        setFormData(prev => ({
          ...prev,
          service_category: 'Tour',
          service_title: tu.tour_title,
          destination: tu.destination,
          cost_price: tu.cost_price,
          selling_price: tu.selling_price,
          currency: tu.currency,
          itinerary_or_details: tu.itinerary_summary,
          inclusions: tu.inclusions || [],
          exclusions: tu.exclusions || []
        }));
      }
    } else if (category === 'Day Trip') {
      const dt = dayTrips.find(d => d.id === serviceId);
      if (dt) {
        setFormData(prev => ({
          ...prev,
          service_category: 'Day Trip',
          service_title: dt.trip_title,
          destination: dt.city_location,
          cost_price: dt.cost_price,
          selling_price: dt.selling_price,
          currency: dt.currency,
          itinerary_or_details: `Category: ${dt.category} | Duration: ${dt.duration_hours}h | Departure: ${dt.departure_time}`,
          inclusions: dt.inclusions || []
        }));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selling = Number(formData.selling_price) || 0;
    const cost = Number(formData.cost_price) || 0;
    const paid = Number(formData.paid_amount) || 0;
    const profit = selling - cost;
    const remaining = Math.max(0, selling - paid);

    let installmentObj: InstallmentDetails | null = null;
    if (formData.payment_method?.includes('ValU') || formData.payment_method?.includes('TRU')) {
      const partnerName = formData.payment_method.includes('ValU') ? 'ValU' : 'TRU';
      installmentObj = handleRecalculateInstallment(partnerName, selling, selectedPlanMonths, downPaymentAmount);
    }

    const payload: Partial<Voucher> = {
      ...formData,
      selling_price: selling,
      cost_price: cost,
      paid_amount: paid,
      remaining_amount: remaining,
      profit,
      installment_details: installmentObj,
      number_of_travelers: (Number(formData.adults_count) || 1) + (Number(formData.children_count) || 0) + (Number(formData.infants_count) || 0)
    };

    if (editingVoucher) {
      onUpdateVoucher(editingVoucher.id, payload);
    } else {
      onAddVoucher(payload);
    }
    setShowAddModal(false);
  };

  const handleOpenSend = (v: Voucher) => {
    setSendModalVoucher(v);
    setSendChannel('WhatsApp');
    setCustomSendNote(`Dear ${v.customer_name || 'Valued Customer'}, please find attached your confirmed Sofia Travel voucher #${v.voucher_number} for "${v.service_title}". Total: ${formatCurrency(v.selling_price, v.currency)}. Have a memorable journey!`);
  };

  const handleConfirmSend = () => {
    if (!sendModalVoucher) return;
    onSendVoucher(sendModalVoucher.id, sendChannel, customSendNote);
    setSendModalVoucher(null);
  };

  const handleOpenConvert = (v: Voucher) => {
    setConvertModalVoucher(v);
    setConvertTripTitle(v.service_title || 'Confirmed Tourism Trip');
    setConvertNotes('');
  };

  const handleConfirmConvert = () => {
    if (!convertModalVoucher) return;
    onConvertVoucher(convertModalVoucher.id, convertTripTitle, convertNotes);
    setConvertModalVoucher(null);
  };

  return (
    <div className="p-8 space-y-6 bg-slate-50 min-h-screen">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
              <Ticket className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Customer Vouchers & Service Issuance</h1>
              <p className="text-sm text-slate-500">Create branded travel vouchers, send to clients, support ValU / TRU installment plans, and convert vouchers to trips.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Voucher</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Vouchers Issued</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{vouchers.length}</div>
          <span className="text-xs text-slate-500 mt-1 block">All registered vouchers</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Converted to Active Trips</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {vouchers.filter(v => v.status === 'Converted to Trip/Service' || v.reservation_status === 'Confirmed').length}
          </div>
          <span className="text-xs text-emerald-600 mt-1 block">Confirmed bookings in operation</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">ValU / TRU Installments</span>
          <div className="text-2xl font-bold text-purple-600 mt-1">
            {vouchers.filter(v => v.payment_method?.includes('ValU') || v.payment_method?.includes('TRU') || v.installment_details).length}
          </div>
          <span className="text-xs text-purple-600 mt-1 block">Financed via partner agreement</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Voucher Volume</span>
          <div className="text-2xl font-bold text-indigo-600 mt-1">
            ${vouchers.reduce((acc, v) => acc + (v.selling_price || 0), 0).toLocaleString()}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Gross contract value</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xs">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by voucher #, customer name, destination, service..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-500">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700"
            >
              <option value="All">All Categories</option>
              <option value="Tour Package">Tour Package</option>
              <option value="Visa">Visa Service</option>
              <option value="Transfer">Transfer / Fleet</option>
              <option value="Cruise">Nile & Sea Cruise</option>
              <option value="Tour">Guided Tour</option>
              <option value="Day Trip">Day Trip / Safari</option>
              <option value="Hotel">Hotel Booking</option>
              <option value="Flight">Flight Ticket</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700"
            >
              <option value="All">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent to Customer</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Converted to Trip/Service">Converted to Trip/Service</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vouchers Table / Cards Grid */}
      <div className="space-y-4">
        {filteredVouchers.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No Vouchers Found</h3>
            <p className="text-xs text-slate-500 mt-1">Issue a customer voucher for any tourism service or package.</p>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Voucher</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredVouchers.map((v) => {
              const profit = (v.selling_price || 0) - (v.cost_price || 0);
              const isConverted = v.status === 'Converted to Trip/Service' || v.reservation_status === 'Confirmed';
              const isSent = v.status === 'Sent' || !!v.sent_to_customer_at;
              const hasInstallments = !!v.installment_details || v.payment_method?.includes('ValU') || v.payment_method?.includes('TRU');

              return (
                <div 
                  key={v.id}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                >
                  {/* Left Section: Details */}
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-black px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg">
                        {v.voucher_number || v.reservation_id}
                      </span>

                      <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                        {v.service_category || 'Service'}
                      </span>

                      {/* Status Badges */}
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        isConverted
                          ? 'bg-emerald-100 text-emerald-800'
                          : isSent
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {v.status || 'Draft'}
                      </span>

                      {hasInstallments && (
                        <span className="text-xs font-extrabold px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full flex items-center gap-1">
                          <Percent className="w-3 h-3" />
                          {v.installment_details?.partner_name || 'Installments'} ({v.installment_details?.plan_months || 6}M)
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900 leading-snug">{v.service_title}</h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500">
                        <span className="font-semibold text-slate-700">Client: {v.customer_name || 'Individual Traveler'}</span>
                        <span>•</span>
                        <span>Destination: <strong>{v.destination}</strong></span>
                        <span>•</span>
                        <span>Travel Date: <strong>{v.travel_date}</strong></span>
                        <span>•</span>
                        <span>Travelers: <strong>{v.number_of_travelers || 1} Pax</strong></span>
                      </div>
                    </div>

                    {/* Progress / Tracking info */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                      {v.sent_to_customer_at && (
                        <span className="flex items-center gap-1 text-sky-700 font-medium">
                          <Send className="w-3.5 h-3.5" />
                          Sent via {v.sent_via || 'WhatsApp'} on {new Date(v.sent_to_customer_at).toLocaleDateString()}
                        </span>
                      )}
                      {v.converted_at && (
                        <span className="flex items-center gap-1 text-emerald-700 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Converted to Trip on {new Date(v.converted_at).toLocaleDateString()}
                        </span>
                      )}
                      {v.employee_name && (
                        <span className="text-slate-400">
                          Issued by: {v.employee_name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle Section: Financial Summary */}
                  <div className="lg:border-x lg:border-slate-100 lg:px-6 py-2 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3 min-w-[240px]">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Voucher Price</span>
                      <span className="text-sm font-extrabold text-indigo-700">{formatCurrency(v.selling_price, v.currency)}</span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Paid Amount</span>
                      <span className="text-sm font-bold text-emerald-600">{formatCurrency(v.paid_amount, v.currency)}</span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Remaining</span>
                      <span className={`text-sm font-bold ${v.remaining_amount === 0 ? 'text-slate-400' : 'text-rose-600'}`}>
                        {formatCurrency(v.remaining_amount, v.currency)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Agency Profit</span>
                      <span className="text-sm font-bold text-emerald-700">+{formatCurrency(profit, v.currency)}</span>
                    </div>
                  </div>

                  {/* Right Section: Actions */}
                  <div className="flex flex-wrap lg:flex-col items-center justify-end gap-2 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPreviewVoucher(v)}
                        className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                        title="View & Print Voucher"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenSend(v)}
                        className="p-2 text-slate-600 hover:text-sky-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                        title="Send to Customer"
                      >
                        <Send className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(v)}
                        className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                        title="Edit Voucher"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(v.id)}
                        className="p-2 text-slate-600 hover:text-rose-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                        title="Delete Voucher"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {!isConverted ? (
                      <button
                        type="button"
                        onClick={() => handleOpenConvert(v)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer w-full justify-center"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirm & Convert</span>
                      </button>
                    ) : (
                      <div className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-xl text-[11px] font-bold border border-emerald-200 text-center w-full">
                        ✓ Active Trip
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Add / Edit Voucher */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-600 text-white rounded-xl">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {editingVoucher ? 'Edit Customer Voucher' : 'Create & Issue Customer Voucher'}
                  </h2>
                  <p className="text-xs text-slate-500">Record individual tourism services, custom trips, or full tour packages with ValU/TRU installments.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {/* Service Category & Preset Quick Pick */}
              <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Select Tourism Service Type</span>
                  <span className="text-xs text-indigo-600">Quickly load presets or customize below</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                  {[
                    { id: 'Tour Package', label: 'Tour Package', icon: Layers },
                    { id: 'Visa', label: 'Visa Service', icon: FileCheck2 },
                    { id: 'Transfer', label: 'Transfer Fleet', icon: Car },
                    { id: 'Cruise', label: 'Cruise Ship', icon: Ship },
                    { id: 'Tour', label: 'Guided Tour', icon: Compass },
                    { id: 'Day Trip', label: 'Day Trip Safari', icon: Sun },
                    { id: 'Custom', label: 'Custom Service', icon: Sparkles }
                  ].map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = formData.service_category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, service_category: cat.id as any })}
                        className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                          isSelected 
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs font-bold' 
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-indigo-50/50'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-[11px] leading-tight">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Predefined service selection dropdown */}
                {formData.service_category === 'Tour Package' && packages.length > 0 && (
                  <div className="pt-2">
                    <label className="block text-xs font-bold text-indigo-900 mb-1">Load from Tour Package Catalog:</label>
                    <select
                      onChange={(e) => handleSelectPredefinedService('Tour Package', e.target.value)}
                      className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800"
                    >
                      <option value="">-- Choose a Tour Package --</option>
                      {packages.map(p => (
                        <option key={p.id} value={p.id}>{p.title} (${p.selling_price})</option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.service_category === 'Visa' && visas.length > 0 && (
                  <div className="pt-2">
                    <label className="block text-xs font-bold text-indigo-900 mb-1">Load from Visa Services Catalog:</label>
                    <select
                      onChange={(e) => handleSelectPredefinedService('Visa', e.target.value)}
                      className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800"
                    >
                      <option value="">-- Choose a Visa Service --</option>
                      {visas.map(v => (
                        <option key={v.id} value={v.id}>{v.country} - {v.visa_title} (${v.selling_price})</option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.service_category === 'Transfer' && transfers.length > 0 && (
                  <div className="pt-2">
                    <label className="block text-xs font-bold text-indigo-900 mb-1">Load from Transfer Fleet Catalog:</label>
                    <select
                      onChange={(e) => handleSelectPredefinedService('Transfer', e.target.value)}
                      className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800"
                    >
                      <option value="">-- Choose a Transfer Route --</option>
                      {transfers.map(t => (
                        <option key={t.id} value={t.id}>{t.service_title} (${t.selling_price})</option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.service_category === 'Cruise' && cruises.length > 0 && (
                  <div className="pt-2">
                    <label className="block text-xs font-bold text-indigo-900 mb-1">Load from Cruises Catalog:</label>
                    <select
                      onChange={(e) => handleSelectPredefinedService('Cruise', e.target.value)}
                      className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800"
                    >
                      <option value="">-- Choose a Nile / Sea Cruise --</option>
                      {cruises.map(c => (
                        <option key={c.id} value={c.id}>{c.cruise_name} - {c.route_itinerary} (${c.selling_price})</option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.service_category === 'Tour' && tours.length > 0 && (
                  <div className="pt-2">
                    <label className="block text-xs font-bold text-indigo-900 mb-1">Load from Guided Tours Catalog:</label>
                    <select
                      onChange={(e) => handleSelectPredefinedService('Tour', e.target.value)}
                      className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800"
                    >
                      <option value="">-- Choose a Tour Program --</option>
                      {tours.map(t => (
                        <option key={t.id} value={t.id}>{t.tour_title} (${t.selling_price})</option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.service_category === 'Day Trip' && dayTrips.length > 0 && (
                  <div className="pt-2">
                    <label className="block text-xs font-bold text-indigo-900 mb-1">Load from Day Trips & Safaris Catalog:</label>
                    <select
                      onChange={(e) => handleSelectPredefinedService('Day Trip', e.target.value)}
                      className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800"
                    >
                      <option value="">-- Choose a Day Trip Excursion --</option>
                      {dayTrips.map(d => (
                        <option key={d.id} value={d.id}>{d.trip_title} (${d.selling_price})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* General Voucher Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Customer / Guest *</label>
                  <select
                    required
                    value={formData.customer_id || ''}
                    onChange={(e) => {
                      const c = customers.find(cust => cust.id === e.target.value);
                      setFormData({
                        ...formData,
                        customer_id: e.target.value,
                        customer_name: c ? c.name : '',
                        customer_phone: c ? c.phone : '',
                        customer_email: c ? c.email : ''
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="">-- Select Registered Customer --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.phone || c.email})</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Trip / Service Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.service_title || ''}
                    onChange={(e) => setFormData({ ...formData, service_title: e.target.value })}
                    placeholder="e.g. 7-Day Classical Egypt & Nile Cruise VIP"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Destination Region *</label>
                  <input
                    type="text"
                    required
                    value={formData.destination || ''}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    placeholder="e.g. Cairo & Luxor"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Travel Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.travel_date || ''}
                    onChange={(e) => setFormData({ ...formData, travel_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Return / End Date</label>
                  <input
                    type="date"
                    value={formData.return_date || ''}
                    onChange={(e) => setFormData({ ...formData, return_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                {/* Travelers breakdown */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Adults Count</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.adults_count || 1}
                    onChange={(e) => setFormData({ ...formData, adults_count: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Children Count (2-11 Yrs)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.children_count || 0}
                    onChange={(e) => setFormData({ ...formData, children_count: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Infants Count (0-2 Yrs)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.infants_count || 0}
                    onChange={(e) => setFormData({ ...formData, infants_count: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              {/* Financial Pricing & Installments */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">Financial Calculation & Payment Mode</span>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Net Cost Price</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.cost_price || 0}
                      onChange={(e) => setFormData({ ...formData, cost_price: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-indigo-700 mb-1">Selling Price to Customer *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formData.selling_price || 0}
                      onChange={(e) => setFormData({ ...formData, selling_price: Number(e.target.value) })}
                      className="w-full bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl px-3 py-1.5 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Paid / Advance Amount</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.paid_amount || 0}
                      onChange={(e) => setFormData({ ...formData, paid_amount: Number(e.target.value) })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Payment Method</label>
                    <select
                      value={formData.payment_method || 'Cash'}
                      onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="InstaPay">InstaPay</option>
                      <option value="ValU (Installments)">ValU (Installments)</option>
                      <option value="TRU (Installments)">TRU (Installments)</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* ValU / TRU Installment Configuration Panel */}
                {(formData.payment_method?.includes('ValU') || formData.payment_method?.includes('TRU')) && (
                  <div className="mt-3 p-4 bg-purple-50 rounded-xl border border-purple-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-purple-600 text-white rounded-lg">
                          <Percent className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-purple-950">
                          {formData.payment_method?.includes('ValU') ? 'ValU Financing Agreement' : 'TRU Financing Agreement'} Setup
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-purple-700 bg-white px-2 py-0.5 rounded-md border border-purple-200">
                        Merchant: {formData.payment_method?.includes('ValU') ? 'VALU-SOFIA-88219' : 'TRU-SOFIA-77340'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-purple-900 mb-1">Installment Tenor (Months)</label>
                        <select
                          value={selectedPlanMonths}
                          onChange={(e) => setSelectedPlanMonths(Number(e.target.value))}
                          className="w-full bg-white border border-purple-200 rounded-xl px-3 py-1.5 text-xs font-bold text-purple-950"
                        >
                          <option value="3">3 Months (0% Promo)</option>
                          <option value="6">6 Months (0% Interest)</option>
                          <option value="9">9 Months</option>
                          <option value="12">12 Months (Standard)</option>
                          <option value="18">18 Months</option>
                          <option value="24">24 Months</option>
                          <option value="36">36 Months</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-purple-900 mb-1">Down Payment Amount</label>
                        <input
                          type="number"
                          value={downPaymentAmount}
                          onChange={(e) => setDownPaymentAmount(Number(e.target.value))}
                          className="w-full bg-white border border-purple-200 rounded-xl px-3 py-1.5 text-xs font-semibold"
                        />
                      </div>

                      {/* Calculated Monthly installment preview */}
                      <div className="bg-white p-2.5 rounded-xl border border-purple-200 text-center flex flex-col justify-center">
                        <span className="text-[10px] uppercase font-bold text-purple-600 block">Monthly Installment</span>
                        <span className="text-sm font-black text-purple-900">
                          {(() => {
                            const partnerName = formData.payment_method?.includes('ValU') ? 'ValU' : 'TRU';
                            const calc = handleRecalculateInstallment(partnerName, Number(formData.selling_price) || 0, selectedPlanMonths, downPaymentAmount);
                            return calc ? `${formatCurrency(calc.monthly_installment_amount, formData.currency || 'USD')} / mo` : '$0';
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Itinerary / Details */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Itinerary / Service Details</label>
                <textarea
                  rows={2}
                  value={formData.itinerary_or_details || ''}
                  onChange={(e) => setFormData({ ...formData, itinerary_or_details: e.target.value })}
                  placeholder="Detailed day-by-day program, pickup timings, or service schedule..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  {editingVoucher ? 'Save Changes' : 'Issue Voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View & Print Branded Voucher */}
      {previewVoucher && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-8 shadow-2xl border border-slate-200 my-8 space-y-6">
            {/* Header / Actions toolbar */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Official Customer Voucher Preview</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Voucher</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewVoucher(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Branded Voucher Layout */}
            <div className="border-2 border-indigo-600 rounded-2xl p-6 bg-white space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-0" />

              {/* Company & Voucher Header */}
              <div className="flex justify-between items-start relative z-10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{settings?.logo || '✈️'}</span>
                    <span className="text-xl font-black text-slate-900 tracking-tight">{settings?.company_name || 'Sofia Travel'}</span>
                  </div>
                  <p className="text-xs text-slate-500">{settings?.address || '124 Tahrir Square, Cairo, Egypt'}</p>
                  <p className="text-xs text-slate-500">Tel: {settings?.phone || '+20 2 25750000'} | Web: {settings?.website || 'www.sofiatravel.com'}</p>
                </div>

                <div className="text-right">
                  <span className="px-3 py-1 bg-indigo-600 text-white font-mono text-xs font-extrabold rounded-lg inline-block">
                    {previewVoucher.voucher_number || previewVoucher.reservation_id}
                  </span>
                  <div className="text-xs text-slate-500 mt-1">Issue Date: {previewVoucher.issue_date || new Date().toISOString().split('T')[0]}</div>
                  <div className="text-xs text-slate-500">Valid Until: {previewVoucher.valid_until || 'N/A'}</div>
                </div>
              </div>

              {/* Guest & Service Header Block */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 font-bold uppercase block text-[10px]">Guest / Traveler Name</span>
                  <span className="font-bold text-sm text-slate-900">{previewVoucher.customer_name || 'Valued Customer'}</span>
                  {previewVoucher.customer_phone && <p className="text-slate-500 mt-0.5">Phone: {previewVoucher.customer_phone}</p>}
                </div>

                <div>
                  <span className="text-slate-400 font-bold uppercase block text-[10px]">Service Category</span>
                  <span className="font-bold text-sm text-indigo-700">{previewVoucher.service_category}</span>
                  <p className="text-slate-500 mt-0.5">Travelers: <strong>{previewVoucher.number_of_travelers || 1} Person(s)</strong></p>
                </div>
              </div>

              {/* Service & Itinerary Detail */}
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Service Description</span>
                  <h4 className="text-base font-bold text-slate-900">{previewVoucher.service_title}</h4>
                  <div className="text-xs text-slate-600 mt-1 flex gap-4">
                    <span>Destination: <strong>{previewVoucher.destination}</strong></span>
                    <span>Travel Date: <strong>{previewVoucher.travel_date}</strong></span>
                    {previewVoucher.return_date && <span>Return Date: <strong>{previewVoucher.return_date}</strong></span>}
                  </div>
                </div>

                {previewVoucher.itinerary_or_details && (
                  <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 leading-relaxed border border-slate-100">
                    <span className="font-bold block mb-1">Itinerary / Program:</span>
                    {previewVoucher.itinerary_or_details}
                  </div>
                )}

                {previewVoucher.inclusions && previewVoucher.inclusions.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-800">Confirmed Inclusions:</span>
                    <ul className="grid grid-cols-2 gap-1 text-xs text-slate-600 pl-1">
                      {previewVoucher.inclusions.map((inc, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{inc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Installment Badge if applicable */}
              {previewVoucher.installment_details && (
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs text-purple-900 flex items-center justify-between">
                  <div>
                    <span className="font-bold flex items-center gap-1">
                      <Percent className="w-4 h-4 text-purple-700" />
                      Financed through {previewVoucher.installment_details.partner_name} Agreement
                    </span>
                    <span className="text-purple-700 text-[11px]">
                      {previewVoucher.installment_details.plan_months} Monthly Installments of {formatCurrency(previewVoucher.installment_details.monthly_installment_amount, previewVoucher.currency)}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] font-bold bg-white px-2 py-1 rounded-md border border-purple-200">
                    Ref: {previewVoucher.installment_details.transaction_reference}
                  </span>
                </div>
              )}

              {/* Pricing & Total */}
              <div className="border-t border-slate-200 pt-4 flex justify-between items-center">
                <div>
                  <span className="text-xs text-slate-500 block">Payment Method: {previewVoucher.payment_method || 'Standard'}</span>
                  <span className={`text-xs font-bold ${previewVoucher.remaining_amount === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                    Payment Status: {previewVoucher.payment_status || 'Confirmed'}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 block font-bold uppercase">Total Voucher Price</span>
                  <span className="text-2xl font-black text-indigo-700">{formatCurrency(previewVoucher.selling_price, previewVoucher.currency)}</span>
                </div>
              </div>

              {/* Terms & Footer */}
              <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 text-center leading-tight">
                Please present this voucher upon arrival. For 24/7 assistance or changes, contact Sofia Travel Operations at {settings?.whatsapp || '+20 100 123 4567'}.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Send Voucher to Customer */}
      {sendModalVoucher && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
                  <Send className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Send Voucher to Customer</h3>
              </div>
              <button
                type="button"
                onClick={() => setSendModalVoucher(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Delivery Channel:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'WhatsApp', label: 'WhatsApp', icon: MessageSquare, color: 'text-emerald-600' },
                    { id: 'Email', label: 'Email', icon: Mail, color: 'text-indigo-600' },
                    { id: 'Print', label: 'Direct Print', icon: Printer, color: 'text-slate-700' }
                  ].map((ch) => {
                    const Icon = ch.icon;
                    const isSelected = sendChannel === ch.id;
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => setSendChannel(ch.id as any)}
                        className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                          isSelected 
                            ? 'bg-sky-50 border-sky-500 font-bold text-sky-900' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${ch.color}`} />
                        <span className="text-xs">{ch.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Customer Contact:</label>
                <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 text-slate-700">
                  <div><strong>Name:</strong> {sendModalVoucher.customer_name || 'Client'}</div>
                  <div><strong>Phone / WhatsApp:</strong> {sendModalVoucher.customer_phone || '+20 100 000 0000'}</div>
                  <div><strong>Email:</strong> {sendModalVoucher.customer_email || 'client@example.com'}</div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Message Content:</label>
                <textarea
                  rows={4}
                  value={customSendNote}
                  onChange={(e) => setCustomSendNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSendModalVoucher(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSend}
                className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Confirm & Send Voucher</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirm & Convert to Trip */}
      {convertModalVoucher && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Confirm & Convert Voucher to Trip</h3>
                  <p className="text-xs text-slate-500">Transfers voucher #{convertModalVoucher.voucher_number} into an active confirmed booking.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConvertModalVoucher(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirmed Trip Title:</label>
                <input
                  type="text"
                  value={convertTripTitle}
                  onChange={(e) => setConvertTripTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Internal Operations Notes:</label>
                <textarea
                  rows={3}
                  value={convertNotes}
                  onChange={(e) => setConvertNotes(e.target.value)}
                  placeholder="e.g. Deposit received, driver assigned, Nile cruise cabin 304 confirmed."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConvertModalVoucher(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmConvert}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirm & Activate Trip</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">Delete Voucher</h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">Are you sure you want to delete this customer voucher?</p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteConfirmId) onDeleteVoucher(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
