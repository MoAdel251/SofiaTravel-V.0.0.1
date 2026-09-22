import React, { useState } from 'react';
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  MapPin, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  MessageSquare, 
  Plus, 
  Printer, 
  FileText, 
  Plane, 
  Building2, 
  Ship, 
  Compass, 
  FileCheck, 
  Sun, 
  Briefcase, 
  ShieldCheck, 
  MessageCircle,
  ChevronRight,
  Send,
  UserCheck,
  Tag,
  Receipt,
  Sparkles,
  History
} from 'lucide-react';
import { 
  Customer, 
  Invoice, 
  Reservation, 
  Voucher, 
  CustomerPayment, 
  CustomerInquiry, 
  Employee, 
  ActivityLog, 
  CompanySettings,
  CustomerCommunication
} from '../types';
import { SofiaLogo } from './SofiaLogo';

interface CustomerOverviewModalProps {
  customer: Customer;
  onClose: () => void;
  invoices?: Invoice[];
  reservations?: Reservation[];
  vouchers?: Voucher[];
  customerPayments?: CustomerPayment[];
  customerInquiries?: CustomerInquiry[];
  employees?: Employee[];
  activityLogs?: ActivityLog[];
  visas?: any[];
  flights?: any[];
  hotels?: any[];
  transfers?: any[];
  cruises?: any[];
  tours?: any[];
  dayTrips?: any[];
  settings?: CompanySettings;
  currentUsername?: string;
  onUpdateCustomer?: (id: string, data: Partial<Customer>) => void;
  onOpenStatement?: (cust: Customer) => void;
  onLogCommunication?: (customerId: string, communication: { employee_name: string; channel: string; notes: string; outcome?: string; date?: string }) => Promise<void>;
}

interface UnifiedServiceItem {
  id: string;
  code: string;
  category: 'Flight' | 'Hotel' | 'Tour Package' | 'Visa' | 'Transfer' | 'Cruise' | 'Tour' | 'Day Trip' | 'Custom';
  title: string;
  destination?: string;
  dates: string;
  rawDate?: string;
  status: string;
  selling_price: number;
  paid_amount: number;
  remaining_amount: number;
  currency: string;
  responsible_employee: string;
  responsible_position?: string;
  is_completed: boolean;
  notes?: string;
}

interface CommunicationRecord {
  id: string;
  date: string;
  employee_name: string;
  channel: string;
  notes: string;
  outcome?: string;
  source: string;
}

export function CustomerOverviewModal({
  customer,
  onClose,
  invoices = [],
  reservations = [],
  vouchers = [],
  customerPayments = [],
  customerInquiries = [],
  employees = [],
  activityLogs = [],
  visas = [],
  flights = [],
  hotels = [],
  transfers = [],
  cruises = [],
  tours = [],
  dayTrips = [],
  settings,
  currentUsername = 'Staff Member',
  onUpdateCustomer,
  onOpenStatement,
  onLogCommunication
}: CustomerOverviewModalProps) {
  const [activeTab, setActiveTab] = useState<'current' | 'previous' | 'all' | 'communications'>('current');
  const [showLogModal, setShowLogModal] = useState(false);
  const [isSubmittingComm, setIsSubmittingComm] = useState(false);
  const [commChannel, setCommChannel] = useState<'WhatsApp' | 'Phone Call' | 'Email' | 'Office Visit' | 'Instagram'>('WhatsApp');
  const [commEmployee, setCommEmployee] = useState(currentUsername);
  const [commNotes, setCommNotes] = useState('');
  const [commOutcome, setCommOutcome] = useState('Service follow-up completed');

  const todayStr = new Date().toISOString().split('T')[0];

  // ----------------------------------------------------
  // 1. GATHER ALL SERVICES & BOOKINGS FOR THIS CUSTOMER
  // ----------------------------------------------------
  const unifiedServices: UnifiedServiceItem[] = [];

  // Match vouchers / reservations
  const custVouchers = vouchers.filter(v => 
    v.customer_id === customer.id || 
    v.customer_id === customer.customer_id || 
    (v.customer_name && v.customer_name.toLowerCase() === customer.full_name.toLowerCase())
  );

  custVouchers.forEach(v => {
    const isCompleted = 
      v.status === 'Completed' || 
      v.reservation_status === 'Completed' || 
      (Boolean(v.return_date) && v.return_date! < todayStr) ||
      (!v.return_date && Boolean(v.travel_date) && v.travel_date < todayStr && v.status !== 'Draft' && v.status !== 'Confirmed');

    const empObj = employees.find(e => e.id === v.employee_id || e.name === v.employee_name);
    const empResponsible = v.employee_name || empObj?.name || 'Ahmed Ali (Lead Coordinator)';
    const empPos = empObj?.position || 'Travel Consultant';

    const price = Number(v.selling_price) || 0;
    const paid = Number(v.paid_amount) || 0;
    const remaining = v.remaining_amount !== undefined ? Number(v.remaining_amount) : Math.max(0, price - paid);

    unifiedServices.push({
      id: v.id,
      code: v.voucher_number || v.id,
      category: v.service_category || 'Tour Package',
      title: v.service_title || `${v.service_category} Booking`,
      destination: v.destination || 'Cairo, Egypt',
      dates: v.travel_date ? `${v.travel_date}${v.return_date ? ` to ${v.return_date}` : ''}` : 'Date Scheduled',
      rawDate: v.travel_date,
      status: v.status || v.reservation_status || 'Confirmed',
      selling_price: price,
      paid_amount: paid,
      remaining_amount: remaining,
      currency: (v.currency || 'USD').toUpperCase(),
      responsible_employee: empResponsible,
      responsible_position: empPos,
      is_completed: isCompleted,
      notes: v.notes || v.itinerary_or_details
    });
  });

  // Standalone Visas (not already in vouchers)
  const custVisas = visas.filter(vi => 
    (vi.customer_id === customer.id || vi.customer_name === customer.full_name) &&
    !custVouchers.some(v => v.service_reference_id === vi.id)
  );
  custVisas.forEach(vi => {
    const price = Number(vi.selling_price) || 0;
    const paid = vi.paid_amount !== undefined ? Number(vi.paid_amount) : (vi.payment_status === 'Paid' ? price : 0);
    const remaining = Math.max(0, price - paid);
    unifiedServices.push({
      id: vi.id,
      code: `VISA-${vi.id.substring(0, 5).toUpperCase()}`,
      category: 'Visa',
      title: vi.visa_title || `${vi.country} Visa (${vi.visa_type || 'Tourist'})`,
      destination: vi.country,
      dates: `Validity: ${vi.validity_duration || '30 Days'}`,
      status: vi.status === 'Active' ? 'Active Processing' : 'Completed',
      selling_price: price,
      paid_amount: paid,
      remaining_amount: remaining,
      currency: (vi.currency || 'USD').toUpperCase(),
      responsible_employee: (vi as any).employee_name || 'Sarah Mansour (Visa Desk)',
      responsible_position: 'Visa Operations Specialist',
      is_completed: vi.status !== 'Active',
      notes: vi.notes
    });
  });

  // Standalone Flights
  const custFlights = flights.filter(fl => 
    (fl.customer_id === customer.id || fl.customer_name === customer.full_name || fl.passenger === customer.full_name) &&
    !custVouchers.some(v => v.service_reference_id === fl.id)
  );
  custFlights.forEach(fl => {
    const isCompleted = fl.status === 'Completed' || (Boolean(fl.departure_date) && fl.departure_date < todayStr);
    const price = Number(fl.selling_price) || 0;
    const paid = fl.paid_amount !== undefined ? Number(fl.paid_amount) : (fl.payment_status === 'Paid' ? price : 0);
    const remaining = Math.max(0, price - paid);
    unifiedServices.push({
      id: fl.id,
      code: fl.ticket_number || fl.booking_reference || `FL-${fl.id.substring(0, 5).toUpperCase()}`,
      category: 'Flight',
      title: `${fl.airline || 'Flight'} (${fl.flight_number || 'Tkt'}): ${fl.departure_airport} → ${fl.arrival_airport}`,
      destination: fl.arrival_airport,
      dates: fl.departure_date ? `${fl.departure_date} ${fl.departure_time || ''}` : 'Scheduled Flight',
      rawDate: fl.departure_date,
      status: fl.status || 'Confirmed',
      selling_price: price,
      paid_amount: paid,
      remaining_amount: remaining,
      currency: (fl.currency || 'USD').toUpperCase(),
      responsible_employee: (fl as any).employee_name || 'Ahmed Ali (Flight Desk)',
      responsible_position: 'Ticketing Specialist',
      is_completed: isCompleted
    });
  });

  // Standalone Hotels
  const custHotels = hotels.filter(ht => 
    (ht.customer_id === customer.id || ht.customer_name === customer.full_name) &&
    !custVouchers.some(v => v.service_reference_id === ht.id)
  );
  custHotels.forEach(ht => {
    const isCompleted = Boolean(ht.check_out_date && ht.check_out_date < todayStr);
    const price = Number(ht.selling_price) || 0;
    const paid = ht.paid_amount !== undefined ? Number(ht.paid_amount) : (ht.payment_status === 'Paid' ? price : 0);
    const remaining = Math.max(0, price - paid);
    unifiedServices.push({
      id: ht.id,
      code: `HTL-${ht.id.substring(0, 5).toUpperCase()}`,
      category: 'Hotel',
      title: `${ht.hotel_name} (${ht.city || 'Egypt'})`,
      destination: ht.city,
      dates: ht.check_in_date ? `${ht.check_in_date} to ${ht.check_out_date || 'Check-out'}` : 'Lodging Stay',
      rawDate: ht.check_in_date,
      status: isCompleted ? 'Completed' : 'Confirmed Booking',
      selling_price: price,
      paid_amount: paid,
      remaining_amount: remaining,
      currency: (ht.currency || 'USD').toUpperCase(),
      responsible_employee: (ht as any).employee_name || 'Mona Youssef (Hospitality Desk)',
      responsible_position: 'Hotel Reservations Agent',
      is_completed: isCompleted,
      notes: ht.notes
    });
  });

  // Standalone Transfers
  const custTransfers = transfers.filter(tr => 
    (tr.customer_id === customer.id || tr.customer_name === customer.full_name) &&
    !custVouchers.some(v => v.service_reference_id === tr.id)
  );
  custTransfers.forEach(tr => {
    const price = Number(tr.selling_price) || 0;
    const paid = tr.paid_amount !== undefined ? Number(tr.paid_amount) : (tr.payment_status === 'Paid' ? price : 0);
    const remaining = Math.max(0, price - paid);
    unifiedServices.push({
      id: tr.id,
      code: `TRF-${tr.id.substring(0, 5).toUpperCase()}`,
      category: 'Transfer',
      title: `${tr.service_title || 'Private Chauffeur Transfer'} (${tr.pickup_location} → ${tr.dropoff_location})`,
      destination: tr.dropoff_location,
      dates: tr.vehicle_type || 'Private Transport',
      status: tr.status === 'Active' ? 'Active Service' : 'Completed',
      selling_price: price,
      paid_amount: paid,
      remaining_amount: remaining,
      currency: (tr.currency || 'USD').toUpperCase(),
      responsible_employee: tr.driver_name ? `Driver: ${tr.driver_name}` : 'Karim Adel (Fleet Logistics)',
      responsible_position: 'Transport Coordinator',
      is_completed: tr.status !== 'Active',
      notes: tr.notes
    });
  });

  // Standalone Cruises
  const custCruises = cruises.filter(cr => 
    (cr.customer_id === customer.id || cr.customer_name === customer.full_name) &&
    !custVouchers.some(v => v.service_reference_id === cr.id)
  );
  custCruises.forEach(cr => {
    const price = Number(cr.selling_price) || 0;
    const paid = cr.paid_amount !== undefined ? Number(cr.paid_amount) : (cr.payment_status === 'Paid' ? price : 0);
    const remaining = Math.max(0, price - paid);
    unifiedServices.push({
      id: cr.id,
      code: `CRU-${cr.id.substring(0, 5).toUpperCase()}`,
      category: 'Cruise',
      title: `${cr.cruise_name} (${cr.cruise_category || 'Nile Cruise'})`,
      destination: cr.route || 'Luxor - Aswan',
      dates: `${cr.duration_nights || 4} Nights Sail`,
      status: cr.status === 'Active' ? 'Confirmed Cruise' : 'Completed',
      selling_price: price,
      paid_amount: paid,
      remaining_amount: remaining,
      currency: (cr.currency || 'USD').toUpperCase(),
      responsible_employee: (cr as any).employee_name || 'Sarah Mansour (Cruise Desk)',
      responsible_position: 'Senior Cruise Specialist',
      is_completed: cr.status !== 'Active'
    });
  });

  // Standalone Tours & Day Trips
  const custTours = tours.filter(to => 
    (to.customer_id === customer.id || to.customer_name === customer.full_name) &&
    !custVouchers.some(v => v.service_reference_id === to.id)
  );
  custTours.forEach(to => {
    const price = Number(to.selling_price) || 0;
    const paid = to.paid_amount !== undefined ? Number(to.paid_amount) : (to.payment_status === 'Paid' ? price : 0);
    const remaining = Math.max(0, price - paid);
    unifiedServices.push({
      id: to.id,
      code: `TOR-${to.id.substring(0, 5).toUpperCase()}`,
      category: 'Tour',
      title: to.tour_title,
      destination: to.destination,
      dates: `${to.duration_days || 1} Days Excursion`,
      status: to.status === 'Active' ? 'Confirmed Tour' : 'Completed',
      selling_price: price,
      paid_amount: paid,
      remaining_amount: remaining,
      currency: (to.currency || 'USD').toUpperCase(),
      responsible_employee: (to as any).employee_name || 'Karim Adel (Tour Operations)',
      responsible_position: 'Tour Guide & Leader',
      is_completed: to.status !== 'Active'
    });
  });

  const custDayTrips = dayTrips.filter(dt => 
    (dt.customer_id === customer.id || dt.customer_name === customer.full_name) &&
    !custVouchers.some(v => v.service_reference_id === dt.id)
  );
  custDayTrips.forEach(dt => {
    const price = Number(dt.selling_price) || 0;
    const paid = dt.paid_amount !== undefined ? Number(dt.paid_amount) : (dt.payment_status === 'Paid' ? price : 0);
    const remaining = Math.max(0, price - paid);
    unifiedServices.push({
      id: dt.id,
      code: `DTR-${dt.id.substring(0, 5).toUpperCase()}`,
      category: 'Day Trip',
      title: dt.trip_title,
      destination: dt.location_city || dt.city_location,
      dates: `${dt.duration_hours || 8} Hours Safari/Tour`,
      status: dt.status === 'Active' ? 'Confirmed Excursion' : 'Completed',
      selling_price: price,
      paid_amount: paid,
      remaining_amount: remaining,
      currency: (dt.currency || 'USD').toUpperCase(),
      responsible_employee: (dt as any).employee_name || 'Mona Youssef (Field Excursions)',
      responsible_position: 'Field Operations Specialist',
      is_completed: dt.status !== 'Active'
    });
  });

  // Split into:
  // 1. Current bookings or ongoing services
  // 2. Previous bookings or completed services
  const currentServices = unifiedServices.filter(s => !s.is_completed && s.status !== 'Cancelled');
  const previousServices = unifiedServices.filter(s => s.is_completed || s.status === 'Cancelled' || s.status === 'Completed');

  // ----------------------------------------------------
  // 2. CONSOLIDATE FINANCIALS BY CURRENCY (DO NOT MIX CURRENCIES)
  // ----------------------------------------------------
  // Sofia Travel operates strictly across 3 distinct currencies: USD, EGP, EUR.
  const custInvoices = invoices.filter(inv => 
    inv.customer_id === customer.id || 
    inv.customer_id === customer.customer_id
  );

  const calculateCurrencyTotals = (currCode: 'USD' | 'EGP' | 'EUR') => {
    const symbol = currCode === 'USD' ? '$' : currCode === 'EUR' ? '€' : 'EGP';
    const invForCurr = custInvoices.filter(i => (i.currency || 'USD').toUpperCase() === currCode);
    const servForCurr = unifiedServices.filter(s => s.currency === currCode);

    let totalAmount = 0;
    let totalPaid = 0;
    let totalRemaining = 0;

    if (invForCurr.length > 0) {
      invForCurr.forEach(inv => {
        totalAmount += Number(inv.total_amount) || 0;
        totalPaid += Number(inv.paid_amount) || 0;
        totalRemaining += Number(inv.balance_due) || 0;
      });
    } else if (servForCurr.length > 0) {
      servForCurr.forEach(s => {
        totalAmount += s.selling_price;
        totalPaid += s.paid_amount;
        totalRemaining += s.remaining_amount;
      });
    } else if ((customer.currency || 'USD').toUpperCase() === currCode && Number(customer.outstanding_balance) > 0) {
      totalAmount = Number(customer.outstanding_balance) || 0;
      totalPaid = 0;
      totalRemaining = totalAmount;
    }

    // Direct payments cross-check if present
    const directPayments = customerPayments.filter(p => 
      (p.customer_id === customer.id || p.customer_id === customer.customer_id) &&
      (p.currency || 'USD').toUpperCase() === currCode
    );
    const directPaidSum = directPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    if (directPaidSum > totalPaid) {
      totalPaid = directPaidSum;
      totalRemaining = Math.max(0, totalAmount - totalPaid);
    }

    const hasActivity = totalAmount > 0 || totalPaid > 0 || totalRemaining > 0 || (customer.currency || 'USD').toUpperCase() === currCode;

    return {
      code: currCode,
      symbol,
      totalAmount,
      totalPaid,
      totalRemaining,
      invoiceCount: invForCurr.length,
      serviceCount: servForCurr.length,
      hasActivity
    };
  };

  const usdFinancials = calculateCurrencyTotals('USD');
  const egpFinancials = calculateCurrencyTotals('EGP');
  const eurFinancials = calculateCurrencyTotals('EUR');
  const currencyLedgers = [usdFinancials, egpFinancials, eurFinancials];

  // Helper formatting with exact currency symbol
  const formatExactCurrency = (amount: number, currCode: string) => {
    const val = Number(amount) || 0;
    const formatted = val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (currCode === 'USD') return `$${formatted}`;
    if (currCode === 'EUR') return `€${formatted}`;
    return `EGP ${formatted}`;
  };

  // ----------------------------------------------------
  // 3. LAST EMPLOYEE WHO COMMUNICATED WITH THE CUSTOMER
  // ----------------------------------------------------
  const communicationsList: CommunicationRecord[] = [];

  // A. Customer's direct communications history
  if (customer.communications_history && Array.isArray(customer.communications_history)) {
    customer.communications_history.forEach(c => {
      communicationsList.push({
        id: c.id,
        date: c.date,
        employee_name: c.employee_name,
        channel: c.channel,
        notes: c.notes,
        outcome: c.outcome,
        source: 'Customer Profile Direct Log'
      });
    });
  }

  // B. Legacy direct customer field
  if (customer.last_communicated_by && customer.last_communicated_date) {
    if (!communicationsList.some(c => c.date === customer.last_communicated_date && c.employee_name === customer.last_communicated_by)) {
      communicationsList.push({
        id: 'legacy-contact',
        date: customer.last_communicated_date,
        employee_name: customer.last_communicated_by,
        channel: 'Phone Call / Direct Message',
        notes: customer.last_communication_notes || 'Customer inquiry follow-up & booking coordination',
        source: 'CRM Profile Record'
      });
    }
  }

  // C. Inquiries follow-ups
  const matchingInquiries = customerInquiries.filter(inq => 
    inq.converted_to_customer_id === customer.id ||
    inq.phone === customer.phone ||
    inq.phone === customer.whatsapp_number ||
    (inq.name && inq.name.toLowerCase() === customer.full_name.toLowerCase())
  );

  matchingInquiries.forEach(inq => {
    if (inq.follow_up_history && inq.follow_up_history.length > 0) {
      inq.follow_up_history.forEach(f => {
        communicationsList.push({
          id: f.id,
          date: f.date,
          employee_name: f.representative_name,
          channel: f.channel,
          notes: f.notes,
          outcome: f.outcome,
          source: `Inquiry Follow-up (${inq.inquiry_code})`
        });
      });
    } else if (inq.assigned_representative) {
      communicationsList.push({
        id: `inq-assigned-${inq.id}`,
        date: inq.last_updated || inq.created_at,
        employee_name: inq.assigned_representative,
        channel: inq.inquiry_source || 'WhatsApp',
        notes: `Initial lead intake: Inquired about ${inq.inquired_service}`,
        source: `Inquiry Record (${inq.inquiry_code})`
      });
    }
  });

  // D. Activity logs mentioning this customer
  const custActivityLogs = activityLogs.filter(log => 
    log.record === customer.customer_id || 
    log.record === customer.id || 
    (log.action && log.action.toLowerCase().includes(customer.full_name.toLowerCase()))
  );
  custActivityLogs.forEach(log => {
    communicationsList.push({
      id: log.id,
      date: log.date ? `${log.date}T${log.time || '12:00:00'}` : new Date().toISOString(),
      employee_name: log.user_name,
      channel: 'System Operation / Service Update',
      notes: log.action,
      source: 'Audit Activity Log'
    });
  });

  // E. Most recent voucher / service update
  custVouchers.forEach(v => {
    if (v.sent_to_customer_at || v.issue_date) {
      communicationsList.push({
        id: `voucher-comm-${v.id}`,
        date: v.sent_to_customer_at || v.issue_date,
        employee_name: v.employee_name || 'Staff Representative',
        channel: v.sent_via || 'Direct Dispatch',
        notes: `Issued booking voucher: ${v.service_title} (${v.voucher_number || v.id})`,
        source: 'Voucher Dispatch'
      });
    }
  });

  // Sort descending by date
  communicationsList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Pick the most recent communication
  const lastCommunication = communicationsList.length > 0 ? communicationsList[0] : null;

  // Handle logging new communication
  const handleSaveCommunication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commNotes.trim()) return;

    setIsSubmittingComm(true);
    const now = new Date().toISOString();

    if (onLogCommunication) {
      await onLogCommunication(customer.id, {
        employee_name: commEmployee,
        channel: commChannel,
        notes: commNotes,
        outcome: commOutcome,
        date: now
      });
    } else {
      // Fallback via fetch
      try {
        await fetch(`/api/customers/${customer.id}/log-communication`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-acting-user': commEmployee
          },
          body: JSON.stringify({
            employee_name: commEmployee,
            channel: commChannel,
            notes: commNotes,
            outcome: commOutcome,
            date: now
          })
        });
        if (onUpdateCustomer) {
          onUpdateCustomer(customer.id, {
            last_communicated_by: commEmployee,
            last_communicated_date: now,
            last_communication_notes: commNotes
          });
        }
      } catch (err) {
        console.error("Error logging customer communication:", err);
      }
    }

    setIsSubmittingComm(false);
    setShowLogModal(false);
    setCommNotes('');
  };

  const getServiceCategoryIcon = (category: string) => {
    switch (category) {
      case 'Flight': return <Plane className="w-4 h-4 text-sky-600" />;
      case 'Hotel': return <Building2 className="w-4 h-4 text-indigo-600" />;
      case 'Cruise': return <Ship className="w-4 h-4 text-cyan-600" />;
      case 'Visa': return <FileCheck className="w-4 h-4 text-emerald-600" />;
      case 'Transfer': return <Compass className="w-4 h-4 text-amber-600" />;
      case 'Tour': return <Briefcase className="w-4 h-4 text-purple-600" />;
      case 'Day Trip': return <Sun className="w-4 h-4 text-orange-600" />;
      default: return <Tag className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200 my-6 max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER */}
        <div className="px-6 py-5 bg-linear-to-r from-slate-900 via-slate-800 to-cyan-950 text-white flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center space-x-4">
            <div className="w-13 h-13 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 font-extrabold text-xl shadow-inner">
              {customer.full_name?.charAt(0)?.toUpperCase() || 'C'}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-black tracking-tight">{customer.full_name}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-400/20 text-cyan-200 border border-cyan-400/30">
                  {customer.customer_id}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-slate-200">
                  {customer.customer_type || 'Individual'} Client
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300 mt-1 flex-wrap">
                <span>Passport: <strong className="text-white font-mono">{customer.passport_number || 'N/A'}</strong></span>
                <span>•</span>
                <span>Nationality: <strong className="text-white">{customer.nationality || 'Egyptian'}</strong></span>
                <span>•</span>
                <span>Registered: <strong className="text-white">{customer.registration_date || 'Active'}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                if (onOpenStatement) {
                  onOpenStatement(customer);
                }
              }}
              className="flex items-center space-x-1.5 bg-cyan-600 hover:bg-cyan-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
              title="Open Official 3-Currency Statement"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>3-Currency Statement</span>
            </button>

            <button
              onClick={() => setShowLogModal(true)}
              className="flex items-center space-x-1.5 bg-white/10 hover:bg-white/20 text-white px-3.5 py-2 rounded-xl text-xs font-bold border border-white/20 transition-colors cursor-pointer"
              title="Log phone call, message, or meeting with this client"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Contact</span>
            </button>

            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer ml-1"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          
          {/* SECTION 1: LAST EMPLOYEE WHO COMMUNICATED WITH THIS CUSTOMER */}
          <div className="bg-linear-to-br from-white via-cyan-50/30 to-blue-50/40 rounded-2xl p-5 border border-cyan-200/80 shadow-xs relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-cyan-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-cyan-600 text-white rounded-xl shadow-xs">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                    Last Employee Who Communicated with Customer
                  </h3>
                  <p className="text-xs text-slate-500">
                    Real-time continuity log tracking staff member conversations and follow-ups
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowLogModal(true)}
                className="inline-flex items-center space-x-1.5 bg-white hover:bg-cyan-50 text-cyan-700 border border-cyan-200 px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log New Interaction</span>
              </button>
            </div>

            {lastCommunication ? (
              <div className="pt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Responsible Representative</p>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-800 font-black text-xs flex items-center justify-center border border-cyan-200">
                      {lastCommunication.employee_name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">{lastCommunication.employee_name}</p>
                      <p className="text-[11px] text-cyan-700 font-semibold">Sofia Travel Team</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Communication Timestamp & Channel</p>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      {lastCommunication.channel}
                    </span>
                    <span className="text-xs text-slate-600 font-medium">
                      {new Date(lastCommunication.date).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Notes & Conversation Summary</p>
                  <p className="text-xs text-slate-700 font-medium bg-white/80 p-2 rounded-xl border border-cyan-100 line-clamp-2" title={lastCommunication.notes}>
                    "{lastCommunication.notes || 'Inquired on trip itinerary and travel documentation.'}"
                  </p>
                </div>
              </div>
            ) : (
              <div className="pt-3 flex items-center justify-between text-xs text-slate-500 bg-white/70 p-3 rounded-xl border border-cyan-100">
                <span className="italic">No formal communication logged yet. Sofia Travel initial onboarding team registered this client.</span>
                <button
                  onClick={() => setShowLogModal(true)}
                  className="font-bold text-cyan-600 hover:text-cyan-800 underline ml-2"
                >
                  Record first communication now
                </button>
              </div>
            )}
          </div>

          {/* SECTION 2: 3-CURRENCY FINANCIAL BALANCES (DO NOT MIX CURRENCIES) */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-slate-900 text-white rounded-lg">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                    Total Amount Paid & Remaining (3-Currency Segregated Ledger)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Mandatory multi-currency compliance: USD, EGP, and EUR are calculated and kept strictly distinct.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-lg border border-cyan-200 self-start sm:self-auto">
                3 Supported Currencies: USD ($) • EGP (EGP) • EUR (€)
              </span>
            </div>

            {/* 3 Dedicated Financial Cards: USD, EGP, EUR */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {currencyLedgers.map((curr) => {
                const isSettled = curr.totalRemaining === 0 && curr.totalAmount > 0;
                const hasPending = curr.totalRemaining > 0;

                return (
                  <div 
                    key={curr.code} 
                    className={`rounded-2xl p-4.5 border transition-all relative overflow-hidden ${
                      hasPending 
                        ? 'bg-white border-amber-300 shadow-xs' 
                        : isSettled
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : 'bg-slate-50/70 border-slate-200 opacity-80'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center space-x-2">
                        <span className={`w-7 h-7 rounded-lg font-black text-xs flex items-center justify-center shadow-xs ${
                          curr.code === 'USD' ? 'bg-blue-600 text-white' :
                          curr.code === 'EGP' ? 'bg-amber-600 text-white' :
                          'bg-indigo-600 text-white'
                        }`}>
                          {curr.symbol}
                        </span>
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm">
                            {curr.code === 'USD' ? 'US Dollar ($)' : curr.code === 'EGP' ? 'Egyptian Pound (EGP)' : 'Euro (€)'}
                          </h4>
                          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                            Isolated Ledger
                          </span>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        hasPending ? 'bg-amber-100 text-amber-800' :
                        isSettled ? 'bg-emerald-100 text-emerald-800' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {hasPending ? 'Balance Due' : isSettled ? 'Fully Settled' : 'Zero Active Balance'}
                      </span>
                    </div>

                    <div className="pt-3 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-[11px] font-medium">Total Contracted / Invoiced:</span>
                        <span className="font-bold text-slate-800">
                          {formatExactCurrency(curr.totalAmount, curr.code)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/80 border border-emerald-200/80">
                        <span className="font-bold text-emerald-900 flex items-center gap-1 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Total Amount Paid:
                        </span>
                        <span className="font-extrabold text-emerald-700 text-sm">
                          {formatExactCurrency(curr.totalPaid, curr.code)}
                        </span>
                      </div>

                      <div className={`flex items-center justify-between p-2 rounded-xl border ${
                        hasPending 
                          ? 'bg-amber-50/90 border-amber-300 text-amber-950' 
                          : 'bg-slate-100/80 border-slate-200 text-slate-700'
                      }`}>
                        <span className="font-bold flex items-center gap-1 text-[11px]">
                          {hasPending ? <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> : <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />}
                          Total Amount Remaining:
                        </span>
                        <span className={`font-black text-sm ${hasPending ? 'text-amber-700' : 'text-slate-500'}`}>
                          {formatExactCurrency(curr.totalRemaining, curr.code)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: BOOKINGS & SERVICES (PREVIOUS VS. CURRENT + RESPONSIBLE EMPLOYEES) */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-cyan-600 text-white rounded-lg">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                    Customer Services & Bookings Portfolio
                  </h3>
                  <p className="text-xs text-slate-500">
                    Comprehensive itinerary view showing responsible staff, travel windows, and payment statuses
                  </p>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center bg-slate-200/80 p-1 rounded-xl text-xs font-bold self-start sm:self-auto">
                <button
                  onClick={() => setActiveTab('current')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'current'
                      ? 'bg-white text-cyan-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Current Bookings & Ongoing</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    activeTab === 'current' ? 'bg-cyan-100 text-cyan-800 font-black' : 'bg-slate-300 text-slate-700'
                  }`}>
                    {currentServices.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('previous')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'previous'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Previous Bookings & Completed</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    activeTab === 'previous' ? 'bg-slate-900 text-white font-black' : 'bg-slate-300 text-slate-700'
                  }`}>
                    {previousServices.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>All ({unifiedServices.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('communications')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'communications'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <History className="w-3 h-3" />
                  <span>Contact History ({communicationsList.length})</span>
                </button>
              </div>
            </div>

            {/* TAB CONTENTS */}
            {activeTab === 'communications' ? (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                      Chronological Client Communication & Contact History
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Audit trail of all conversations, inquiries, calls, and service updates
                    </p>
                  </div>
                  <button
                    onClick={() => setShowLogModal(true)}
                    className="flex items-center space-x-1.5 bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log Interaction</span>
                  </button>
                </div>

                {communicationsList.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No communication history logged yet. Click "Log Interaction" to record a conversation.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {communicationsList.map((comm, idx) => (
                      <div key={comm.id || idx} className="p-4 hover:bg-slate-50/80 transition-colors text-xs flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1 max-w-xl">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 flex items-center gap-1.5">
                              <UserCheck className="w-3.5 h-3.5 text-cyan-600" />
                              {comm.employee_name}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {comm.channel}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              via {comm.source}
                            </span>
                          </div>
                          <p className="text-slate-700 font-medium pt-0.5 leading-relaxed">
                            {comm.notes}
                          </p>
                          {comm.outcome && (
                            <p className="text-[11px] text-cyan-700 font-semibold">
                              Outcome: {comm.outcome}
                            </p>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-slate-500 font-medium">
                            {new Date(comm.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(comm.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // BOOKINGS & SERVICES LIST
              <div className="space-y-3">
                {(() => {
                  const displayList = 
                    activeTab === 'current' ? currentServices :
                    activeTab === 'previous' ? previousServices :
                    unifiedServices;

                  if (displayList.length === 0) {
                    return (
                      <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-2">
                        <Compass className="w-8 h-8 text-slate-300 mx-auto" />
                        <h4 className="text-sm font-bold text-slate-700">
                          {activeTab === 'current' ? 'No Current or Ongoing Services' : 
                           activeTab === 'previous' ? 'No Previous or Completed Services' : 
                           'No Services Recorded'}
                        </h4>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
                          {activeTab === 'current' 
                            ? 'This client currently has no active or upcoming travel bookings in progress.'
                            : 'No past historical bookings have been closed or completed for this client yet.'}
                        </p>
                      </div>
                    );
                  }

                  return displayList.map(srv => {
                    const isFullyPaid = srv.remaining_amount === 0;

                    return (
                      <div 
                        key={srv.id}
                        className="bg-white rounded-2xl p-4.5 border border-slate-200 shadow-xs hover:border-cyan-300 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                      >
                        {/* Service Basic Info & Category */}
                        <div className="flex items-start space-x-3.5 min-w-0">
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 shrink-0 mt-0.5">
                            {getServiceCategoryIcon(srv.category)}
                          </div>
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-extrabold text-slate-900 text-sm truncate">
                                {srv.title}
                              </h4>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 font-mono">
                                {srv.code}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                srv.is_completed 
                                  ? 'bg-slate-100 text-slate-700' 
                                  : 'bg-cyan-100 text-cyan-800'
                              }`}>
                                {srv.is_completed ? 'Completed' : srv.status}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                {srv.dates}
                              </span>
                              {srv.destination && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                  {srv.destination}
                                </span>
                              )}
                            </div>

                            {/* RESPONSIBLE EMPLOYEE DISPLAY (CRITICAL REQUIREMENT) */}
                            <div className="pt-1.5 flex items-center gap-2">
                              <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-900 border border-indigo-200/70 text-xs font-bold">
                                <User className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Responsible Agent:</span>
                                <span className="text-indigo-950 font-extrabold">{srv.responsible_employee}</span>
                                {srv.responsible_position && (
                                  <span className="text-[10px] text-indigo-600 font-normal">
                                    ({srv.responsible_position})
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Financials for this booking (Segregated with Symbol) */}
                        <div className="flex items-center justify-between lg:justify-end space-x-6 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                          <div className="text-left lg:text-right space-y-0.5">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                              Service Price
                            </span>
                            <span className="font-extrabold text-slate-900 text-sm">
                              {formatExactCurrency(srv.selling_price, srv.currency)}
                            </span>
                          </div>

                          <div className="text-left lg:text-right space-y-0.5">
                            <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider block">
                              Paid Amount
                            </span>
                            <span className="font-extrabold text-emerald-700 text-sm">
                              {formatExactCurrency(srv.paid_amount, srv.currency)}
                            </span>
                          </div>

                          <div className="text-left lg:text-right space-y-0.5">
                            <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider block">
                              Remaining Due
                            </span>
                            <span className={`font-black text-sm ${isFullyPaid ? 'text-slate-400 font-normal' : 'text-amber-700'}`}>
                              {formatExactCurrency(srv.remaining_amount, srv.currency)}
                            </span>
                          </div>

                          <div className="shrink-0">
                            <span className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold block text-center ${
                              isFullyPaid 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : srv.paid_amount > 0 
                                ? 'bg-amber-100 text-amber-800' 
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {isFullyPaid ? 'Fully Paid' : srv.paid_amount > 0 ? 'Partially Paid' : 'Unpaid'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>

          {/* SECTION 4: CONTACT & DEMOGRAPHIC OVERVIEW */}
          <div className="bg-white rounded-2xl p-4.5 border border-slate-200 text-xs space-y-2">
            <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">
              Direct Client Contact & Profile Coordinates
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-slate-700">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Phone Number</span>
                <span className="font-bold text-slate-900 mt-0.5 block">{customer.phone || 'N/A'}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">WhatsApp Line</span>
                <span className="font-bold text-emerald-700 mt-0.5 block">{customer.whatsapp_number || customer.phone || 'N/A'}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Email Address</span>
                <span className="font-bold text-slate-900 mt-0.5 block truncate">{customer.email || 'N/A'}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Residential Address</span>
                <span className="font-bold text-slate-900 mt-0.5 block truncate">{customer.address || 'Cairo, Egypt'}</span>
              </div>
            </div>
          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400">
            <span>Sofia Travel Customer Profile System • </span>
            <span className="font-semibold text-slate-600">ID: {customer.customer_id}</span>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => {
                if (onOpenStatement) {
                  onOpenStatement(customer);
                }
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Print Account Statement
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Close Customer File
            </button>
          </div>
        </div>
      </div>

      {/* LOG DIRECT COMMUNICATION SUB-MODAL */}
      {showLogModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-60">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-cyan-100 text-cyan-700 rounded-xl">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Log Customer Communication</h3>
                  <p className="text-xs text-slate-500">Record interaction with {customer.full_name}</p>
                </div>
              </div>
              <button onClick={() => setShowLogModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCommunication} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Employee / Representative Communicating</label>
                <select
                  value={commEmployee}
                  onChange={(e) => setCommEmployee(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-cyan-500"
                >
                  <option value={currentUsername}>{currentUsername} (Current User)</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.name}>{emp.name} ({emp.position || 'Staff'})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Channel</label>
                  <select
                    value={commChannel}
                    onChange={(e) => setCommChannel(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-cyan-500"
                  >
                    <option value="WhatsApp">WhatsApp Message</option>
                    <option value="Phone Call">Phone Call</option>
                    <option value="Email">Email Communication</option>
                    <option value="Office Visit">Office / In-Person Visit</option>
                    <option value="Instagram">Instagram Direct Message</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Outcome / Objective</label>
                  <input
                    type="text"
                    value={commOutcome}
                    onChange={(e) => setCommOutcome(e.target.value)}
                    placeholder="e.g. Confirmed booking, Payment follow-up"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Discussion Details & Follow-up Notes</label>
                <textarea
                  rows={4}
                  required
                  value={commNotes}
                  onChange={(e) => setCommNotes(e.target.value)}
                  placeholder="Summarize key points discussed, client preferences, travel confirmations, or pending questions..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingComm}
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingComm ? 'Saving...' : 'Save Communication'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
