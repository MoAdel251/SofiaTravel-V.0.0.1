import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, Phone, Mail, X, Edit2, Trash2, AlertTriangle, Check, Save } from 'lucide-react';
import { Employee, UserRole } from '../types';

interface EmployeesViewProps {
  employees: Employee[];
  onAddEmployee: (data: Partial<Employee> & { username?: string; password?: string }) => void;
  onEditEmployee: (id: string, data: Partial<Employee> & { username?: string; password?: string }) => void;
  onDeleteEmployee: (id: string) => void;
  userRole: UserRole;
}

const EMPLOYEE_DRAFT_KEY = 'sofia_travel_employee_draft';

export function EmployeesView({ employees, onAddEmployee, onEditEmployee, onDeleteEmployee, userRole }: EmployeesViewProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string | null>(null);
  
  const initialFormState = {
    name: '',
    username: '',
    password: '',
    position: 'Sales Executive' as const,
    department: 'Sales',
    salary: 1200,
    email: '',
    phone: '',
    status: 'Active' as const
  };
  
  const [formData, setFormData] = useState(initialFormState);
  const [hasUnsavedDraft, setHasUnsavedDraft] = useState(false);
  const [draftPreviewName, setDraftPreviewName] = useState<string>('');

  // Check for unsaved draft on load
  useEffect(() => {
    try {
      const draft = localStorage.getItem(EMPLOYEE_DRAFT_KEY);
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed && (parsed.name || parsed.username || parsed.email || parsed.phone)) {
          setHasUnsavedDraft(true);
          setDraftPreviewName(parsed.name || parsed.username || parsed.position || 'Employee');
        }
      }
    } catch (e) {
      console.warn("Draft parse error:", e);
    }
  }, []);

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      name: emp.name || (emp as any).full_name || '',
      username: emp.username || '',
      password: emp.password || '',
      position: emp.position || (emp as any).job_title || (emp as any).role || 'Sales Executive',
      department: emp.department || 'Sales',
      salary: emp.salary || 0,
      email: emp.email || '',
      phone: emp.phone || '',
      status: emp.status || 'Active'
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
      // Persist draft immediately so user data is never lost
      try {
        localStorage.setItem(EMPLOYEE_DRAFT_KEY, JSON.stringify(updated));
        if (updated.name || updated.username || updated.email) {
          setHasUnsavedDraft(true);
          setDraftPreviewName(updated.name || updated.username || 'Employee');
        }
      } catch (err) {
        console.warn("Could not save employee draft:", err);
      }
    }
  };

  const handleCreateOrUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const empName = formData.name || formData.username || 'Employee';
    if (editingEmployee) {
      onEditEmployee(editingEmployee.id, formData);
      setSavedSuccessMsg(`Updated details for ${empName}`);
    } else {
      onAddEmployee(formData);
      setSavedSuccessMsg(`Created employee record for ${empName}`);
    }
    // Clean up draft
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

  const isAdmin = userRole === 'Administrator';

  return (
    <div className="p-8 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Employee Management & Performance</h1>
          <p className="text-sm text-slate-500">Track staff performance, reservations count, sales totals, commission earned, and staff accounts.</p>
        </div>
        {isAdmin && (
          <button
            onClick={handleOpenAddModal}
            className="flex items-center space-x-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Employee Account</span>
          </button>
        )}
      </div>

      {/* Unsaved Employee Draft Alert */}
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
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-sm font-semibold flex items-center gap-2 animate-in fade-in">
          <Check className="w-5 h-5 text-emerald-600" />
          <span>{savedSuccessMsg}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold">Employee ID</th>
                <th className="py-3 px-4 font-semibold">Name</th>
                <th className="py-3 px-4 font-semibold">Position</th>
                <th className="py-3 px-4 font-semibold">Department</th>
                <th className="py-3 px-4 font-semibold">Reservations</th>
                <th className="py-3 px-4 font-semibold">Total Sales</th>
                <th className="py-3 px-4 font-semibold">Profit Generated</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                {isAdmin && <th className="py-3 px-4 font-semibold text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map(emp => {
                const displayName = emp.name || (emp as any).full_name || 'Staff Member';
                const displayPosition = emp.position || (emp as any).job_title || (emp as any).role || 'Sales';
                return (
                  <tr key={emp.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{emp.employee_id || emp.id}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{displayName}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 bg-cyan-50 text-cyan-700 rounded-full text-xs font-bold">
                        {displayPosition}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{emp.department || 'Operations'}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{emp.reservations_count || 0}</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600">${(emp.total_sales || 0).toLocaleString()}</td>
                    <td className="py-3.5 px-4 font-bold text-indigo-600">${(emp.total_profit || 0).toLocaleString()}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                        {emp.status || 'Active'}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => openEditModal(emp)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete employee ${displayName}?`)) {
                                onDeleteEmployee(emp.id);
                              }
                            }}
                            className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingEmployee ? 'Edit Employee Account' : 'Create New Employee Account'}
                </h3>
                {!editingEmployee && (
                  <p className="text-xs text-slate-500">Draft is continuously saved to your browser so you don't lose data.</p>
                )}
              </div>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdate} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleFormFieldChange({ name: e.target.value })}
                    placeholder="e.g. Sarah Connor"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Login Username *</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => handleFormFieldChange({ username: e.target.value })}
                    placeholder="e.g. sarah.connor"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Login Password</label>
                  <input
                    type="text"
                    required={!editingEmployee}
                    value={formData.password}
                    onChange={(e) => handleFormFieldChange({ password: e.target.value })}
                    placeholder={editingEmployee ? "Leave blank to keep same" : "e.g. Pass@123"}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 focus:bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role / Position</label>
                  <select
                    value={formData.position}
                    onChange={(e) => handleFormFieldChange({ position: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 focus:bg-white"
                  >
                    <option value="Sales Executive">Sales Executive</option>
                    <option value="Tour Operations Manager">Tour Operations Manager</option>
                    <option value="Senior Accountant">Senior Accountant</option>
                    <option value="Customer Service Agent">Customer Service Agent</option>
                    <option value="Administrator">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={formData.department}
                    onChange={(e) => handleFormFieldChange({ department: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Salary ($)</label>
                  <input
                    type="number"
                    required
                    value={formData.salary}
                    onChange={(e) => handleFormFieldChange({ salary: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleFormFieldChange({ email: e.target.value })}
                    placeholder="e.g. sarah@sofiatravel.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handleFormFieldChange({ phone: e.target.value })}
                    placeholder="e.g. +20 100 123 4567"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                {!editingEmployee && (
                  <button
                    type="button"
                    onClick={handleDiscardDraft}
                    className="text-xs text-rose-600 hover:text-rose-700 underline cursor-pointer"
                  >
                    Clear Draft
                  </button>
                )}
                <div className="flex justify-end space-x-3 ml-auto">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 cursor-pointer"
                  >
                    Close (Draft Preserved)
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingEmployee ? 'Update Account' : 'Save & Create Account'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
