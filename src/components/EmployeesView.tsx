import React, { useState } from 'react';
import { Briefcase, Plus, Phone, Mail, X, Edit2, Trash2 } from 'lucide-react';
import { Employee, UserRole } from '../types';

interface EmployeesViewProps {
  employees: Employee[];
  onAddEmployee: (data: Partial<Employee> & { username?: string; password?: string }) => void;
  onEditEmployee: (id: string, data: Partial<Employee> & { username?: string; password?: string }) => void;
  onDeleteEmployee: (id: string) => void;
  userRole: UserRole;
}

export function EmployeesView({ employees, onAddEmployee, onEditEmployee, onDeleteEmployee, userRole }: EmployeesViewProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  
  const initialFormState = {
    name: '',
    username: '',
    password: '',
    position: 'Sales Executive',
    department: 'Sales',
    salary: 1200,
    email: '',
    phone: '',
    status: 'Active'
  };
  
  const [formData, setFormData] = useState(initialFormState);

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      name: emp.name,
      username: emp.username || '',
      password: emp.password || '',
      position: emp.position,
      department: emp.department,
      salary: emp.salary || 0,
      email: emp.email || '',
      phone: emp.phone || '',
      status: emp.status
    });
    setShowAddModal(true);
  };

  const handleCreateOrUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEmployee) {
      onEditEmployee(editingEmployee.id, formData);
    } else {
      onAddEmployee(formData);
    }
    setShowAddModal(false);
    setEditingEmployee(null);
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
            onClick={() => {
              setEditingEmployee(null);
              setFormData(initialFormState);
              setShowAddModal(true);
            }}
            className="flex items-center space-x-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Employee Account</span>
          </button>
        )}
      </div>

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
              {employees.map(emp => (
                <tr key={emp.id} className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{emp.employee_id}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{emp.name}</td>
                  <td className="py-3.5 px-4"><span className="px-2.5 py-1 bg-cyan-50 text-cyan-700 rounded-full text-xs font-bold">{emp.position}</span></td>
                  <td className="py-3.5 px-4 text-slate-600">{emp.department}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{emp.reservations_count || 0}</td>
                  <td className="py-3.5 px-4 font-bold text-emerald-600">${(emp.total_sales || 0).toLocaleString()}</td>
                  <td className="py-3.5 px-4 font-bold text-indigo-600">${(emp.total_profit || 0).toLocaleString()}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                      {emp.status}
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
                            if (window.confirm(`Delete employee ${emp.name}?`)) {
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">{editingEmployee ? 'Edit Employee Account' : 'Create New Employee Account'}</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdate} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Sarah Connor"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Login Username</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="e.g. sarah.connor"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Login Password</label>
                  <input
                    type="text"
                    required={!editingEmployee} // Required only for new, optional on edit
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingEmployee ? "Leave blank to keep same" : "e.g. SC05"}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role / Position</label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
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
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Salary ($)</label>
                  <input
                    type="number"
                    required
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-medium shadow-sm cursor-pointer"
                >
                  {editingEmployee ? 'Update Account' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
