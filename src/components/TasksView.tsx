import React, { useState } from 'react';
import { CheckSquare, Plus, Clock, AlertCircle, ShieldAlert, MessageCircle, Filter, Search, User } from 'lucide-react';
import { Task, TaskPriority, TaskStatus, Employee, UserRole } from '../types';

interface TasksViewProps {
  tasks: Task[];
  employees: Employee[];
  userRole?: UserRole;
  onAddTask: (data: Partial<Task>) => void;
  onUpdateTask: (id: string, data: Partial<Task>) => void;
}

export function TasksView({ 
  tasks, 
  employees, 
  userRole = 'Manager', 
  onAddTask, 
  onUpdateTask 
}: TasksViewProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');

  const [formData, setFormData] = useState<Partial<Task>>({
    task_name: '',
    assigned_employee_id: employees[0]?.id || '',
    due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'Medium',
    status: 'Pending',
    notes: ''
  });

  // Only Managers and Administrators have authority to assign tasks (Requirement 10)
  const isManagerOrAdmin = userRole === 'Manager' || userRole === 'Administrator';

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.task_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (t.assigned_employee_name && t.assigned_employee_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || t.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isManagerOrAdmin) {
      alert('Permission Denied: Only Managers and Administrators can assign tasks.');
      return;
    }
    const emp = employees.find(e => e.id === formData.assigned_employee_id);
    onAddTask({
      ...formData,
      assigned_employee_name: emp?.name
    });
    setShowAddModal(false);
    setFormData({
      task_name: '',
      assigned_employee_id: employees[0]?.id || '',
      due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: 'Medium',
      status: 'Pending',
      notes: ''
    });
  };

  const sendTaskReminderWhatsApp = (t: Task) => {
    const emp = employees.find(e => e.id === t.assigned_employee_id || e.name === t.assigned_employee_name);
    const text = encodeURIComponent(
      `*SOFIA TRAVEL - TASK ASSIGNMENT NOTICE*\n` +
      `-----------------------------------------\n` +
      `Assigned To: ${t.assigned_employee_name}\n` +
      `Task: ${t.task_name}\n` +
      `Priority: ${t.priority}\n` +
      `Due Date: ${t.due_date}\n` +
      `Status: ${t.status}\n` +
      (t.notes ? `Notes: ${t.notes}\n` : '') +
      `-----------------------------------------\n` +
      `Please complete this assignment and mark it finished in the Sofia portal.`
    );
    const phone = emp?.phone?.replace(/[^0-9]/g, '') || '';
    const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Tasks & Operational Directives</h1>
          <p className="text-sm text-slate-500">
            Manager-directed task delegation, deadlines, and employee accountability tracking.
          </p>
        </div>

        {/* Manager-only Action Button */}
        {isManagerOrAdmin ? (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-cyan-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Assign New Task</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3.5 py-2 rounded-xl text-xs font-semibold text-amber-800">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>Task creation is restricted to Managers</span>
          </div>
        )}
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks, employee names..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-cyan-500 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700"
            >
              <option value="All">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Task Name</th>
                <th className="py-3.5 px-4 font-semibold">Assigned Employee</th>
                <th className="py-3.5 px-4 font-semibold">Due Date</th>
                <th className="py-3.5 px-4 font-semibold">Priority</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <CheckSquare className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No tasks found.</p>
                  </td>
                </tr>
              ) : (
                filteredTasks.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{t.task_name}</div>
                      {t.notes && <div className="text-[11px] text-slate-400 mt-0.5">{t.notes}</div>}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center text-[10px] font-bold">
                          {t.assigned_employee_name?.charAt(0) || 'E'}
                        </div>
                        <span className="font-medium text-slate-800 text-xs">{t.assigned_employee_name}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{t.due_date}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        t.priority === 'Urgent' ? 'bg-rose-100 text-rose-800' :
                        t.priority === 'High' ? 'bg-amber-100 text-amber-800' :
                        t.priority === 'Medium' ? 'bg-blue-100 text-blue-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {t.priority}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        t.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                        t.status === 'In Progress' ? 'bg-cyan-100 text-cyan-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {t.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => sendTaskReminderWhatsApp(t)}
                          className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors cursor-pointer"
                          title="Send Task to Employee via WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onUpdateTask(t.id, { 
                            status: t.status === 'Completed' ? 'Pending' : 'Completed' 
                          })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                            t.status === 'Completed'
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                          }`}
                        >
                          {t.status === 'Completed' ? 'Reopen' : 'Complete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Task Modal (Restricted to Managers & Admins) */}
      {showAddModal && isManagerOrAdmin && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Manager Task Assignment</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Task Title / Directive *</label>
                <input
                  type="text"
                  required
                  value={formData.task_name}
                  onChange={(e) => setFormData({ ...formData, task_name: e.target.value })}
                  placeholder="e.g. Confirm VIP Nile Cruise booking vouchers"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assign To Employee *</label>
                <select
                  value={formData.assigned_employee_id}
                  onChange={(e) => setFormData({ ...formData, assigned_employee_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-cyan-500"
                >
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.name} • {e.position} ({e.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Instructions / Notes</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Specific requirements, contact details, or reference numbers..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Assign Directive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
