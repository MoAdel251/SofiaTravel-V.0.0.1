import React, { useState, useEffect } from 'react';
import { DollarSign, CreditCard, Receipt, Calculator, Plus, ArrowUpRight, ArrowDownRight, Printer } from 'lucide-react';
import { UserRole } from '../types';

interface FinanceViewProps {
  customerPayments: any[];
  supplierPayments: any[];
  expenses: any[];
  onAddExpense: (data: any) => void;
  onAddCustomerPayment: (data: any) => void;
  userRole?: UserRole;
  initialTab?: string;
}

export function FinanceView({ customerPayments, supplierPayments, expenses, onAddExpense, onAddCustomerPayment, userRole, initialTab = 'overview' }: FinanceViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'customer_payments' | 'supplier_payments' | 'expenses'>(
    initialTab === 'overview' ? 'overview' : (initialTab as any) || 'customer_payments'
  );

  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab === 'overview' ? 'overview' : (initialTab as any));
    }
  }, [initialTab]);

  const isAccountant = userRole === 'Accountant';
  const isAdmin = userRole === 'Administrator';
  
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    category: 'Office',
    description: '',
    amount: 100,
    currency: 'USD',
    payment_method: 'Bank Transfer',
    notes: ''
  });

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddExpense(expenseForm);
    setShowExpenseModal(false);
    setExpenseForm({
      category: 'Office',
      description: '',
      amount: 100,
      currency: 'USD',
      payment_method: 'Bank Transfer',
      notes: ''
    });
  };

  const totalCustomerPayments = customerPayments.reduce((acc, p) => acc + p.amount, 0);
  const totalSupplierPayments = supplierPayments.reduce((acc, p) => acc + p.amount, 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);

  return (
    <div className="p-8 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Financial Management</h1>
          <p className="text-sm text-slate-500">Track customer payments, supplier settlements, company expenses, and profit margins.</p>
        </div>
        {!isAccountant && (
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowExpenseModal(true)}
              className="flex items-center space-x-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record Expense</span>
            </button>
          </div>
        )}
      </div>

      {/* Financial Summary Cards */}
      {!isAccountant && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Customer Payments Collected</p>
            <h3 className="text-3xl font-extrabold text-emerald-600 mt-2">${totalCustomerPayments.toLocaleString()}</h3>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Supplier Payments Paid</p>
            <h3 className="text-3xl font-extrabold text-blue-600 mt-2">${totalSupplierPayments.toLocaleString()}</h3>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Expenses</p>
            <h3 className="text-3xl font-extrabold text-rose-600 mt-2">${totalExpenses.toLocaleString()}</h3>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200">
        {!isAccountant && (
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'overview' ? 'border-cyan-600 text-cyan-600' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
          >
            Overview
          </button>
        )}
        <button
          onClick={() => setActiveTab('customer_payments')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'customer_payments' ? 'border-cyan-600 text-cyan-600' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
        >
          Customer Invoices
        </button>
        {!isAccountant && (
          <>
            <button
              onClick={() => setActiveTab('supplier_payments')}
              className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'supplier_payments' ? 'border-cyan-600 text-cyan-600' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
            >
              Supplier Payments
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'expenses' ? 'border-cyan-600 text-cyan-600' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
            >
              Expenses
            </button>
          </>
        )}
      </div>

      {/* Content based on tab */}
      {!isAccountant && activeTab === 'overview' && (
        <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
          Overview panel for financial metrics. (Use individual tabs for detailed views).
        </div>
      )}
      {activeTab === 'customer_payments' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold">Payment ID</th>
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-4 font-semibold">Reservation</th>
                <th className="py-3 px-4 font-semibold">Amount</th>
                <th className="py-3 px-4 font-semibold">Method</th>
                <th className="py-3 px-4 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customerPayments.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{p.payment_id}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{p.customer_name}</td>
                  <td className="py-3.5 px-4 text-slate-600">{p.reservation_id}</td>
                  <td className="py-3.5 px-4 font-bold text-emerald-600">${p.amount} {p.currency}</td>
                  <td className="py-3.5 px-4 text-slate-600">{p.payment_method}</td>
                  <td className="py-3.5 px-4 text-slate-600">{p.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'supplier_payments' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold">Reference</th>
                <th className="py-3 px-4 font-semibold">Supplier</th>
                <th className="py-3 px-4 font-semibold">Amount</th>
                <th className="py-3 px-4 font-semibold">Method</th>
                <th className="py-3 px-4 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {supplierPayments.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{p.reference}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{p.supplier_name}</td>
                  <td className="py-3.5 px-4 font-bold text-blue-600">${p.amount} {p.currency}</td>
                  <td className="py-3.5 px-4 text-slate-600">{p.payment_method}</td>
                  <td className="py-3.5 px-4 text-slate-600">{p.payment_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'expenses' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold">ID</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold">Description</th>
                <th className="py-3 px-4 font-semibold">Amount</th>
                <th className="py-3 px-4 font-semibold">Method</th>
                <th className="py-3 px-4 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.map(e => (
                <tr key={e.id} className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{e.expense_id}</td>
                  <td className="py-3.5 px-4"><span className="px-2.5 py-1 bg-rose-50 text-rose-700 rounded-full text-xs font-bold">{e.category}</span></td>
                  <td className="py-3.5 px-4 text-slate-800 font-medium">{e.description}</td>
                  <td className="py-3.5 px-4 font-bold text-rose-600">${e.amount}</td>
                  <td className="py-3.5 px-4 text-slate-600">{e.payment_method}</td>
                  <td className="py-3.5 px-4 text-slate-600">{e.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Record Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Record Company Expense</h3>
            <form onSubmit={handleExpenseSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm"
                >
                  <option value="Salaries">Salaries</option>
                  <option value="Office">Office</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Bank Fees">Bank Fees</option>
                  <option value="Software">Software</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  required
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Amount ($)</label>
                <input
                  type="number"
                  required
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-medium"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
