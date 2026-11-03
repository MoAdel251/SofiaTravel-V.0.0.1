import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  Search, 
  Trash2,
  Edit3,
  Shield,
  DollarSign,
  Plus
} from 'lucide-react';
import { PermissionRequest, UserRole, EmployeeAdvance, Employee } from '../types';
import { formatCurrency } from '../utils/currency';

interface PermissionRequestsViewProps {
  requests: PermissionRequest[];
  userRole: UserRole;
  currentUsername: string;
  onApproveRequest: (id: string) => Promise<void> | void;
  onRejectRequest: (id: string, reason?: string) => Promise<void> | void;
  advances?: EmployeeAdvance[];
  employees?: Employee[];
  currentEmployee?: Employee | null;
  onAddAdvance?: (advance: EmployeeAdvance) => Promise<void> | void;
  onUpdateAdvance?: (advance: EmployeeAdvance) => Promise<void> | void;
}

export function PermissionRequestsView({
  requests = [],
  userRole,
  currentUsername,
  onApproveRequest,
  onRejectRequest,
  advances = [],
  employees = [],
  currentEmployee = null,
  onAddAdvance,
  onUpdateAdvance
}: PermissionRequestsViewProps) {
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('Pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [rejectModalId, setRejectModalId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Employee Salary Advance Request Modal State
  const [showAdvanceRequestModal, setShowAdvanceRequestModal] = useState(false);
  const [advanceForm, setAdvanceForm] = useState({
    employee_id: currentEmployee?.id || '',
    amount: '',
    currency: 'EGP',
    reason: '',
    repayment_method: 'Payroll Deduction'
  });

  const canApprove = userRole === 'Administrator' || userRole === 'Manager';
  const canApproveAdvances = userRole === 'Administrator' || userRole === 'Manager' || userRole === 'Accountant';

  const filteredRequests = requests.filter(r => {
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    const matchesSearch = 
      (r.employee_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.module || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.item_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.reason || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const visibleAdvances = canApproveAdvances
    ? advances
    : advances.filter(a =>
        a.employee_id === currentEmployee?.id ||
        (a.employee_name || '').toLowerCase() === (currentEmployee?.name || currentUsername || '').toLowerCase() ||
        (a.requested_by || '').toLowerCase() === (currentUsername || '').toLowerCase()
      );

  const pendingCount = requests.filter(r => r.status === 'Pending').length;
  const approvedCount = requests.filter(r => r.status === 'Approved').length;
  const rejectedCount = requests.filter(r => r.status === 'Rejected').length;

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      await onApproveRequest(id);
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectModalId) return;
    setProcessingId(rejectModalId);
    try {
      await onRejectRequest(rejectModalId, rejectionReason);
      setRejectModalId(null);
      setRejectionReason('');
    } finally {
      setProcessingId(null);
    }
  };

  const handleSubmitAdvanceRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddAdvance) return;
    const amt = Number(advanceForm.amount) || 0;
    if (amt <= 0) return;

    const targetEmp =
      employees.find(emp => emp.id === advanceForm.employee_id) ||
      currentEmployee ||
      employees.find(emp => (emp.username || emp.name || '').toLowerCase() === currentUsername.toLowerCase());

    const newAdv: EmployeeAdvance = {
      id: 'ADV-' + Date.now(),
      advance_id: 'ADV-' + Math.floor(1000 + Math.random() * 9000),
      employee_id: targetEmp?.id || currentUsername,
      employee_name: targetEmp?.name || currentUsername,
      date: new Date().toISOString().split('T')[0],
      amount: amt,
      currency: advanceForm.currency || 'EGP',
      reason: advanceForm.reason || 'Salary advance request',
      repayment_method: advanceForm.repayment_method || 'Payroll Deduction',
      outstanding_amount: amt,
      status: 'Requested',
      requested_by: currentUsername
    };

    await onAddAdvance(newAdv);
    setShowAdvanceRequestModal(false);
    setAdvanceForm({
      employee_id: currentEmployee?.id || '',
      amount: '',
      currency: 'EGP',
      reason: '',
      repayment_method: 'Payroll Deduction'
    });
  };

  const handleApproveAdvanceRequest = async (adv: EmployeeAdvance) => {
    if (!onUpdateAdvance) return;
    await onUpdateAdvance({
      ...adv,
      status: 'Outstanding',
      outstanding_amount: Number(adv.amount) || 0,
      approved_by: currentUsername,
      approved_at: new Date().toISOString().split('T')[0]
    });
  };

  const handleRejectAdvanceRequest = async (adv: EmployeeAdvance) => {
    if (!onUpdateAdvance) return;
    await onUpdateAdvance({
      ...adv,
      status: 'Rejected',
      outstanding_amount: 0,
      approved_by: currentUsername,
      approved_at: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-600/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Permission & Financial Advance Requests
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review employee edit/delete authorization requests and submit or approve employee salary advances synchronized directly with the Finance Dashboard.
          </p>
        </div>
        {onAddAdvance && (
          <button
            onClick={() => {
              setAdvanceForm({
                employee_id: currentEmployee?.id || (employees[0]?.id || ''),
                amount: '',
                currency: 'EGP',
                reason: '',
                repayment_method: 'Payroll Deduction'
              });
              setShowAdvanceRequestModal(true);
            }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Request Salary Advance</span>
          </button>
        )}
      </div>

      {/* Employee Salary Advance Requests Section (Synced with Finance Dashboard) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">Employee Salary Advances (Synced with Finance Dashboard)</h2>
              <p className="text-[11px] text-slate-500">All requested and approved employee advances appear live on the Finance Dashboard & Payroll.</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold self-start sm:self-auto">
            {visibleAdvances.filter(a => a.status === 'Requested').length} Pending Requests • {visibleAdvances.filter(a => a.status === 'Outstanding' || a.status === 'Approved' || a.status === 'Partially Repaid').length} Active
          </span>
        </div>

        {visibleAdvances.length === 0 ? (
          <p className="text-xs text-slate-400 py-3 text-center">No salary advance requests recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Ref #</th>
                  <th className="py-2.5 px-3">Employee</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Repayment</th>
                  <th className="py-2.5 px-3">Reason</th>
                  <th className="py-2.5 px-3">Status</th>
                  {canApproveAdvances && <th className="py-2.5 px-3 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleAdvances.map(adv => (
                  <tr key={adv.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{adv.advance_id}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{adv.employee_name}</td>
                    <td className="py-2.5 px-3 text-slate-500">{adv.date}</td>
                    <td className="py-2.5 px-3 font-extrabold text-slate-900">{formatCurrency(adv.amount, adv.currency || 'EGP')}</td>
                    <td className="py-2.5 px-3 text-slate-600">{adv.repayment_method}</td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">{adv.reason}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        adv.status === 'Requested' ? 'bg-amber-100 text-amber-800' :
                        adv.status === 'Rejected' ? 'bg-rose-100 text-rose-800' :
                        adv.status === 'Fully Repaid' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-indigo-100 text-indigo-800'
                      }`}>
                        {adv.status === 'Outstanding' ? 'Approved / Outstanding' : adv.status}
                      </span>
                    </td>
                    {canApproveAdvances && (
                      <td className="py-2.5 px-3 text-right">
                        {adv.status === 'Requested' ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleApproveAdvanceRequest(adv)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectAdvanceRequest(adv)}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-bold cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400">Synced</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div 
          onClick={() => setStatusFilter('Pending')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'Pending' ? 'bg-amber-500 text-white border-amber-600 shadow-md' : 'bg-white text-slate-900 border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className={`text-xs font-bold uppercase tracking-wider ${statusFilter === 'Pending' ? 'text-amber-100' : 'text-slate-500'}`}>
              Pending Approvals
            </span>
            <Clock className={`w-5 h-5 ${statusFilter === 'Pending' ? 'text-white' : 'text-amber-500'}`} />
          </div>
          <div className="text-2xl font-extrabold mt-2">{pendingCount}</div>
        </div>

        <div 
          onClick={() => setStatusFilter('Approved')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'Approved' ? 'bg-emerald-600 text-white border-emerald-700 shadow-md' : 'bg-white text-slate-900 border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className={`text-xs font-bold uppercase tracking-wider ${statusFilter === 'Approved' ? 'text-emerald-100' : 'text-slate-500'}`}>
              Approved Requests
            </span>
            <CheckCircle2 className={`w-5 h-5 ${statusFilter === 'Approved' ? 'text-white' : 'text-emerald-500'}`} />
          </div>
          <div className="text-2xl font-extrabold mt-2">{approvedCount}</div>
        </div>

        <div 
          onClick={() => setStatusFilter('Rejected')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'Rejected' ? 'bg-rose-600 text-white border-rose-700 shadow-md' : 'bg-white text-slate-900 border-slate-200 hover:border-rose-300'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className={`text-xs font-bold uppercase tracking-wider ${statusFilter === 'Rejected' ? 'text-rose-100' : 'text-slate-500'}`}>
              Rejected Requests
            </span>
            <XCircle className={`w-5 h-5 ${statusFilter === 'Rejected' ? 'text-white' : 'text-rose-500'}`} />
          </div>
          <div className="text-2xl font-extrabold mt-2">{rejectedCount}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search employee, item, module, reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto">
          <span className="text-xs font-semibold text-slate-500 shrink-0">Filter:</span>
          {(['All', 'Pending', 'Approved', 'Rejected'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
            <Shield className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No permission requests found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {statusFilter === 'Pending' ? 'There are currently no pending approval requests from employees.' : 'Try adjusting your search or filters.'}
            </p>
          </div>
        ) : (
          filteredRequests.map((req) => (
            <div 
              key={req.id}
              className={`bg-white rounded-2xl border shadow-xs p-5 transition-all space-y-4 ${
                req.status === 'Pending' ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-700 shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 text-sm">{req.employee_name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                        {req.employee_role}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Submitted: {req.created_at}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-start sm:self-auto">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider flex items-center space-x-1 ${
                    req.action_type === 'Delete' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {req.action_type === 'Delete' ? <Trash2 className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                    <span>{req.action_type}</span>
                  </span>

                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                    req.status === 'Pending' ? 'bg-amber-500 text-white animate-pulse' :
                    req.status === 'Approved' ? 'bg-emerald-600 text-white' :
                    'bg-rose-600 text-white'
                  }`}>
                    {req.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Target Module & Record:</span>
                  <p className="font-extrabold text-slate-900 mt-0.5 text-sm">
                    <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md mr-1.5">{req.module}</span>
                    {req.item_name}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 font-medium">Reason Stated by Employee:</span>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 mt-0.5 text-slate-800 italic">
                    "{req.reason}"
                  </div>
                </div>
              </div>

              {req.status === 'Approved' && (
                <div className="text-[11px] text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Approved by <strong className="font-bold">{req.reviewed_by}</strong> on {req.reviewed_at}. Action executed automatically.</span>
                </div>
              )}

              {req.status === 'Rejected' && (
                <div className="text-[11px] text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200 flex items-center space-x-2">
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Rejected by <strong className="font-bold">{req.reviewed_by}</strong> on {req.reviewed_at}. Reason: "{req.rejection_reason || 'Not approved'}"</span>
                </div>
              )}

              {req.status === 'Pending' && canApprove && (
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                  <button
                    onClick={() => setRejectModalId(req.id)}
                    disabled={processingId === req.id}
                    className="flex items-center space-x-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                  <button
                    onClick={() => handleApprove(req.id)}
                    disabled={processingId === req.id}
                    className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{processingId === req.id ? 'Executing...' : 'Approve & Execute Action'}</span>
                  </button>
                </div>
              )}

              {req.status === 'Pending' && !canApprove && (
                <div className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200">
                  Waiting for an Administrator or Manager to review and approve this request.
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Request Salary Advance Modal */}
      {showAdvanceRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 w-full max-w-md space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base">Request Salary Advance</h3>
            <p className="text-xs text-slate-500">
              Submitted advance requests appear immediately on the Finance Dashboard for owner/accountant review and payroll synchronization.
            </p>
            <form onSubmit={handleSubmitAdvanceRequest} className="space-y-3 text-xs">
              {canApproveAdvances && employees.length > 0 && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Employee</label>
                  <select
                    value={advanceForm.employee_id}
                    onChange={(e) => setAdvanceForm({ ...advanceForm, employee_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold"
                    required
                  >
                    <option value="">Select Employee...</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.position})</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Amount *</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={advanceForm.amount}
                    onChange={(e) => setAdvanceForm({ ...advanceForm, amount: e.target.value })}
                    placeholder="e.g. 2000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Currency</label>
                  <select
                    value={advanceForm.currency}
                    onChange={(e) => setAdvanceForm({ ...advanceForm, currency: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold"
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
                  onChange={(e) => setAdvanceForm({ ...advanceForm, repayment_method: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold"
                >
                  <option value="Payroll Deduction">Payroll Deduction (December Salary)</option>
                  <option value="Cash Repayment">Direct Cash Repayment</option>
                  <option value="Monthly Installments">Monthly Installments</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason *</label>
                <textarea
                  rows={2}
                  required
                  value={advanceForm.reason}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, reason: e.target.value })}
                  placeholder="State reason for advance request..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdvanceRequestModal(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm cursor-pointer"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 w-full max-w-md space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base">Reject Permission Request</h3>
            <p className="text-xs text-slate-500">Provide feedback to the employee regarding why this request is rejected.</p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setRejectModalId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
