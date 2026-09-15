import React, { useState, useEffect } from 'react';
import { 
  Briefcase, Plus, Phone, Mail, X, Edit2, Trash2, AlertTriangle, Check, Save, Shield, UserX, UserCheck, Lock, Copy
} from 'lucide-react';
import { Employee, UserRole } from '../types';

interface EmployeesViewProps {
  employees: Employee[];
  onAddEmployee: (data: Partial<Employee> & { username?: string; password?: string }) => void;
  onEditEmployee: (id: string, data: Partial<Employee> & { username?: string; password?: string }) => void;
  onDeleteEmployee: (id: string) => void;
  onDeactivateEmployee?: (id: string, status: 'Active' | 'Inactive' | 'Suspended') => void;
  userRole: UserRole;
  onAddAuditLog: (log: any) => void;
  currentUsername: string;
}

const EMPLOYEE_DRAFT_KEY = 'sofia_travel_employee_draft_v2';

export const PERMISSION_GROUPS = [
  { 
    group: 'Dashboard', 
    permissions: [{ id: 'view_dashboard', label: 'View Dashboard' }] 
  },
  { 
    group: 'Employees', 
    permissions: [
      { id: 'view_employees', label: 'View Employees' },
      { id: 'add_employee', label: 'Add Employee' },
      { id: 'edit_employee', label: 'Edit Employee' },
      { id: 'delete_employee', label: 'Delete / Deactivate Employee' }
    ] 
  },
  { 
    group: 'Attendance', 
    permissions: [
      { id: 'view_attendance', label: 'View Attendance' },
      { id: 'add_check_in', label: 'Add Check-In' },
      { id: 'add_check_out', label: 'Add Check-Out' },
      { id: 'edit_attendance', label: 'Edit Attendance' },
      { id: 'view_attendance_reports', label: 'View Attendance Reports' }
    ] 
  },
  { 
    group: 'Customers', 
    permissions: [
      { id: 'view_customers', label: 'View Customers' },
      { id: 'add_customer', label: 'Add Customer' },
      { id: 'edit_customer', label: 'Edit Customer' },
      { id: 'delete_customer', label: 'Delete Customer' }
    ] 
  },
  { 
    group: 'Trips / Tours', 
    permissions: [
      { id: 'view_trips', label: 'View Trips' },
      { id: 'add_trip', label: 'Add Trip' },
      { id: 'edit_trip', label: 'Edit Trip' },
      { id: 'delete_trip', label: 'Delete Trip' }
    ] 
  },
  { 
    group: 'Bookings', 
    permissions: [
      { id: 'view_bookings', label: 'View Bookings' },
      { id: 'add_booking', label: 'Add Booking' },
      { id: 'edit_booking', label: 'Edit Booking' },
      { id: 'cancel_booking', label: 'Cancel Booking' },
      { id: 'delete_booking', label: 'Delete Booking' }
    ] 
  },
  { 
    group: 'Sales', 
    permissions: [
      { id: 'view_sales', label: 'View Sales' },
      { id: 'add_sale', label: 'Add Sale' },
      { id: 'edit_sale', label: 'Edit Sale' },
      { id: 'view_sales_reports', label: 'View Sales Reports' }
    ] 
  },
  { 
    group: 'Finance', 
    permissions: [
      { id: 'view_finance', label: 'View Finance' },
      { id: 'add_expense', label: 'Add Expense' },
      { id: 'edit_expense', label: 'Edit Expense' },
      { id: 'delete_expense', label: 'Delete Expense' },
      { id: 'view_financial_reports', label: 'View Financial Reports' }
    ] 
  },
  { 
    group: 'Payroll', 
    permissions: [
      { id: 'view_payroll', label: 'View Payroll' },
      { id: 'add_payroll', label: 'Add Payroll' },
      { id: 'edit_payroll', label: 'Edit Payroll' },
      { id: 'delete_payroll', label: 'Delete Payroll' },
      { id: 'view_payroll_reports', label: 'View Payroll Reports' }
    ] 
  },
  { 
    group: 'Commissions', 
    permissions: [
      { id: 'view_commissions', label: 'View Commissions' },
      { id: 'add_commission', label: 'Add Commission' },
      { id: 'edit_commission', label: 'Edit Commission' },
      { id: 'delete_commission', label: 'Delete Commission' }
    ] 
  },
  { 
    group: 'Reports', 
    permissions: [
      { id: 'view_reports', label: 'View Reports' },
      { id: 'export_reports', label: 'Export Reports' }
    ] 
  },
  { 
    group: 'System / Settings', 
    permissions: [
      { id: 'view_settings', label: 'View Settings' },
      { id: 'manage_users', label: 'Manage Users' },
      { id: 'manage_permissions', label: 'Manage Permissions' }
    ] 
  },
];

export function EmployeesView({ 
  employees, 
  onAddEmployee, 
  onEditEmployee, 
  onDeleteEmployee, 
  onDeactivateEmployee,
  userRole, 
  onAddAuditLog,
  currentUsername 
}: EmployeesViewProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string | null>(null);

  // Deactivate confirmation modal
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [employeeToDeactivate, setEmployeeToDeactivate] = useState<Employee | null>(null);
  const [deactivateReason, setDeactivateReason] = useState('');
  
  const initialFormState = {
    name: '',
    username: '',
    password: '',
    position: 'Sales Executive' as const,
    department: 'Sales',
    salary: 1200,
    email: '',
    phone: '',
    status: 'Active' as const,
    account_status: 'Active' as const,
    permissions: [
      'view_dashboard', 'view_customers', 'view_trips', 'view_bookings', 'view_sales'
    ] as string[]
  };
  
  const [formData, setFormData] = useState(initialFormState);
  const [hasUnsavedDraft, setHasUnsavedDraft] = useState(false);
  const [draftPreviewName, setDraftPreviewName] = useState<string>('');
  const [copySourceEmpId, setCopySourceEmpId] = useState<string>('');

  useEffect(() => {
    try {
      const draft = localStorage.getItem(EMPLOYEE_DRAFT_KEY);
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed && (parsed.name || parsed.username || parsed.email)) {
          setHasUnsavedDraft(true);
          setDraftPreviewName(parsed.name || parsed.username || 'Employee');
        }
      }
    } catch (e) {
      console.warn("Draft parse error:", e);
    }
  }, []);

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      name: emp.name || '',
      username: emp.username || '',
      password: emp.password || '',
      position: emp.position || 'Sales Executive',
      department: emp.department || 'Sales',
      salary: emp.salary || 0,
      email: emp.email || '',
      phone: emp.phone || '',
      status: emp.status || 'Active',
      account_status: emp.account_status || 'Active',
      permissions: emp.permissions || ['view_dashboard', 'view_customers', 'view_trips', 'view_bookings']
    });
    setShowAddModal(true);
  };

  const handleOpenAddModal = () => {
    setEditingEmployee(null);
    try {
      const draft = localStorage.getItem(EMPLOYEE_DRAFT_KEY);
      if (draft) {
        const parsed = JSON.parse(draft);
        setFormData({ ...initialFormState, ...parsed });
      } else {
        setFormData(initialFormState);
      }
    } catch {
      setFormData(initialFormState);
    }
    setShowAddModal(true);
  };

  const handleFormFieldChange = (updates: Partial<typeof initialFormState>) => {
    const updated = { ...formData, ...updates };
    setFormData(updated);
    if (!editingEmployee) {
      try {
        localStorage.setItem(EMPLOYEE_DRAFT_KEY, JSON.stringify(updated));
        if (updated.name || updated.username) {
          setHasUnsavedDraft(true);
          setDraftPreviewName(updated.name || updated.username || 'Employee');
        }
      } catch (err) {
        console.warn("Could not save employee draft:", err);
      }
    }
  };

  const handlePermissionToggle = (permId: string) => {
    const current = formData.permissions;
    const exists = current.includes(permId);
    const updated = exists ? current.filter(p => p !== permId) : [...current, permId];
    handleFormFieldChange({ permissions: updated });
  };

  const handleSelectGroupAll = (groupPerms: string[]) => {
    const current = new Set(formData.permissions);
    groupPerms.forEach(p => current.add(p));
    handleFormFieldChange({ permissions: Array.from(current) as string[] });
  };

  const handleClearGroupAll = (groupPerms: string[]) => {
    const current = new Set(formData.permissions);
    groupPerms.forEach(p => current.delete(p));
    handleFormFieldChange({ permissions: Array.from(current) as string[] });
  };

  const handleCopyPermissionsFrom = (sourceId: string) => {
    if (!sourceId) return;
    const src = employees.find(e => e.id === sourceId || e.employee_id === sourceId);
    if (src && src.permissions) {
      handleFormFieldChange({ permissions: [...src.permissions] });
      alert(`Successfully copied permissions from ${src.name}!`);
    }
  };

  const handleCreateOrUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const empName = formData.name || formData.username || 'Employee';
    if (editingEmployee) {
      onEditEmployee(editingEmployee.id, formData);
      onAddAuditLog({
        id: 'LOG-' + Date.now(),
        user_name: currentUsername,
        user_role: userRole,
        action: 'Updated',
        record_type: 'Employee Permissions & Account',
        record_id: editingEmployee.employee_id || editingEmployee.id,
        new_value: `Updated profile & permissions for ${empName}`,
        date_time: new Date().toLocaleString()
      });
      setSavedSuccessMsg(`Updated details and permissions for ${empName}`);
    } else {
      onAddEmployee(formData);
      onAddAuditLog({
        id: 'LOG-' + Date.now(),
        user_name: currentUsername,
        user_role: userRole,
        action: 'Created',
        record_type: 'Employee Account',
        record_id: 'EMP-' + Date.now(),
        new_value: `Created employee ${empName} with specific permissions`,
        date_time: new Date().toLocaleString()
      });
      setSavedSuccessMsg(`Created employee record and user account for ${empName}`);
    }
    localStorage.removeItem(EMPLOYEE_DRAFT_KEY);
    setHasUnsavedDraft(false);
    setShowAddModal(false);
    setEditingEmployee(null);
    setFormData(initialFormState);
    setTimeout(() => setSavedSuccessMsg(null), 4000);
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem(EMPLOYEE_DRAFT_KEY);
    setHasUnsavedDraft(false);
    setFormData(initialFormState);
  };

  const handleConfirmDeactivate = () => {
    if (!employeeToDeactivate) return;
    const newStatus = employeeToDeactivate.account_status === 'Inactive' ? 'Active' : 'Inactive';
    if (onDeactivateEmployee) {
      onDeactivateEmployee(employeeToDeactivate.id, newStatus);
    } else {
      onEditEmployee(employeeToDeactivate.id, { account_status: newStatus });
    }
    onAddAuditLog({
      id: 'LOG-' + Date.now(),
      user_name: currentUsername,
      user_role: userRole,
      action: 'Updated',
      record_type: 'Employee Account Status',
      record_id: employeeToDeactivate.employee_id,
      new_value: `Changed account status to ${newStatus}. Reason: ${deactivateReason || 'Administrative action'}`,
      date_time: new Date().toLocaleString()
    });
    setShowDeactivateModal(false);
    setEmployeeToDeactivate(null);
    setDeactivateReason('');
    setSavedSuccessMsg(`Employee account status updated successfully.`);
    setTimeout(() => setSavedSuccessMsg(null), 4000);
  };

  const isAdmin = userRole === 'Administrator';

  return (
    <div className="p-8 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-extrabold uppercase tracking-wider">Admin Secure</span>
            <span className="px-2.5 py-1 bg-cyan-50 text-cyan-700 rounded-lg text-xs font-extrabold uppercase tracking-wider">Granular RBAC</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-2">Employee Management & Permission Control</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage staff profiles, unique employee IDs, granular access control permissions, and account security.</p>
        </div>
        {isAdmin && (
          <button
            onClick={handleOpenAddModal}
            className="flex items-center space-x-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Employee & Permissions</span>
          </button>
        )}
      </div>

      {/* Unsaved Draft Alert */}
      {hasUnsavedDraft && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-bold">Unsaved Employee Draft Found: {draftPreviewName}</p>
              <p className="text-xs text-amber-700">You previously entered employee details that haven't been saved yet. You can resume and save now.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
            >
              Resume & Save
            </button>
            <button
              type="button"
              onClick={handleDiscardDraft}
              className="px-3.5 py-1.5 bg-white border border-amber-300 text-amber-800 hover:bg-amber-100 text-xs font-medium rounded-lg cursor-pointer"
            >
              Discard Draft
            </button>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {savedSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{savedSuccessMsg}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold">Employee ID</th>
                <th className="py-3 px-4 font-semibold">Name & Username</th>
                <th className="py-3 px-4 font-semibold">Position / Dept</th>
                <th className="py-3 px-4 font-semibold">Permissions Assigned</th>
                <th className="py-3 px-4 font-semibold">Account Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map(emp => {
                const displayName = emp.name || (emp as any).full_name || 'Staff Member';
                const displayPosition = emp.position || (emp as any).job_title || 'Sales Executive';
                const permCount = (emp.permissions || []).length;
                const accStatus = emp.account_status || emp.status || 'Active';
                return (
                  <tr key={emp.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{emp.employee_id || emp.id}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{displayName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">@{emp.username || 'n/a'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-cyan-700 block">{displayPosition}</span>
                      <span className="text-[10px] text-slate-500">{emp.department || 'Sales'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg font-bold text-[10px]">
                        {permCount} Permissions
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                        accStatus === 'Active' ? 'bg-emerald-50 text-emerald-700' :
                        accStatus === 'Suspended' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {accStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openEditModal(emp)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1"
                          title="Edit Profile & Permissions"
                        >
                          <Edit2 className="w-3 h-3" /> Edit
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => {
                              setEmployeeToDeactivate(emp);
                              setShowDeactivateModal(true);
                            }}
                            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1 ${
                              accStatus === 'Active' ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            {accStatus === 'Active' ? <UserX className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                            {accStatus === 'Active' ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Permanently delete employee ${displayName}? Historical data will be unlinked.`)) {
                                onDeleteEmployee(emp.id);
                              }
                            }}
                            className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="Hard Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Employee Modal with Granular Permissions */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingEmployee ? 'Edit Employee Account & Permissions' : 'Create Employee Account & Granular Permissions'}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingEmployee ? `Employee ID: ${editingEmployee.employee_id}` : 'Assign unique employee ID and role permissions.'}
                </p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdate} className="space-y-6 pt-4 text-xs">
              {/* Copy permissions helper */}
              <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-blue-900">Quick Permission Template</p>
                  <p className="text-[11px] text-blue-700">Copy permissions from an existing employee profile.</p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={copySourceEmpId}
                    onChange={(e) => setCopySourceEmpId(e.target.value)}
                    className="bg-white border border-blue-200 rounded-xl px-3 py-1.5 text-xs text-blue-900 font-medium"
                  >
                    <option value="">-- Choose Employee to Copy From --</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({e.employee_id})</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleCopyPermissionsFrom(copySourceEmpId)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl font-bold shadow-xs cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </button>
                </div>
              </div>

              {/* Personal & Login Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleFormFieldChange({ name: e.target.value })}
                    placeholder="e.g. Ahmed Mohamed"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Login Username *</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => handleFormFieldChange({ username: e.target.value })}
                    placeholder="e.g. ahmed.mohamed"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Login Password *</label>
                  <input
                    type="text"
                    required={!editingEmployee}
                    value={formData.password}
                    onChange={(e) => handleFormFieldChange({ password: e.target.value })}
                    placeholder={editingEmployee ? "Leave blank to keep same" : "e.g. Secret@123"}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Job Title / Position</label>
                  <select
                    value={formData.position}
                    onChange={(e) => handleFormFieldChange({ position: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                  >
                    <option value="Sales Executive">Sales Executive</option>
                    <option value="Tour Operations Manager">Tour Operations Manager</option>
                    <option value="Senior Accountant">Senior Accountant</option>
                    <option value="Customer Service Agent">Customer Service Agent</option>
                    <option value="Administrator">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={formData.department}
                    onChange={(e) => handleFormFieldChange({ department: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Monthly Salary (EGP)</label>
                  <input
                    type="number"
                    required
                    value={formData.salary}
                    onChange={(e) => handleFormFieldChange({ salary: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleFormFieldChange({ email: e.target.value })}
                    placeholder="e.g. ahmed@sofiatravel.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handleFormFieldChange({ phone: e.target.value })}
                    placeholder="e.g. +20 100 123 4567"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Account Status</label>
                  <select
                    value={formData.account_status}
                    onChange={(e) => handleFormFieldChange({ account_status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800"
                  >
                    <option value="Active">Active (Allowed to Login)</option>
                    <option value="Inactive">Inactive (Disabled Login)</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>

              {/* Employee Permissions Section */}
              <div className="pt-4 border-t border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-600" /> Employee Permissions & Module Access
                    </h4>
                    <p className="text-[11px] text-slate-500">Check granular permissions granted to this employee account.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const allIds = PERMISSION_GROUPS.flatMap(g => g.permissions.map(p => p.id));
                        handleFormFieldChange({ permissions: allIds });
                      }}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] cursor-pointer"
                    >
                      Select All Permissions
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFormFieldChange({ permissions: [] })}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-rose-700 font-bold rounded-lg text-[11px] cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Grid of Permission Groups */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {PERMISSION_GROUPS.map(group => {
                    const groupPermIds = group.permissions.map(p => p.id);
                    const allSelected = groupPermIds.every(id => formData.permissions.includes(id));
                    return (
                      <div key={group.group} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                          <span className="font-extrabold text-slate-900">{group.group}</span>
                          <div className="space-x-2">
                            <button
                              type="button"
                              onClick={() => handleSelectGroupAll(groupPermIds)}
                              className="text-[10px] text-blue-600 font-bold hover:underline cursor-pointer"
                            >
                              All
                            </button>
                            <span className="text-slate-300">|</span>
                            <button
                              type="button"
                              onClick={() => handleClearGroupAll(groupPermIds)}
                              className="text-[10px] text-rose-600 font-bold hover:underline cursor-pointer"
                            >
                              Clear
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {group.permissions.map(perm => {
                            const isChecked = formData.permissions.includes(perm.id);
                            return (
                              <label key={perm.id} className="flex items-center space-x-2.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handlePermissionToggle(perm.id)}
                                  className="w-4 h-4 rounded-sm text-blue-600 border-slate-300 focus:ring-blue-500"
                                />
                                <span className={`text-xs font-medium ${isChecked ? 'text-slate-900 font-bold' : 'text-slate-600'}`}>
                                  {perm.label}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs cursor-pointer flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingEmployee ? 'Update Employee & Permissions' : 'Save & Create Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivate Account Modal */}
      {showDeactivateModal && employeeToDeactivate && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 text-center">
              {employeeToDeactivate.account_status === 'Active' ? 'Deactivate Employee Account?' : 'Activate Employee Account?'}
            </h3>
            <p className="text-slate-500 text-center leading-relaxed">
              Employee: <strong>{employeeToDeactivate.name}</strong> ({employeeToDeactivate.employee_id})
            </p>
            <p className="text-slate-500 text-center leading-relaxed">
              {employeeToDeactivate.account_status === 'Active' 
                ? 'Deactivating will block login access immediately. All historical attendance, payroll, and financial records will be fully preserved.'
                : 'Activating will restore login access based on their assigned permissions.'}
            </p>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Reason / Notes</label>
              <input
                type="text"
                value={deactivateReason}
                onChange={(e) => setDeactivateReason(e.target.value)}
                placeholder="e.g. Resignation, Suspension, Leave of Absence"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowDeactivateModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeactivate}
                className={`px-5 py-2 text-white rounded-xl font-bold shadow-xs cursor-pointer ${
                  employeeToDeactivate.account_status === 'Active' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {employeeToDeactivate.account_status === 'Active' ? 'Confirm Deactivation' : 'Confirm Activation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
