import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays, Plus, X, CheckCircle2, XCircle, Paperclip,
  Search, RefreshCw, AlertCircle, Wallet, Settings2, Ban, FileText,
} from 'lucide-react';
import type { Employee, LeaveBalance, LeavePolicy, LeaveRequest, LeaveRequestStatus, UserRole } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { formatDateTime, hrFetch, readFileAsDataUrl, type ActingContext } from '../services/hrApi';

interface LeaveManagementViewProps {
  employees: Employee[];
  currentEmployee?: Employee | null;
  currentUsername: string;
  userRole: UserRole;
  isAdmin: boolean;
  isITAccount: boolean;
  onShowToast?: (message: string) => void;
}

type ViewMode = 'my' | 'approvals' | 'balances' | 'policy';

const STATUS_STYLES: Record<LeaveRequestStatus, string> = {
  Pending: 'bg-amber-100 text-amber-700 border-amber-200',
  Approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Rejected: 'bg-rose-100 text-rose-700 border-rose-200',
  Cancelled: 'bg-slate-100 text-slate-600 border-slate-200',
};

const EMPTY_FORM = {
  leave_type: 'annual',
  start_date: '',
  end_date: '',
  start_time: '09:00',
  end_time: '12:00',
  reason: '',
  attachment_name: '',
  attachment_data: '',
};

export function LeaveManagementView({
  employees,
  currentEmployee,
  currentUsername,
  userRole,
  isAdmin,
  isITAccount,
  onShowToast,
}: LeaveManagementViewProps) {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const L = (en: string, ar: string) => (isAr ? ar : en);

  const acting: ActingContext = useMemo(
    () => ({ username: currentUsername, role: isAdmin ? 'Administrator' : userRole, isIT: isITAccount }),
    [currentUsername, userRole, isAdmin, isITAccount]
  );

  const [mode, setMode] = useState<ViewMode>('my');
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [policy, setPolicy] = useState<LeavePolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [formError, setFormError] = useState('');

  const [decision, setDecision] = useState<{ request: LeaveRequest; action: 'approve' | 'reject' } | null>(null);
  const [decisionComment, setDecisionComment] = useState('');
  const [decisionError, setDecisionError] = useState('');

  const [filterStatus, setFilterStatus] = useState<'All' | LeaveRequestStatus>('All');
  const [filterType, setFilterType] = useState('All');
  const [filterEmployee, setFilterEmployee] = useState('');
  const [search, setSearch] = useState('');

  const canApprove = isAdmin || isITAccount || userRole === 'Manager' ||
    (Array.isArray(currentEmployee?.permissions) && currentEmployee!.permissions!.includes('approve_leave'));
  const canManageBalances = isAdmin || isITAccount ||
    (Array.isArray(currentEmployee?.permissions) && currentEmployee!.permissions!.includes('manage_leave_balances'));

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [policyData, requestData, balanceData] = await Promise.all([
        hrFetch<LeavePolicy>('/api/leave-policies', acting),
        hrFetch<LeaveRequest[]>('/api/leave-requests', acting),
        hrFetch<LeaveBalance[]>(`/api/leave-balances?year=${year}`, acting),
      ]);
      setPolicy(policyData);
      setRequests(Array.isArray(requestData) ? requestData : []);
      setBalances(Array.isArray(balanceData) ? balanceData : []);
    } catch (err: any) {
      setError(err?.message || L('Unable to load leave data.', 'تعذر تحميل بيانات الإجازات.'));
    } finally {
      setLoading(false);
    }
  }, [acting, year, isAr]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const myEmployeeId = String(currentEmployee?.id || currentEmployee?.employee_id || currentUsername || '');
  const myEmployeeName = String(currentEmployee?.name || currentEmployee?.full_name || currentUsername || '');

  const myBalance = useMemo(() => {
    return balances.find(b =>
      String(b.employee_id) === myEmployeeId ||
      (b.employee_name || '').toLowerCase() === myEmployeeName.toLowerCase()
    ) || null;
  }, [balances, myEmployeeId, myEmployeeName]);

  const myRequests = useMemo(() => requests.filter(r =>
    [r.employee_id, r.employee_name].some(value =>
      String(value || '').toLowerCase() === myEmployeeId.toLowerCase() ||
      String(value || '').toLowerCase() === myEmployeeName.toLowerCase()
    )
  ), [requests, myEmployeeId, myEmployeeName]);

  const approvals = useMemo(() => requests.filter(r => r.status === 'Pending'), [requests]);

  const filteredRequests = useMemo(() => {
    const term = search.trim().toLowerCase();
    const source = mode === 'approvals' ? approvals : (mode === 'my' ? myRequests : requests);
    return source.filter(r => {
      if (filterStatus !== 'All' && r.status !== filterStatus) return false;
      if (filterType !== 'All' && r.leave_type !== filterType) return false;
      if (filterEmployee && r.employee_id !== filterEmployee) return false;
      if (!term) return true;
      return [r.employee_name, r.leave_type_label, r.reason, r.request_id, r.department]
        .some(value => String(value || '').toLowerCase().includes(term));
    });
  }, [mode, myRequests, approvals, requests, filterStatus, filterType, filterEmployee, search]);

  const leaveTypes = policy?.leave_types || [];
  const selectedType = leaveTypes.find(t => t.id === form.leave_type);

  const resetForm = () => {
    setForm({ ...EMPTY_FORM, leave_type: leaveTypes[0]?.id || 'annual' });
    setFormError('');
  };

  const openForm = () => {
    resetForm();
    setShowForm(true);
  };

  const handleAttachment = async (file: File | null) => {
    if (!file) {
      setForm(prev => ({ ...prev, attachment_name: '', attachment_data: '' }));
      return;
    }
    if (file.size > 500 * 1024) {
      setFormError(L('Attachment must be smaller than 500 KB.', 'يجب أن يكون المرفق أصغر من 500 كيلوبايت.'));
      return;
    }
    const data = await readFileAsDataUrl(file);
    setForm(prev => ({ ...prev, attachment_name: file.name, attachment_data: data }));
  };

  const submitRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError('');
    if (!form.start_date) {
      setFormError(L('Please select a start date.', 'يرجى اختيار تاريخ البداية.'));
      return;
    }
    if (selectedType?.is_hourly && !form.start_time) {
      setFormError(L('Please select the permission time.', 'يرجى تحديد وقت الإذن.'));
      return;
    }
    if (form.reason.trim().length < 3) {
      setFormError(L('Please provide a reason.', 'يرجى كتابة سبب الطلب.'));
      return;
    }

    setSaving(true);
    try {
      await hrFetch<LeaveRequest>('/api/leave-requests', acting, {
        method: 'POST',
        body: {
          employee_id: myEmployeeId,
          employee_name: myEmployeeName,
          department: currentEmployee?.department || '',
          leave_type: form.leave_type,
          start_date: form.start_date,
          end_date: selectedType?.is_hourly ? form.start_date : (form.end_date || form.start_date),
          start_time: selectedType?.is_hourly ? form.start_time : undefined,
          end_time: selectedType?.is_hourly ? form.end_time : undefined,
          reason: form.reason.trim(),
          attachment_name: form.attachment_name || undefined,
          attachment_data: form.attachment_data || undefined,
        },
      });
      setShowForm(false);
      resetForm();
      onShowToast?.(L('Leave request submitted successfully.', 'تم إرسال طلب الإجازة بنجاح.'));
      await loadData();
    } catch (err: any) {
      setFormError(err?.message || L('Unable to submit the request.', 'تعذر إرسال الطلب.'));
    } finally {
      setSaving(false);
    }
  };

  const submitDecision = async () => {
    if (!decision) return;
    setDecisionError('');
    if (decision.action === 'reject' && !decisionComment.trim()) {
      setDecisionError(L('A rejection reason is required.', 'سبب الرفض مطلوب.'));
      return;
    }
    setSaving(true);
    try {
      await hrFetch(`/api/leave-requests/${encodeURIComponent(decision.request.id)}/${decision.action}`, acting, {
        method: 'POST',
        body: { comment: decisionComment.trim() },
      });
      onShowToast?.(decision.action === 'approve'
        ? L('Leave request approved.', 'تمت الموافقة على طلب الإجازة.')
        : L('Leave request rejected.', 'تم رفض طلب الإجازة.'));
      setDecision(null);
      setDecisionComment('');
      await loadData();
    } catch (err: any) {
      setDecisionError(err?.message || L('Unable to update the request.', 'تعذر تحديث الطلب.'));
    } finally {
      setSaving(false);
    }
  };

  const cancelRequest = async (request: LeaveRequest) => {
    if (!window.confirm(L('Cancel this leave request?', 'هل تريد إلغاء طلب الإجازة؟'))) return;
    setSaving(true);
    try {
      await hrFetch(`/api/leave-requests/${encodeURIComponent(request.id)}/cancel`, acting, { method: 'POST', body: {} });
      onShowToast?.(L('Leave request cancelled.', 'تم إلغاء طلب الإجازة.'));
      await loadData();
    } catch (err: any) {
      onShowToast?.(err?.message || L('Unable to cancel the request.', 'تعذر إلغاء الطلب.'));
    } finally {
      setSaving(false);
    }
  };

  const adjustBalance = async (row: LeaveBalance) => {
    const input = window.prompt(
      L(`Annual allowance for ${row.employee_name} (${row.year})`, `الرصيد السنوي لـ ${row.employee_name} (${row.year})`),
      String(row.annual_allowance)
    );
    if (input === null) return;
    const allowance = Number(input);
    if (!Number.isFinite(allowance) || allowance < 0) return;
    setSaving(true);
    try {
      await hrFetch(`/api/leave-balances/${encodeURIComponent(row.employee_id)}`, acting, {
        method: 'PUT',
        body: {
          year: row.year,
          annual_allowance: allowance,
          carry_forward_days: row.carry_forward_days || 0,
          adjustment_days: row.adjustment_days || 0,
        },
      });
      onShowToast?.(L('Leave balance updated.', 'تم تحديث رصيد الإجازات.'));
      await loadData();
    } catch (err: any) {
      onShowToast?.(err?.message || L('Unable to update the balance.', 'تعذر تحديث الرصيد.'));
    } finally {
      setSaving(false);
    }
  };

  const modeTabs: Array<{ id: ViewMode; label: string; visible: boolean }> = [
    { id: 'my', label: L('My Requests', 'طلباتي'), visible: true },
    { id: 'approvals', label: L('Pending Approvals', 'بانتظار الموافقة'), visible: canApprove },
    { id: 'balances', label: L('Leave Balances', 'أرصدة الإجازات'), visible: true },
    { id: 'policy', label: L('Policy Settings', 'إعدادات السياسة'), visible: canManageBalances },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-600/20">
              <CalendarDays className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {L('Leave & Permission Management', 'إدارة الإجازات والأذونات')}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {L(
              'Submit leave and hourly permission requests, follow approvals, and track your annual balance.',
              'قدّم طلبات الإجازات والأذونات بالساعة، وتابع الموافقات، وتتبع رصيدك السنوي.'
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void loadData()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-100"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {L('Refresh', 'تحديث')}
          </button>
          <button
            type="button"
            onClick={openForm}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            {L('New Request', 'طلب جديد')}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {myBalance && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: L('Annual Allowance', 'الرصيد السنوي'), value: myBalance.annual_allowance, tone: 'text-slate-900' },
            { label: L('Used', 'المستخدم'), value: myBalance.used, tone: 'text-rose-600' },
            { label: L('Pending', 'قيد الموافقة'), value: myBalance.pending, tone: 'text-amber-600' },
            { label: L('Remaining', 'المتبقي'), value: myBalance.remaining, tone: 'text-emerald-600' },
          ].map(card => (
            <div key={card.label} className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{card.label}</div>
              <div className={`text-2xl font-extrabold mt-1 ${card.tone}`}>
                {Number(card.value || 0).toLocaleString()} <span className="text-xs font-bold text-slate-400">{L('days', 'يوم')}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {modeTabs.filter(tab => tab.visible).map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setMode(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
              mode === tab.id
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {tab.label}
            {tab.id === 'approvals' && approvals.length > 0 && (
              <span className="ms-1.5 px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-900 text-[10px]">
                {approvals.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {mode === 'policy' ? (
        <PolicyPanel policy={policy} acting={acting} canEdit={canManageBalances} onSaved={loadData} onShowToast={onShowToast} isAr={isAr} />
      ) : mode === 'balances' ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
              <Wallet className="w-4 h-4 text-indigo-600" />
              {L('Leave balances', 'أرصدة الإجازات')}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={2000}
                max={2100}
                value={year}
                onChange={e => setYear(Number(e.target.value) || new Date().getFullYear())}
                className="w-24 px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
                aria-label={L('Year', 'السنة')}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="text-start px-4 py-2 font-bold">{L('Employee', 'الموظف')}</th>
                  <th className="text-start px-4 py-2 font-bold">{L('Department', 'القسم')}</th>
                  <th className="text-end px-4 py-2 font-bold">{L('Allowance', 'الرصيد')}</th>
                  <th className="text-end px-4 py-2 font-bold">{L('Used', 'المستخدم')}</th>
                  <th className="text-end px-4 py-2 font-bold">{L('Pending', 'قيد الموافقة')}</th>
                  <th className="text-end px-4 py-2 font-bold">{L('Remaining', 'المتبقي')}</th>
                  {canManageBalances && <th className="px-4 py-2" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {balances.map(row => (
                  <tr key={`${row.employee_id}-${row.year}`} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-bold text-slate-800">{row.employee_name}</td>
                    <td className="px-4 py-2.5 text-slate-500">{row.department || '—'}</td>
                    <td className="px-4 py-2.5 text-end font-semibold">{row.total_allowance ?? row.annual_allowance}</td>
                    <td className="px-4 py-2.5 text-end text-rose-600 font-semibold">{row.used}</td>
                    <td className="px-4 py-2.5 text-end text-amber-600 font-semibold">{row.pending}</td>
                    <td className="px-4 py-2.5 text-end text-emerald-600 font-extrabold">{row.remaining}</td>
                    {canManageBalances && (
                      <td className="px-4 py-2.5 text-end">
                        <button
                          type="button"
                          onClick={() => void adjustBalance(row)}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[10px] font-bold"
                        >
                          {L('Adjust', 'تعديل')}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {balances.length === 0 && !loading && (
                  <tr><td colSpan={canManageBalances ? 7 : 6} className="px-4 py-8 text-center text-slate-400">{L('No balance records.', 'لا توجد أرصدة.')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute start-2.5 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={L('Search requests…', 'بحث في الطلبات…')}
                className="w-full ps-8 pe-2 py-1.5 rounded-lg border border-slate-200 text-xs"
              />
            </div>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as any)}
              className="px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold"
            >
              <option value="All">{L('All statuses', 'كل الحالات')}</option>
              {['Pending', 'Approved', 'Rejected', 'Cancelled'].map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold"
            >
              <option value="All">{L('All types', 'كل الأنواع')}</option>
              {leaveTypes.map(type => (
                <option key={type.id} value={type.id}>{isAr ? type.label_ar : type.label_en}</option>
              ))}
            </select>
            {mode === 'approvals' && (
              <select
                value={filterEmployee}
                onChange={e => setFilterEmployee(e.target.value)}
                className="px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold"
              >
                <option value="">{L('All employees', 'كل الموظفين')}</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            )}
          </div>

          <div className="divide-y divide-slate-100">
            {filteredRequests.map(request => {
              const canCancel = request.status === 'Pending' || request.status === 'Approved';
              return (
                <div key={request.id} className="p-4 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 hover:bg-slate-50/70">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-extrabold text-slate-900">
                        {request.leave_type_label || request.leave_type}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${STATUS_STYLES[request.status]}`}>
                        {request.status}
                      </span>
                      {request.request_id && (
                        <span className="text-[10px] font-mono text-slate-400">{request.request_id}</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-600 mt-1 font-semibold">
                      {request.employee_name}
                      {request.department ? ` · ${request.department}` : ''}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {request.start_date}{request.start_date !== request.end_date ? ` → ${request.end_date}` : ''}
                      {request.is_hourly && request.start_time ? ` · ${request.start_time}–${request.end_time}` : ''}
                      {` · ${request.days} ${L('day(s)', 'يوم')}`}
                    </div>
                    <div className="text-xs text-slate-600 mt-1.5 whitespace-pre-line">{request.reason}</div>
                    {request.manager_comment && (
                      <div className="text-[11px] text-slate-500 mt-1.5 italic">
                        {L('Reviewer comment', 'ملاحظة المراجع')}: {request.manager_comment}
                      </div>
                    )}
                    <div className="text-[10px] text-slate-400 mt-1.5">
                      {L('Submitted', 'تم الإرسال')}: {formatDateTime(request.submitted_at)}
                      {request.reviewed_by_name ? ` · ${L('Reviewed by', 'راجعه')}: ${request.reviewed_by_name}` : ''}
                      {request.reviewed_at ? ` · ${formatDateTime(request.reviewed_at)}` : ''}
                    </div>
                    {request.attachment_name && (
                      request.attachment_data ? (
                        <a
                          href={request.attachment_data}
                          download={request.attachment_name}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:underline mt-1.5"
                        >
                          <Paperclip className="w-3 h-3" /> {request.attachment_name}
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 mt-1.5">
                          <Paperclip className="w-3 h-3" /> {request.attachment_name}
                        </span>
                      )
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {mode === 'approvals' && request.status === 'Pending' && canApprove && (
                      <>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => { setDecision({ request, action: 'approve' }); setDecisionComment(''); setDecisionError(''); }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-500 disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> {L('Approve', 'موافقة')}
                        </button>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => { setDecision({ request, action: 'reject' }); setDecisionComment(''); setDecisionError(''); }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 text-white text-[11px] font-bold hover:bg-rose-500 disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" /> {L('Reject', 'رفض')}
                        </button>
                      </>
                    )}
                    {canCancel && (request.employee_id === myEmployeeId || request.employee_name === myEmployeeName) && (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void cancelRequest(request)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-[11px] font-bold hover:bg-slate-100 disabled:opacity-50"
                      >
                        <Ban className="w-3.5 h-3.5" /> {L('Cancel', 'إلغاء')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {filteredRequests.length === 0 && !loading && (
              <div className="p-10 text-center text-slate-400 text-xs">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                {mode === 'approvals'
                  ? L('No pending requests.', 'لا توجد طلبات معلقة.')
                  : L('No leave requests found.', 'لا توجد طلبات إجازة.')}
              </div>
            )}
            {loading && (
              <div className="p-10 text-center text-slate-400 text-xs">
                <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin" />
                {L('Loading…', 'جاري التحميل…')}
              </div>
            )}
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <form onSubmit={submitRequest} className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92dvh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-900">{L('New leave request', 'طلب إجازة جديد')}</h2>
              <button type="button" onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">{L('Leave type', 'نوع الإجازة')}</label>
                <select
                  value={form.leave_type}
                  onChange={e => setForm(prev => ({ ...prev, leave_type: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                >
                  {leaveTypes.filter(t => t.active !== false).map(type => (
                    <option key={type.id} value={type.id}>{isAr ? type.label_ar : type.label_en}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">{L('Start date', 'تاريخ البداية')}</label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={e => setForm(prev => ({ ...prev, start_date: e.target.value, end_date: prev.end_date || e.target.value }))}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">{L('End date', 'تاريخ النهاية')}</label>
                  <input
                    type="date"
                    value={form.end_date}
                    min={form.start_date || undefined}
                    disabled={Boolean(selectedType?.is_hourly)}
                    onChange={e => setForm(prev => ({ ...prev, end_date: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold disabled:bg-slate-100"
                  />
                </div>
              </div>
              {selectedType?.is_hourly && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">{L('From time', 'من وقت')}</label>
                    <input
                      type="time"
                      value={form.start_time}
                      onChange={e => setForm(prev => ({ ...prev, start_time: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">{L('To time', 'إلى وقت')}</label>
                    <input
                      type="time"
                      value={form.end_time}
                      onChange={e => setForm(prev => ({ ...prev, end_time: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">{L('Reason', 'السبب')}</label>
                <textarea
                  value={form.reason}
                  onChange={e => setForm(prev => ({ ...prev, reason: e.target.value }))}
                  rows={3}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs resize-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  {L('Attachment (optional, max 500 KB)', 'مرفق (اختياري، 500 كيلوبايت كحد أقصى)')}
                </label>
                <input
                  type="file"
                  onChange={e => void handleAttachment(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:me-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-slate-900 file:text-white file:text-[11px] file:font-bold"
                />
                {form.attachment_name && (
                  <div className="text-[10px] text-slate-400 mt-1 truncate">{form.attachment_name}</div>
                )}
              </div>
              {formError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-semibold">
                  {formError}
                </div>
              )}
            </div>
            <div className="sticky bottom-0 bg-white px-5 py-3 border-t border-slate-100 flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600">
                {L('Cancel', 'إلغاء')}
              </button>
              <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold disabled:opacity-50">
                {saving ? L('Submitting…', 'جاري الإرسال…') : L('Submit request', 'إرسال الطلب')}
              </button>
            </div>
          </form>
        </div>
      )}

      {decision && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-900">
                {decision.action === 'approve' ? L('Approve request', 'الموافقة على الطلب') : L('Reject request', 'رفض الطلب')}
              </h2>
              <button type="button" onClick={() => setDecision(null)} className="p-1.5 rounded-lg hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div className="text-xs text-slate-600">
                <span className="font-bold text-slate-900">{decision.request.employee_name}</span>
                {' · '}{decision.request.leave_type_label || decision.request.leave_type}
                {' · '}{decision.request.start_date} → {decision.request.end_date}
                {' · '}{decision.request.days} {L('day(s)', 'يوم')}
              </div>
              <textarea
                value={decisionComment}
                onChange={e => setDecisionComment(e.target.value)}
                rows={3}
                placeholder={decision.action === 'reject'
                  ? L('Rejection reason (required)', 'سبب الرفض (مطلوب)')
                  : L('Comment (optional)', 'ملاحظة (اختياري)')}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs resize-none"
              />
              {decisionError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-semibold">
                  {decisionError}
                </div>
              )}
            </div>
            <div className="px-5 py-3 border-t border-slate-100 flex justify-end gap-2">
              <button type="button" onClick={() => setDecision(null)} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600">
                {L('Cancel', 'إلغاء')}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void submitDecision()}
                className={`px-4 py-2 rounded-xl text-white text-xs font-bold disabled:opacity-50 ${
                  decision.action === 'approve' ? 'bg-emerald-600' : 'bg-rose-600'
                }`}
              >
                {decision.action === 'approve' ? L('Confirm approval', 'تأكيد الموافقة') : L('Confirm rejection', 'تأكيد الرفض')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PolicyPanel({
  policy,
  acting,
  canEdit,
  onSaved,
  onShowToast,
  isAr,
}: {
  policy: LeavePolicy | null;
  acting: ActingContext;
  canEdit: boolean;
  onSaved: () => Promise<void> | void;
  onShowToast?: (message: string) => void;
  isAr: boolean;
}) {
  const L = (en: string, ar: string) => (isAr ? ar : en);
  const [allowance, setAllowance] = useState(String(policy?.default_annual_allowance ?? 21));
  const [types, setTypes] = useState<any[]>(policy?.leave_types || []);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setAllowance(String(policy?.default_annual_allowance ?? 21));
    setTypes(policy?.leave_types || []);
  }, [policy]);

  const updateType = (index: number, patch: Record<string, any>) => {
    setTypes(prev => prev.map((type, i) => (i === index ? { ...type, ...patch } : type)));
  };

  const addType = () => {
    setTypes(prev => [...prev, {
      id: `custom_${Date.now()}`,
      label_en: 'Custom Leave',
      label_ar: 'إجازة مخصصة',
      is_hourly: false,
      deducts_balance: true,
      requires_attachment: false,
      active: true,
    }]);
  };

  const save = async () => {
    setSaving(true);
    setMessage('');
    try {
      await hrFetch('/api/leave-policies', acting, {
        method: 'PUT',
        body: { default_annual_allowance: Number(allowance), leave_types: types },
      });
      onShowToast?.(L('Leave policy updated.', 'تم تحديث سياسة الإجازات.'));
      await onSaved();
    } catch (err: any) {
      setMessage(err?.message || L('Unable to save the policy.', 'تعذر حفظ السياسة.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
      <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
        <Settings2 className="w-4 h-4 text-indigo-600" />
        {L('Leave policy settings', 'إعدادات سياسة الإجازات')}
      </div>
      <div className="max-w-xs">
        <label className="block text-[11px] font-bold text-slate-500 mb-1">{L('Default annual allowance (days)', 'الرصيد السنوي الافتراضي (أيام)')}</label>
        <input
          type="number"
          min={0}
          max={365}
          value={allowance}
          onChange={e => setAllowance(e.target.value)}
          disabled={!canEdit}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold disabled:bg-slate-100"
        />
      </div>

      <div className="space-y-2">
        {types.map((type, index) => (
          <div key={`${type.id}-${index}`} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center border border-slate-100 rounded-xl p-3">
            <input
              value={type.label_en}
              onChange={e => updateType(index, { label_en: e.target.value })}
              disabled={!canEdit}
              className="sm:col-span-3 px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold"
              placeholder="English label"
            />
            <input
              value={type.label_ar}
              onChange={e => updateType(index, { label_ar: e.target.value })}
              disabled={!canEdit}
              className="sm:col-span-3 px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold"
              placeholder="Arabic label"
            />
            <label className="sm:col-span-2 flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
              <input type="checkbox" checked={type.deducts_balance !== false} disabled={!canEdit}
                onChange={e => updateType(index, { deducts_balance: e.target.checked })} />
              {L('Deducts', 'يخصم')}
            </label>
            <label className="sm:col-span-2 flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
              <input type="checkbox" checked={Boolean(type.is_hourly)} disabled={!canEdit}
                onChange={e => updateType(index, { is_hourly: e.target.checked })} />
              {L('Hourly', 'بالساعة')}
            </label>
            <label className="sm:col-span-2 flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
              <input type="checkbox" checked={type.active !== false} disabled={!canEdit}
                onChange={e => updateType(index, { active: e.target.checked })} />
              {L('Active', 'نشط')}
            </label>
          </div>
        ))}
        {types.length === 0 && (
          <div className="text-xs text-slate-400">{L('No leave types configured.', 'لا توجد أنواع إجازات.')}</div>
        )}
      </div>

      {canEdit && (
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={addType} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-700 hover:bg-slate-100">
            <Plus className="w-3.5 h-3.5" /> {L('Add type', 'إضافة نوع')}
          </button>
          <button type="button" onClick={() => void save()} disabled={saving} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-[11px] font-bold disabled:opacity-50">
            {saving ? L('Saving…', 'جاري الحفظ…') : L('Save policy', 'حفظ السياسة')}
          </button>
        </div>
      )}
      {message && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-semibold">{message}</div>
      )}
    </div>
  );
}

export default LeaveManagementView;
