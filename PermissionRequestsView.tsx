import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  FileText, 
  Search, 
  Filter, 
  AlertCircle,
  Trash2,
  Edit3,
  Shield,
  ArrowRight
} from 'lucide-react';
import { PermissionRequest, UserRole } from '../types';

interface PermissionRequestsViewProps {
  requests: PermissionRequest[];
  userRole: UserRole;
  currentUsername: string;
  onApproveRequest: (id: string) => Promise<void> | void;
  onRejectRequest: (id: string, reason?: string) => Promise<void> | void;
}

export function PermissionRequestsView({
  requests = [],
  userRole,
  currentUsername,
  onApproveRequest,
  onRejectRequest
}: PermissionRequestsViewProps) {
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('Pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [rejectModalId, setRejectModalId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const canApprove = userRole === 'Administrator' || userRole === 'Manager';

  const filteredRequests = requests.filter(r => {
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    const matchesSearch = 
      (r.employee_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.module || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.item_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.reason || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

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
              Permission & Approval Requests
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Employees must obtain manager or admin authorization to edit or delete content. Review and execute pending requests here.
          </p>
        </div>
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
