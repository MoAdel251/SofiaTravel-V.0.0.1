import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  CreditCard,
  Receipt,
  Calculator,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Printer,
  Shield,
  Search,
  Download,
  Trash2,
  Edit,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  Briefcase,
  FileText,
  Check,
  X,
  RefreshCw,
  PieChart,
  Globe,
  Clock,
  Building2,
  Wallet
} from 'lucide-react';
import {
  UserRole,
  Expense,
  PayrollRecord,
  EmployeeAdvance,
  CommissionRecord,
  FinanceAuditLog,
  Reservation,
  Supplier,
  Employee,
  CompanySettings,
  Invoice,
  Voucher,
  Customer,
  CustomerPayment,
  SupplierPayment
} from '../types';
import {
  formatCurrency,
  convertCurrency,
  calculateEgpEquivalent,
  normalizeCurrencyCode,
  DEFAULT_EXCHANGE_RATES
} from '../utils/currency';
import { RealTimeCurrencyConverter } from './RealTimeCurrencyConverter';
import { useLanguage } from '../context/LanguageContext';

interface FinancePayrollViewProps {
  userRole: UserRole;
  currentUsername: string;
  isAdmin?: boolean;
  isITAccount?: boolean;
  expenses: Expense[];
  onAddExpense: (expense: Expense) => void;
  onUpdateExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  payrollRecords: PayrollRecord[];
  onGeneratePayroll: (month: string) => void;
  onUpdatePayrollStatus: (id: string, status: 'Pending' | 'Partially Paid' | 'Paid', paymentDetails?: any) => void;
  onDeletePayroll?: (id: string) => void;
  advances: EmployeeAdvance[];
  onAddAdvance: (advance: EmployeeAdvance) => void;
  onUpdateAdvance: (advance: EmployeeAdvance) => void;
  onDeleteAdvance: (id: string) => void;
  commissions: CommissionRecord[];
  onAddCommission: (comm: CommissionRecord) => void;
  onUpdateCommission?: (comm: CommissionRecord) => void;
  onDeleteCommission: (id: string) => void;
  reservations: Reservation[];
  vouchers?: Voucher[];
  invoices?: Invoice[];
  customers?: Customer[];
  suppliers: Supplier[];
  employees: Employee[];
  visas?: any[];
  flights?: any[];
  hotels?: any[];
  transfers?: any[];
  cruises?: any[];
  tours?: any[];
  dayTrips?: any[];
  customerPayments?: CustomerPayment[];
  supplierPayments?: SupplierPayment[];
  auditLogs: FinanceAuditLog[];
  onAddAuditLog: (log: FinanceAuditLog) => void;
  onNavigateTab?: (tab: string) => void;
  settings?: CompanySettings;
  companyCurrency?: string;
}

export function FinancePayrollView({
  userRole,
  currentUsername,
  isAdmin = false,
  isITAccount = false,
  expenses = [],
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  payrollRecords = [],
  onGeneratePayroll,
  onUpdatePayrollStatus,
  onDeletePayroll,
  advances = [],
  onAddAdvance,
  onUpdateAdvance,
  onDeleteAdvance,
  commissions = [],
  onAddCommission,
  onUpdateCommission,
  onDeleteCommission,
  reservations = [],
  vouchers = [],
  invoices = [],
  customers = [],
  suppliers = [],
  employees = [],
  visas = [],
  flights = [],
  hotels = [],
  transfers = [],
  cruises = [],
  tours = [],
  dayTrips = [],
  customerPayments = [],
  supplierPayments = [],
  auditLogs = [],
  onAddAuditLog,
  onNavigateTab,
  settings,
  companyCurrency = 'EGP'
}: FinancePayrollViewProps) {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  // SECURITY CHECK: Accessible to Company Owners (Administrator / isAdmin), Accountant, and IT developer
  const hasFinanceAccess =
    userRole === 'Administrator' ||
    userRole === 'Accountant' ||
    isAdmin ||
    isITAccount;

  if (!hasFinanceAccess) {
    return (
      <div className="p-12 min-h-[80vh] flex items-center justify-center bg-slate-50">
        <div className="bg-white rounded-3xl border border-rose-200 p-8 max-w-md w-full text-center shadow-xl space-y-4">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            {isAr ? 'غير مصرح بالدخول' : 'Access Restricted'}
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            {isAr
              ? 'قسم الإدارة المالية والرواتب مخصص لملاك الشركة (المدير العام) والمحاسب المالي فقط.'
              : 'The Finance & Payroll Command Hub is strictly restricted to Company Owners (Administrator) and the Accountant.'}
          </p>
          <div className="pt-2">
            <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl">
              {isAr ? `الدور الحالي: ${userRole}` : `Current Role: ${userRole}`}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Default December payroll month (Employment started in November -> Payroll generated based on December's salary)
  const currentYear = new Date().getFullYear();
  const defaultDecemberPayrollMonth = `${currentYear}-12`;

  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'converter' | 'expenses' | 'payroll' | 'advances' | 'commissions' | 'trip-profit' | 'reports' | 'pl' | 'audit'
  >('dashboard');

  const [periodFilter, setPeriodFilter] = useState<'all' | 'november' | 'december' | 'this_month' | 'year'>('all');
  const [displayCurrency, setDisplayCurrency] = useState<string>(normalizeCurrencyCode(companyCurrency || 'EGP'));
  const [currencyFilter, setCurrencyFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [localToast, setLocalToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const triggerBanner = (message: string, type: 'success' | 'info' = 'success') => {
    setLocalToast({ message, type });
    setTimeout(() => {
      setLocalToast(prev => (prev?.message === message ? null : prev));
    }, 4000);
  };

  const activeRates = settings?.exchange_rates?.length ? settings.exchange_rates : DEFAULT_EXCHANGE_RATES;

  const toBase = (amount: number | undefined | null, fromCurr?: string): number => {
    const val = Number(amount) || 0;
    if (!val) return 0;
    return convertCurrency(val, normalizeCurrencyCode(fromCurr || 'EGP'), displayCurrency, activeRates);
  };

  // Date matcher for period filtering
  const matchesPeriod = (dateStr?: string, isPayrollMonth?: boolean): boolean => {
    if (periodFilter === 'all') return true;
    if (!dateStr) return true;
    const ym = isPayrollMonth ? dateStr.slice(0, 7) : String(dateStr).slice(0, 7);
    const nowYm = new Date().toISOString().slice(0, 7);
    if (periodFilter === 'november') return ym === `${currentYear}-11`;
    if (periodFilter === 'december') return ym === `${currentYear}-12`;
    if (periodFilter === 'this_month') return ym === nowYm;
    if (periodFilter === 'year') return String(dateStr).startsWith(String(currentYear));
    return true;
  };

  // Modals state
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseForm, setExpenseForm] = useState<Partial<Expense>>({
    category: 'Office Rent',
    description: '',
    amount: 0,
    currency: 'EGP',
    exchange_rate: 1,
    payment_method: 'Bank Transfer',
    paid_by: currentUsername,
    date: new Date().toISOString().split('T')[0],
    status: 'Paid',
    notes: ''
  });

  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [advanceForm, setAdvanceForm] = useState({
    employee_id: '',
    amount: 0,
    currency: 'EGP',
    reason: '',
    repayment_method: 'Payroll Deduction',
    request_mode: 'Outstanding' as 'Requested' | 'Outstanding'
  });

  const [showRepayModal, setShowRepayModal] = useState(false);
  const [selectedAdvanceForRepay, setSelectedAdvanceForRepay] = useState<EmployeeAdvance | null>(null);
  const [repayAmount, setRepayAmount] = useState<number>(0);

  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [commissionForm, setCommissionForm] = useState({
    employee_id: '',
    source_ref: '',
    customer_name: '',
    reservation_id: '',
    trip_name: '',
    sale_amount: 0,
    commission_percentage: 5,
    currency: 'EGP'
  });

  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedPayrollRecord, setSelectedPayrollRecord] = useState<PayrollRecord | null>(null);
  const [payForm, setPayForm] = useState({
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'Bank Transfer',
    paid_amount: 0,
    transaction_reference: '',
    notes: ''
  });

  const [showEditPayrollModal, setShowEditPayrollModal] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState<PayrollRecord | null>(null);
  const [payrollEditForm, setPayrollEditForm] = useState({
    basic_salary: 0,
    allowances: 0,
    commission: 0,
    bonus: 0,
    deductions: 0,
    advances: 0
  });

  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    isOpen: boolean;
    type: 'expense' | 'advance' | 'commission' | 'payroll';
    id: string;
    title: string;
  }>({ isOpen: false, type: 'expense', id: '', title: '' });

  // Payroll defaults strictly to December's salary (2026-12) since employment began in November
  const [generateMonth, setGenerateMonth] = useState<string>(defaultDecemberPayrollMonth);

  // ============================================================================
  // UNIFIED SITE-WIDE FINANCIAL ENGINE (Invoices + Bookings + Services + Payroll + Expenses + Advances + Commissions)
  // ============================================================================

  // 1. Consolidate all operational bookings (Reservations + non-duplicate Vouchers + customer-linked Services)
  const consolidatedBookings = useMemo(() => {
    const seen = new Set<string>();
    const list: Array<{
      id: string;
      ref: string;
      customer_name: string;
      service_type: string;
      destination: string;
      date: string;
      selling_price: number;
      cost_price: number;
      paid_amount: number;
      remaining_amount: number;
      currency: string;
      employee_id?: string;
      employee_name?: string;
      status: string;
      customer_invoice_id?: string;
      supplier_invoice_id?: string;
    }> = [];

    reservations.forEach(r => {
      if (r.id) seen.add(r.id);
      if (r.reservation_id) seen.add(r.reservation_id);
      if (r.voucher_number) seen.add(r.voucher_number);
      list.push({
        id: r.id,
        ref: r.reservation_id || r.voucher_number || r.id,
        customer_name: r.customer_name || 'Client',
        service_type: r.service_type || 'Reservation',
        destination: r.destination || (r as any).service_name || 'Trip',
        date: r.booking_date || r.issue_date || r.travel_date || '',
        selling_price: Number(r.selling_price) || 0,
        cost_price: Number(r.cost_price) || 0,
        paid_amount: Number(r.paid_amount) || 0,
        remaining_amount: Number(r.remaining_amount ?? ((Number(r.selling_price) || 0) - (Number(r.paid_amount) || 0))),
        currency: normalizeCurrencyCode(r.currency || 'USD'),
        employee_id: r.employee_id,
        employee_name: r.employee_name,
        status: r.reservation_status || 'Confirmed'
      });
    });

    vouchers.forEach(v => {
      if (seen.has(v.id) || (v.reservation_id && seen.has(v.reservation_id)) || (v.voucher_number && seen.has(v.voucher_number))) {
        return;
      }
      if (v.id) seen.add(v.id);
      if (v.voucher_number) seen.add(v.voucher_number);
      if (v.reservation_id) seen.add(v.reservation_id);
      list.push({
        id: v.id,
        ref: v.voucher_number || v.reservation_id || v.id,
        customer_name: v.customer_name || 'Client',
        service_type: v.service_category || 'Voucher',
        destination: v.destination || v.service_title || 'Voucher',
        date: v.issue_date || v.travel_date || '',
        selling_price: Number(v.selling_price) || 0,
        cost_price: Number(v.cost_price) || 0,
        paid_amount: Number(v.paid_amount) || 0,
        remaining_amount: Number(v.remaining_amount ?? ((Number(v.selling_price) || 0) - (Number(v.paid_amount) || 0))),
        currency: normalizeCurrencyCode(v.currency || 'USD'),
        employee_id: v.employee_id,
        employee_name: v.employee_name,
        status: v.status === 'Cancelled' || v.reservation_status === 'Cancelled' ? 'Cancelled' : (v.reservation_status || 'Confirmed'),
        customer_invoice_id: v.customer_invoice_id,
        supplier_invoice_id: v.supplier_invoice_id
      });
    });

    // Standalone customer-booked flights & visas
    flights.forEach((f: any) => {
      if ((f.customer_id || f.customer_name || (f.passenger && f.passenger !== 'Guest')) && !seen.has(f.id)) {
        seen.add(f.id);
        list.push({
          id: f.id,
          ref: f.booking_reference || f.id,
          customer_name: f.customer_name || f.passenger || 'Passenger',
          service_type: 'Flight',
          destination: f.arrival_airport || 'Flight Sector',
          date: f.departure_date || (f.createdAt ? String(f.createdAt).split('T')[0] : ''),
          selling_price: Number(f.selling_price) || 0,
          cost_price: Number(f.ticket_cost) || 0,
          paid_amount: Number(f.selling_price) || 0,
          remaining_amount: 0,
          currency: normalizeCurrencyCode(f.currency || 'USD'),
          employee_name: f.employee_name,
          status: f.status === 'Cancelled' ? 'Cancelled' : 'Confirmed'
        });
      }
    });

    visas.forEach((vs: any) => {
      if ((vs.customer_id || vs.customer_name) && !seen.has(vs.id)) {
        seen.add(vs.id);
        list.push({
          id: vs.id,
          ref: vs.id,
          customer_name: vs.customer_name || 'Applicant',
          service_type: 'Visa',
          destination: vs.country || 'Visa',
          date: vs.travel_date || (vs.createdAt ? String(vs.createdAt).split('T')[0] : ''),
          selling_price: Number(vs.selling_price) || 0,
          cost_price: Number(vs.cost_price) || 0,
          paid_amount: Number(vs.selling_price) || 0,
          remaining_amount: 0,
          currency: normalizeCurrencyCode(vs.currency || 'USD'),
          employee_name: vs.employee_name,
          status: vs.status === 'Inactive' ? 'Cancelled' : 'Confirmed'
        });
      }
    });

    return list;
  }, [reservations, vouchers, flights, visas]);

  // 2. Filter active financial datasets by selected period and currency policy
  // Policy: When selecting USD or EUR as the currency on the Finance & Payroll page, existing invoices in Egyptian pounds are not converted to dollars/euros and displayed.
  const extractInvoiceNum = (inv: Invoice): number => {
    const numStr = String(inv.invoice_number || inv.id || '');
    const matches = numStr.match(/\d+/g);
    return matches && matches.length > 0 ? parseInt(matches.join(''), 10) : 0;
  };

  const sortInvoicesDescending = (a: Invoice, b: Invoice): number => {
    const numA = extractInvoiceNum(a);
    const numB = extractInvoiceNum(b);
    if (numA !== numB) return numB - numA;
    const dateA = String(a.issue_date || a.createdAt || '');
    const dateB = String(b.issue_date || b.createdAt || '');
    if (dateA !== dateB) return dateB.localeCompare(dateA);
    return String(b.invoice_number || b.id || '').localeCompare(String(a.invoice_number || a.id || ''), undefined, { numeric: true, sensitivity: 'base' });
  };

  const activeInvoices = useMemo(
    () =>
      invoices
        .filter(inv => {
          if (inv.payment_status === 'Cancelled') return false;
          if (!matchesPeriod(inv.issue_date)) return false;
          const invCurr = normalizeCurrencyCode(inv.currency || 'EGP');
          if (invCurr === 'EGP' && (displayCurrency === 'USD' || displayCurrency === 'EUR')) {
            return false;
          }
          return true;
        })
        .sort(sortInvoicesDescending),
    [invoices, periodFilter, displayCurrency]
  );

  const customerInvoices = useMemo(
    () => activeInvoices.filter(inv => (inv.recipient_type || 'Customer') === 'Customer'),
    [activeInvoices]
  );

  const supplierInvoices = useMemo(
    () => activeInvoices.filter(inv => inv.recipient_type === 'Supplier'),
    [activeInvoices]
  );

  const activeBookings = useMemo(
    () => consolidatedBookings.filter(b => b.status !== 'Cancelled' && matchesPeriod(b.date)),
    [consolidatedBookings, periodFilter]
  );

  // Track which bookings are already billed on a Customer Invoice or Supplier Invoice to prevent double-counting
  const customerInvoicedBookingRefs = useMemo(() => {
    const refs = new Set<string>();
    customerInvoices.forEach(inv => {
      if (inv.reservation_id) refs.add(inv.reservation_id);
      (inv.items || []).forEach(it => {
        if (it.item_reference_id) refs.add(it.item_reference_id);
      });
    });
    return refs;
  }, [customerInvoices]);

  const supplierInvoicedBookingRefs = useMemo(() => {
    const refs = new Set<string>();
    supplierInvoices.forEach(inv => {
      if (inv.reservation_id) refs.add(inv.reservation_id);
      (inv.items || []).forEach(it => {
        if (it.item_reference_id) refs.add(it.item_reference_id);
      });
    });
    return refs;
  }, [supplierInvoices]);

  const uninvoicedCustomerBookings = useMemo(
    () =>
      activeBookings.filter(
        b =>
          !customerInvoicedBookingRefs.has(b.id) &&
          !customerInvoicedBookingRefs.has(b.ref) &&
          !(b.customer_invoice_id && customerInvoices.some(i => i.id === b.customer_invoice_id || i.invoice_number === b.customer_invoice_id))
      ),
    [activeBookings, customerInvoicedBookingRefs, customerInvoices]
  );

  const uninvoicedSupplierBookings = useMemo(
    () =>
      activeBookings.filter(
        b =>
          !supplierInvoicedBookingRefs.has(b.id) &&
          !supplierInvoicedBookingRefs.has(b.ref) &&
          !(b.supplier_invoice_id && supplierInvoices.some(i => i.id === b.supplier_invoice_id || i.invoice_number === b.supplier_invoice_id))
      ),
    [activeBookings, supplierInvoicedBookingRefs, supplierInvoices]
  );

  const filteredExpenses = useMemo(
    () => expenses.filter(e => matchesPeriod(e.date)),
    [expenses, periodFilter]
  );

  const filteredAdvances = useMemo(
    () => advances.filter(a => matchesPeriod(a.date)),
    [advances, periodFilter]
  );

  const filteredCommissions = useMemo(
    () => commissions.filter(c => matchesPeriod(c.date)),
    [commissions, periodFilter]
  );

  // Payroll records: When periodFilter is 'all' or 'december', include all generated payroll (especially 2026-12)
  const filteredPayrolls = useMemo(() => {
    if (periodFilter === 'all') return payrollRecords;
    return payrollRecords.filter(p => matchesPeriod(p.payroll_month, true));
  }, [payrollRecords, periodFilter]);

  // 3. Synchronized Financial Totals (All converted accurately to displayCurrency)
  const financeSummary = useMemo(() => {
    // Revenue
    const invoicedRevenue = customerInvoices.reduce((acc, inv) => acc + toBase(inv.total_amount, inv.currency), 0);
    const uninvoicedBookingRevenue = uninvoicedCustomerBookings.reduce((acc, b) => acc + toBase(b.selling_price, b.currency), 0);
    const totalRevenue = invoicedRevenue + uninvoicedBookingRevenue;

    // Collections & Customer Receivables
    const invoicedCollected = customerInvoices.reduce((acc, inv) => acc + toBase(inv.paid_amount, inv.currency), 0);
    const uninvoicedCollected = uninvoicedCustomerBookings.reduce((acc, b) => acc + toBase(b.paid_amount, b.currency), 0);
    const standalonePaymentsCollected = customerPayments
      .filter(cp => matchesPeriod(cp.date || (cp as any).payment_date))
      .reduce((acc, cp) => acc + toBase(cp.amount, cp.currency), 0);
    const totalCollectedCash = Math.max(invoicedCollected + uninvoicedCollected, standalonePaymentsCollected);

    const invoicedReceivables = customerInvoices.reduce(
      (acc, inv) => acc + toBase(Math.max(0, Number(inv.balance_due ?? ((Number(inv.total_amount) || 0) - (Number(inv.paid_amount) || 0)))), inv.currency),
      0
    );
    const uninvoicedReceivables = uninvoicedCustomerBookings.reduce(
      (acc, b) => acc + toBase(Math.max(0, b.remaining_amount), b.currency),
      0
    );
    const customerProfileReceivables = customers.reduce(
      (acc, c) => acc + toBase(Math.max(0, Number(c.outstanding_balance) || 0), c.currency),
      0
    );
    const totalCustomerReceivables = Math.max(invoicedReceivables + uninvoicedReceivables, customerProfileReceivables);

    // Direct Supplier & Trip Costs (COGS)
    const supplierInvoicedCosts = supplierInvoices.reduce((acc, inv) => acc + toBase(inv.total_amount, inv.currency), 0);
    const uninvoicedTripCosts = uninvoicedSupplierBookings.reduce((acc, b) => acc + toBase(b.cost_price, b.currency), 0);
    const totalDirectCosts = supplierInvoicedCosts + uninvoicedTripCosts;

    const supplierPaidCash = supplierInvoices.reduce((acc, inv) => acc + toBase(inv.paid_amount, inv.currency), 0) +
      supplierPayments.filter(sp => matchesPeriod(sp.payment_date)).reduce((acc, sp) => acc + toBase(sp.amount, sp.currency), 0);

    const supplierInvoicesUnpaid = supplierInvoices.reduce(
      (acc, inv) => acc + toBase(Math.max(0, Number(inv.balance_due ?? ((Number(inv.total_amount) || 0) - (Number(inv.paid_amount) || 0)))), inv.currency),
      0
    );
    const supplierProfilePayables = suppliers.reduce(
      (acc, s) => acc + toBase(Math.max(0, Number(s.outstanding_balance) || 0), s.currency),
      0
    );
    const totalSupplierPayables = Math.max(supplierInvoicesUnpaid, supplierProfilePayables);

    // Operating Expenses (OPEX)
    const totalExpenses = filteredExpenses.reduce((acc, e) => acc + toBase(e.amount, e.currency), 0);
    const paidExpenses = filteredExpenses
      .filter(e => (e.status || 'Paid') === 'Paid')
      .reduce((acc, e) => acc + toBase(e.amount, e.currency), 0);
    const pendingExpenses = filteredExpenses
      .filter(e => e.status === 'Pending')
      .reduce((acc, e) => acc + toBase(e.amount, e.currency), 0);

    // Expenses by Category
    const expensesByCategory: Record<string, number> = {};
    filteredExpenses.forEach(e => {
      const cat = e.category || 'General';
      expensesByCategory[cat] = (expensesByCategory[cat] || 0) + toBase(e.amount, e.currency);
    });

    // Payroll (December 2026 base salary & net payable)
    // Note: For P&L we use base salary + allowances + bonus - deductions so we don't double-count Commissions or Advances!
    const activeEmployeesBaseMonthly = employees
      .filter(emp => emp.status !== 'Inactive' && emp.account_status !== 'Inactive')
      .reduce((acc, emp) => acc + toBase(Number(emp.salary) || 0, 'EGP'), 0);

    const payrollNetTotal = filteredPayrolls.reduce((acc, p) => acc + toBase(p.net_salary, p.currency || 'EGP'), 0);
    const payrollBaseExpense = filteredPayrolls.reduce((acc, p) => {
      const baseCost = (Number(p.basic_salary) || 0) + (Number(p.allowances) || 0) + (Number(p.bonus) || 0) - (Number(p.deductions) || 0);
      return acc + toBase(Math.max(0, baseCost), p.currency || 'EGP');
    }, 0);

    const payrollPaidCash = filteredPayrolls
      .filter(p => p.status === 'Paid' || p.status === 'Partially Paid')
      .reduce((acc, p) => acc + toBase(Number(p.paid_amount ?? p.net_salary) || 0, p.currency || 'EGP'), 0);

    const payrollPendingPayable = filteredPayrolls
      .filter(p => p.status !== 'Paid')
      .reduce((acc, p) => {
        const paid = p.status === 'Partially Paid' ? (Number(p.paid_amount) || 0) : 0;
        return acc + toBase(Math.max(0, (Number(p.net_salary) || 0) - paid), p.currency || 'EGP');
      }, 0);

    const decemberPayrolls = payrollRecords.filter(p => p.payroll_month === defaultDecemberPayrollMonth);
    const decemberPayrollLiability = decemberPayrolls.length > 0
      ? decemberPayrolls.reduce((acc, p) => acc + toBase(p.net_salary, p.currency || 'EGP'), 0)
      : activeEmployeesBaseMonthly;

    // Employee Advances
    const activeAdvances = filteredAdvances.filter(a => a.status !== 'Rejected');
    const requestedAdvances = filteredAdvances.filter(a => a.status === 'Requested');
    const totalRequestedAdvances = requestedAdvances.reduce((acc, a) => acc + toBase(a.amount, a.currency || 'EGP'), 0);
    const totalDisbursedAdvances = activeAdvances
      .filter(a => a.status !== 'Requested')
      .reduce((acc, a) => acc + toBase(a.amount, a.currency || 'EGP'), 0);
    const totalOutstandingAdvances = activeAdvances
      .filter(a => a.status === 'Outstanding' || a.status === 'Approved' || a.status === 'Partially Repaid')
      .reduce((acc, a) => acc + toBase(a.outstanding_amount ?? a.amount, a.currency || 'EGP'), 0);

    // Employee Commissions
    const totalCommissions = filteredCommissions.reduce((acc, c) => acc + toBase(c.commission_amount, c.currency || 'EGP'), 0);
    const pendingCommissions = filteredCommissions
      .filter(c => c.status === 'Pending')
      .reduce((acc, c) => acc + toBase(c.commission_amount, c.currency || 'EGP'), 0);
    const paidDirectCommissions = filteredCommissions
      .filter(c => c.status === 'Paid')
      .reduce((acc, c) => acc + toBase(c.commission_amount, c.currency || 'EGP'), 0);

    // Profit & Loss (P&L)
    const grossProfit = totalRevenue - totalDirectCosts;
    const grossMarginPct = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const totalOperatingOverhead = totalExpenses + payrollBaseExpense + totalCommissions;
    const netOperatingProfit = grossProfit - totalOperatingOverhead;
    const netMarginPct = totalRevenue > 0 ? (netOperatingProfit / totalRevenue) * 100 : 0;

    // Cash / Treasury Net Position
    const netCashPosition =
      totalCollectedCash -
      supplierPaidCash -
      paidExpenses -
      payrollPaidCash -
      paidDirectCommissions -
      totalOutstandingAdvances;

    // Multi-currency Invoice Breakdown
    const invoicesByCurrency: Record<string, { billed: number; collected: number; due: number; count: number }> = {};
    customerInvoices.forEach(inv => {
      const code = normalizeCurrencyCode(inv.currency || 'USD');
      if (!invoicesByCurrency[code]) {
        invoicesByCurrency[code] = { billed: 0, collected: 0, due: 0, count: 0 };
      }
      invoicesByCurrency[code].billed += Number(inv.total_amount) || 0;
      invoicesByCurrency[code].collected += Number(inv.paid_amount) || 0;
      invoicesByCurrency[code].due += Math.max(0, Number(inv.balance_due ?? ((Number(inv.total_amount) || 0) - (Number(inv.paid_amount) || 0))));
      invoicesByCurrency[code].count += 1;
    });

    return {
      invoicedRevenue,
      uninvoicedBookingRevenue,
      totalRevenue,
      totalCollectedCash,
      totalCustomerReceivables,
      supplierInvoicedCosts,
      uninvoicedTripCosts,
      totalDirectCosts,
      supplierPaidCash,
      totalSupplierPayables,
      totalExpenses,
      paidExpenses,
      pendingExpenses,
      expensesByCategory,
      activeEmployeesBaseMonthly,
      payrollNetTotal,
      payrollBaseExpense,
      payrollPaidCash,
      payrollPendingPayable,
      decemberPayrollsCount: decemberPayrolls.length,
      decemberPayrollLiability,
      requestedAdvancesCount: requestedAdvances.length,
      totalRequestedAdvances,
      totalDisbursedAdvances,
      totalOutstandingAdvances,
      totalCommissions,
      pendingCommissions,
      paidDirectCommissions,
      grossProfit,
      grossMarginPct,
      totalOperatingOverhead,
      netOperatingProfit,
      netMarginPct,
      netCashPosition,
      invoicesByCurrency
    };
  }, [
    customerInvoices,
    uninvoicedCustomerBookings,
    customerPayments,
    customers,
    supplierInvoices,
    uninvoicedSupplierBookings,
    supplierPayments,
    suppliers,
    filteredExpenses,
    employees,
    filteredPayrolls,
    payrollRecords,
    filteredAdvances,
    filteredCommissions,
    displayCurrency,
    activeRates,
    periodFilter
  ]);

  // Detect unlogged employee sales from Customer Invoices & Confirmed Bookings for 1-click Commission Sync
  const unloggedSalesCandidates = useMemo(() => {
    const existingRefs = new Set(commissions.map(c => c.reservation_id).filter(Boolean));
    const candidates: Array<{
      emp: Employee;
      ref: string;
      customer_name: string;
      trip_name: string;
      sale_amount: number;
      currency: string;
      date: string;
    }> = [];

    // Check Customer Invoices created by an employee with commission_rate > 0
    customerInvoices.forEach(inv => {
      const refKey = inv.invoice_number || inv.id;
      if (existingRefs.has(refKey) || (inv.reservation_id && existingRefs.has(inv.reservation_id))) return;
      const emp = employees.find(
        e =>
          (inv.created_by_employee &&
            (e.name.toLowerCase() === inv.created_by_employee.toLowerCase() ||
              (e.username || '').toLowerCase() === inv.created_by_employee.toLowerCase())) &&
          Number(e.commission_rate) > 0
      );
      if (emp && Number(inv.total_amount) > 0) {
        existingRefs.add(refKey);
        if (inv.reservation_id) existingRefs.add(inv.reservation_id);
        candidates.push({
          emp,
          ref: refKey,
          customer_name: inv.customer_name || 'Customer',
          trip_name: inv.items?.[0]?.title || `Invoice ${refKey}`,
          sale_amount: Number(inv.total_amount) || 0,
          currency: normalizeCurrencyCode(inv.currency || 'EGP'),
          date: inv.issue_date || new Date().toISOString().split('T')[0]
        });
      }
    });

    // Check Bookings/Vouchers assigned to an employee with commission_rate > 0
    activeBookings.forEach(b => {
      if (existingRefs.has(b.ref) || existingRefs.has(b.id)) return;
      const emp = employees.find(
        e =>
          (b.employee_id === e.id ||
            b.employee_id === e.employee_id ||
            (b.employee_name && e.name.toLowerCase() === b.employee_name.toLowerCase())) &&
          Number(e.commission_rate) > 0
      );
      if (emp && Number(b.selling_price) > 0) {
        existingRefs.add(b.ref);
        candidates.push({
          emp,
          ref: b.ref,
          customer_name: b.customer_name,
          trip_name: `${b.service_type} - ${b.destination}`,
          sale_amount: Number(b.selling_price) || 0,
          currency: normalizeCurrencyCode(b.currency || 'EGP'),
          date: b.date || new Date().toISOString().split('T')[0]
        });
      }
    });

    return candidates;
  }, [commissions, customerInvoices, activeBookings, employees]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const chosenCurrency = normalizeCurrencyCode(expenseForm.currency || 'EGP');
    const amt = Number(expenseForm.amount) || 0;
    const { rate, egpEquivalent } = calculateEgpEquivalent(amt, chosenCurrency, undefined, activeRates);

    if (editingExpense) {
      const updated: Expense = {
        ...editingExpense,
        ...(expenseForm as any),
        amount: amt,
        currency: chosenCurrency,
        exchange_rate: rate,
        converted_amount: Math.round(egpEquivalent * 100) / 100,
        status: (expenseForm.status as any) || editingExpense.status || 'Paid'
      };
      onUpdateExpense(updated);
      onAddAuditLog({
        id: 'LOG-' + Date.now(),
        user_name: currentUsername,
        user_role: userRole,
        action: 'Updated',
        record_type: 'Expense',
        record_id: updated.expense_id,
        previous_value: `${editingExpense.amount} ${editingExpense.currency}`,
        new_value: `${updated.amount} ${updated.currency}`,
        date_time: new Date().toLocaleString()
      });
      triggerBanner(isAr ? 'تم تحديث المصروف ومزامنته مع لوحة المالية' : 'Expense updated and synchronized with Finance Dashboard');
    } else {
      const newExp: Expense = {
        id: 'EXP-' + Date.now(),
        expense_id: 'EXP-' + Math.floor(1000 + Math.random() * 9000),
        category: expenseForm.category || 'Office Rent',
        description: expenseForm.description || '',
        amount: amt,
        currency: chosenCurrency,
        exchange_rate: rate,
        converted_amount: Math.round(egpEquivalent * 100) / 100,
        date: expenseForm.date || new Date().toISOString().split('T')[0],
        payment_method: (expenseForm.payment_method as any) || 'Bank Transfer',
        paid_by: expenseForm.paid_by || currentUsername,
        supplier_id: expenseForm.supplier_id,
        supplier_name: expenseForm.supplier_name,
        related_trip_id: expenseForm.related_trip_id,
        invoice_receipt_number: expenseForm.invoice_receipt_number,
        notes: expenseForm.notes || '',
        status: (expenseForm.status as any) || 'Paid'
      };
      onAddExpense(newExp);
      onAddAuditLog({
        id: 'LOG-' + Date.now(),
        user_name: currentUsername,
        user_role: userRole,
        action: 'Created',
        record_type: 'Expense',
        record_id: newExp.expense_id,
        new_value: `${newExp.amount} ${newExp.currency} (${newExp.category})`,
        date_time: new Date().toLocaleString()
      });
      triggerBanner(isAr ? 'تم تسجيل المصروف وظهوره فوراً في لوحة المالية وتقرير الأرباح والخسائر' : 'Expense recorded and live on the Finance Dashboard & P&L');
    }
    setShowExpenseModal(false);
    setEditingExpense(null);
    setExpenseForm({
      category: 'Office Rent',
      description: '',
      amount: 0,
      currency: 'EGP',
      exchange_rate: 1,
      payment_method: 'Bank Transfer',
      paid_by: currentUsername,
      date: new Date().toISOString().split('T')[0],
      status: 'Paid',
      notes: ''
    });
  };

  const handleCreateAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(emp => emp.id === advanceForm.employee_id);
    const chosenCurr = normalizeCurrencyCode(advanceForm.currency || 'EGP');
    const amt = Number(advanceForm.amount) || 0;
    const isRequest = advanceForm.request_mode === 'Requested';

    const newAdv: EmployeeAdvance = {
      id: 'ADV-' + Date.now(),
      advance_id: 'ADV-' + Math.floor(1000 + Math.random() * 9000),
      employee_id: advanceForm.employee_id,
      employee_name: emp ? emp.name : currentUsername,
      date: new Date().toISOString().split('T')[0],
      amount: amt,
      currency: chosenCurr,
      reason: advanceForm.reason,
      repayment_method: advanceForm.repayment_method,
      outstanding_amount: amt,
      status: isRequest ? 'Requested' : 'Outstanding',
      requested_by: currentUsername,
      approved_by: isRequest ? undefined : currentUsername,
      approved_at: isRequest ? undefined : new Date().toISOString().split('T')[0]
    };
    onAddAdvance(newAdv);
    onAddAuditLog({
      id: 'LOG-' + Date.now(),
      user_name: currentUsername,
      user_role: userRole,
      action: 'Created',
      record_type: 'Employee Advance',
      record_id: newAdv.advance_id,
      new_value: `${newAdv.amount} ${newAdv.currency} (${newAdv.status}) for ${newAdv.employee_name}`,
      date_time: new Date().toLocaleString()
    });
    setShowAdvanceModal(false);
    setAdvanceForm({
      employee_id: '',
      amount: 0,
      currency: 'EGP',
      reason: '',
      repayment_method: 'Payroll Deduction',
      request_mode: 'Outstanding'
    });
    triggerBanner(
      isRequest
        ? (isAr ? 'تم تسجيل طلب السلفة ومزامنته في لوحة المالية' : 'Employee advance request recorded on Finance Dashboard')
        : (isAr ? 'تم اعتماد وصرف السلفة ومزامنتها مع لوحة المالية والرواتب' : 'Employee advance issued and synced with Finance Dashboard & Payroll')
    );
  };

  const handleApproveAdvance = (adv: EmployeeAdvance) => {
    const updated: EmployeeAdvance = {
      ...adv,
      status: 'Outstanding',
      outstanding_amount: Number(adv.amount) || 0,
      approved_by: currentUsername,
      approved_at: new Date().toISOString().split('T')[0]
    };
    onUpdateAdvance(updated);
    onAddAuditLog({
      id: 'LOG-' + Date.now(),
      user_name: currentUsername,
      user_role: userRole,
      action: 'Updated',
      record_type: 'Employee Advance',
      record_id: adv.advance_id,
      previous_value: 'Requested',
      new_value: `Approved (${adv.amount} ${adv.currency})`,
      date_time: new Date().toLocaleString()
    });
    triggerBanner(isAr ? `تم اعتماد سلفة ${adv.employee_name}` : `Approved advance for ${adv.employee_name}`);
  };

  const handleRejectAdvance = (adv: EmployeeAdvance) => {
    const updated: EmployeeAdvance = {
      ...adv,
      status: 'Rejected',
      outstanding_amount: 0,
      approved_by: currentUsername,
      approved_at: new Date().toISOString().split('T')[0]
    };
    onUpdateAdvance(updated);
    triggerBanner(isAr ? `تم رفض طلب سلفة ${adv.employee_name}` : `Rejected advance request for ${adv.employee_name}`, 'info');
  };

  const handleRepayAdvanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdvanceForRepay) return;
    const payAmt = Math.max(0, Number(repayAmount) || 0);
    const currentOut = Number(selectedAdvanceForRepay.outstanding_amount) || 0;
    const nextOut = Math.max(0, currentOut - payAmt);
    const nextStatus: EmployeeAdvance['status'] = nextOut <= 0 ? 'Fully Repaid' : 'Partially Repaid';

    onUpdateAdvance({
      ...selectedAdvanceForRepay,
      outstanding_amount: nextOut,
      status: nextStatus
    });
    onAddAuditLog({
      id: 'LOG-' + Date.now(),
      user_name: currentUsername,
      user_role: userRole,
      action: 'Updated',
      record_type: 'Employee Advance',
      record_id: selectedAdvanceForRepay.advance_id,
      previous_value: `Outstanding: ${currentOut} ${selectedAdvanceForRepay.currency}`,
      new_value: `Outstanding: ${nextOut} ${selectedAdvanceForRepay.currency} (${nextStatus})`,
      date_time: new Date().toLocaleString()
    });
    setShowRepayModal(false);
    setSelectedAdvanceForRepay(null);
    triggerBanner(isAr ? 'تم تحديث سداد السلفة بنجاح' : 'Advance repayment recorded successfully');
  };

  const handleCreateCommission = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(empItem => empItem.id === commissionForm.employee_id);
    const chosenCurr = normalizeCurrencyCode(commissionForm.currency || 'EGP');
    const saleAmt = Number(commissionForm.sale_amount) || 0;
    const pct = Number(commissionForm.commission_percentage) || 0;
    const commAmt = Math.round(((saleAmt * pct) / 100) * 100) / 100;

    const newComm: CommissionRecord = {
      id: 'COMM-' + Date.now(),
      commission_id: 'COM-' + Math.floor(1000 + Math.random() * 9000),
      employee_id: commissionForm.employee_id,
      employee_name: emp ? emp.name : 'Staff Member',
      customer_name: commissionForm.customer_name,
      reservation_id: commissionForm.reservation_id,
      trip_name: commissionForm.trip_name,
      sale_amount: saleAmt,
      commission_percentage: pct,
      commission_amount: commAmt,
      currency: chosenCurr,
      date: new Date().toISOString().split('T')[0],
      status: 'Pending'
    };
    onAddCommission(newComm);
    onAddAuditLog({
      id: 'LOG-' + Date.now(),
      user_name: currentUsername,
      user_role: userRole,
      action: 'Created',
      record_type: 'Sales Commission',
      record_id: newComm.commission_id,
      new_value: `${commAmt} ${chosenCurr} for ${newComm.employee_name}`,
      date_time: new Date().toLocaleString()
    });
    setShowCommissionModal(false);
    setCommissionForm({
      employee_id: '',
      source_ref: '',
      customer_name: '',
      reservation_id: '',
      trip_name: '',
      sale_amount: 0,
      commission_percentage: 5,
      currency: 'EGP'
    });
    triggerBanner(isAr ? 'تم تسجيل عمولة الموظف ومزامنتها مع لوحة المالية' : 'Employee commission recorded and synced with Finance Dashboard');
  };

  const handleSyncUnloggedCommissions = () => {
    if (unloggedSalesCandidates.length === 0) {
      triggerBanner(isAr ? 'جميع عمولات المبيعات والفواتير مسجلة بالفعل' : 'All eligible invoice & booking commissions are already recorded', 'info');
      return;
    }
    unloggedSalesCandidates.forEach((cand, idx) => {
      const pct = Number(cand.emp.commission_rate) || 5;
      const commAmt = Math.round(((cand.sale_amount * pct) / 100) * 100) / 100;
      const rec: CommissionRecord = {
        id: `COMM-${Date.now()}-${idx}`,
        commission_id: `COM-${Math.floor(1000 + Math.random() * 9000)}`,
        employee_id: cand.emp.id,
        employee_name: cand.emp.name,
        customer_name: cand.customer_name,
        reservation_id: cand.ref,
        trip_name: cand.trip_name,
        sale_amount: cand.sale_amount,
        commission_percentage: pct,
        commission_amount: commAmt,
        currency: cand.currency,
        date: cand.date,
        status: 'Pending'
      };
      onAddCommission(rec);
    });
    triggerBanner(
      isAr
        ? `تم استيراد وتسجيل ${unloggedSalesCandidates.length} عمولة تلقائياً من الفواتير والحجوزات`
        : `Synchronized & recorded ${unloggedSalesCandidates.length} employee commission(s) from sales & invoices`
    );
  };

  const handleMarkPaidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayrollRecord) return;
    const paidVal = Number(payForm.paid_amount) || 0;
    const targetNet = Number(selectedPayrollRecord.net_salary) || 0;
    const nextStatus: 'Paid' | 'Partially Paid' = paidVal >= targetNet ? 'Paid' : 'Partially Paid';

    onUpdatePayrollStatus(selectedPayrollRecord.id, nextStatus, {
      ...payForm,
      paid_amount: paidVal
    });

    // If fully paid, also settle Payroll Deduction advances that were deducted on this payroll
    if (nextStatus === 'Paid' && (Number(selectedPayrollRecord.advances) || 0) > 0) {
      let remainingDeductionToApply = Number(selectedPayrollRecord.advances) || 0;
      advances
        .filter(
          a =>
            a.employee_id === selectedPayrollRecord.employee_id &&
            (a.status === 'Outstanding' || a.status === 'Approved' || a.status === 'Partially Repaid') &&
            a.repayment_method === 'Payroll Deduction'
        )
        .forEach(adv => {
          if (remainingDeductionToApply <= 0) return;
          const advOutInEgp = convertCurrency(adv.outstanding_amount, adv.currency || 'EGP', selectedPayrollRecord.currency || 'EGP', activeRates);
          const deductInEgp = Math.min(advOutInEgp, remainingDeductionToApply);
          remainingDeductionToApply -= deductInEgp;
          const deductInAdvCurr = convertCurrency(deductInEgp, selectedPayrollRecord.currency || 'EGP', adv.currency || 'EGP', activeRates);
          const nextOut = Math.max(0, Math.round((adv.outstanding_amount - deductInAdvCurr) * 100) / 100);
          onUpdateAdvance({
            ...adv,
            outstanding_amount: nextOut,
            status: nextOut <= 0 ? 'Fully Repaid' : 'Partially Repaid'
          });
        });
    }

    // Mark Pending commissions for this employee as Paid if included in payroll
    if (nextStatus === 'Paid' && onUpdateCommission && (Number(selectedPayrollRecord.commission) || 0) > 0) {
      commissions
        .filter(c => c.employee_id === selectedPayrollRecord.employee_id && (c.status === 'Pending' || c.status === 'Added to Payroll'))
        .forEach(c => {
          onUpdateCommission({ ...c, status: 'Paid' });
        });
    }

    onAddAuditLog({
      id: 'LOG-' + Date.now(),
      user_name: currentUsername,
      user_role: userRole,
      action: 'Paid',
      record_type: 'Payroll',
      record_id: `${selectedPayrollRecord.payroll_month}-${selectedPayrollRecord.employee_name}`,
      new_value: `${nextStatus}: ${paidVal} ${selectedPayrollRecord.currency || 'EGP'}`,
      date_time: new Date().toLocaleString()
    });
    setShowPayModal(false);
    setSelectedPayrollRecord(null);
    triggerBanner(isAr ? 'تم تسجيل صرف الراتب وتحديث الأرصدة المالية' : 'Payroll payment recorded and synchronized');
  };

  const handleSavePayrollEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayroll) return;
    const basic = Number(payrollEditForm.basic_salary) || 0;
    const allow = Number(payrollEditForm.allowances) || 0;
    const comm = Number(payrollEditForm.commission) || 0;
    const bonus = Number(payrollEditForm.bonus) || 0;
    const ded = Number(payrollEditForm.deductions) || 0;
    const adv = Number(payrollEditForm.advances) || 0;
    const net = Math.max(0, basic + allow + comm + bonus - ded - adv);

    onUpdatePayrollStatus(editingPayroll.id, editingPayroll.status, {
      basic_salary: basic,
      allowances: allow,
      commission: comm,
      bonus,
      deductions: ded,
      advances: adv,
      net_salary: net
    });
    setShowEditPayrollModal(false);
    setEditingPayroll(null);
    triggerBanner(isAr ? 'تم تحديث مفردات راتب شهر ديسمبر بنجاح' : 'Payroll breakdown updated and recalculated');
  };

  // Real CSV Export (No window.alert)
  const exportFinancialSummaryCSV = (reportTitle: string = 'sofia_finance_summary') => {
    const rows: string[][] = [
      ['Metric / Category', 'Amount', 'Currency', 'Notes'],
      ['Total Revenue (Invoices + Uninvoiced Bookings)', financeSummary.totalRevenue.toFixed(2), displayCurrency, `${customerInvoices.length} Customer Invoices + ${uninvoicedCustomerBookings.length} Uninvoiced Bookings`],
      ['Customer Invoices Revenue', financeSummary.invoicedRevenue.toFixed(2), displayCurrency, `${customerInvoices.length} Invoices`],
      ['Uninvoiced Bookings Revenue', financeSummary.uninvoicedBookingRevenue.toFixed(2), displayCurrency, `${uninvoicedCustomerBookings.length} Bookings`],
      ['Total Cash Collected', financeSummary.totalCollectedCash.toFixed(2), displayCurrency, 'Paid Invoices & Deposits'],
      ['Pending Customer Receivables', financeSummary.totalCustomerReceivables.toFixed(2), displayCurrency, 'Unpaid Client Balances'],
      ['Direct Supplier & Trip Costs (COGS)', financeSummary.totalDirectCosts.toFixed(2), displayCurrency, `${supplierInvoices.length} Supplier Invoices + Trip Costs`],
      ['Pending Supplier Payables', financeSummary.totalSupplierPayables.toFixed(2), displayCurrency, 'Unpaid Supplier Balances'],
      ['Gross Operating Profit', financeSummary.grossProfit.toFixed(2), displayCurrency, `${financeSummary.grossMarginPct.toFixed(1)}% Gross Margin`],
      ['Operating Expenses (OPEX)', financeSummary.totalExpenses.toFixed(2), displayCurrency, `${filteredExpenses.length} Expense Entries`],
      ['Payroll Base Salaries (December Cycle)', financeSummary.payrollBaseExpense.toFixed(2), displayCurrency, `Target Month: ${defaultDecemberPayrollMonth}`],
      ['Employee Commissions', financeSummary.totalCommissions.toFixed(2), displayCurrency, `${filteredCommissions.length} Commission Records`],
      ['Net Operating Profit / (Loss)', financeSummary.netOperatingProfit.toFixed(2), displayCurrency, `${financeSummary.netMarginPct.toFixed(1)}% Net Margin`],
      ['Employee Advances (Outstanding)', financeSummary.totalOutstandingAdvances.toFixed(2), displayCurrency, `${financeSummary.requestedAdvancesCount} Pending Requests`],
      ['Net Treasury Cash Position', financeSummary.netCashPosition.toFixed(2), displayCurrency, 'Cash Inflows minus Paid Outflows & Advances']
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${reportTitle}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onAddAuditLog({
      id: 'LOG-' + Date.now(),
      user_name: currentUsername,
      user_role: userRole,
      action: 'Exported Report',
      record_type: 'Finance & P&L Statement',
      record_id: reportTitle.toUpperCase(),
      date_time: new Date().toLocaleString()
    });
    triggerBanner(isAr ? 'تم تحميل التقرير المالي بصيغة CSV بنجاح' : 'Financial report exported to CSV successfully');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-50 min-h-screen">
      {/* In-App Feedback Banner */}
      {localToast && (
        <div
          className={`flex items-center justify-between px-4 py-3 rounded-2xl border shadow-sm text-xs font-bold ${
            localToast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{localToast.message}</span>
          </div>
          <button onClick={() => setLocalToast(null)} className="p-1 hover:bg-black/5 rounded-lg cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Module Header */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-[11px] font-extrabold uppercase tracking-wider">
              {isAr ? 'ملخص الملاك والمحاسب المالي' : 'Owners & Accountant Hub'}
            </span>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-extrabold uppercase tracking-wider">
              {isAr ? 'متزامن لحظياً مع الفواتير والنظام' : 'Live Synced: Invoices • Expenses • Payroll • P&L'}
            </span>
            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] font-extrabold">
              {isAr ? `رواتب ديسمبر (${defaultDecemberPayrollMonth})` : `December Salary Cycle (${defaultDecemberPayrollMonth})`}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
            {isAr ? 'مركز القيادة المالية والرواتب والأرباح' : 'Finance & Payroll Command Hub'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAr
              ? 'ملخص مالي شامل وسهل الفهم لملاك الشركة والمحاسب: الفواتير، المصروفات، سلف وعمولات الموظفين، مسير رواتب ديسمبر، وتقرير الأرباح والخسائر.'
              : 'Clear executive & accounting command summary synchronizing site-wide Invoices, Operating Expenses, December Payroll, Employee Advances, Commissions, and Profit & Loss.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Display Base Currency Selector */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
            {(['EGP', 'USD', 'EUR'] as const).map(curr => (
              <button
                key={curr}
                onClick={() => setDisplayCurrency(curr)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  displayCurrency === curr
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {curr}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setEditingExpense(null);
              setExpenseForm({
                category: 'Office Rent',
                description: '',
                amount: 0,
                currency: 'EGP',
                exchange_rate: 1,
                payment_method: 'Bank Transfer',
                paid_by: currentUsername,
                date: new Date().toISOString().split('T')[0],
                status: 'Paid',
                notes: ''
              });
              setShowExpenseModal(true);
            }}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'تسجيل مصروف' : 'Add Expense'}</span>
          </button>

          <button
            onClick={() => {
              setAdvanceForm({
                employee_id: employees[0]?.id || '',
                amount: 0,
                currency: 'EGP',
                reason: '',
                repayment_method: 'Payroll Deduction',
                request_mode: 'Outstanding'
              });
              setShowAdvanceModal(true);
            }}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'سلفة موظف' : 'Employee Advance'}</span>
          </button>

          <button
            onClick={() => {
              const firstEmp = employees[0];
              setCommissionForm({
                employee_id: firstEmp?.id || '',
                source_ref: '',
                customer_name: '',
                reservation_id: '',
                trip_name: '',
                sale_amount: 0,
                commission_percentage: firstEmp?.commission_rate || 5,
                currency: 'EGP'
              });
              setShowCommissionModal(true);
            }}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'تسجيل عمولة' : 'Record Commission'}</span>
          </button>

          <button
            onClick={() => exportFinancialSummaryCSV('sofia_finance_dashboard')}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2.5 rounded-xl text-xs font-bold border border-slate-200 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isAr ? 'تصدير CSV' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
        {[
          { id: 'dashboard', label: isAr ? 'لوحة المالية الشاملة' : 'Finance Dashboard', icon: PieChart },
          { id: 'pl', label: isAr ? 'الأرباح والخسائر (P&L)' : 'Profit & Loss', icon: Calculator },
          { id: 'expenses', label: isAr ? `المصروفات (${expenses.length})` : `Expenses (${expenses.length})`, icon: Receipt },
          { id: 'payroll', label: isAr ? `رواتب ديسمبر (${payrollRecords.length})` : `Payroll (${payrollRecords.length})`, icon: Users },
          { id: 'advances', label: isAr ? `سلف الموظفين (${advances.length})` : `Advances (${advances.length})`, icon: CreditCard },
          { id: 'commissions', label: isAr ? `عمولات الموظفين (${commissions.length})` : `Commissions (${commissions.length})`, icon: TrendingUp },
          { id: 'trip-profit', label: isAr ? 'أرباح الرحلات' : 'Trip Profitability', icon: Briefcase },
          { id: 'converter', label: isAr ? 'محول العملات' : 'Currency Converter', icon: Globe },
          { id: 'reports', label: isAr ? 'التقارير المالية' : 'Financial Reports', icon: FileText },
          { id: 'audit', label: isAr ? 'سجل المراجعة' : 'Audit Logs', icon: Shield }
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                active ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Period Filter Bar (Shared by Finance Dashboard & P&L) */}
      {(activeTab === 'dashboard' || activeTab === 'pl') && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-5 py-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>
              {isAr
                ? 'نطاق البيانات المعروضة (جميع العملات محولة تلقائياً إلى ' + displayCurrency + '):'
                : `Synchronized Accounting Period (Multi-currency converted to ${displayCurrency}):`}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: isAr ? 'كل البيانات النشطة (تراكمي)' : 'All Active Data (Cumulative)' },
              { id: 'november', label: isAr ? `نوفمبر ${currentYear} (بداية التعيين)` : `November ${currentYear}` },
              { id: 'december', label: isAr ? `ديسمبر ${currentYear} (مسير الرواتب)` : `December ${currentYear}` },
              { id: 'year', label: isAr ? `سنة ${currentYear}` : `Full Year ${currentYear}` }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setPeriodFilter(p.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  periodFilter === p.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          1. FINANCE DASHBOARD (Executive Summary for Company Owners & Accountant)
         ===================================================================== */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Row 1: Primary Executive Owner & Accountant KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Revenue (Invoices + Bookings) */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                  {isAr ? 'إجمالي الإيرادات (الفواتير والحجوزات)' : 'Total Revenue (Invoices & Sales)'}
                </span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {formatCurrency(financeSummary.totalRevenue, displayCurrency)}
              </div>
              <div className="text-[11px] text-slate-500 space-y-0.5 pt-1 border-t border-slate-100">
                <div className="flex justify-between">
                  <span>{isAr ? `فواتير العملاء (${customerInvoices.length}):` : `Customer Invoices (${customerInvoices.length}):`}</span>
                  <span className="font-bold text-slate-800">{formatCurrency(financeSummary.invoicedRevenue, displayCurrency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{isAr ? `حجوزات غير مفوترة (${uninvoicedCustomerBookings.length}):` : `Uninvoiced Bookings (${uninvoicedCustomerBookings.length}):`}</span>
                  <span className="font-bold text-slate-800">{formatCurrency(financeSummary.uninvoicedBookingRevenue, displayCurrency)}</span>
                </div>
              </div>
            </div>

            {/* Cash Collected & Client Receivables */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                  {isAr ? 'التحصيل الفعلي ومستحقات العملاء' : 'Cash Collected & Receivables'}
                </span>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-blue-700">
                {formatCurrency(financeSummary.totalCollectedCash, displayCurrency)}
              </div>
              <div className="text-[11px] text-slate-500 space-y-0.5 pt-1 border-t border-slate-100">
                <div className="flex justify-between">
                  <span>{isAr ? 'أرصدة متبقية على العملاء:' : 'Pending Client Receivables:'}</span>
                  <span className="font-bold text-amber-600">{formatCurrency(financeSummary.totalCustomerReceivables, displayCurrency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{isAr ? 'صافي سيولة الخزينة:' : 'Net Treasury Cash:'}</span>
                  <span className={`font-bold ${financeSummary.netCashPosition >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatCurrency(financeSummary.netCashPosition, displayCurrency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Direct Supplier & Trip Costs + Operating Expenses */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                  {isAr ? 'تكاليف الموردين والمصروفات' : 'Supplier Costs & Expenses'}
                </span>
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                  <ArrowDownRight className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-black text-rose-600">
                {formatCurrency(financeSummary.totalDirectCosts + financeSummary.totalExpenses, displayCurrency)}
              </div>
              <div className="text-[11px] text-slate-500 space-y-0.5 pt-1 border-t border-slate-100">
                <div className="flex justify-between">
                  <span>{isAr ? 'تكاليف الموردين والرحلات:' : 'Supplier & Trip Costs:'}</span>
                  <span className="font-bold text-slate-800">{formatCurrency(financeSummary.totalDirectCosts, displayCurrency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{isAr ? `المصروفات التشغيلية (${filteredExpenses.length}):` : `Operating Expenses (${filteredExpenses.length}):`}</span>
                  <span className="font-bold text-rose-600">{formatCurrency(financeSummary.totalExpenses, displayCurrency)}</span>
                </div>
              </div>
            </div>

            {/* Net Operating Profit / Loss */}
            <div
              className={`p-5 rounded-3xl border shadow-sm space-y-2 ${
                financeSummary.netOperatingProfit >= 0
                  ? 'bg-slate-900 text-white border-slate-800'
                  : 'bg-rose-950 text-white border-rose-900'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">
                  {isAr ? 'صافي الربح التشغيلي (P&L)' : 'Net Operating Profit (P&L)'}
                </span>
                <div className="p-2 bg-white/10 text-emerald-400 rounded-xl">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className={`text-2xl font-black ${financeSummary.netOperatingProfit >= 0 ? 'text-emerald-400' : 'text-rose-300'}`}>
                {formatCurrency(financeSummary.netOperatingProfit, displayCurrency)}
              </div>
              <div className="text-[11px] text-slate-300 space-y-0.5 pt-1 border-t border-white/10">
                <div className="flex justify-between">
                  <span>{isAr ? 'مجمل الربح قبل المصاريف:' : 'Gross Profit:'}</span>
                  <span className="font-bold text-white">{formatCurrency(financeSummary.grossProfit, displayCurrency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{isAr ? 'هامش صافي الربح:' : 'Net Profit Margin:'}</span>
                  <span className="font-bold text-emerald-400">{financeSummary.netMarginPct.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Staff Financial Obligations & Expense Cards (December Payroll, Advances, Commissions, Supplier Payables) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* December Salary Payroll */}
            <div
              onClick={() => setActiveTab('payroll')}
              className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 shadow-xs transition-all cursor-pointer space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">
                  {isAr ? `مسير رواتب ديسمبر (${defaultDecemberPayrollMonth})` : `December Payroll (${defaultDecemberPayrollMonth})`}
                </span>
                <Users className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-lg font-black text-slate-900">
                {formatCurrency(financeSummary.decemberPayrollLiability, displayCurrency)}
              </div>
              <p className="text-[11px] text-indigo-600 font-semibold">
                {financeSummary.decemberPayrollsCount > 0
                  ? (isAr ? `${financeSummary.decemberPayrollsCount} راتب مُصدر لشهر ديسمبر` : `${financeSummary.decemberPayrollsCount} December payslips generated`)
                  : (isAr ? 'مقدر بناءً على رواتب ديسمبر (بداية العمل نوفمبر)' : 'Estimated on December base salaries (Nov start)')}
              </p>
            </div>

            {/* Employee Advances */}
            <div
              onClick={() => setActiveTab('advances')}
              className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-amber-300 shadow-xs transition-all cursor-pointer space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">
                  {isAr ? 'سلف الموظفين (القائمة والمطلوبة)' : 'Employee Advances'}
                </span>
                <CreditCard className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-lg font-black text-slate-900">
                {formatCurrency(financeSummary.totalOutstandingAdvances, displayCurrency)}
              </div>
              <p className="text-[11px] text-amber-700 font-semibold">
                {financeSummary.requestedAdvancesCount > 0
                  ? (isAr
                      ? `${financeSummary.requestedAdvancesCount} طلب سلفة بانتظار الموافقة (${formatCurrency(financeSummary.totalRequestedAdvances, displayCurrency)})`
                      : `${financeSummary.requestedAdvancesCount} Pending Request(s) (${formatCurrency(financeSummary.totalRequestedAdvances, displayCurrency)})`)
                  : (isAr ? `${filteredAdvances.length} سجل سلفة متزامن` : `${filteredAdvances.length} total advance record(s)`)}
              </p>
            </div>

            {/* Employee Commissions */}
            <div
              onClick={() => setActiveTab('commissions')}
              className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 shadow-xs transition-all cursor-pointer space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">
                  {isAr ? 'عمولات الموظفين المسجلة' : 'Employee Commissions'}
                </span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-lg font-black text-emerald-700">
                {formatCurrency(financeSummary.totalCommissions, displayCurrency)}
              </div>
              <p className="text-[11px] text-slate-500 font-semibold">
                {isAr
                  ? `معلق للصرف: ${formatCurrency(financeSummary.pendingCommissions, displayCurrency)} (${filteredCommissions.length} سجل)`
                  : `Pending payout: ${formatCurrency(financeSummary.pendingCommissions, displayCurrency)} (${filteredCommissions.length} records)`}
              </p>
            </div>

            {/* Supplier Payables */}
            <div
              onClick={() => onNavigateTab && onNavigateTab('invoices')}
              className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-rose-300 shadow-xs transition-all cursor-pointer space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">
                  {isAr ? 'مستحقات الموردين غير المدفوعة' : 'Pending Supplier Payables'}
                </span>
                <Building2 className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-lg font-black text-rose-600">
                {formatCurrency(financeSummary.totalSupplierPayables, displayCurrency)}
              </div>
              <p className="text-[11px] text-slate-500 font-semibold">
                {isAr
                  ? `${supplierInvoices.length} فاتورة مورد • ${suppliers.length} مورد مسجل`
                  : `${supplierInvoices.length} Supplier Invoice(s) • ${suppliers.length} Suppliers`}
              </p>
            </div>
          </div>

          {/* Row 3: SYNCHRONIZED INVOICES LEDGER ON FINANCE DASHBOARD + EXECUTIVE P&L SNAPSHOT */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Synchronized Invoices Summary & Recent Invoices Table */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <h3 className="font-extrabold text-slate-900 text-sm">
                      {isAr ? 'مزامنة الفواتير (فواتير العملاء والموردين)' : 'Synchronized Invoices Overview (Client & Supplier)'}
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {isAr
                      ? 'جميع الفواتير الصادرة من قسم الفواتير تظهر هنا تلقائياً مع التحصيل والأرصدة المتبقية.'
                      : 'Every customer and supplier invoice issued across the site is automatically synchronized here.'}
                  </p>
                </div>
                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab('invoices')}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    {isAr ? 'فتح إدارة الفواتير ←' : 'Open Invoices Module →'}
                  </button>
                )}
              </div>

              {/* Invoice Status & Currency Breakdown Strip */}
              <div className="px-5 py-3 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg font-bold">
                    {isAr ? 'مدفوعة:' : 'Paid:'} {activeInvoices.filter(i => i.payment_status === 'Paid').length}
                  </span>
                  <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-lg font-bold">
                    {isAr ? 'مدفوعة جزئياً:' : 'Partial:'} {activeInvoices.filter(i => i.payment_status === 'Partially Paid').length}
                  </span>
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg font-bold">
                    {isAr ? 'غير مدفوعة:' : 'Unpaid:'} {activeInvoices.filter(i => i.payment_status === 'Unpaid' || i.payment_status === 'Overdue').length}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {Object.keys(financeSummary.invoicesByCurrency).map(curr => (
                    <span key={curr} className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-extrabold text-slate-800">
                      {curr}: {formatCurrency(financeSummary.invoicesByCurrency[curr].billed, curr)}
                    </span>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 font-semibold">{isAr ? 'رقم الفاتورة' : 'Invoice #'}</th>
                      <th className="py-3 px-4 font-semibold">{isAr ? 'النوع / الجهة' : 'Type / Party'}</th>
                      <th className="py-3 px-4 font-semibold">{isAr ? 'التاريخ' : 'Date'}</th>
                      <th className="py-3 px-4 font-semibold">{isAr ? 'الإجمالي' : 'Total'}</th>
                      <th className="py-3 px-4 font-semibold">{isAr ? 'المدفوع' : 'Paid'}</th>
                      <th className="py-3 px-4 font-semibold">{isAr ? 'المتبقي' : 'Balance Due'}</th>
                      <th className="py-3 px-4 font-semibold">{isAr ? 'الحالة' : 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          {isAr ? 'لا توجد فواتير مسجلة في هذه الفترة بعد.' : 'No invoices issued in this period yet.'}
                        </td>
                      </tr>
                    ) : (
                      activeInvoices.slice(0, 8).map(inv => {
                        const isSup = inv.recipient_type === 'Supplier';
                        const due = Math.max(0, Number(inv.balance_due ?? ((Number(inv.total_amount) || 0) - (Number(inv.paid_amount) || 0))));
                        return (
                          <tr key={inv.id} className="hover:bg-slate-50/80">
                            <td className="py-3 px-4 font-mono font-bold text-slate-900">{inv.invoice_number}</td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-800">
                                {isSup ? inv.supplier_name : inv.customer_name}
                              </div>
                              <span
                                className={`inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                  isSup ? 'bg-purple-50 text-purple-700' : 'bg-cyan-50 text-cyan-700'
                                }`}
                              >
                                {isSup ? (isAr ? 'مورد' : 'Supplier') : (isAr ? 'عميل' : 'Customer')}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-500">{inv.issue_date}</td>
                            <td className="py-3 px-4 font-extrabold text-slate-900">
                              {formatCurrency(inv.total_amount, inv.currency)}
                            </td>
                            <td className="py-3 px-4 font-bold text-emerald-600">
                              {formatCurrency(inv.paid_amount, inv.currency)}
                            </td>
                            <td className="py-3 px-4 font-bold text-amber-600">
                              {formatCurrency(due, inv.currency)}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  inv.payment_status === 'Paid'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : inv.payment_status === 'Partially Paid'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {inv.payment_status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Easy-to-Understand Owner & Accountant Profit & Loss Snapshot */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">
                      {isAr ? 'ملخص الأرباح والخسائر السريع' : 'Owner & Accountant P&L Summary'}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {isAr ? 'معادلة مالية واضحة ومباشرة' : 'Synchronized real-time accounting equation'}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('pl')}
                    className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    {isAr ? 'التفاصيل ←' : 'Full P&L →'}
                  </button>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
                    <span className="font-bold text-emerald-950">{isAr ? '(+) إجمالي الإيرادات' : '(+) Gross Revenue'}</span>
                    <span className="font-black text-emerald-700">{formatCurrency(financeSummary.totalRevenue, displayCurrency)}</span>
                  </div>

                  <div className="flex justify-between items-center px-2.5 py-1.5 text-slate-600">
                    <span>{isAr ? '(-) تكاليف الموردين والرحلات' : '(-) Supplier & Trip Costs'}</span>
                    <span className="font-bold text-rose-600">-{formatCurrency(financeSummary.totalDirectCosts, displayCurrency)}</span>
                  </div>

                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-100 font-bold text-slate-900">
                    <span>{isAr ? '(=) مجمل الربح التشغيلي' : '(=) Gross Profit'}</span>
                    <span>{formatCurrency(financeSummary.grossProfit, displayCurrency)}</span>
                  </div>

                  <div className="flex justify-between items-center px-2.5 py-1 text-slate-600">
                    <span>{isAr ? '(-) المصروفات التشغيلية' : '(-) Operating Expenses'}</span>
                    <span className="font-bold text-rose-600">-{formatCurrency(financeSummary.totalExpenses, displayCurrency)}</span>
                  </div>

                  <div className="flex justify-between items-center px-2.5 py-1 text-slate-600">
                    <span>{isAr ? '(-) الرواتب الأساسية والبدلات' : '(-) Payroll Salaries'}</span>
                    <span className="font-bold text-rose-600">-{formatCurrency(financeSummary.payrollBaseExpense, displayCurrency)}</span>
                  </div>

                  <div className="flex justify-between items-center px-2.5 py-1 text-slate-600">
                    <span>{isAr ? '(-) عمولات المبيعات للموظفين' : '(-) Employee Commissions'}</span>
                    <span className="font-bold text-rose-600">-{formatCurrency(financeSummary.totalCommissions, displayCurrency)}</span>
                  </div>
                </div>
              </div>

              <div
                className={`p-4 rounded-2xl border ${
                  financeSummary.netOperatingProfit >= 0
                    ? 'bg-emerald-950 text-white border-emerald-800'
                    : 'bg-rose-950 text-white border-rose-800'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-200">
                    {isAr ? 'صافي الربح النهائي' : 'Net Profit / (Loss)'}
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-white/10">
                    {financeSummary.netMarginPct.toFixed(1)}%
                  </span>
                </div>
                <div className="text-xl font-black mt-1">
                  {formatCurrency(financeSummary.netOperatingProfit, displayCurrency)}
                </div>
                <div className="mt-2 pt-2 border-t border-white/15 flex justify-between text-[11px] text-slate-300">
                  <span>{isAr ? 'السلف القائمة (ذمم موظفين):' : 'Staff Advances Receivable:'}</span>
                  <span className="font-bold text-amber-300">{formatCurrency(financeSummary.totalOutstandingAdvances, displayCurrency)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Row 4: LIVE SYNCHRONIZED EXPENSES, EMPLOYEE ADVANCES & EMPLOYEE COMMISSIONS ON FINANCE DASHBOARD */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Panel A: Operating Expenses on Finance Dashboard */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-rose-600" />
                    <span>{isAr ? 'المصروفات المضافة حديثاً' : 'Operating Expenses'}</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isAr ? 'تظهر هنا فور إضافتها' : 'Live feed of all added company expenses'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setShowExpenseModal(true)}
                    className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-bold cursor-pointer"
                  >
                    + {isAr ? 'إضافة' : 'Add'}
                  </button>
                  <button
                    onClick={() => setActiveTab('expenses')}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold cursor-pointer"
                  >
                    {isAr ? 'الكل' : 'All'}
                  </button>
                </div>
              </div>

              {filteredExpenses.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 flex-1 flex items-center justify-center">
                  {isAr ? 'لم يتم تسجيل مصروفات بعد. اضغط "+ إضافة" لتسجيل مصروف.' : 'No expenses added yet. Click "+ Add" to record an expense.'}
                </div>
              ) : (
                <div className="p-4 space-y-2.5 flex-1 overflow-y-auto max-h-80">
                  {filteredExpenses.slice(0, 6).map(exp => (
                    <div key={exp.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md text-[10px] font-bold">
                            {exp.category}
                          </span>
                          <span className="text-[10px] text-slate-400">{exp.date}</span>
                        </div>
                        <p className="font-bold text-slate-800 truncate mt-1">{exp.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-black text-rose-600">{formatCurrency(exp.amount, exp.currency)}</div>
                        <span className={`text-[10px] font-bold ${(exp.status || 'Paid') === 'Paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {exp.status || 'Paid'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Panel B: Employee Advances (Requested & Active) on Finance Dashboard */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-indigo-600" />
                    <span>{isAr ? 'سلف الموظفين والطلبات' : 'Employee Advances & Requests'}</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isAr ? 'السلف المطلوبة والقائمة للموظفين' : 'Requested & active employee salary advances'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setShowAdvanceModal(true)}
                    className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-bold cursor-pointer"
                  >
                    + {isAr ? 'سلفة' : 'New'}
                  </button>
                  <button
                    onClick={() => setActiveTab('advances')}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold cursor-pointer"
                  >
                    {isAr ? 'الكل' : 'All'}
                  </button>
                </div>
              </div>

              {filteredAdvances.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 flex-1 flex items-center justify-center">
                  {isAr ? 'لا توجد سلف موظفين مسجلة أو مطلوبة حالياً.' : 'No employee advances requested or active yet.'}
                </div>
              ) : (
                <div className="p-4 space-y-2.5 flex-1 overflow-y-auto max-h-80">
                  {filteredAdvances.slice(0, 6).map(adv => (
                    <div key={adv.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-extrabold text-slate-900">{adv.employee_name}</div>
                          <div className="text-[10px] text-slate-500">{adv.date} • {adv.repayment_method}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-slate-900">{formatCurrency(adv.amount, adv.currency || 'EGP')}</div>
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              adv.status === 'Requested'
                                ? 'bg-amber-100 text-amber-800'
                                : adv.status === 'Fully Repaid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : adv.status === 'Rejected'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-indigo-100 text-indigo-800'
                            }`}
                          >
                            {adv.status}
                          </span>
                        </div>
                      </div>
                      {adv.reason && <p className="text-[11px] text-slate-600 truncate">"{adv.reason}"</p>}
                      {adv.status === 'Requested' && (
                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200/70">
                          <button
                            onClick={() => handleApproveAdvance(adv)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                          >
                            {isAr ? 'اعتماد وصرف' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleRejectAdvance(adv)}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-bold cursor-pointer"
                          >
                            {isAr ? 'رفض' : 'Reject'}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Panel C: Employee Commissions on Finance Dashboard */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>{isAr ? 'عمولات الموظفين المسجلة' : 'Employee Commissions'}</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isAr ? 'سجل عمولات المبيعات والفواتير للموظفين' : 'Recorded sales & invoice commissions'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {unloggedSalesCandidates.length > 0 && (
                    <button
                      onClick={handleSyncUnloggedCommissions}
                      title="Auto-record commissions from confirmed sales & invoices"
                      className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[11px] font-bold cursor-pointer"
                    >
                      {isAr ? `مزامنة (${unloggedSalesCandidates.length})` : `Sync (${unloggedSalesCandidates.length})`}
                    </button>
                  )}
                  <button
                    onClick={() => setShowCommissionModal(true)}
                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold cursor-pointer"
                  >
                    + {isAr ? 'عمولة' : 'Record'}
                  </button>
                  <button
                    onClick={() => setActiveTab('commissions')}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold cursor-pointer"
                  >
                    {isAr ? 'الكل' : 'All'}
                  </button>
                </div>
              </div>

              {filteredCommissions.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 flex-1 flex flex-col items-center justify-center gap-2">
                  <span>{isAr ? 'لا توجد عمولات موظفين مسجلة بعد.' : 'No employee commissions recorded yet.'}</span>
                  {unloggedSalesCandidates.length > 0 && (
                    <button
                      onClick={handleSyncUnloggedCommissions}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      {isAr
                        ? `استيراد ${unloggedSalesCandidates.length} عمولة من الفواتير والحجوزات`
                        : `Auto-Record ${unloggedSalesCandidates.length} Commission(s) from Sales`}
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-4 space-y-2.5 flex-1 overflow-y-auto max-h-80">
                  {filteredCommissions.slice(0, 6).map(comm => (
                    <div key={comm.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                      <div className="min-w-0 pr-2">
                        <div className="font-extrabold text-slate-900">{comm.employee_name}</div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {comm.trip_name || comm.reservation_id || 'Sale'} • {comm.commission_percentage}%
                        </div>
                        <div className="text-[10px] text-slate-400">{comm.date}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-black text-emerald-600">
                          {formatCurrency(comm.commission_amount, comm.currency || 'EGP')}
                        </div>
                        <span
                          className={`text-[10px] font-bold ${
                            comm.status === 'Paid'
                              ? 'text-emerald-700'
                              : comm.status === 'Added to Payroll'
                              ? 'text-indigo-600'
                              : 'text-amber-600'
                          }`}
                        >
                          {comm.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          2. REAL-TIME CURRENCY CONVERTER TAB
         ===================================================================== */}
      {activeTab === 'converter' && <RealTimeCurrencyConverter />}

      {/* =====================================================================
          3. EXPENSES MANAGEMENT TAB
         ===================================================================== */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder={isAr ? 'بحث في المصروفات أو الفئة...' : 'Search expense description, category, or ID...'}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={currencyFilter}
                onChange={e => setCurrencyFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
              >
                <option value="All">{isAr ? 'جميع العملات' : 'All Currencies'}</option>
                <option value="EGP">EGP</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="SAR">SAR</option>
                <option value="AED">AED</option>
              </select>
              <button
                onClick={() => {
                  setEditingExpense(null);
                  setShowExpenseModal(true);
                }}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isAr ? 'إضافة مصروف' : 'Add Expense'}</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                    <th className="py-3.5 px-4">ID / Date</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Description</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Equivalent ({displayCurrency})</th>
                    <th className="py-3.5 px-4">Method & Paid By</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {expenses
                    .filter(
                      e =>
                        (currencyFilter === 'All' || normalizeCurrencyCode(e.currency) === currencyFilter) &&
                        ((e.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (e.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (e.expense_id || '').toLowerCase().includes(searchTerm.toLowerCase()))
                    )
                    .map(exp => (
                      <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{exp.expense_id}</div>
                          <div className="text-[10px] text-slate-400">{exp.date}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg font-semibold text-[11px]">
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-800 max-w-xs truncate">{exp.description}</td>
                        <td className="py-3.5 px-4 font-extrabold text-slate-900">
                          {formatCurrency(exp.amount, exp.currency)}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-rose-600">
                          {formatCurrency(toBase(exp.amount, exp.currency), displayCurrency)}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-700">{exp.payment_method}</div>
                          <div className="text-[10px] text-slate-400">By: {exp.paid_by || exp.employee_name || 'Admin'}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              (exp.status || 'Paid') === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {exp.status || 'Paid'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1">
                          <button
                            onClick={() => {
                              setEditingExpense(exp);
                              setExpenseForm(exp);
                              setShowExpenseModal(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteConfirmState({
                                isOpen: true,
                                type: 'expense',
                                id: exp.id,
                                title: `${exp.expense_id} (${exp.description})`
                              })
                            }
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  {expenses.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                        {isAr ? 'لا توجد مصروفات مسجلة بعد.' : 'No operating expenses recorded yet.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          4. EMPLOYEE PAYROLL TAB (DECEMBER SALARY DEFAULT: 2026-12)
         ===================================================================== */}
      {activeTab === 'payroll' && (
        <div className="space-y-4">
          {/* December Salary Policy Notice */}
          <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-indigo-600 text-white rounded-md text-[10px] font-extrabold uppercase">
                  {isAr ? 'دورة رواتب ديسمبر المعتمدة' : 'December Salary Cycle'}
                </span>
                <h3 className="text-sm font-extrabold text-indigo-950">
                  {isAr
                    ? `توليد مسير الرواتب بناءً على راتب شهر ديسمبر (${defaultDecemberPayrollMonth})`
                    : `Payroll Generated Based on December's Salary (${defaultDecemberPayrollMonth})`}
                </h3>
              </div>
              <p className="text-xs text-indigo-800">
                {isAr
                  ? 'نظراً لأن التعيين وبداية العمل بدأت هذا الشهر (نوفمبر)، يتم احتساب وتوليد مسير الرواتب على أساس راتب شهر ديسمبر مع إدراج العمولات المستحقة وخصم السلف المعتمدة تلقائياً.'
                  : 'Since employment began this month (November), payroll is generated based on December’s salary, automatically incorporating recorded commissions and payroll-deductible employee advances.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <input
                type="month"
                value={generateMonth}
                onChange={e => setGenerateMonth(e.target.value)}
                className="bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs font-extrabold text-slate-800"
              />
              <button
                onClick={() => {
                  onGeneratePayroll(generateMonth);
                  onAddAuditLog({
                    id: 'LOG-' + Date.now(),
                    user_name: currentUsername,
                    user_role: userRole,
                    action: 'Generated Payroll',
                    record_type: 'Payroll Batch',
                    record_id: `BATCH-${generateMonth}`,
                    new_value: `Generated payroll based on ${generateMonth} salary for ${employees.length} employees`,
                    date_time: new Date().toLocaleString()
                  });
                  triggerBanner(
                    isAr
                      ? `تم توليد وتحديث مسير رواتب شهر ${generateMonth} بنجاح`
                      : `Generated & synchronized payroll for ${generateMonth} based on December salary cycle`
                  );
                }}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>
                  {isAr ? `توليد مسير رواتب ديسمبر (${generateMonth})` : `Generate December Payroll (${generateMonth})`}
                </span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                    <th className="py-3.5 px-4">Employee</th>
                    <th className="py-3.5 px-4">Salary Month</th>
                    <th className="py-3.5 px-4">December Basic Salary</th>
                    <th className="py-3.5 px-4">+ Allow / Comm / Bonus</th>
                    <th className="py-3.5 px-4">- Deduct / Advances</th>
                    <th className="py-3.5 px-4">Net Payable</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {payrollRecords.map(p => {
                    const curr = normalizeCurrencyCode(p.currency || 'EGP');
                    const additions = (Number(p.allowances) || 0) + (Number(p.commission) || 0) + (Number(p.bonus) || 0);
                    const subtractions = (Number(p.deductions) || 0) + (Number(p.advances) || 0);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{p.employee_name}</div>
                          <div className="text-[10px] text-slate-400">
                            {p.job_title} • {p.department}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-indigo-700">{p.payroll_month}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {formatCurrency(p.basic_salary, curr)}
                        </td>
                        <td className="py-3.5 px-4 text-emerald-600 font-semibold">
                          +{formatCurrency(additions, curr)}
                          <div className="text-[10px] text-slate-400 font-normal">
                            Comm: {formatCurrency(p.commission || 0, curr)} • Allow/Bonus: {formatCurrency((p.allowances || 0) + (p.bonus || 0), curr)}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-rose-600 font-semibold">
                          -{formatCurrency(subtractions, curr)}
                          <div className="text-[10px] text-slate-400 font-normal">
                            Adv: {formatCurrency(p.advances || 0, curr)} • Ded: {formatCurrency(p.deductions || 0, curr)}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-black text-slate-900 text-sm">
                          {formatCurrency(p.net_salary, curr)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                              p.status === 'Paid'
                                ? 'bg-emerald-50 text-emerald-700'
                                : p.status === 'Partially Paid'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {p.status}
                          </span>
                          {p.payment_date && (
                            <div className="text-[9px] text-slate-400 mt-0.5">Paid: {p.payment_date}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1.5">
                          <button
                            onClick={() => {
                              setEditingPayroll(p);
                              setPayrollEditForm({
                                basic_salary: Number(p.basic_salary) || 0,
                                allowances: Number(p.allowances) || 0,
                                commission: Number(p.commission) || 0,
                                bonus: Number(p.bonus) || 0,
                                deductions: Number(p.deductions) || 0,
                                advances: Number(p.advances) || 0
                              });
                              setShowEditPayrollModal(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Adjust Payroll Breakdown"
                          >
                            <Edit className="w-4 h-4 inline" />
                          </button>
                          {p.status !== 'Paid' && (
                            <button
                              onClick={() => {
                                setSelectedPayrollRecord(p);
                                setPayForm({
                                  payment_date: new Date().toISOString().split('T')[0],
                                  payment_method: 'Bank Transfer',
                                  paid_amount: p.net_salary,
                                  transaction_reference: '',
                                  notes: ''
                                });
                                setShowPayModal(true);
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                            >
                              {isAr ? 'صرف الراتب' : 'Mark Paid'}
                            </button>
                          )}
                          {onDeletePayroll && (
                            <button
                              onClick={() =>
                                setDeleteConfirmState({
                                  isOpen: true,
                                  type: 'payroll',
                                  id: p.id,
                                  title: `${p.employee_name} (${p.payroll_month})`
                                })
                              }
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4 inline" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {payrollRecords.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                        {isAr
                          ? `لا يوجد مسير رواتب مُصدر بعد. اضغط "توليد مسير رواتب ديسمبر (${defaultDecemberPayrollMonth})" أعلاه.`
                          : `No payroll records generated yet. Click "Generate December Payroll (${defaultDecemberPayrollMonth})" above to create December salary records.`}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          5. EMPLOYEE ADVANCES TAB
         ===================================================================== */}
      {activeTab === 'advances' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {isAr ? 'إدارة سلف الموظفين وطلبات السلف' : 'Employee Salary Advances & Requests'}
              </h3>
              <p className="text-xs text-slate-500">
                {isAr
                  ? 'جميع السلف المطلوبة أو المصروفة تظهر مباشرة في لوحة المالية وتُخصم تلقائياً في مسير رواتب ديسمبر عند اختيار الخصم من الراتب.'
                  : 'All requested and approved employee advances sync directly to the Finance Dashboard and December Payroll.'}
              </p>
            </div>
            <button
              onClick={() => {
                setAdvanceForm({
                  employee_id: employees[0]?.id || '',
                  amount: 0,
                  currency: 'EGP',
                  reason: '',
                  repayment_method: 'Payroll Deduction',
                  request_mode: 'Outstanding'
                });
                setShowAdvanceModal(true);
              }}
              className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'تسجيل / طلب سلفة جديدة' : 'Record / Request Advance'}</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                    <th className="py-3.5 px-4">Advance ID</th>
                    <th className="py-3.5 px-4">Employee</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Total Amount</th>
                    <th className="py-3.5 px-4">Outstanding</th>
                    <th className="py-3.5 px-4">Repayment & Reason</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {advances.map(adv => (
                    <tr key={adv.id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{adv.advance_id}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{adv.employee_name}</td>
                      <td className="py-3.5 px-4 text-slate-500">{adv.date}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {formatCurrency(adv.amount, adv.currency || 'EGP')}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-rose-600">
                        {formatCurrency(adv.outstanding_amount, adv.currency || 'EGP')}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="font-semibold text-slate-800">{adv.repayment_method}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">{adv.reason}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            adv.status === 'Fully Repaid'
                              ? 'bg-emerald-50 text-emerald-700'
                              : adv.status === 'Requested'
                              ? 'bg-amber-100 text-amber-800'
                              : adv.status === 'Rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-indigo-50 text-indigo-700'
                          }`}
                        >
                          {adv.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        {adv.status === 'Requested' && (
                          <>
                            <button
                              onClick={() => handleApproveAdvance(adv)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectAdvance(adv)}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-bold cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {(adv.status === 'Outstanding' || adv.status === 'Approved' || adv.status === 'Partially Repaid') && (
                          <button
                            onClick={() => {
                              setSelectedAdvanceForRepay(adv);
                              setRepayAmount(adv.outstanding_amount);
                              setShowRepayModal(true);
                            }}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[10px] font-bold cursor-pointer"
                          >
                            Repay
                          </button>
                        )}
                        <button
                          onClick={() =>
                            setDeleteConfirmState({
                              isOpen: true,
                              type: 'advance',
                              id: adv.id,
                              title: `${adv.advance_id} (${adv.employee_name})`
                            })
                          }
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {advances.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                        {isAr ? 'لا توجد سلف موظفين مسجلة بعد.' : 'No employee advances recorded yet.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          6. SALES COMMISSIONS TAB
         ===================================================================== */}
      {activeTab === 'commissions' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {isAr ? 'عمولات وحوافز المبيعات للموظفين' : 'Employee Sales Commissions & Incentives'}
              </h3>
              <p className="text-xs text-slate-500">
                {isAr
                  ? 'سجل عمولات الموظفين مرتبط بلوحة المالية ومسير رواتب ديسمبر وتقرير الأرباح والخسائر.'
                  : 'Recorded employee commissions synchronize directly with the Finance Dashboard, December Payroll, and P&L.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {unloggedSalesCandidates.length > 0 && (
                <button
                  onClick={handleSyncUnloggedCommissions}
                  className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>
                    {isAr
                      ? `استيراد عمولات المبيعات (${unloggedSalesCandidates.length})`
                      : `Auto-Sync Unlogged Sales (${unloggedSalesCandidates.length})`}
                  </span>
                </button>
              )}
              <button
                onClick={() => setShowCommissionModal(true)}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isAr ? 'تسجيل عمولة جديدة' : 'Record Commission'}</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                    <th className="py-3.5 px-4">ID / Date</th>
                    <th className="py-3.5 px-4">Employee</th>
                    <th className="py-3.5 px-4">Customer / Trip / Ref</th>
                    <th className="py-3.5 px-4">Sale Amount</th>
                    <th className="py-3.5 px-4">Rate %</th>
                    <th className="py-3.5 px-4">Commission Earned</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {commissions.map(c => {
                    const curr = normalizeCurrencyCode(c.currency || 'EGP');
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/80">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{c.commission_id}</div>
                          <div className="text-[10px] text-slate-400">{c.date}</div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{c.employee_name}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-700">{c.customer_name || 'Client'}</div>
                          <div className="text-[10px] text-slate-400">
                            {c.trip_name || 'Sale'} {c.reservation_id ? `(${c.reservation_id})` : ''}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700">
                          {formatCurrency(c.sale_amount, curr)}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-blue-600">{c.commission_percentage}%</td>
                        <td className="py-3.5 px-4 font-black text-emerald-600">
                          {formatCurrency(c.commission_amount, curr)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              c.status === 'Paid'
                                ? 'bg-emerald-50 text-emerald-700'
                                : c.status === 'Added to Payroll'
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1.5">
                          {onUpdateCommission && c.status !== 'Paid' && (
                            <button
                              onClick={() => {
                                onUpdateCommission({ ...c, status: 'Paid' });
                                triggerBanner(isAr ? 'تم تحديث حالة العمولة إلى مدفوعة' : 'Commission marked as Paid');
                              }}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-bold cursor-pointer"
                            >
                              Mark Paid
                            </button>
                          )}
                          <button
                            onClick={() =>
                              setDeleteConfirmState({
                                isOpen: true,
                                type: 'commission',
                                id: c.id,
                                title: `${c.commission_id} (${c.employee_name})`
                              })
                            }
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4 inline" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {commissions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                        {isAr ? 'لا توجد عمولات مسجلة بعد.' : 'No commission records logged yet.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          7. TRIP PROFITABILITY TAB (Synced across Reservations, Vouchers & Services)
         ===================================================================== */}
      {activeTab === 'trip-profit' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">
              {isAr ? 'تحليل أرباح الرحلات والحجوزات والفواتير' : 'Trip & Booking Profitability Analysis'}
            </h3>
            <p className="text-xs text-slate-500">
              {isAr
                ? 'مقارنة سعر البيع بتكلفة المورد والمصروفات المرتبطة وهامش الربح الصافي لكل حجز أو قسيمة.'
                : 'Granular revenue vs. supplier cost, linked expenses, and net margin across all bookings and vouchers.'}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                  <th className="py-3.5 px-4">Booking / Voucher Ref</th>
                  <th className="py-3.5 px-4">Client & Destination</th>
                  <th className="py-3.5 px-4">Selling Price ({displayCurrency})</th>
                  <th className="py-3.5 px-4">Supplier Cost ({displayCurrency})</th>
                  <th className="py-3.5 px-4">Linked Expenses ({displayCurrency})</th>
                  <th className="py-3.5 px-4">Net Trip Profit</th>
                  <th className="py-3.5 px-4">Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {consolidatedBookings.map(b => {
                  const sellBase = toBase(b.selling_price, b.currency);
                  const costBase = toBase(b.cost_price, b.currency);
                  const tripExpBase = expenses
                    .filter(e => e.related_trip_id === b.ref || e.related_trip_id === b.id)
                    .reduce((acc, e) => acc + toBase(e.amount, e.currency), 0);
                  const profit = sellBase - costBase - tripExpBase;
                  const margin = sellBase > 0 ? ((profit / sellBase) * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{b.ref}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">{b.customer_name}</div>
                        <div className="text-[10px] text-slate-400">
                          {b.destination} • {b.service_type}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-700">
                        {formatCurrency(sellBase, displayCurrency)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-rose-600">
                        {formatCurrency(costBase, displayCurrency)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-amber-600">
                        {formatCurrency(tripExpBase, displayCurrency)}
                      </td>
                      <td className={`py-3.5 px-4 font-black ${profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {formatCurrency(profit, displayCurrency)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            Number(margin) >= 15
                              ? 'bg-emerald-50 text-emerald-700'
                              : Number(margin) > 0
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {margin}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {consolidatedBookings.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                      {isAr ? 'لا توجد حجوزات أو قسائم مسجلة بعد.' : 'No bookings or vouchers recorded yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          8. SYNCHRONIZED PROFIT & LOSS (P&L) STATEMENT TAB
         ===================================================================== */}
      {activeTab === 'pl' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-4xl mx-auto shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                {isAr ? 'متزامن بالكامل مع النظام المالي' : 'Synchronized Official Statement'}
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-2">
                {isAr ? 'قائمة الأرباح والخسائر (Profit & Loss Statement)' : 'Profit & Loss (P&L) Statement'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {settings?.company_name || 'Sofia Travel'} • {isAr ? 'العملة المعروضة:' : 'Reporting Currency:'} <strong>{displayCurrency}</strong>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => exportFinancialSummaryCSV('sofia_profit_and_loss')}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>CSV</span>
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 rounded-xl text-xs font-bold text-white cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>{isAr ? 'طباعة القائمة' : 'Print Statement'}</span>
              </button>
            </div>
          </div>

          <div className="space-y-5 text-sm">
            {/* Section 1: Operating Revenue */}
            <div className="space-y-2">
              <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                {isAr ? '1. الإيرادات التشغيلية (Operating Revenue)' : '1. Operating Revenue'}
              </div>
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-2">
                <div className="flex justify-between text-xs text-slate-700">
                  <span>{isAr ? `إيرادات فواتير العملاء الصادرة (${customerInvoices.length} فاتورة)` : `Billed Customer Invoices (${customerInvoices.length} invoices)`}</span>
                  <span className="font-bold">{formatCurrency(financeSummary.invoicedRevenue, displayCurrency)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-700">
                  <span>{isAr ? `إيرادات الحجوزات والقسائم غير المفوترة (${uninvoicedCustomerBookings.length} حجز)` : `Uninvoiced Confirmed Bookings & Vouchers (${uninvoicedCustomerBookings.length})`}</span>
                  <span className="font-bold">{formatCurrency(financeSummary.uninvoicedBookingRevenue, displayCurrency)}</span>
                </div>
                <div className="pt-2 border-t border-emerald-200/70 flex justify-between font-black text-emerald-950 text-base">
                  <span>{isAr ? 'إجمالي الإيرادات التشغيلية' : 'Total Gross Operating Revenue'}</span>
                  <span>{formatCurrency(financeSummary.totalRevenue, displayCurrency)}</span>
                </div>
              </div>
            </div>

            {/* Section 2: Cost of Sales (COGS) */}
            <div className="space-y-2">
              <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                {isAr ? '2. تكلفة المبيعات والموردين (Direct Cost of Sales)' : '2. Direct Cost of Sales (COGS)'}
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs text-slate-700">
                <div className="flex justify-between">
                  <span>{isAr ? `فواتير الموردين الصادرة (${supplierInvoices.length} فاتورة)` : `Billed Supplier Invoices (${supplierInvoices.length} invoices)`}</span>
                  <span className="font-bold text-rose-600">-{formatCurrency(financeSummary.supplierInvoicedCosts, displayCurrency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{isAr ? 'تكاليف الرحلات والفنادق والطيران والخدمات المباشرة' : 'Uninvoiced Trip, Hotel, Flight & Service Costs'}</span>
                  <span className="font-bold text-rose-600">-{formatCurrency(financeSummary.uninvoicedTripCosts, displayCurrency)}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-extrabold text-slate-900 text-sm">
                  <span>{isAr ? 'إجمالي التكاليف المباشرة' : 'Total Direct Costs (COGS)'}</span>
                  <span className="text-rose-600">-{formatCurrency(financeSummary.totalDirectCosts, displayCurrency)}</span>
                </div>
              </div>
            </div>

            {/* Gross Profit Line */}
            <div className="flex justify-between items-center p-4 bg-blue-50/70 rounded-2xl border border-blue-200 font-black text-slate-900">
              <div>
                <div>{isAr ? 'مجمل الربح التشغيلي (Gross Profit)' : 'Gross Operating Profit'}</div>
                <div className="text-[11px] font-semibold text-blue-700">
                  {isAr ? `هامش مجمل الربح: ${financeSummary.grossMarginPct.toFixed(1)}%` : `Gross Profit Margin: ${financeSummary.grossMarginPct.toFixed(1)}%`}
                </div>
              </div>
              <span className="text-lg text-blue-900">{formatCurrency(financeSummary.grossProfit, displayCurrency)}</span>
            </div>

            {/* Section 3: Operating Overhead, Salaries & Commissions */}
            <div className="space-y-2">
              <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                {isAr ? '3. المصروفات التشغيلية والرواتب والعمولات (Operating Overhead)' : '3. Operating Expenses, Payroll & Commissions'}
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5 text-xs text-slate-700">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>{isAr ? `المصروفات الإدارية والتشغيلية (${filteredExpenses.length})` : `General & Administrative Expenses (${filteredExpenses.length})`}</span>
                  <span className="text-rose-600">-{formatCurrency(financeSummary.totalExpenses, displayCurrency)}</span>
                </div>

                {/* Category Sub-breakdown */}
                {Object.keys(financeSummary.expensesByCategory).length > 0 && (
                  <div className="pl-4 border-l-2 border-slate-200 space-y-1 text-[11px] text-slate-500">
                    {Object.entries(financeSummary.expensesByCategory).map(([cat, val]) => (
                      <div key={cat} className="flex justify-between">
                        <span>• {cat}</span>
                        <span>-{formatCurrency(Number(val) || 0, displayCurrency)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between font-bold text-slate-900 pt-1">
                  <span>{isAr ? 'رواتب الموظفين والبدلات (مسير ديسمبر)' : 'Employee Base Payroll & Allowances (December Cycle)'}</span>
                  <span className="text-rose-600">-{formatCurrency(financeSummary.payrollBaseExpense, displayCurrency)}</span>
                </div>

                <div className="flex justify-between font-bold text-slate-900">
                  <span>{isAr ? `عمولات المبيعات للموظفين (${filteredCommissions.length})` : `Employee Sales Commissions (${filteredCommissions.length})`}</span>
                  <span className="text-rose-600">-{formatCurrency(financeSummary.totalCommissions, displayCurrency)}</span>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between font-extrabold text-slate-900 text-sm">
                  <span>{isAr ? 'إجمالي المصروفات والأجور والعمولات' : 'Total Operating Overhead'}</span>
                  <span className="text-rose-600">-{formatCurrency(financeSummary.totalOperatingOverhead, displayCurrency)}</span>
                </div>
              </div>
            </div>

            {/* Final Net Operating Profit */}
            <div
              className={`flex justify-between items-center p-6 rounded-2xl text-white shadow-lg ${
                financeSummary.netOperatingProfit >= 0 ? 'bg-slate-900' : 'bg-rose-950'
              }`}
            >
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {isAr ? 'صافي الربح / (الخسارة) النهائية' : 'Net Operating Profit / (Loss)'}
                </div>
                <div className="text-lg font-extrabold mt-0.5">
                  {isAr ? 'صافي العائد بعد جميع التكاليف والمصروفات والرواتب والعمولات' : 'Bottom-Line Earnings After All Costs, Expenses, Payroll & Commissions'}
                </div>
                <div className="text-xs text-emerald-400 font-bold mt-1">
                  {isAr ? `هامش الربح الصافي: ${financeSummary.netMarginPct.toFixed(1)}%` : `Net Profit Margin: ${financeSummary.netMarginPct.toFixed(1)}%`}
                </div>
              </div>
              <span className={`text-2xl sm:text-3xl font-black ${financeSummary.netOperatingProfit >= 0 ? 'text-emerald-400' : 'text-rose-300'}`}>
                {formatCurrency(financeSummary.netOperatingProfit, displayCurrency)}
              </span>
            </div>

            {/* Section 4: Treasury & Cash Flow Reconciliation (Including Advances & Pending Receivables) */}
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2 text-xs">
              <div className="font-extrabold text-amber-950 uppercase tracking-wider">
                {isAr ? 'تسوية السيولة النقدية والسلف والذمم (Cash & Balance Sheet Notes)' : 'Cash Treasury & Balance Sheet Reconciliation'}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-slate-700">
                <div className="flex justify-between">
                  <span>{isAr ? 'النقدية المحصلة فعلياً:' : 'Actual Cash Collected:'}</span>
                  <span className="font-bold text-emerald-700">{formatCurrency(financeSummary.totalCollectedCash, displayCurrency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{isAr ? 'مستحقات معلقة عند العملاء:' : 'Pending Client Receivables:'}</span>
                  <span className="font-bold text-amber-700">{formatCurrency(financeSummary.totalCustomerReceivables, displayCurrency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{isAr ? 'سلف الموظفين القائمة (تُسترد من الراتب):' : 'Active Employee Advances (Receivable):'}</span>
                  <span className="font-bold text-indigo-700">{formatCurrency(financeSummary.totalOutstandingAdvances, displayCurrency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{isAr ? 'صافي النقدية المتاحة بالخزينة:' : 'Net Available Cash Position:'}</span>
                  <span className={`font-black ${financeSummary.netCashPosition >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {formatCurrency(financeSummary.netCashPosition, displayCurrency)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          9. FINANCIAL REPORTS HUB TAB
         ===================================================================== */}
      {activeTab === 'reports' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            {
              title: isAr ? 'تقرير الفواتير والتحصيل الشامل' : 'Invoices & Collections Ledger',
              desc: isAr ? 'جميع فواتير العملاء والموردين والأرصدة المتبقية' : 'Complete register of Customer & Supplier invoices, collections, and balances due.',
              action: () => exportFinancialSummaryCSV('sofia_invoices_collections')
            },
            {
              title: isAr ? 'تقرير المصروفات التشغيلية' : 'Operating Expenses Breakdown',
              desc: isAr ? 'تفصيل المصروفات حسب الفئة وطريقة الدفع' : 'Detailed breakdown of office, marketing, rent, and operational expenses.',
              action: () => exportFinancialSummaryCSV('sofia_operating_expenses')
            },
            {
              title: isAr ? `مسير رواتب ديسمبر (${defaultDecemberPayrollMonth})` : `December Salary Payroll (${defaultDecemberPayrollMonth})`,
              desc: isAr ? 'كشف الرواتب الأساسية والعمولات والسلف المخصومة' : 'December base salaries, commissions, deductions, and net employee payouts.',
              action: () => exportFinancialSummaryCSV('sofia_december_payroll')
            },
            {
              title: isAr ? 'تقرير سلف وعمولات الموظفين' : 'Employee Advances & Commissions',
              desc: isAr ? 'سجل السلف المطلوبة والقائمة وعمولات المبيعات' : 'Full audit of requested/active staff advances and recorded sales commissions.',
              action: () => exportFinancialSummaryCSV('sofia_advances_commissions')
            },
            {
              title: isAr ? 'قائمة الأرباح والخسائر المعتمدة' : 'Synchronized Profit & Loss (P&L)',
              desc: isAr ? 'ملخص الإيرادات والتكاليف وصافي الربح للملاك والمحاسب' : 'Executive income statement for company owners and external auditors.',
              action: () => setActiveTab('pl')
            }
          ].map((rep, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-3">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">{rep.title}</h3>
                <p className="text-xs text-slate-500 mt-1">{rep.desc}</p>
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={rep.action}
                  className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  {isAr ? 'تصدير / عرض' : 'Export / Open'}
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* =====================================================================
          10. AUDIT LOGS TAB
         ===================================================================== */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {isAr ? 'سجل المراجعة المالية' : 'Financial Security Audit Trail'}
              </h3>
              <p className="text-xs text-slate-500">
                {isAr ? 'توثيق كافة العمليات المالية والرواتب والمصروفات.' : 'Immutable log of all financial creations, updates, payroll runs, and payouts.'}
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Module / Record</th>
                  <th className="py-3.5 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No financial audit events logged yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">{log.date_time}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {log.user_name} <span className="text-[10px] font-normal text-slate-400">({log.user_role})</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-blue-50 text-blue-700">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {log.record_type} ({log.record_id})
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{log.new_value || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODALS
         ===================================================================== */}

      {/* 1. Add / Edit Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {editingExpense ? (isAr ? 'تعديل مصروف' : 'Edit Expense') : (isAr ? 'إضافة مصروف تشغيلي جديد' : 'Record New Operating Expense')}
              </h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveExpense} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={expenseForm.category}
                    onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold"
                    required
                  >
                    {[
                      'Office Rent',
                      'Utilities & Internet',
                      'Marketing & Ads',
                      'Transportation',
                      'Supplier Settlement',
                      'Hospitality',
                      'Software & IT',
                      'Taxes & Gov Fees',
                      'Miscellaneous'
                    ].map(c => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    value={expenseForm.date}
                    onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description *</label>
                <input
                  type="text"
                  placeholder="e.g. Monthly Cairo HQ office rent or Facebook Ads campaign"
                  value={expenseForm.description}
                  onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={expenseForm.amount || ''}
                    onChange={e => setExpenseForm({ ...expenseForm, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Currency</label>
                  <select
                    value={expenseForm.currency || 'EGP'}
                    onChange={e => setExpenseForm({ ...expenseForm, currency: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-blue-700"
                  >
                    <option value="EGP">EGP</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="SAR">SAR</option>
                    <option value="AED">AED</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={expenseForm.status || 'Paid'}
                    onChange={e => setExpenseForm({ ...expenseForm, status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={expenseForm.payment_method}
                    onChange={e => setExpenseForm({ ...expenseForm, payment_method: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Instapay">Instapay / Wallet</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Related Booking (Optional)</label>
                  <select
                    value={expenseForm.related_trip_id || ''}
                    onChange={e => setExpenseForm({ ...expenseForm, related_trip_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  >
                    <option value="">General Company Expense</option>
                    {consolidatedBookings.map(b => (
                      <option key={b.id} value={b.ref}>
                        {b.ref} - {b.customer_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Save & Sync Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Employee Advance Modal (Supports both Request & Approved Disbursement) */}
      {showAdvanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {isAr ? 'سلفة موظف (طلب سلفة أو صرف مباشر)' : 'Employee Salary Advance'}
              </h3>
              <button onClick={() => setShowAdvanceModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateAdvance} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Advance Entry Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdvanceForm({ ...advanceForm, request_mode: 'Outstanding' })}
                    className={`py-2 px-3 rounded-xl font-bold border cursor-pointer ${
                      advanceForm.request_mode === 'Outstanding'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    Approved / Issued Now
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdvanceForm({ ...advanceForm, request_mode: 'Requested' })}
                    className={`py-2 px-3 rounded-xl font-bold border cursor-pointer ${
                      advanceForm.request_mode === 'Requested'
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    Pending Advance Request
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Employee *</label>
                <select
                  value={advanceForm.employee_id}
                  onChange={e => setAdvanceForm({ ...advanceForm, employee_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold"
                  required
                >
                  <option value="">Select Employee...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.position})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Amount *</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={advanceForm.amount || ''}
                    onChange={e => setAdvanceForm({ ...advanceForm, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Currency</label>
                  <select
                    value={advanceForm.currency}
                    onChange={e => setAdvanceForm({ ...advanceForm, currency: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-indigo-700"
                  >
                    <option value="EGP">EGP</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Repayment Method</label>
                <select
                  value={advanceForm.repayment_method}
                  onChange={e => setAdvanceForm({ ...advanceForm, repayment_method: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold"
                >
                  <option value="Payroll Deduction">Payroll Deduction (December Salary)</option>
                  <option value="Direct Cash Repayment">Direct Cash Repayment</option>
                  <option value="Monthly Installments">Monthly Installments</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason *</label>
                <input
                  type="text"
                  placeholder="Emergency / personal salary advance"
                  value={advanceForm.reason}
                  onChange={e => setAdvanceForm({ ...advanceForm, reason: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAdvanceModal(false)}
                  className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Save Advance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Repay Advance Modal */}
      {showRepayModal && selectedAdvanceForRepay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Record Advance Repayment</h3>
            <p className="text-xs text-slate-500">
              Employee: <strong>{selectedAdvanceForRepay.employee_name}</strong> • Current Outstanding:{' '}
              <strong>{formatCurrency(selectedAdvanceForRepay.outstanding_amount, selectedAdvanceForRepay.currency)}</strong>
            </p>
            <form onSubmit={handleRepayAdvanceSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Repayment Amount ({selectedAdvanceForRepay.currency})</label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  max={selectedAdvanceForRepay.outstanding_amount}
                  value={repayAmount}
                  onChange={e => setRepayAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRepayModal(false)}
                  className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold cursor-pointer">
                  Confirm Repayment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Record Employee Commission Modal (Linked to Invoices & Bookings) */}
      {showCommissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {isAr ? 'تسجيل عمولة مبيعات لموظف' : 'Record Employee Sales Commission'}
              </h3>
              <button onClick={() => setShowCommissionModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCommission} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Employee *</label>
                <select
                  value={commissionForm.employee_id}
                  onChange={e => {
                    const emp = employees.find(x => x.id === e.target.value);
                    setCommissionForm({
                      ...commissionForm,
                      employee_id: e.target.value,
                      commission_percentage: emp?.commission_rate ? Number(emp.commission_rate) : commissionForm.commission_percentage
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold"
                  required
                >
                  <option value="">Select Employee...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} (Default Rate: {emp.commission_rate || 0}%)
                    </option>
                  ))}
                </select>
              </div>

              {/* Optional Quick Link from Invoice or Booking */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Link to Invoice or Booking (Auto-fill)</label>
                <select
                  value={commissionForm.source_ref}
                  onChange={e => {
                    const val = e.target.value;
                    if (!val) {
                      setCommissionForm({ ...commissionForm, source_ref: '' });
                      return;
                    }
                    if (val.startsWith('INV:')) {
                      const invId = val.slice(4);
                      const inv = customerInvoices.find(i => i.id === invId);
                      if (inv) {
                        setCommissionForm({
                          ...commissionForm,
                          source_ref: val,
                          customer_name: inv.customer_name || 'Customer',
                          reservation_id: inv.invoice_number,
                          trip_name: inv.items?.[0]?.title || `Invoice ${inv.invoice_number}`,
                          sale_amount: Number(inv.total_amount) || 0,
                          currency: normalizeCurrencyCode(inv.currency || 'EGP')
                        });
                      }
                    } else if (val.startsWith('BKG:')) {
                      const bId = val.slice(4);
                      const b = consolidatedBookings.find(x => x.id === bId);
                      if (b) {
                        setCommissionForm({
                          ...commissionForm,
                          source_ref: val,
                          customer_name: b.customer_name,
                          reservation_id: b.ref,
                          trip_name: `${b.service_type} - ${b.destination}`,
                          sale_amount: Number(b.selling_price) || 0,
                          currency: normalizeCurrencyCode(b.currency || 'EGP')
                        });
                      }
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                >
                  <option value="">-- Manual Entry or Select Invoice / Booking --</option>
                  {customerInvoices.map(inv => (
                    <option key={`inv-${inv.id}`} value={`INV:${inv.id}`}>
                      Invoice {inv.invoice_number} • {inv.customer_name} ({inv.total_amount} {inv.currency})
                    </option>
                  ))}
                  {consolidatedBookings.map(b => (
                    <option key={`bkg-${b.id}`} value={`BKG:${b.id}`}>
                      Booking {b.ref} • {b.customer_name} ({b.selling_price} {b.currency})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Customer Name</label>
                  <input
                    type="text"
                    placeholder="Client name"
                    value={commissionForm.customer_name}
                    onChange={e => setCommissionForm({ ...commissionForm, customer_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Trip / Invoice Ref</label>
                  <input
                    type="text"
                    placeholder="e.g. INV-2026-101 or Sharm"
                    value={commissionForm.trip_name}
                    onChange={e => setCommissionForm({ ...commissionForm, trip_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sale Amount *</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={commissionForm.sale_amount || ''}
                    onChange={e => setCommissionForm({ ...commissionForm, sale_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={commissionForm.commission_percentage}
                    onChange={e => setCommissionForm({ ...commissionForm, commission_percentage: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Currency</label>
                  <select
                    value={commissionForm.currency}
                    onChange={e => setCommissionForm({ ...commissionForm, currency: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                  >
                    <option value="EGP">EGP</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex justify-between items-center">
                <span className="font-bold text-emerald-900">Calculated Commission:</span>
                <span className="text-base font-black text-emerald-700">
                  {formatCurrency(
                    ((Number(commissionForm.sale_amount) || 0) * (Number(commissionForm.commission_percentage) || 0)) / 100,
                    commissionForm.currency
                  )}
                </span>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCommissionModal(false)}
                  className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Save Commission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Edit Payroll Breakdown Modal */}
      {showEditPayrollModal && editingPayroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Adjust Payroll Breakdown</h3>
                <p className="text-[11px] text-slate-500">
                  {editingPayroll.employee_name} • Salary Cycle: <strong>{editingPayroll.payroll_month}</strong>
                </p>
              </div>
              <button onClick={() => setShowEditPayrollModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSavePayrollEdit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">December Basic Salary</label>
                  <input
                    type="number"
                    step="any"
                    value={payrollEditForm.basic_salary}
                    onChange={e => setPayrollEditForm({ ...payrollEditForm, basic_salary: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Allowances</label>
                  <input
                    type="number"
                    step="any"
                    value={payrollEditForm.allowances}
                    onChange={e => setPayrollEditForm({ ...payrollEditForm, allowances: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sales Commission</label>
                  <input
                    type="number"
                    step="any"
                    value={payrollEditForm.commission}
                    onChange={e => setPayrollEditForm({ ...payrollEditForm, commission: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bonus</label>
                  <input
                    type="number"
                    step="any"
                    value={payrollEditForm.bonus}
                    onChange={e => setPayrollEditForm({ ...payrollEditForm, bonus: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Deductions</label>
                  <input
                    type="number"
                    step="any"
                    value={payrollEditForm.deductions}
                    onChange={e => setPayrollEditForm({ ...payrollEditForm, deductions: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-rose-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Advance Deduction</label>
                  <input
                    type="number"
                    step="any"
                    value={payrollEditForm.advances}
                    onChange={e => setPayrollEditForm({ ...payrollEditForm, advances: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-rose-600"
                  />
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 text-white flex justify-between items-center">
                <span className="font-bold">Recalculated Net Salary:</span>
                <span className="text-base font-black text-emerald-400">
                  {formatCurrency(
                    Math.max(
                      0,
                      payrollEditForm.basic_salary +
                        payrollEditForm.allowances +
                        payrollEditForm.commission +
                        payrollEditForm.bonus -
                        payrollEditForm.deductions -
                        payrollEditForm.advances
                    ),
                    editingPayroll.currency || 'EGP'
                  )}
                </span>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditPayrollModal(false)}
                  className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold cursor-pointer">
                  Save Breakdown
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Mark Payroll Paid Modal */}
      {showPayModal && selectedPayrollRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Confirm Salary Payment</h3>
                <p className="text-[11px] text-slate-500">
                  {selectedPayrollRecord.employee_name} • {selectedPayrollRecord.payroll_month}
                </p>
              </div>
              <button onClick={() => setShowPayModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleMarkPaidSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={payForm.payment_date}
                    onChange={e => setPayForm({ ...payForm, payment_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Method</label>
                  <select
                    value={payForm.payment_method}
                    onChange={e => setPayForm({ ...payForm, payment_method: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Instapay">Instapay</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Amount Paid ({selectedPayrollRecord.currency || 'EGP'})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={payForm.paid_amount}
                    onChange={e => setPayForm({ ...payForm, paid_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-emerald-700"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Transaction Ref #</label>
                  <input
                    type="text"
                    placeholder="TRX-99402"
                    value={payForm.transaction_reference}
                    onChange={e => setPayForm({ ...payForm, transaction_reference: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Confirm Disbursement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Delete Confirmation Modal */}
      {deleteConfirmState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-rose-200 text-center space-y-4">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Confirm Deletion</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to permanently delete <strong>{deleteConfirmState.title}</strong>?
              </p>
            </div>
            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setDeleteConfirmState({ ...deleteConfirmState, isOpen: false })}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteConfirmState.type === 'expense') onDeleteExpense(deleteConfirmState.id);
                  if (deleteConfirmState.type === 'advance') onDeleteAdvance(deleteConfirmState.id);
                  if (deleteConfirmState.type === 'commission') onDeleteCommission(deleteConfirmState.id);
                  if (deleteConfirmState.type === 'payroll' && onDeletePayroll) onDeletePayroll(deleteConfirmState.id);

                  onAddAuditLog({
                    id: 'LOG-' + Date.now(),
                    user_name: currentUsername,
                    user_role: userRole,
                    action: 'Deleted',
                    record_type: deleteConfirmState.type.toUpperCase(),
                    record_id: deleteConfirmState.id,
                    previous_value: deleteConfirmState.title,
                    date_time: new Date().toLocaleString()
                  });
                  setDeleteConfirmState({ ...deleteConfirmState, isOpen: false });
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
