import React, { useState, useMemo } from 'react';
import { 
  Clock, CheckCircle2, XCircle, AlertTriangle, Calendar, Plus, Search, Filter, 
  UserCheck, UserX, Shield, Edit, Trash2, Check, X, RefreshCw, Briefcase, FileText
} from 'lucide-react';
import { Employee, AttendanceRecord, AttendanceSettings, UserRole } from '../types';

interface AttendanceViewProps {
  userRole: UserRole;
  userPermissions?: string[];
  currentEmployeeId: string;
  currentUsername: string;
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  onCheckIn: (employeeId: string, date: string, checkInTime: string) => void;
  onCheckOut: (recordId: string, checkOutTime: string) => void;
  onAddAttendance: (record: AttendanceRecord) => void;
  onUpdateAttendance: (record: AttendanceRecord) => void;
  onDeleteAttendance: (id: string) => void;
  settings: AttendanceSettings;
  onUpdateSettings: (settings: AttendanceSettings) => void;
  onAddAuditLog: (log: any) => void;
}

export function AttendanceView({
  userRole,
  userPermissions = [],
  currentEmployeeId,
  currentUsername,
  employees,
  attendanceRecords,
  onCheckIn,
  onCheckOut,
  onAddAttendance,
  onUpdateAttendance,
  onDeleteAttendance,
  settings,
  onUpdateSettings,
  onAddAuditLog
}: AttendanceViewProps) {
  const canViewAll = userRole === 'Administrator';
  const canSelfClockInOut = true;

  // Live Clock State
  const [currentTime, setCurrentTime] = useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Security Check: Must have at least some attendance permission
  if (!canViewAll && !canSelfClockInOut) {
    return (
      <div className="p-12 min-h-[80vh] flex items-center justify-center bg-slate-50">
        <div className="bg-white rounded-3xl border border-rose-200 p-8 max-w-md w-full text-center shadow-xl space-y-4">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            You do not have administrator permissions to access the <strong>Attendance & Departure</strong> module. This section is strictly restricted to company administrators.
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

  const [activeTab, setActiveTab] = useState<'daily' | 'settings' | 'monthly-report'>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All');

  // Manual Check-In Modal State
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [checkInEmpId, setCheckInEmpId] = useState('');
  const [checkInTime, setCheckInTime] = useState(new Date().toTimeString().slice(0, 5));
  const [checkInDate, setCheckInDate] = useState(new Date().toISOString().split('T')[0]);

  // Check-Out Modal State
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [activeRecordForOut, setActiveRecordForOut] = useState<AttendanceRecord | null>(null);
  const [checkOutTime, setCheckOutTime] = useState(new Date().toTimeString().slice(0, 5));

  // Edit Record Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editRecord, setEditRecord] = useState<AttendanceRecord | null>(null);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState<AttendanceSettings>(settings);

  const activeEmployees = useMemo(() => {
    return employees.filter(e => e.status === 'Active');
  }, [employees]);

  // Today's attendance mapped by employee_id
  const todayRecordsMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    attendanceRecords
      .filter(r => r.date === selectedDate)
      .forEach(r => map.set(r.employee_id, r));
    return map;
  }, [attendanceRecords, selectedDate]);

  const handleManualCheckInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === checkInEmpId);
    if (!emp) return;

    // Check duplicate
    const existing = attendanceRecords.find(r => r.employee_id === checkInEmpId && r.date === checkInDate);
    if (existing) {
      alert(`Attendance record already exists for ${emp.name} on ${checkInDate}. You can update or check-out instead.`);
      return;
    }

    onCheckIn(checkInEmpId, checkInDate, checkInTime);
    onAddAuditLog({
      id: 'LOG-' + Date.now(),
      user_name: currentUsername,
      user_role: userRole,
      action: 'Attendance Added',
      record_type: 'Attendance',
      record_id: emp.employee_id,
      new_value: `Check-In at ${checkInTime} on ${checkInDate} for ${emp.name}`,
      date_time: new Date().toLocaleString()
    });

    setShowCheckInModal(false);
    setCheckInEmpId('');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRecord) return;
    
    // We update via onUpdateAttendance
    // First calculate working hours if both times exist
    let workingHoursStr = '--';
    if (editRecord.check_in_time && editRecord.check_out_time) {
      const [inH, inM] = editRecord.check_in_time.split(':').map(Number);
      const [outH, outM] = editRecord.check_out_time.split(':').map(Number);
      const diffMins = (outH * 60 + outM) - (inH * 60 + inM);
      if (diffMins > 0) {
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        workingHoursStr = `${hours}h ${mins}m`;
      }
    }
    
    const [offHour, offMin] = settings.official_check_in.split(':').map(Number);
    const [inHour, inMin] = (editRecord.check_in_time || '00:00').split(':').map(Number);
    const officialTotalMins = offHour * 60 + offMin + settings.grace_period_minutes;
    const actualTotalMins = inHour * 60 + inMin;
    const lateMins = Math.max(0, actualTotalMins - (offHour * 60 + offMin));
    
    // Determine status
    let status = editRecord.status;
    if (editRecord.check_in_time) {
      status = lateMins > 0 ? 'Late' : 'Present';
    }

    const updated = {
      ...editRecord,
      late_minutes: lateMins,
      status: status,
      total_working_hours: workingHoursStr,
      updated_at: new Date().toISOString()
    };

    onUpdateAttendance(updated);
    
    onAddAuditLog({
      id: 'LOG-' + Date.now(),
      user_name: currentUsername,
      user_role: userRole,
      action: 'Attendance Edited',
      record_type: 'Attendance',
      record_id: editRecord.attendance_id,
      new_value: `Check-in: ${editRecord.check_in_time}, Check-out: ${editRecord.check_out_time}`,
      date_time: new Date().toLocaleString()
    });
    
    setShowEditModal(false);
    setEditRecord(null);
  };

  const handleCheckOutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRecordForOut) return;
    onCheckOut(activeRecordForOut.id, checkOutTime);
    onAddAuditLog({
      id: 'LOG-' + Date.now(),
      user_name: currentUsername,
      user_role: userRole,
      action: 'Attendance Updated',
      record_type: 'Attendance',
      record_id: activeRecordForOut.attendance_id,
      new_value: `Check-Out at ${checkOutTime}`,
      date_time: new Date().toLocaleString()
    });
    setShowCheckOutModal(false);
    setActiveRecordForOut(null);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(settingsForm);
    onAddAuditLog({
      id: 'LOG-' + Date.now(),
      user_name: currentUsername,
      user_role: userRole,
      action: 'Updated',
      record_type: 'Attendance Settings',
      record_id: 'SETTINGS-ATT',
      new_value: `Updated official times (${settingsForm.official_check_in} - ${settingsForm.official_check_out})`,
      date_time: new Date().toLocaleString()
    });
    alert('Attendance and deduction settings updated successfully!');
  };

  if (!canViewAll && canSelfClockInOut) {
    const today = new Date().toISOString().split('T')[0];
    const myRecord = attendanceRecords.find(r => r.employee_id === currentEmployeeId && r.date === today);

    const handleSelfClockIn = () => {
      const hhmm = currentTime.toTimeString().slice(0, 5);
      onCheckIn(currentEmployeeId, today, hhmm);
    };

    const handleSelfClockOut = () => {
      if (!myRecord) return;
      const hhmm = currentTime.toTimeString().slice(0, 5);
      onCheckOut(myRecord.id, hhmm);
    };

    return (
      <div className="p-6 lg:p-8 space-y-6 bg-slate-50 min-h-screen">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-2xl mx-auto text-center space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-slate-900">My Attendance</h1>
            <p className="text-slate-500">Record your daily clock-in and clock-out times.</p>
          </div>

          <div className="p-8 bg-slate-900 text-white rounded-3xl inline-block shadow-xl shadow-slate-900/20">
            <div className="text-5xl font-black tracking-tighter tabular-nums">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className="text-sm font-bold text-slate-400 mt-2 uppercase tracking-widest">
              {currentTime.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {!myRecord?.check_in_time ? (
              <button
                onClick={handleSelfClockIn}
                className="w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-lg shadow-sm transition-all flex items-center justify-center gap-3 cursor-pointer"
              >
                <Clock className="w-6 h-6" /> Clock In Now
              </button>
            ) : !myRecord?.check_out_time ? (
              <div className="w-full space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl font-bold">
                  ✓ Clocked In at {myRecord.check_in_time}
                </div>
                <button
                  onClick={handleSelfClockOut}
                  className="w-full sm:w-auto px-8 py-4 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-lg shadow-sm transition-all flex items-center justify-center gap-3 cursor-pointer mx-auto"
                >
                  <Clock className="w-6 h-6" /> Clock Out Now
                </button>
              </div>
            ) : (
              <div className="w-full p-6 bg-slate-100 border border-slate-200 text-slate-700 rounded-2xl font-bold">
                ✓ Shift completed for today. <br/> 
                <span className="text-sm text-slate-500 font-medium">In: {myRecord.check_in_time} — Out: {myRecord.check_out_time}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-extrabold uppercase tracking-wider">Admin Secure</span>
            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-extrabold uppercase tracking-wider">Payroll Linked</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-2">Attendance & Departure Control</h1>
          <p className="text-xs text-slate-500 mt-0.5">Track daily check-ins, check-outs, late minutes, absences, and calculate automatic payroll deductions.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCheckInModal(true)}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Check-In</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 overflow-x-auto">
        {[
          { id: 'daily', label: 'Daily Attendance Sheet', icon: Clock },
          { id: 'monthly-report', label: 'Monthly Attendance Report', icon: Calendar },
          { id: 'settings', label: 'Attendance & Deduction Rules', icon: Shield }
        ].filter(tab => tab.id !== 'settings' || userRole === 'Administrator').map(tab => {
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

      {/* TAB 1: DAILY ATTENDANCE SHEET */}
      {activeTab === 'daily' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-700">Select Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800"
              />
            </div>
            <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search employee..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 pl-8 pr-3 text-xs outline-none focus:border-blue-500"
                />
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Employee ID & Name</th>
                  <th className="py-3 px-4 font-semibold">Department</th>
                  <th className="py-3 px-4 font-semibold">Check-In</th>
                  <th className="py-3 px-4 font-semibold">Check-Out</th>
                  <th className="py-3 px-4 font-semibold">Late Minutes</th>
                  <th className="py-3 px-4 font-semibold">Working Hours</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeEmployees
                  .filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()) || e.employee_id.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(emp => {
                    const record = todayRecordsMap.get(emp.id);
                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{emp.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{emp.employee_id}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{emp.department || emp.position}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          {record?.check_in_time || <span className="text-slate-300 font-normal">Not Checked In</span>}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          {record?.check_out_time || <span className="text-slate-300 font-normal">--:--</span>}
                        </td>
                        <td className="py-3 px-4">
                          {record && record.late_minutes > 0 ? (
                            <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded-full text-[10px] font-bold">
                              {record.late_minutes} mins late
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-semibold">On Time</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700">{record?.total_working_hours || '--'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                            record?.status === 'Present' ? 'bg-emerald-50 text-emerald-700' :
                            record?.status === 'Late' ? 'bg-amber-50 text-amber-700' :
                            record?.status === 'Absent' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {record?.status || 'Absent'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          {!record ? (
                            <button
                              onClick={() => {
                                setCheckInEmpId(emp.id);
                                setCheckInDate(selectedDate);
                                setCheckInTime(new Date().toTimeString().slice(0, 5));
                                setShowCheckInModal(true);
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl font-bold text-[11px] shadow-xs cursor-pointer"
                            >
                              Check-In
                            </button>
                          ) : !record.check_out_time ? (
                            <button
                              onClick={() => {
                                setActiveRecordForOut(record);
                                setCheckOutTime(new Date().toTimeString().slice(0, 5));
                                setShowCheckOutModal(true);
                              }}
                              className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-xl font-bold text-[11px] shadow-xs cursor-pointer"
                            >
                              Check-Out
                            </button>
                          ) : (
                            <span className="text-emerald-600 font-semibold text-[11px] flex items-center justify-end gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                            </span>
                          )}
                          {record && (
                            <>
                              <button
                                onClick={() => {
                                  setEditRecord(record);
                                  setShowEditModal(true);
                                }}
                                className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg inline-block"
                                title="Edit Record"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onDeleteAttendance(record.id)}
                                className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg inline-block"
                                title="Delete Record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* TAB 2: MONTHLY ATTENDANCE REPORT */}
      {activeTab === 'monthly-report' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Monthly Attendance Summary</h3>
              <p className="text-xs text-slate-500">Overview of present days, late minutes, absences and hours across active personnel.</p>
            </div>
            <div className="text-xs font-semibold text-slate-700">
              Total Active Employees: <strong className="text-blue-600">{activeEmployees.length}</strong>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Employee</th>
                  <th className="py-3 px-4 font-semibold">Department</th>
                  <th className="py-3 px-4 font-semibold text-center">Present Days</th>
                  <th className="py-3 px-4 font-semibold text-center">Late Days</th>
                  <th className="py-3 px-4 font-semibold text-center">Late Minutes</th>
                  <th className="py-3 px-4 font-semibold text-center">Absent Days</th>
                  <th className="py-3 px-4 font-semibold text-right">Attendance Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeEmployees.map(emp => {
                  const empRecords = attendanceRecords.filter(r => r.employee_id === emp.id);
                  const presentCount = empRecords.filter(r => r.status === 'Present' || r.status === 'Late').length;
                  const lateCount = empRecords.filter(r => r.status === 'Late').length;
                  const totalLateMins = empRecords.reduce((acc, r) => acc + (r.late_minutes || 0), 0);
                  const absentCount = empRecords.filter(r => r.status === 'Absent').length;
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-bold text-slate-900">{emp.name}</td>
                      <td className="py-3 px-4 text-slate-600">{emp.department}</td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-600">{presentCount}</td>
                      <td className="py-3 px-4 text-center font-bold text-amber-600">{lateCount}</td>
                      <td className="py-3 px-4 text-center font-bold text-rose-600">{totalLateMins}m</td>
                      <td className="py-3 px-4 text-center font-bold text-rose-700">{absentCount}</td>
                      <td className="py-3 px-4 text-right font-extrabold text-blue-600">
                        {presentCount > 0 ? ((presentCount / (presentCount + absentCount || 1)) * 100).toFixed(1) : 100}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ATTENDANCE & DEDUCTION SETTINGS */}
      {activeTab === 'settings' && (
        <div className="space-y-6 animate-in fade-in max-w-2xl mx-auto">
          <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs space-y-6">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-200">
              Official Shift & Payroll Deduction Rules
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Check-In Time</label>
                <input
                  type="time"
                  required
                  value={settingsForm.official_check_in}
                  onChange={(e) => setSettingsForm({ ...settingsForm, official_check_in: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Check-Out Time</label>
                <input
                  type="time"
                  required
                  value={settingsForm.official_check_out}
                  onChange={(e) => setSettingsForm({ ...settingsForm, official_check_out: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Grace Period (Minutes)</label>
                <input
                  type="number"
                  required
                  value={settingsForm.grace_period_minutes}
                  onChange={(e) => setSettingsForm({ ...settingsForm, grace_period_minutes: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Required Working Hours</label>
                <input
                  type="number"
                  required
                  value={settingsForm.required_working_hours}
                  onChange={(e) => setSettingsForm({ ...settingsForm, required_working_hours: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Absence Deduction Rule</label>
                <select
                  value={settingsForm.absence_deduction_type}
                  onChange={(e) => setSettingsForm({ ...settingsForm, absence_deduction_type: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                >
                  <option value="Deduct Daily Rate">Deduct Daily Rate (Salary / 26 days)</option>
                  <option value="No Deduction">No Deduction</option>
                  <option value="Custom Amount">Custom Amount</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Late Deduction Rule</label>
                <select
                  value={settingsForm.late_deduction_type}
                  onChange={(e) => setSettingsForm({ ...settingsForm, late_deduction_type: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                >
                  <option value="Per Minute">Per Minute Rate</option>
                  <option value="Per Late Day">Per Late Day Rate</option>
                  <option value="No Deduction">No Deduction</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-200">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-xs cursor-pointer"
              >
                Save Attendance & Deduction Rules
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CHECK-IN MODAL */}
      {showCheckInModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Record Employee Check-In</h3>
            <form onSubmit={handleManualCheckInSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Employee</label>
                <select
                  required
                  value={checkInEmpId}
                  onChange={(e) => setCheckInEmpId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                >
                  <option value="">-- Choose Employee --</option>
                  {activeEmployees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.employee_id})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Check-In Time</label>
                  <input
                    type="time"
                    required
                    value={checkInTime}
                    onChange={(e) => setCheckInTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCheckInModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs"
                >
                  Confirm Check-In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHECK-OUT MODAL */}
      {showCheckOutModal && activeRecordForOut && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Record Employee Check-Out</h3>
            <p className="text-xs text-slate-500 mb-4">
              Employee: <strong>{activeRecordForOut.employee_name}</strong> (Checked in at {activeRecordForOut.check_in_time})
            </p>
            <form onSubmit={handleCheckOutSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Check-Out Time</label>
                <input
                  type="time"
                  required
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCheckOutModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-xs"
                >
                  Confirm Check-Out
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && editRecord && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Edit Attendance Record</h3>
            <p className="text-xs text-slate-500 mb-4">
              Employee: <strong>{editRecord.employee_name}</strong> - {editRecord.date}
            </p>
            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Check-In Time</label>
                  <input
                    type="time"
                    required
                    value={editRecord.check_in_time}
                    onChange={(e) => setEditRecord({ ...editRecord, check_in_time: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Check-Out Time</label>
                  <input
                    type="time"
                    value={editRecord.check_out_time || ''}
                    onChange={(e) => setEditRecord({ ...editRecord, check_out_time: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditRecord(null);
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
