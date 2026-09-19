import React, { useState, useMemo } from 'react';
import { 
  DollarSign, CreditCard, Receipt, Calculator, Plus, ArrowUpRight, ArrowDownRight, Printer, 
  Shield, Search, Filter, Download, Trash2, Edit, CheckCircle2, AlertTriangle, Calendar, 
  TrendingUp, TrendingDown, Users, Briefcase, FileText, Check, X, RefreshCw, Layers, PieChart, Globe
} from 'lucide-react';
import { UserRole, Expense, PayrollRecord, EmployeeAdvance, CommissionRecord, FinanceAuditLog, Reservation, Supplier, Employee, CompanySettings } from '../types';
import { formatCurrency } from '../utils/currency';
import { RealTimeCurrencyConverter } from './RealTimeCurrencyConverter';

interface FinancePayrollViewProps {
  userRole: UserRole;
  currentUsername: string;
  expenses: Expense[];
  onAddExpense: (expense: Expense) => void;
  onUpdateExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  payrollRecords: PayrollRecord[];
  onGeneratePayroll: (month: string) => void;
  onUpdatePayrollStatus: (id: string, status: 'Pending' | 'Partially Paid' | 'Paid', paymentDetails?: any) => void;
  advances: EmployeeAdvance[];
  onAddAdvance: (advance: EmployeeAdvance) => void;
  onUpdateAdvance: (advance: EmployeeAdvance) => void;
  onDeleteAdvance: (id: string) => void;
  commissions: CommissionRecord[];
  onAddCommission: (comm: CommissionRecord) => void;
  onDeleteCommission: (id: string) => void;
  reservations: Reservation[];
  suppliers: Supplier[];
  employees: Employee[];
  auditLogs: FinanceAuditLog[];
  onAddAuditLog: (log: FinanceAuditLog) => void;
  settings?: CompanySettings;
  companyCurrency?: string;
}

export function FinancePayrollView({
  userRole,
  currentUsername,
  expenses,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  payrollRecords,
  onGeneratePayroll,
  onUpdatePayrollStatus,
  advances,
  onAddAdvance,
  onUpdateAdvance,
  onDeleteAdvance,
  commissions,
  onAddCommission,
  onDeleteCommission,
  reservations,
  suppliers,
  employees,
  auditLogs,
  onAddAuditLog,
  settings,
  companyCurrency = 'EGP'
}: FinancePayrollViewProps) {
  // SECURITY CHECK: Administrator only
  if (userRole !== 'Administrator') {
    return (
      <div className="p-12 min-h-[80vh] flex items-center justify-center bg-slate-50">
        <div className="bg-white rounded-3xl border border-rose-200 p-8 max-w-md w-full text-center shadow-xl space-y-4">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            You do not have administrator permissions to access the <strong>Finance & Payroll</strong> module. This section is strictly restricted to company administrators.
          </p>
          <div className="pt-2">
            <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl">
              Current Role: {userRole} (Required: Administrator)
            </span>
          </div>
        </div>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'converter' | 'expenses' | 'payroll' | 'advances' | 'commissions' | 'trip-profit' | 'reports' | 'pl' | 'audit'
  >('dashboard');

  const [periodFilter, setPeriodFilter] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('month');
  const [currencyFilter, setCurrencyFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseForm, setExpenseForm] = useState<Partial<Expense>>({
    category: 'Office',
    description: '',
    amount: 0,
    currency: 'USD',
    exchange_rate: 1,
    payment_method: 'Bank Transfer',
    paid_by: currentUsername,
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [advanceForm, setAdvanceForm] = useState({
    employee_id: '',
    amount: 0,
    currency: 'USD',
    reason: '',
    repayment_method: 'Payroll Deduction'
  });

  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [commissionForm, setCommissionForm] = useState({
    employee_id: '',
    customer_name: '',
    reservation_id: '',
    trip_name: '',
    sale_amount: 0,
    commission_percentage: 5,
    currency: 'USD'
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

  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    isOpen: boolean;
    type: 'expense' | 'advance' | 'commission';
    id: string;
    title: string;
  }>({ isOpen: false, type: 'expense', id: '', title: '' });

  const [generateMonth, setGenerateMonth] = useState(new Date().toISOString().slice(0, 7));

  // Calculations for Dashboard & P&L (All in EGP)
  const totalRevenue = useMemo(() => {
    return reservations.reduce((acc, r) => acc + (Number(r.selling_price) || 0), 0);
  }, [reservations]);

  const totalTripCosts = useMemo(() => {
    return reservations.reduce((acc, r) => acc + (Number(r.cost_price) || 0), 0);
  }, [reservations]);

  const totalExpenses = useMemo(() => {
    return expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  }, [expenses]);

  const totalPayroll = useMemo(() => {
    return payrollRecords.reduce((acc, p) => acc + (Number(p.net_salary) || 0), 0);
  }, [payrollRecords]);

  const totalCommissions = useMemo(() => {
    return commissions.reduce((acc, c) => acc + (Number(c.commission_amount) || 0), 0);
  }, [commissions]);

  const pendingExpenses = useMemo(() => {
    return expenses.filter(e => e.status === 'Pending').reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  }, [expenses]);

  const pendingSalaries = useMemo(() => {
    return payrollRecords.filter(p => p.status !== 'Paid').reduce((acc, p) => acc + (Number(p.net_salary) || 0), 0);
  }, [payrollRecords]);

  const grossProfit = totalRevenue - totalTripCosts;
  const netProfit = grossProfit - totalExpenses - totalPayroll - totalCommissions;

  // Handlers
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingExpense) {
      const updated: Expense = {
        ...editingExpense,
        ...expenseForm as any,
        currency: 'EGP',
        exchange_rate: 1,
        converted_amount: Number(expenseForm.amount) || 0
      };
      onUpdateExpense(updated);
      onAddAuditLog({
        id: 'LOG-' + Date.now(),
        user_name: currentUsername,
        user_role: userRole,
        action: 'Updated',
        record_type: 'Expense',
        record_id: updated.expense_id,
        previous_value: `${editingExpense.amount} EGP`,
        new_value: `${updated.amount} EGP`,
        date_time: new Date().toLocaleString()
      });
    } else {
      const newExp: Expense = {
        id: 'EXP-' + Date.now(),
        expense_id: 'EXP-' + Math.floor(1000 + Math.random() * 9000),
        category: expenseForm.category || 'Office',
        description: expenseForm.description || '',
        amount: Number(expenseForm.amount) || 0,
        currency: 'EGP',
        exchange_rate: 1,
        converted_amount: Number(expenseForm.amount) || 0,
        date: expenseForm.date || new Date().toISOString().split('T')[0],
        payment_method: expenseForm.payment_method as any || 'Bank Transfer',
        paid_by: expenseForm.paid_by || currentUsername,
        supplier_id: expenseForm.supplier_id,
        supplier_name: expenseForm.supplier_name,
        related_trip_id: expenseForm.related_trip_id,
        invoice_receipt_number: expenseForm.invoice_receipt_number,
        notes: expenseForm.notes || '',
        status: 'Paid'
      };
      onAddExpense(newExp);
      onAddAuditLog({
        id: 'LOG-' + Date.now(),
        user_name: currentUsername,
        user_role: userRole,
        action: 'Created',
        record_type: 'Expense',
        record_id: newExp.expense_id,
        new_value: `${newExp.amount} EGP (${newExp.category})`,
        date_time: new Date().toLocaleString()
      });
    }
    setShowExpenseModal(false);
    setEditingExpense(null);
    setExpenseForm({
      category: 'Office',
      description: '',
      amount: 0,
      currency: 'EGP',
      exchange_rate: 1,
      payment_method: 'Bank Transfer',
      paid_by: currentUsername,
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  const handleCreateAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(emp => emp.id === advanceForm.employee_id);
    const newAdv: EmployeeAdvance = {
      id: 'ADV-' + Date.now(),
      advance_id: 'ADV-' + Math.floor(1000 + Math.random() * 9000),
      employee_id: advanceForm.employee_id,
      employee_name: emp ? emp.name : 'Unknown Employee',
      date: new Date().toISOString().split('T')[0],
      amount: Number(advanceForm.amount) || 0,
      currency: 'EGP',
      reason: advanceForm.reason,
      repayment_method: advanceForm.repayment_method,
      outstanding_amount: Number(advanceForm.amount) || 0,
      status: 'Outstanding'
    };
    onAddAdvance(newAdv);
    onAddAuditLog({
      id: 'LOG-' + Date.now(),
      user_name: currentUsername,
      user_role: userRole,
      action: 'Created',
      record_type: 'Employee Advance',
      record_id: newAdv.advance_id,
      new_value: `${newAdv.amount} EGP for ${newAdv.employee_name}`,
      date_time: new Date().toLocaleString()
    });
    setShowAdvanceModal(false);
    setAdvanceForm({ employee_id: '', amount: 0, currency: 'EGP', reason: '', repayment_method: 'Payroll Deduction' });
  };

  const handleCreateCommission = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === commissionForm.employee_id);
    const commAmt = (Number(commissionForm.sale_amount) * Number(commissionForm.commission_percentage)) / 100;
    const newComm: CommissionRecord = {
      id: 'COMM-' + Date.now(),
      commission_id: 'COM-' + Math.floor(1000 + Math.random() * 9000),
      employee_id: commissionForm.employee_id,
      employee_name: emp ? emp.name : 'Unknown Employee',
      customer_name: commissionForm.customer_name,
      reservation_id: commissionForm.reservation_id,
      trip_name: commissionForm.trip_name,
      sale_amount: Number(commissionForm.sale_amount),
      commission_percentage: Number(commissionForm.commission_percentage),
      commission_amount: commAmt,
      currency: 'EGP',
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
      new_value: `${commAmt} EGP for ${newComm.employee_name}`,
      date_time: new Date().toLocaleString()
    });
    setShowCommissionModal(false);
    setCommissionForm({ employee_id: '', customer_name: '', reservation_id: '', trip_name: '', sale_amount: 0, commission_percentage: 5, currency: 'EGP' });
  };

  const handleMarkPaidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayrollRecord) return;
    onUpdatePayrollStatus(selectedPayrollRecord.id, 'Paid', payForm);
    onAddAuditLog({
      id: 'LOG-' + Date.now(),
      user_name: currentUsername,
      user_role: userRole,
      action: 'Paid',
      record_type: 'Payroll',
      record_id: selectedPayrollRecord.payroll_month + '-' + selectedPayrollRecord.employee_name,
      new_value: `Paid ${payForm.paid_amount} EGP`,
      date_time: new Date().toLocaleString()
    });
    setShowPayModal(false);
    setSelectedPayrollRecord(null);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-slate-50 min-h-screen">
      {/* Module Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-extrabold uppercase tracking-wider">Admin Secure</span>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-extrabold uppercase tracking-wider">EGP Currency Only</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-2">Finance & Payroll Command Hub</h1>
          <p className="text-xs text-slate-500 mt-0.5">Comprehensive financial control, operating expenses, employee payroll, commissions, advances & P&L (All in EGP).</p>
        </div>
        <div className="flex items-center space-x-3">
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
                notes: ''
              });
              setShowExpenseModal(true);
            }}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Expense</span>
          </button>
          <button
            onClick={() => {
              onAddAuditLog({
                id: 'LOG-' + Date.now(),
                user_name: currentUsername,
                user_role: userRole,
                action: 'Exported Report',
                record_type: 'All Financials',
                record_id: 'FIN-EXPORT-ALL',
                date_time: new Date().toLocaleString()
              });
              alert('Financial statement exported successfully to EGP report format.');
            }}
            className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Financials</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 overflow-x-auto custom-scrollbar">
        {[
          { id: 'dashboard', label: 'Finance Dashboard', icon: DollarSign },
          { id: 'converter', label: 'Currency Converter', icon: Globe },
          { id: 'expenses', label: 'Expenses', icon: Receipt },
          { id: 'payroll', label: 'Payroll & Salaries', icon: Briefcase },
          { id: 'advances', label: 'Employee Advances', icon: CreditCard },
          { id: 'commissions', label: 'Sales Commissions', icon: TrendingUp },
          { id: 'trip-profit', label: 'Trip Profitability', icon: PieChart },
          { id: 'reports', label: 'Financial Reports', icon: FileText },
          { id: 'pl', label: 'Profit & Loss (P&L)', icon: Layers },
          { id: 'audit', label: 'Audit Log', icon: Shield }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 pb-3 px-4 text-xs font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
                isActive ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl shadow-xs' : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: FINANCE DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Period filter bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-700">Period:</span>
              {(['today', 'week', 'month', 'year'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriodFilter(p)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer uppercase ${
                    periodFilter === p ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-700">Currency:</span>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-extrabold border border-emerald-200">
                EGP (Egyptian Pound — جنيه مصري)
              </span>
            </div>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Revenue</p>
                <h3 className="text-2xl font-black text-emerald-600 mt-1">{totalRevenue.toLocaleString()} EGP</h3>
                <p className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" /> Booking Sales Inflow
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Operating Expenses</p>
                <h3 className="text-2xl font-black text-rose-600 mt-1">{totalExpenses.toLocaleString()} EGP</h3>
                <p className="text-[10px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                  <ArrowDownRight className="w-3 h-3" /> Pending: {pendingExpenses.toLocaleString()} EGP
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Receipt className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Payroll & Salaries</p>
                <h3 className="text-2xl font-black text-blue-600 mt-1">{totalPayroll.toLocaleString()} EGP</h3>
                <p className="text-[10px] text-blue-600 font-semibold mt-1 flex items-center gap-1">
                  <Briefcase className="w-3 h-3" /> Pending: {pendingSalaries.toLocaleString()} EGP
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Net Profit</p>
                <h3 className={`text-2xl font-black mt-1 ${netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {netProfit.toLocaleString()} EGP
                </h3>
                <p className="text-[10px] text-slate-500 font-semibold mt-1">
                  Margin: {totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${netProfit >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Secondary Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <p className="text-xs font-semibold text-slate-400">Total Trip Costs</p>
              <h4 className="text-xl font-bold text-slate-900 mt-1">{totalTripCosts.toLocaleString()} EGP</h4>
              <p className="text-[11px] text-slate-500 mt-1">Hotels, Flights, Suppliers & Tour Guides</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <p className="text-xs font-semibold text-slate-400">Sales Commissions</p>
              <h4 className="text-xl font-bold text-amber-600 mt-1">{totalCommissions.toLocaleString()} EGP</h4>
              <p className="text-[11px] text-slate-500 mt-1">{commissions.length} commissions registered</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <p className="text-xs font-semibold text-slate-400">Employee Advances</p>
              <h4 className="text-xl font-bold text-indigo-600 mt-1">
                {advances.reduce((acc, a) => acc + (Number(a.outstanding_amount) || 0), 0).toLocaleString()} EGP
              </h4>
              <p className="text-[11px] text-slate-500 mt-1">Outstanding balance to recover</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EXPENSES MANAGEMENT */}
      {activeTab === 'expenses' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Search expenses by ID, category, desc..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs outline-none focus:border-blue-500"
              />
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            </div>
            <button
              onClick={() => {
                setEditingExpense(null);
                setExpenseForm({
                  category: 'Office',
                  description: '',
                  amount: 0,
                  currency: 'USD',
                  exchange_rate: 1,
                  payment_method: 'Bank Transfer',
                  paid_by: currentUsername,
                  date: new Date().toISOString().split('T')[0],
                  notes: ''
                });
                setShowExpenseModal(true);
              }}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Expense Record</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">ID</th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">Description</th>
                  <th className="py-3 px-4 font-semibold">Amount</th>
                  <th className="py-3 px-4 font-semibold">Method</th>
                  <th className="py-3 px-4 font-semibold">Paid By</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                      No expense records found. Click "Add Expense Record" to get started.
                    </td>
                  </tr>
                ) : (
                  expenses
                    .filter(e => e.description.toLowerCase().includes(searchTerm.toLowerCase()) || e.category.toLowerCase().includes(searchTerm.toLowerCase()) || e.expense_id.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(e => (
                      <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">{e.expense_id}</td>
                        <td className="py-3 px-4 text-slate-600">{e.date}</td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-1 bg-rose-50 text-rose-700 rounded-full text-[11px] font-bold">
                            {e.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-800 font-medium">{e.description}</td>
                        <td className="py-3 px-4 font-extrabold text-rose-600">
                          {e.amount.toLocaleString()} {e.currency}
                          {e.currency !== 'USD' && e.converted_amount && (
                            <span className="block text-[10px] text-slate-400 font-normal">
                              (${e.converted_amount.toFixed(2)} USD)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{e.payment_method}</td>
                        <td className="py-3 px-4 text-slate-600">{e.paid_by || 'Admin'}</td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              setEditingExpense(e);
                              setExpenseForm(e);
                              setShowExpenseModal(true);
                            }}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteConfirmState({
                                isOpen: true,
                                type: 'expense',
                                id: e.id,
                                title: `Expense #${e.expense_id} (${e.category} - ${e.amount} ${e.currency})`
                              });
                            }}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PAYROLL & SALARIES */}
      {activeTab === 'payroll' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-bold text-slate-700">Payroll Month:</span>
              <input
                type="month"
                value={generateMonth}
                onChange={(e) => setGenerateMonth(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800"
              />
              <button
                onClick={() => {
                  onGeneratePayroll(generateMonth);
                  onAddAuditLog({
                    id: 'LOG-' + Date.now(),
                    user_name: currentUsername,
                    user_role: userRole,
                    action: 'Generated Payroll',
                    record_type: 'Payroll',
                    record_id: generateMonth,
                    date_time: new Date().toLocaleString()
                  });
                  alert(`Payroll generated for ${generateMonth} successfully!`);
                }}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Generate Payroll for Month</span>
              </button>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Total Payroll Outflow: <strong className="text-blue-600 font-bold">${totalPayroll.toLocaleString()}</strong>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Month</th>
                  <th className="py-3 px-4 font-semibold">Employee</th>
                  <th className="py-3 px-4 font-semibold">Role / Dept</th>
                  <th className="py-3 px-4 font-semibold">Basic Salary</th>
                  <th className="py-3 px-4 font-semibold">Allowances</th>
                  <th className="py-3 px-4 font-semibold">Commission</th>
                  <th className="py-3 px-4 font-semibold">Deductions</th>
                  <th className="py-3 px-4 font-semibold">Net Salary</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payrollRecords.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400 text-xs">
                      No payroll records generated yet. Select a month and click "Generate Payroll for Month".
                    </td>
                  </tr>
                ) : (
                  payrollRecords.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-bold text-slate-900">{p.payroll_month}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{p.employee_name}</td>
                      <td className="py-3 px-4 text-slate-600">{p.job_title} ({p.department})</td>
                      <td className="py-3 px-4 text-slate-800">${p.basic_salary}</td>
                      <td className="py-3 px-4 text-emerald-600">+${p.allowances}</td>
                      <td className="py-3 px-4 text-emerald-600">+${p.commission}</td>
                      <td className="py-3 px-4 text-rose-600">-${p.deductions + p.advances}</td>
                      <td className="py-3 px-4 font-extrabold text-blue-600">${p.net_salary} {p.currency}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          p.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' : p.status === 'Partially Paid' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {p.status !== 'Paid' ? (
                          <button
                            onClick={() => {
                              setSelectedPayrollRecord(p);
                              setPayForm({
                                payment_date: new Date().toISOString().split('T')[0],
                                payment_method: 'Bank Transfer',
                                paid_amount: p.net_salary,
                                transaction_reference: 'TRX-' + Math.floor(100000 + Math.random() * 900000),
                                notes: 'Salary settlement'
                              });
                              setShowPayModal(true);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl font-bold text-[11px] shadow-xs cursor-pointer"
                          >
                            Mark as Paid
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-semibold flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Settled
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: EMPLOYEE ADVANCES */}
      {activeTab === 'advances' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900">Active Employee Advances & Loans</h3>
            <button
              onClick={() => setShowAdvanceModal(true)}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Issue Advance</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">ID</th>
                  <th className="py-3 px-4 font-semibold">Employee</th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Amount</th>
                  <th className="py-3 px-4 font-semibold">Reason</th>
                  <th className="py-3 px-4 font-semibold">Outstanding</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {advances.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                      No employee advances recorded.
                    </td>
                  </tr>
                ) : (
                  advances.map(a => (
                    <tr key={a.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-bold text-slate-900">{a.advance_id}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{a.employee_name}</td>
                      <td className="py-3 px-4 text-slate-600">{a.date}</td>
                      <td className="py-3 px-4 font-bold text-indigo-600">{a.amount.toLocaleString()} {a.currency}</td>
                      <td className="py-3 px-4 text-slate-700">{a.reason}</td>
                      <td className="py-3 px-4 font-bold text-rose-600">{a.outstanding_amount.toLocaleString()} {a.currency}</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] font-bold uppercase">
                          {a.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setDeleteConfirmState({
                              isOpen: true,
                              type: 'advance',
                              id: a.id,
                              title: `Advance #${a.advance_id} (${a.employee_name} - ${a.amount})`
                            });
                          }}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: SALES COMMISSIONS */}
      {activeTab === 'commissions' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900">Sales Commissions & Performance Bonuses</h3>
            <button
              onClick={() => setShowCommissionModal(true)}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record Commission</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">ID</th>
                  <th className="py-3 px-4 font-semibold">Employee</th>
                  <th className="py-3 px-4 font-semibold">Customer / Trip</th>
                  <th className="py-3 px-4 font-semibold">Sale Amount</th>
                  <th className="py-3 px-4 font-semibold">Rate</th>
                  <th className="py-3 px-4 font-semibold">Commission</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {commissions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                      No sales commissions registered yet.
                    </td>
                  </tr>
                ) : (
                  commissions.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-bold text-slate-900">{c.commission_id}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{c.employee_name}</td>
                      <td className="py-3 px-4 text-slate-700">{c.customer_name || 'General Sale'} ({c.trip_name || 'Package'})</td>
                      <td className="py-3 px-4 text-slate-800">${c.sale_amount.toLocaleString()}</td>
                      <td className="py-3 px-4 text-slate-600">{c.commission_percentage}%</td>
                      <td className="py-3 px-4 font-extrabold text-emerald-600">${c.commission_amount.toLocaleString()} {c.currency}</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold uppercase">
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setDeleteConfirmState({
                              isOpen: true,
                              type: 'commission',
                              id: c.id,
                              title: `Commission #${c.commission_id} (${c.employee_name})`
                            });
                          }}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: TRIP PROFITABILITY */}
      {activeTab === 'trip-profit' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">Trip & Reservation Profitability Analysis</h3>
            <p className="text-xs text-slate-500">Real-time linkage between revenue and operational supplier costs per trip/reservation.</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Res ID</th>
                  <th className="py-3 px-4 font-semibold">Destination / Trip</th>
                  <th className="py-3 px-4 font-semibold">Currency</th>
                  <th className="py-3 px-4 font-semibold">Selling Price</th>
                  <th className="py-3 px-4 font-semibold">Supplier Cost</th>
                  <th className="py-3 px-4 font-semibold">Gross Profit</th>
                  <th className="py-3 px-4 font-semibold">Margin %</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reservations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">No reservations available for profitability analysis.</td>
                  </tr>
                ) : (
                  reservations.map(r => {
                    const sell = Number(r.selling_price) || 0;
                    const cost = Number(r.cost_price) || 0;
                    const prof = sell - cost;
                    const margin = sell > 0 ? ((prof / sell) * 100).toFixed(1) : 0;
                    const resCurrency = r.currency || 'EGP';
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/80">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{r.reservation_id}</td>
                        <td className="py-3.5 px-4 font-medium text-slate-800">{r.destination} ({r.service_type})</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                            {resCurrency}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-emerald-600">{formatCurrency(sell, resCurrency)}</td>
                        <td className="py-3.5 px-4 font-bold text-rose-600">{formatCurrency(cost, resCurrency)}</td>
                        <td className="py-3.5 px-4 font-extrabold text-blue-600">{formatCurrency(prof, resCurrency)}</td>
                        <td className="py-3.5 px-4 font-bold text-indigo-600">{margin}%</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-semibold">{r.reservation_status}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: FINANCIAL REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { title: '1. Monthly Expenses Report', desc: 'Detailed category breakdown of operating expenses.' },
              { title: '2. Monthly Payroll Report', desc: 'Salaries, allowances, deductions and net outlays.' },
              { title: '3. Employee Salary Statement', desc: 'Individual employee earnings and payment history.' },
              { title: '4. Employee Advances Report', desc: 'Outstanding balances and repayment schedules.' },
              { title: '5. Sales Commission Report', desc: 'Commissions earned by agents per booking.' },
              { title: '6. Trip Profitability Report', desc: 'Gross margin and net return per tour.' },
              { title: '7. Revenue vs Expenses Report', desc: 'Comparative cash inflow and outflow statement.' },
              { title: '8. Cash Flow Report', desc: 'Liquidity, bank inflows and disbursements.' },
              { title: '9. Outstanding Expenses Report', desc: 'Unpaid vendor bills and liabilities.' },
              { title: '10. Profit & Loss Report', desc: 'Comprehensive P&L statement for stakeholders.' }
            ].map((rep, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{rep.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">{rep.desc}</p>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">Filterable</span>
                  <button
                    onClick={() => {
                      onAddAuditLog({
                        id: 'LOG-' + Date.now(),
                        user_name: currentUsername,
                        user_role: userRole,
                        action: 'Exported Report',
                        record_type: rep.title,
                        record_id: 'REP-' + (idx + 1),
                        date_time: new Date().toLocaleString()
                      });
                      alert(`Successfully exported ${rep.title}!`);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 1.5: CURRENCY CONVERTER */}
      {activeTab === 'converter' && (
        <div className="space-y-6 animate-in fade-in">
          <RealTimeCurrencyConverter rates={settings?.exchange_rates} />
        </div>
      )}

      {/* TAB 8: PROFIT & LOSS (P&L) */}
      {activeTab === 'pl' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs max-w-3xl mx-auto space-y-6">
            <div className="text-center pb-6 border-b border-slate-200 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                Company Primary Currency: Egyptian Pound ({companyCurrency || 'EGP'})
              </span>
              <h2 className="text-xl font-black text-slate-900 pt-2">Sofia Travel S.A.E. — Profit & Loss Statement</h2>
              <p className="text-xs text-slate-500">Official Financial Performance Summary ({companyCurrency || 'EGP'})</p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2.5 border-b border-slate-100 font-bold text-slate-800">
                <span>Total Gross Revenue (Bookings)</span>
                <span className="text-emerald-600 font-black">{formatCurrency(totalRevenue, companyCurrency || 'EGP')}</span>
              </div>
              <div className="flex justify-between py-2.5 border-b border-slate-100 text-slate-600">
                <span>Less: Direct Trip Costs (Hotels, Flights, Suppliers)</span>
                <span className="text-rose-600 font-semibold">-{formatCurrency(totalTripCosts, companyCurrency || 'EGP')}</span>
              </div>
              <div className="flex justify-between py-2.5 border-b border-slate-200 font-bold text-slate-900 bg-slate-50 px-3 rounded-xl">
                <span>Gross Profit</span>
                <span className="text-blue-600 font-black">{formatCurrency(grossProfit, companyCurrency || 'EGP')}</span>
              </div>
              <div className="flex justify-between py-2.5 border-b border-slate-100 text-slate-600">
                <span>Less: Operating Expenses (Rent, Utilities, Marketing, Software)</span>
                <span className="text-rose-600 font-semibold">-{formatCurrency(totalExpenses, companyCurrency || 'EGP')}</span>
              </div>
              <div className="flex justify-between py-2.5 border-b border-slate-100 text-slate-600">
                <span>Less: Employee Payroll & Salaries</span>
                <span className="text-rose-600 font-semibold">-{formatCurrency(totalPayroll, companyCurrency || 'EGP')}</span>
              </div>
              <div className="flex justify-between py-2.5 border-b border-slate-100 text-slate-600">
                <span>Less: Sales Commissions</span>
                <span className="text-rose-600 font-semibold">-{formatCurrency(totalCommissions, companyCurrency || 'EGP')}</span>
              </div>
              <div className="flex justify-between py-3.5 border-t-2 border-slate-900 text-sm font-black text-slate-900 bg-blue-50/50 px-4 rounded-2xl">
                <span>Net Operating Profit ({companyCurrency || 'EGP'})</span>
                <span className={netProfit >= 0 ? 'text-emerald-700 font-black' : 'text-rose-700 font-black'}>
                  {formatCurrency(netProfit, companyCurrency || 'EGP')}
                </span>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => window.print()}
                className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print P&L Statement ({companyCurrency || 'EGP'})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 9: AUDIT LOG */}
      {activeTab === 'audit' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                  <th className="py-3 px-4 font-semibold">Admin User</th>
                  <th className="py-3 px-4 font-semibold">Action</th>
                  <th className="py-3 px-4 font-semibold">Record Type</th>
                  <th className="py-3 px-4 font-semibold">Details / Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">No finance audit logs recorded yet.</td>
                  </tr>
                ) : (
                  auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 text-slate-500">{log.date_time}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{log.user_name} ({log.user_role})</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-bold text-[10px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-medium">{log.record_type} (#{log.record_id})</td>
                      <td className="py-3 px-4 text-slate-600">{log.new_value || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RECORD EXPENSE MODAL */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {editingExpense ? 'Edit Expense Record' : 'Record New Company Expense'}
            </h3>
            <form onSubmit={handleSaveExpense} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expense Category</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  >
                    {[
                      'Office Rent', 'Electricity', 'Water', 'Internet', 'Telephone',
                      'Advertising', 'Facebook Ads', 'Instagram Ads', 'Google Ads',
                      'Transportation', 'Visa Expenses', 'Hotel Expenses', 'Flight Expenses',
                      'Tour Guide', 'Commission', 'Office Supplies', 'Maintenance',
                      'Software / Subscriptions', 'Other'
                    ].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Monthly Office Rent for Cairo HQ"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Amount</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Currency</label>
                  <select
                    value={expenseForm.currency}
                    onChange={(e) => setExpenseForm({ ...expenseForm, currency: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="EGP">EGP (EGP)</option>
                    <option value="SAR">SAR (SAR)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Exchange Rate to USD</label>
                  <input
                    type="number"
                    step="0.01"
                    value={expenseForm.exchange_rate}
                    onChange={(e) => setExpenseForm({ ...expenseForm, exchange_rate: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={expenseForm.payment_method}
                    onChange={(e) => setExpenseForm({ ...expenseForm, payment_method: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="InstaPay">InstaPay</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Invoice / Receipt Number</label>
                  <input
                    type="text"
                    placeholder="INV-9921"
                    value={expenseForm.invoice_receipt_number || ''}
                    onChange={(e) => setExpenseForm({ ...expenseForm, invoice_receipt_number: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes / Remarks</label>
                <textarea
                  rows={2}
                  value={expenseForm.notes || ''}
                  onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs"
                >
                  {editingExpense ? 'Update Expense' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ISSUE ADVANCE MODAL */}
      {showAdvanceModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Issue Employee Advance / Loan</h3>
            <form onSubmit={handleCreateAdvance} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Employee</label>
                <select
                  required
                  value={advanceForm.employee_id}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, employee_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                >
                  <option value="">-- Select Employee --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.position})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Amount</label>
                  <input
                    type="number"
                    required
                    value={advanceForm.amount}
                    onChange={(e) => setAdvanceForm({ ...advanceForm, amount: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Currency</label>
                  <select
                    value={advanceForm.currency}
                    onChange={(e) => setAdvanceForm({ ...advanceForm, currency: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="EGP">EGP</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason / Purpose</label>
                <input
                  type="text"
                  required
                  placeholder="Emergency medical advance"
                  value={advanceForm.reason}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, reason: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAdvanceModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs"
                >
                  Issue Advance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD COMMISSION MODAL */}
      {showCommissionModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Record Sales Commission</h3>
            <form onSubmit={handleCreateCommission} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Employee / Agent</label>
                <select
                  required
                  value={commissionForm.employee_id}
                  onChange={(e) => setCommissionForm({ ...commissionForm, employee_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                >
                  <option value="">-- Select Employee --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sale Amount</label>
                  <input
                    type="number"
                    required
                    value={commissionForm.sale_amount}
                    onChange={(e) => setCommissionForm({ ...commissionForm, sale_amount: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Commission %</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={commissionForm.commission_percentage}
                    onChange={(e) => setCommissionForm({ ...commissionForm, commission_percentage: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Customer / Trip Name</label>
                <input
                  type="text"
                  placeholder="Cairo Holiday Package"
                  value={commissionForm.trip_name}
                  onChange={(e) => setCommissionForm({ ...commissionForm, trip_name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCommissionModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs"
                >
                  Save Commission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MARK SALARY PAID MODAL */}
      {showPayModal && selectedPayrollRecord && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Mark Salary as Paid</h3>
            <p className="text-xs text-slate-500 mb-4">
              Employee: <strong>{selectedPayrollRecord.employee_name}</strong> ({selectedPayrollRecord.payroll_month})
            </p>
            <form onSubmit={handleMarkPaidSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Date</label>
                  <input
                    type="date"
                    required
                    value={payForm.payment_date}
                    onChange={(e) => setPayForm({ ...payForm, payment_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Paid Amount</label>
                  <input
                    type="number"
                    required
                    value={payForm.paid_amount}
                    onChange={(e) => setPayForm({ ...payForm, paid_amount: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={payForm.payment_method}
                    onChange={(e) => setPayForm({ ...payForm, payment_method: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Check">Check</option>
                    <option value="InstaPay">InstaPay</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Transaction Ref #</label>
                  <input
                    type="text"
                    required
                    value={payForm.transaction_reference}
                    onChange={(e) => setPayForm({ ...payForm, transaction_reference: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL FOR DELETE */}
      {deleteConfirmState.isOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Are you sure you want to delete this record?</h3>
                <p className="text-xs text-slate-500">This action may affect financial reports and P&L statements.</p>
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200 mb-6">
              {deleteConfirmState.title}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmState({ isOpen: false, type: 'expense', id: '', title: '' })}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteConfirmState.type === 'expense') {
                    onDeleteExpense(deleteConfirmState.id);
                  } else if (deleteConfirmState.type === 'advance') {
                    onDeleteAdvance(deleteConfirmState.id);
                  } else if (deleteConfirmState.type === 'commission') {
                    onDeleteCommission(deleteConfirmState.id);
                  }
                  setDeleteConfirmState({ isOpen: false, type: 'expense', id: '', title: '' });
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                Yes, Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
