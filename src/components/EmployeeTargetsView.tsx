import React, { useMemo, useState } from 'react';
import {
  Target, Plus, Edit3, Trash2, Search, Lock, ShieldCheck, X, Save,
  TrendingUp, Calendar, Award
} from 'lucide-react';
import { Employee, EmployeeTarget, EmployeeTargetType, UserRole } from '../types';
import { formatCurrency } from '../utils/currency';

interface EmployeeTargetsViewProps {
  targets: EmployeeTarget[];
  employees: Employee[];
  userRole: UserRole;
  currentEmployeeId: string;
  currentUsername: string;
  onAddTarget: (target: EmployeeTarget) => void;
  onUpdateTarget: (target: EmployeeTarget) => void;
  onDeleteTarget: (id: string) => void;
  onAddAuditLog: (log: any) => void;
}

const TARGET_TYPES: EmployeeTargetType[] = [
  'Sales Revenue',
  'Bookings Count',
  'New Customers',
  'Collections',
  'Custom'
];

const CURRENCIES = ['EGP', 'USD', 'EUR', 'GBP', 'SAR', 'AED'];

const formatPeriod = (period: string) => {
  if (!period) return 'No period';
  const [year, month] = period.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  if (isNaN(date.getTime())) return period;
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const formatTargetValue = (target: EmployeeTarget) => {
  if (target.target_type === 'Sales Revenue' || target.target_type === 'Collections') {
    return formatCurrency(target.target_value, target.currency || 'EGP');
  }
  return `${Number(target.target_value || 0).toLocaleString()} ${target.target_type === 'Bookings Count' ? 'bookings' : target.target_type === 'New Customers' ? 'customers' : 'units'}`;
};

export function EmployeeTargetsView({
  targets,
  employees,
  userRole,
  currentEmployeeId,
  currentUsername,
  onAddTarget,
  onUpdateTarget,
  onDeleteTarget,
  onAddAuditLog
}: EmployeeTargetsViewProps) {
  const isAdmin = userRole === 'Administrator';
  const currentEmployee = employees.find(e =>
    (currentEmployeeId && (e.id === currentEmployeeId || e.employee_id === currentEmployeeId)) ||
    (e.username && e.username === currentUsername) ||
    (e.name && e.name === currentUsername)
  );
  const currentEmployeeKeys = [currentEmployee?.id, currentEmployee?.employee_id, currentEmployeeId].filter(Boolean) as string[];

  const [searchTerm, setSearchTerm] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingTarget, setEditingTarget] = useState<EmployeeTarget | null>(null);
  const [form, setForm] = useState<{
    employee_id: string;
    period: string;
    target_type: EmployeeTargetType;
    title: string;
    target_value: number;
    currency: string;
    notes: string;
  }>({
    employee_id: '',
    period: new Date().toISOString().slice(0, 7),
    target_type: 'Sales Revenue',
    title: '',
    target_value: 0,
    currency: 'EGP',
    notes: ''
  });

  const visibleTargets = useMemo(() => {
    if (isAdmin) return targets;
    return targets.filter(t =>
      currentEmployeeKeys.includes(t.employee_id) ||
      (currentEmployee?.name && t.employee_name === currentEmployee.name) ||
      t.employee_name === currentUsername
    );
  }, [targets, isAdmin, currentEmployeeKeys.join('|'), currentEmployee?.name, currentUsername]);

  const filteredTargets = useMemo(() => {
    if (!isAdmin) return visibleTargets;
    return visibleTargets.filter(t => {
      const matchesEmployee = employeeFilter === 'All' || t.employee_id === employeeFilter;
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch = !q ||
        (t.employee_name || '').toLowerCase().includes(q) ||
        (t.title || '').toLowerCase().includes(q) ||
        (t.target_type || '').toLowerCase().includes(q) ||
        (t.period || '').includes(q);
      return matchesEmployee && matchesSearch;
    });
  }, [visibleTargets, isAdmin, employeeFilter, searchTerm]);

  const openAddModal = () => {
    if (!isAdmin) return;
    setEditingTarget(null);
    setForm({
      employee_id: employees.find(e => e.status === 'Active')?.id || employees[0]?.id || '',
      period: new Date().toISOString().slice(0, 7),
      target_type: 'Sales Revenue',
      title: '',
      target_value: 0,
      currency: 'EGP',
      notes: ''
    });
    setShowModal(true);
  };

  const openEditModal = (target: EmployeeTarget) => {
    if (!isAdmin) return;
    setEditingTarget(target);
    setForm({
      employee_id: target.employee_id,
      period: target.period,
      target_type: target.target_type,
      title: target.title || '',
      target_value: target.target_value,
      currency: target.currency || 'EGP',
      notes: target.notes || ''
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Only an administrator can assign or modify employee targets.');
      return;
    }
    const emp = employees.find(e => e.id === form.employee_id);
    if (!emp) {
      alert('Please select an employee.');
      return;
    }
    if (!form.period) {
      alert('Please select a target period.');
      return;
    }
    if (!form.target_value || Number(form.target_value) <= 0) {
      alert('Please enter a target value greater than zero.');
      return;
    }

    const target: EmployeeTarget = {
      id: editingTarget?.id || `TGT-${emp.id}-${form.period}-${Date.now()}`,
      target_id: editingTarget?.target_id || `TGT-${Date.now()}`,
      employee_id: emp.id,
      employee_name: emp.name,
      period: form.period,
      target_type: form.target_type,
      title: form.title.trim() || undefined,
      target_value: Number(form.target_value),
      currency: form.currency,
      notes: form.notes.trim() || undefined,
      created_by: editingTarget?.created_by || currentUsername,
      created_at: editingTarget?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (editingTarget) {
      onUpdateTarget(target);
    } else {
      onAddTarget(target);
    }

    onAddAuditLog({
      id: 'LOG-' + Date.now(),
      user_name: currentUsername,
      user_role: userRole,
      action: editingTarget ? 'Employee Target Updated' : 'Employee Target Assigned',
      record_type: 'Employee Target',
      record_id: target.target_id,
      new_value: `${target.employee_name}: ${target.target_type} target ${target.target_value} ${target.currency || ''} for ${target.period}`,
      date_time: new Date().toLocaleString()
    });

    setShowModal(false);
    setEditingTarget(null);
  };

  const handleDelete = (target: EmployeeTarget) => {
    if (!isAdmin) return;
    if (!confirm(`Delete the target "${target.title || target.target_type}" for ${target.employee_name}?`)) return;
    onDeleteTarget(target.id);
    onAddAuditLog({
      id: 'LOG-' + Date.now(),
      user_name: currentUsername,
      user_role: userRole,
      action: 'Employee Target Deleted',
      record_type: 'Employee Target',
      record_id: target.target_id,
      new_value: `${target.employee_name}: ${target.target_type} target for ${target.period}`,
      date_time: new Date().toLocaleString()
    });
  };

  // EMPLOYEE READ-ONLY VIEW
  if (!isAdmin) {
    return (
      <div className="p-6 lg:p-8 space-y-6 bg-slate-50 min-h-screen">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-extrabold uppercase tracking-wider flex items-center gap-1">
              <Lock className="w-3 h-3" /> Read Only
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-2">My Targets</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            These targets are assigned by the administrator. You can track them here but cannot modify them.
          </p>
        </div>

        {filteredTargets.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">No targets assigned yet</h2>
            <p className="text-xs text-slate-500 mt-1">Your administrator has not set any targets for you. Please check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredTargets.map(target => (
              <div key={target.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-11 h-11 rounded-2xl bg-cyan-50 text-cyan-700 flex items-center justify-center">
                    <Target className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Admin Set
                  </span>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{target.target_type}</p>
                  <h3 className="text-base font-black text-slate-900">{target.title || target.target_type}</h3>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> {formatPeriod(target.period)}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Target To Achieve</p>
                  <p className="text-2xl font-black text-cyan-700 mt-0.5">{formatTargetValue(target)}</p>
                </div>
                {target.notes && (
                  <p className="text-xs text-slate-500 bg-amber-50 border border-amber-100 rounded-xl p-3">
                    <strong className="text-amber-800">Admin note:</strong> {target.notes}
                  </p>
                )}
                {target.created_by && (
                  <p className="text-[10px] text-slate-400">Assigned by {target.created_by}</p>
                )}
              </div>
            ))}
          </div>
        )}

        <p className="text-[11px] text-slate-400 text-center">
          Targets are locked for employees. Contact the administrator for any changes.
        </p>
      </div>
    );
  }

  // ADMIN MANAGEMENT VIEW
  return (
    <div className="p-6 lg:p-8 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-extrabold uppercase tracking-wider">Admin Secure</span>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-extrabold uppercase tracking-wider">Employee Read Only</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-2">Employee Targets</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Assign monthly performance targets. Employees can view their own targets but cannot modify them.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Assign New Target</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-700">Employee:</span>
          <select
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800 min-w-[180px]"
          >
            <option value="All">All Employees</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name} ({emp.employee_id})</option>
            ))}
          </select>
        </div>
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search targets, type, period..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 pl-8 pr-3 text-xs outline-none focus:border-blue-500"
          />
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[900px]">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-4 font-semibold">Employee</th>
              <th className="py-3 px-4 font-semibold">Period</th>
              <th className="py-3 px-4 font-semibold">Target Type</th>
              <th className="py-3 px-4 font-semibold">Title / Notes</th>
              <th className="py-3 px-4 font-semibold text-right">Target Value</th>
              <th className="py-3 px-4 font-semibold">Assigned By</th>
              <th className="py-3 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTargets.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <Target className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  No targets found. Assign a target to get started.
                </td>
              </tr>
            ) : (
              filteredTargets.map(target => (
                <tr key={target.id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 block">{target.employee_name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {employees.find(e => e.id === target.employee_id || e.employee_id === target.employee_id)?.employee_id || target.employee_id}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-bold">
                      {formatPeriod(target.period)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                      {target.target_type === 'Sales Revenue' || target.target_type === 'Collections'
                        ? <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                        : <Award className="w-3.5 h-3.5 text-amber-600" />}
                      {target.target_type}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 block">{target.title || '—'}</span>
                    {target.notes && <span className="text-[10px] text-slate-500 block max-w-[220px] truncate">{target.notes}</span>}
                  </td>
                  <td className="py-3 px-4 text-right font-black text-cyan-700">{formatTargetValue(target)}</td>
                  <td className="py-3 px-4 text-slate-500">{target.created_by || currentUsername}</td>
                  <td className="py-3 px-4 text-right space-x-1">
                    <button
                      onClick={() => openEditModal(target)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg inline-block"
                      title="Edit Target"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(target)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg inline-block"
                      title="Delete Target"
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

      <div className="flex items-start gap-2 text-[11px] text-slate-500 bg-white border border-slate-200 rounded-2xl p-4">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <span>Targets assigned here are visible to the selected employee in read-only mode. Only administrators can add, edit or delete targets.</span>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingTarget ? 'Edit Employee Target' : 'Assign Employee Target'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">Employees can view this target but cannot change it.</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Employee</label>
                  <select
                    required
                    value={form.employee_id}
                    onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  >
                    <option value="">-- Choose Employee --</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.employee_id})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Period</label>
                  <input
                    type="month"
                    required
                    value={form.period}
                    onChange={(e) => setForm({ ...form, period: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Type</label>
                  <select
                    value={form.target_type}
                    onChange={(e) => setForm({ ...form, target_type: e.target.value as EmployeeTargetType })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  >
                    {TARGET_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Value</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      required
                      value={form.target_value || ''}
                      onChange={(e) => setForm({ ...form, target_value: Number(e.target.value) })}
                      placeholder="e.g. 150000"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                    />
                    <select
                      value={form.currency}
                      onChange={(e) => setForm({ ...form, currency: e.target.value })}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 font-bold"
                    >
                      {CURRENCIES.map(cur => (
                        <option key={cur} value={cur}>{cur}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Title (optional)</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Q4 Sales Campaign Target"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Administrator Note (optional)</label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Instructions or context for the employee..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 resize-none"
                />
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 font-medium flex items-start gap-2">
                <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Once saved, the employee will see this target in read-only mode and will not be able to edit or delete it.</span>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs cursor-pointer flex items-center gap-2"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingTarget ? 'Save Changes' : 'Assign Target'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
