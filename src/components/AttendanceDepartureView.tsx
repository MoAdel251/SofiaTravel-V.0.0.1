import React, { useState, useMemo } from 'react';
import {
  Clock,
  Calendar,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  Shield,
  LogIn,
  LogOut,
  Users,
  Database,
  FileText,
  AlertCircle,
} from 'lucide-react';
import {
  AttendanceRecord,
  AttendanceLoginLog,
  WorkSchedule,
  AttendanceSettings,
  Employee,
  UserRole,
} from '../types';
import {
  calculateWorkingHours,
  formatWorkingHoursLabel,
  getPreviousTwoDaysDates,
  isAttendanceShiftOpen,
  normalizeTimeHHMM,
} from '../utils/attendance';
import { useLanguage } from '../context/LanguageContext';

interface AttendanceDepartureViewProps {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  loginLogs: AttendanceLoginLog[];
  workSchedules: WorkSchedule[];
  attendanceSettings?: AttendanceSettings | null;
  userRole: UserRole;
  currentUsername: string;
  currentEmpId?: string;
  isAdmin: boolean;
  isITAccount: boolean;
  todaySelfAttendance?: AttendanceRecord | null;
  onSelfClockIn?: () => void;
  onSelfClockOut?: () => void;
  onSaveManualAttendance?: (data: {
    id?: string;
    employee_id: string;
    employee_name: string;
    date: string;
    clock_in: string;
    clock_out?: string;
    notes?: string;
  }) => Promise<void> | void;
  onDeleteAttendance?: (id: string) => Promise<void> | void;
  onSyncFromDatabase?: () => Promise<void> | void;
}

type DatePreset = 'all' | 'previous_two_days' | 'today' | 'custom';
type ActiveSection = 'records' | 'login_logs' | 'schedules';

export function AttendanceDepartureView({
  employees,
  attendanceRecords,
  loginLogs,
  workSchedules,
  attendanceSettings,
  userRole,
  currentUsername,
  currentEmpId,
  isAdmin,
  isITAccount,
  todaySelfAttendance,
  onSelfClockIn,
  onSelfClockOut,
  onSaveManualAttendance,
  onDeleteAttendance,
  onSyncFromDatabase,
}: AttendanceDepartureViewProps) {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  // Both Administrator AND the "IT" developer account can view all employees' attendance & departure records
  const canViewAllEmployees = isAdmin || isITAccount || userRole === 'Administrator' || userRole === 'Manager';

  const prevTwoDaysInfo = useMemo(() => getPreviousTwoDaysDates(), []);
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [customFromDate, setCustomFromDate] = useState<string>(prevTwoDaysInfo.twoDaysAgo);
  const [customToDate, setCustomToDate] = useState<string>(prevTwoDaysInfo.today);
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState<string>('ALL');
  const [activeSection, setActiveSection] = useState<ActiveSection>('records');
  const [isSyncing, setIsSyncing] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  // IT Manual Clock-In / Clock-Out Modal State
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState<{
    id?: string;
    employee_id: string;
    employee_name: string;
    date: string;
    clock_in: string;
    clock_out: string;
    notes: string;
  }>({
    employee_id: '',
    employee_name: '',
    date: prevTwoDaysInfo.today,
    clock_in: '10:00',
    clock_out: '18:00',
    notes: '',
  });

  // Build employee roster from Firestore employees + attendance records
  const employeeOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    employees.forEach(emp => {
      const id = emp.id || emp.employee_id;
      const name = emp.name || emp.full_name || emp.username || id;
      if (id) map.set(id, { id, name });
    });
    attendanceRecords.forEach(rec => {
      const key = rec.employee_id || rec.employee_name;
      if (key && !map.has(key)) {
        const existsByName = Array.from(map.values()).some(
          e => e.name.toLowerCase() === (rec.employee_name || '').toLowerCase()
        );
        if (!existsByName) {
          map.set(key, { id: key, name: rec.employee_name || key });
        }
      }
    });
    return Array.from(map.values());
  }, [employees, attendanceRecords]);

  // Scope records: IT & Administrator view ALL employees; regular staff view their own records
  const accessibleRecords = useMemo(() => {
    if (canViewAllEmployees) return attendanceRecords;
    const myName = (currentUsername || '').trim().toLowerCase();
    const myId = (currentEmpId || '').trim();
    return attendanceRecords.filter(
      r =>
        (myId && r.employee_id === myId) ||
        (myName && (r.employee_name || '').trim().toLowerCase() === myName)
    );
  }, [attendanceRecords, canViewAllEmployees, currentUsername, currentEmpId]);

  const accessibleLoginLogs = useMemo(() => {
    if (canViewAllEmployees) return loginLogs;
    const myName = (currentUsername || '').trim().toLowerCase();
    const myId = (currentEmpId || '').trim();
    return loginLogs.filter(
      l =>
        (myId && (l.employee_id === myId || l.record_id === myId)) ||
        (myName && (l.employee_name || '').trim().toLowerCase() === myName)
    );
  }, [loginLogs, canViewAllEmployees, currentUsername, currentEmpId]);

  // Previous Two Days records & login events retrieved directly from Cloud Firestore
  const previousTwoDaysAttendance = useMemo(() => {
    const [d1, d2] = prevTwoDaysInfo.dates;
    return accessibleRecords
      .filter(r => r.date === d1 || r.date === d2)
      .sort((a, b) => `${b.date} ${b.clock_in}`.localeCompare(`${a.date} ${a.clock_in}`));
  }, [accessibleRecords, prevTwoDaysInfo]);

  const previousTwoDaysLogins = useMemo(() => {
    const [d1, d2] = prevTwoDaysInfo.dates;
    return accessibleLoginLogs.filter(l => l.date === d1 || l.date === d2);
  }, [accessibleLoginLogs, prevTwoDaysInfo]);

  // Filtered Attendance Records based on active date preset & employee selector
  const filteredAttendance = useMemo(() => {
    return [...accessibleRecords]
      .filter(rec => {
        if (datePreset === 'previous_two_days') {
          if (!prevTwoDaysInfo.dates.includes(rec.date)) return false;
        } else if (datePreset === 'today') {
          if (rec.date !== prevTwoDaysInfo.today) return false;
        } else if (datePreset === 'custom') {
          if (customFromDate && rec.date < customFromDate) return false;
          if (customToDate && rec.date > customToDate) return false;
        }

        if (selectedEmployeeFilter !== 'ALL') {
          const targetOpt = employeeOptions.find(o => o.id === selectedEmployeeFilter);
          const matchesId = rec.employee_id === selectedEmployeeFilter;
          const matchesName =
            targetOpt &&
            (rec.employee_name || '').trim().toLowerCase() === targetOpt.name.trim().toLowerCase();
          if (!matchesId && !matchesName) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const keyA = `${a.date || ''} ${a.clock_in || a.check_in_time || ''}`;
        const keyB = `${b.date || ''} ${b.clock_in || b.check_in_time || ''}`;
        return keyB.localeCompare(keyA);
      });
  }, [
    accessibleRecords,
    datePreset,
    prevTwoDaysInfo,
    customFromDate,
    customToDate,
    selectedEmployeeFilter,
    employeeOptions,
  ]);

  // Filtered Employee Log-In & Departure Logs
  const filteredLoginLogs = useMemo(() => {
    return [...accessibleLoginLogs].filter(log => {
      if (datePreset === 'previous_two_days') {
        if (!prevTwoDaysInfo.dates.includes(log.date)) return false;
      } else if (datePreset === 'today') {
        if (log.date !== prevTwoDaysInfo.today) return false;
      } else if (datePreset === 'custom') {
        if (customFromDate && log.date < customFromDate) return false;
        if (customToDate && log.date > customToDate) return false;
      }

      if (selectedEmployeeFilter !== 'ALL') {
        const targetOpt = employeeOptions.find(o => o.id === selectedEmployeeFilter);
        const matchesId =
          log.employee_id === selectedEmployeeFilter || log.record_id === selectedEmployeeFilter;
        const matchesName =
          targetOpt &&
          (log.employee_name || '').trim().toLowerCase() === targetOpt.name.trim().toLowerCase();
        if (!matchesId && !matchesName) return false;
      }
      return true;
    });
  }, [
    accessibleLoginLogs,
    datePreset,
    prevTwoDaysInfo,
    customFromDate,
    customToDate,
    selectedEmployeeFilter,
    employeeOptions,
  ]);

  const totalHoursFiltered = useMemo(() => {
    return (
      Math.round(
        filteredAttendance.reduce((acc, rec) => {
          const inT = rec.clock_in || rec.check_in_time;
          const outT = rec.clock_out || rec.check_out_time;
          if (!outT || outT === '--') return acc;
          const calc = calculateWorkingHours(inT, outT);
          return acc + (rec.working_hours || calc.working_hours || 0);
        }, 0) * 100
      ) / 100
    );
  }, [filteredAttendance]);

  const openShiftsCount = useMemo(
    () => accessibleRecords.filter(r => isAttendanceShiftOpen(r)).length,
    [accessibleRecords]
  );

  const previewCalc = useMemo(
    () => calculateWorkingHours(manualForm.clock_in, manualForm.clock_out || undefined),
    [manualForm.clock_in, manualForm.clock_out]
  );

  const handleRetrieveFromDatabase = async (focusPreviousTwoDays = false) => {
    setIsSyncing(true);
    try {
      if (onSyncFromDatabase) {
        await onSyncFromDatabase();
      }
      if (focusPreviousTwoDays) {
        setDatePreset('previous_two_days');
      }
      setBannerMessage(
        isAr
          ? `تم استرجاع ومزامنة بيانات الحضور والانصراف وتسجيل الدخول لليومين السابقين (${prevTwoDaysInfo.twoDaysAgo} و ${prevTwoDaysInfo.yesterday}) وجميع السجلات من قاعدة البيانات بنجاح.`
          : `Successfully retrieved attendance, departure, and log-in records for the previous two days (${prevTwoDaysInfo.twoDaysAgo} & ${prevTwoDaysInfo.yesterday}) and all dates from Cloud Firestore.`
      );
      setTimeout(() => setBannerMessage(null), 5000);
    } finally {
      setIsSyncing(false);
    }
  };

  const openManualModal = (existing?: AttendanceRecord) => {
    if (existing) {
      const inTime = existing.clock_in || existing.check_in_time || '10:00';
      const outTime = existing.clock_out || existing.check_out_time || '';
      setManualForm({
        id: existing.id,
        employee_id: existing.employee_id,
        employee_name: existing.employee_name,
        date: existing.date,
        clock_in: normalizeTimeHHMM(inTime) || inTime || '10:00',
        clock_out: outTime && outTime !== '--' ? (normalizeTimeHHMM(outTime) || outTime) : '',
        notes: existing.notes || '',
      });
    } else {
      const firstEmp = employeeOptions[0];
      const existingToday = firstEmp
        ? accessibleRecords.find(
            r =>
              (r.employee_id === firstEmp.id || r.employee_name === firstEmp.name) &&
              r.date === prevTwoDaysInfo.today
          )
        : undefined;
      setManualForm({
        id: existingToday?.id,
        employee_id: firstEmp?.id || '',
        employee_name: firstEmp?.name || '',
        date: prevTwoDaysInfo.today,
        clock_in: existingToday
          ? normalizeTimeHHMM(existingToday.clock_in || existingToday.check_in_time) || '10:00'
          : '10:00',
        clock_out:
          existingToday && (existingToday.clock_out || existingToday.check_out_time)
            ? normalizeTimeHHMM(existingToday.clock_out || existingToday.check_out_time)
            : '18:00',
        notes: existingToday?.notes || '',
      });
    }
    setShowManualModal(true);
  };

  const handleManualEmpOrDateChange = (empId: string, dateVal: string) => {
    const selectedEmp = employeeOptions.find(o => o.id === empId);
    const empName = selectedEmp?.name || manualForm.employee_name;
    const match = accessibleRecords.find(
      r =>
        (r.employee_id === empId || (empName && r.employee_name === empName)) &&
        r.date === dateVal
    );
    if (match) {
      const inT = match.clock_in || match.check_in_time || '10:00';
      const outT = match.clock_out || match.check_out_time || '';
      setManualForm(prev => ({
        ...prev,
        id: match.id,
        employee_id: empId,
        employee_name: match.employee_name || empName,
        date: dateVal,
        clock_in: normalizeTimeHHMM(inT) || inT || prev.clock_in,
        clock_out: outT && outT !== '--' ? (normalizeTimeHHMM(outT) || outT) : '',
        notes: match.notes || '',
      }));
    } else {
      setManualForm(prev => ({
        ...prev,
        id: undefined,
        employee_id: empId,
        employee_name: empName,
        date: dateVal,
      }));
    }
  };

  const handleSubmitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isITAccount || !onSaveManualAttendance) return;
    const targetEmp = employeeOptions.find(o => o.id === manualForm.employee_id);
    const empName = targetEmp?.name || manualForm.employee_name || 'Employee';
    await onSaveManualAttendance({
      id: manualForm.id,
      employee_id: manualForm.employee_id || empName,
      employee_name: empName,
      date: manualForm.date,
      clock_in: manualForm.clock_in,
      clock_out: manualForm.clock_out || undefined,
      notes: manualForm.notes,
    });
    setShowManualModal(false);
    setBannerMessage(
      isAr
        ? `تم حفظ سجل حضور وانصراف ${empName} (${manualForm.date}) — ساعات العمل المحسوبة: ${previewCalc.working_hours_formatted}`
        : `Saved attendance & departure for ${empName} (${manualForm.date}) — Calculated working hours: ${previewCalc.working_hours_formatted}`
    );
    setTimeout(() => setBannerMessage(null), 4500);
  };

  const selfShiftOpen = isAttendanceShiftOpen(todaySelfAttendance);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-50 min-h-screen">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-extrabold uppercase tracking-wider">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              {isAr ? 'مرتبط بقاعدة البيانات السحابية' : 'Live Cloud Database Records'}
            </span>
            {(isAdmin || isITAccount) && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 text-cyan-300 rounded-lg text-[11px] font-extrabold uppercase tracking-wider">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                {isITAccount
                  ? isAr
                    ? 'صلاحية عرض كاملة لحساب المطور (IT) مثل المدير'
                    : 'IT Developer Full View & Management Access'
                  : isAr
                  ? 'صلاحية المدير العام لعرض جميع السجلات'
                  : 'Administrator Full Records Access'}
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            {isAr
              ? 'صفحة الحضور والانصراف وسجلات تسجيل الدخول'
              : 'Employee Attendance, Departure & Log-In Records'}
          </h1>
          <p className="text-xs text-slate-500">
            {isAr
              ? `عرض جميع بيانات وتواريخ وسجلات حضور وانصراف الموظفين وتسجيل الدخول المسترجعة من قاعدة البيانات (بما في ذلك اليومين السابقين: ${prevTwoDaysInfo.twoDaysAgo} و ${prevTwoDaysInfo.yesterday}).`
              : `Complete history of employee check-in, check-out, working hours, and system log-in records retrieved from Firestore (including previous two days: ${prevTwoDaysInfo.twoDaysAgo} & ${prevTwoDaysInfo.yesterday}).`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Retrieve Previous 2 Days & Sync DB Button */}
          <button
            type="button"
            onClick={() => handleRetrieveFromDatabase(true)}
            disabled={isSyncing}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer min-h-[42px] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>
              {isAr
                ? 'استرجاع بيانات اليومين السابقين من قاعدة البيانات'
                : 'Retrieve Previous 2 Days Data'}
            </span>
          </button>

          {/* Self Check-In / Check-Out */}
          {(onSelfClockIn || onSelfClockOut) &&
            (selfShiftOpen ? (
              <button
                type="button"
                onClick={onSelfClockOut}
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer min-h-[42px]"
              >
                <LogOut className="w-4 h-4" />
                <span>
                  {isAr
                    ? `تسجيل انصراف الآن (${todaySelfAttendance?.clock_in || todaySelfAttendance?.check_in_time})`
                    : `Check Out Now (In: ${todaySelfAttendance?.clock_in || todaySelfAttendance?.check_in_time})`}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onSelfClockIn}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer min-h-[42px]"
              >
                <LogIn className="w-4 h-4" />
                <span>{isAr ? 'تسجيل حضور الآن' : 'Check In Now'}</span>
              </button>
            ))}

          {/* IT Developer Manual Time Entry */}
          {isITAccount && onSaveManualAttendance && (
            <button
              type="button"
              onClick={() => openManualModal()}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer min-h-[42px]"
            >
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>
                {isAr ? 'إضافة / تعديل وقت حضور وانصراف (IT)' : 'Manual Check-In / Out (IT)'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback Banner */}
      {bannerMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2.5">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{bannerMessage}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => setDatePreset(datePreset === 'previous_two_days' ? 'all' : 'previous_two_days')}
          className={`p-4 rounded-2xl border text-start transition-all cursor-pointer ${
            datePreset === 'previous_two_days'
              ? 'bg-indigo-950 text-white border-indigo-700 shadow-md'
              : 'bg-white text-slate-900 border-slate-200 hover:border-indigo-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-extrabold uppercase tracking-wider ${
                datePreset === 'previous_two_days' ? 'text-indigo-300' : 'text-indigo-600'
              }`}
            >
              {isAr ? 'بيانات اليومين السابقين' : 'Previous Two Days Data'}
            </span>
            <Calendar
              className={`w-4 h-4 ${
                datePreset === 'previous_two_days' ? 'text-indigo-300' : 'text-indigo-600'
              }`}
            />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black">{previousTwoDaysAttendance.length}</span>
            <span
              className={`text-xs font-semibold ${
                datePreset === 'previous_two_days' ? 'text-indigo-200' : 'text-slate-500'
              }`}
            >
              {isAr
                ? `سجل حضور + ${previousTwoDaysLogins.length} عملية دخول/انصراف`
                : `shifts + ${previousTwoDaysLogins.length} log-in/out logs`}
            </span>
          </div>
          <div
            className={`text-[11px] font-mono mt-1 ${
              datePreset === 'previous_two_days' ? 'text-indigo-300' : 'text-slate-400'
            }`}
          >
            {prevTwoDaysInfo.twoDaysAgo} &bull; {prevTwoDaysInfo.yesterday}
          </div>
        </button>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600">
              {isAr ? 'إجمالي سجلات الحضور والانصراف' : 'Total Attendance Records'}
            </span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{accessibleRecords.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {isAr
              ? `معروض حالياً: ${filteredAttendance.length} سجل`
              : `Currently showing ${filteredAttendance.length} records`}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600">
              {isAr ? 'متواجدون بالعمل حالياً' : 'Active Open Shifts'}
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{openShiftsCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {isAr
              ? `تاريخ اليوم: ${prevTwoDaysInfo.today}`
              : `Today (${prevTwoDaysInfo.today})`}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-700">
              {isAr ? 'إجمالي ساعات العمل المحسوبة' : 'Calculated Working Hours'}
            </span>
            <FileText className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {totalHoursFiltered.toFixed(2)} {isAr ? 'ساعة' : 'hrs'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {isAr
              ? `${filteredLoginLogs.length} سجل دخول وانصراف مرتبط`
              : `${filteredLoginLogs.length} retrieved log-in / departure events`}
          </div>
        </div>
      </div>

      {/* Filters & Quick Date Range Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-slate-500 me-1">
            {isAr ? 'نطاق التاريخ:' : 'Date View:'}
          </span>
          <button
            type="button"
            onClick={() => setDatePreset('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
              datePreset === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {isAr ? 'كل التواريخ' : 'All Dates'}
          </button>
          <button
            type="button"
            onClick={() => setDatePreset('previous_two_days')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              datePreset === 'previous_two_days'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {isAr
                ? `اليومين السابقين (${prevTwoDaysInfo.twoDaysAgo} & ${prevTwoDaysInfo.yesterday})`
                : `Previous Two Days (${prevTwoDaysInfo.twoDaysAgo} & ${prevTwoDaysInfo.yesterday})`}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setDatePreset('today')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
              datePreset === 'today'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {isAr ? `اليوم (${prevTwoDaysInfo.today})` : `Today (${prevTwoDaysInfo.today})`}
          </button>
          <button
            type="button"
            onClick={() => setDatePreset('custom')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
              datePreset === 'custom'
                ? 'bg-cyan-700 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {isAr ? 'تاريخ مخصص' : 'Custom Range'}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {datePreset === 'custom' && (
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-[11px] font-bold text-slate-500">
                {isAr ? 'من:' : 'From:'}
              </label>
              <input
                type="date"
                value={customFromDate}
                onChange={e => setCustomFromDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-mono font-semibold text-slate-800"
              />
              <label className="text-[11px] font-bold text-slate-500">
                {isAr ? 'إلى:' : 'To:'}
              </label>
              <input
                type="date"
                value={customToDate}
                onChange={e => setCustomToDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-mono font-semibold text-slate-800"
              />
            </div>
          )}

          {canViewAllEmployees && (
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-bold text-slate-500">
                {isAr ? 'الموظف:' : 'Employee:'}
              </label>
              <select
                value={selectedEmployeeFilter}
                onChange={e => setSelectedEmployeeFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-800"
              >
                <option value="ALL">{isAr ? 'جميع الموظفين' : 'All Employees'}</option>
                {employeeOptions.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Sub-Navigation Tabs: 1) Attendance & Departure Records  2) Log-In & Log-Out Logs  3) Work Schedules */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveSection('records')}
          className={`px-4 py-3 font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeSection === 'records'
              ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-xl shadow-xs'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4 text-emerald-600" />
          <span>
            {isAr
              ? `سجلات الحضور والانصراف (${filteredAttendance.length})`
              : `Attendance & Departure Records (${filteredAttendance.length})`}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('login_logs')}
          className={`px-4 py-3 font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeSection === 'login_logs'
              ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-xl shadow-xs'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <LogIn className="w-4 h-4 text-indigo-600" />
          <span>
            {isAr
              ? `سجلات تسجيل الدخول والانصراف (${filteredLoginLogs.length})`
              : `Employee Log-In & Departure Logs (${filteredLoginLogs.length})`}
          </span>
        </button>

        {workSchedules.length > 0 && (
          <button
            type="button"
            onClick={() => setActiveSection('schedules')}
            className={`px-4 py-3 font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeSection === 'schedules'
                ? 'border-cyan-600 text-cyan-700 bg-white rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4 text-cyan-600" />
            <span>
              {isAr
                ? `مواعيد العمل الرسمية (${workSchedules.length})`
                : `Official Work Schedules (${workSchedules.length})`}
            </span>
          </button>
        )}
      </div>

      {/* SECTION 1: ATTENDANCE & DEPARTURE RECORDS TABLE */}
      {activeSection === 'records' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 font-semibold text-start">{isAr ? 'التاريخ' : 'Date'}</th>
                  <th className="py-3.5 px-4 font-semibold text-start">{isAr ? 'الموظف' : 'Employee'}</th>
                  <th className="py-3.5 px-4 font-semibold text-start">{isAr ? 'تسجيل الدخول' : 'System Log-In'}</th>
                  <th className="py-3.5 px-4 font-semibold text-start">{isAr ? 'وقت الحضور' : 'Check-In Time'}</th>
                  <th className="py-3.5 px-4 font-semibold text-start">{isAr ? 'وقت الانصراف' : 'Departure Time'}</th>
                  <th className="py-3.5 px-4 font-semibold text-start">{isAr ? 'عدد ساعات العمل' : 'Working Hours'}</th>
                  <th className="py-3.5 px-4 font-semibold text-start">{isAr ? 'الحالة / التأخير' : 'Status / Late'}</th>
                  {isITAccount && (
                    <th className="py-3.5 px-4 font-semibold text-end">{isAr ? 'إجراءات IT' : 'IT Actions'}</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAttendance.length === 0 ? (
                  <tr>
                    <td colSpan={isITAccount ? 8 : 7} className="py-12 text-center text-slate-400">
                      <AlertCircle className="w-7 h-7 mx-auto mb-2 text-slate-300" />
                      <p className="font-bold text-slate-600">
                        {isAr
                          ? 'لا توجد سجلات مطابقة لعامل التصفية المحدد.'
                          : 'No attendance or departure records match the selected filter.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredAttendance.map(rec => {
                    const checkIn = rec.clock_in || rec.check_in_time || '';
                    const rawOut = rec.clock_out || rec.check_out_time || '';
                    const checkOut = rawOut === '--' ? '' : rawOut;
                    const shiftOpen = isAttendanceShiftOpen(rec);
                    const computed = calculateWorkingHours(checkIn, checkOut || undefined);
                    const hoursNum = !shiftOpen ? rec.working_hours || computed.working_hours : 0;
                    const hoursFmt = !shiftOpen
                      ? rec.working_hours_formatted || rec.total_working_hours || computed.working_hours_formatted
                      : undefined;
                    const isPrevTwoDays = prevTwoDaysInfo.dates.includes(rec.date);
                    const lateMins = Number(rec.late_minutes) || 0;

                    return (
                      <tr
                        key={rec.id}
                        className={`hover:bg-slate-50/90 transition-colors ${
                          isPrevTwoDays && datePreset === 'previous_two_days' ? 'bg-indigo-50/30' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-900">{rec.date}</span>
                            {isPrevTwoDays && (
                              <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[9px] font-bold">
                                {rec.date === prevTwoDaysInfo.yesterday
                                  ? isAr
                                    ? 'أمس'
                                    : 'Yesterday'
                                  : isAr
                                  ? 'أول أمس'
                                  : '2 Days Ago'}
                              </span>
                            )}
                          </div>
                          <span className="block text-[10px] font-mono text-slate-400">
                            {rec.attendance_id || rec.id}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900 block">{rec.employee_name}</span>
                          {rec.employee_id && (
                            <span className="text-[10px] font-mono text-slate-400">{rec.employee_id}</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-indigo-700 font-semibold">
                          {rec.login_time || checkIn || '-'}
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                          {checkIn || '-'}
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                          {checkOut ? (
                            checkOut
                          ) : (
                            <span className="text-amber-600 font-sans font-semibold">
                              {isAr ? 'متواجد حالياً...' : 'Active Shift...'}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {!shiftOpen && checkOut ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold">
                              <Clock className="w-3.5 h-3.5 text-emerald-600" />
                              {formatWorkingHoursLabel(hoursNum, hoursFmt, isAr)}
                            </span>
                          ) : (
                            <span className="text-amber-600 font-semibold">
                              {isAr ? 'قيد العمل (لم ينصرف بعد)' : 'On Duty (Awaiting Check-Out)'}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                shiftOpen
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {shiftOpen
                                ? isAr
                                  ? 'حاضر الآن'
                                  : 'Checked In'
                                : isAr
                                ? 'مكتمل'
                                : 'Completed'}
                            </span>

                            {(rec.attendance_status === 'Late' || lateMins > 0) ? (
                              <span className="px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold">
                                {isAr ? `تأخير ${lateMins} د` : `Late ${lateMins}m`}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 text-[10px] font-bold">
                                {isAr ? 'منتظم' : 'On Time'}
                              </span>
                            )}

                            {rec.entry_source === 'IT Manual' && (
                              <span className="px-2 py-0.5 rounded-md bg-slate-900 text-cyan-300 text-[10px] font-bold">
                                {isAr ? 'معدل بواسطة IT' : 'IT Manual'}
                              </span>
                            )}
                          </div>
                        </td>

                        {isITAccount && (
                          <td className="py-3.5 px-4 text-end">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openManualModal(rec)}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>{isAr ? 'تعديل' : 'Edit'}</span>
                              </button>
                              {onDeleteAttendance && (
                                <button
                                  type="button"
                                  onClick={() => onDeleteAttendance(rec.id)}
                                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                                  title={isAr ? 'حذف السجل' : 'Delete Record'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 2: EMPLOYEE LOG-IN & DEPARTURE ACTIVITY LOGS (Retrieved from Firestore) */}
      {activeSection === 'login_logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="font-bold text-slate-800">
              {isAr
                ? 'سجل عمليات تسجيل الدخول والانصراف المسترجع من قاعدة البيانات السحابية'
                : 'Employee System Log-In, Check-In & Check-Out Audit Trail (Cloud Database)'}
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              {isAr
                ? `إجمالي الأحداث المعروضة: ${filteredLoginLogs.length}`
                : `Total Events Shown: ${filteredLoginLogs.length}`}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold text-start">{isAr ? 'التاريخ' : 'Date'}</th>
                  <th className="py-3 px-4 font-semibold text-start">{isAr ? 'الوقت' : 'Time'}</th>
                  <th className="py-3 px-4 font-semibold text-start">{isAr ? 'الموظف' : 'Employee'}</th>
                  <th className="py-3 px-4 font-semibold text-start">{isAr ? 'نوع العملية' : 'Event Type'}</th>
                  <th className="py-3 px-4 font-semibold text-start">{isAr ? 'التفاصيل المسجلة' : 'Recorded Details'}</th>
                  <th className="py-3 px-4 font-semibold text-start">{isAr ? 'مرجع السجل' : 'Record ID'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLoginLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      {isAr
                        ? 'لا توجد سجلات تسجيل دخول في هذا النطاق الزمني.'
                        : 'No employee log-in or departure logs found for this filter.'}
                    </td>
                  </tr>
                ) : (
                  filteredLoginLogs.map(log => {
                    const lower = `${log.action} ${log.details}`.toLowerCase();
                    const isLogin =
                      lower.includes('log in') ||
                      lower.includes('logged in') ||
                      lower.includes('clocked in');
                    const isLogout =
                      lower.includes('log out') ||
                      lower.includes('logged out') ||
                      lower.includes('clocked out');
                    return (
                      <tr key={log.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">{log.date || '-'}</td>
                        <td className="py-3 px-4 font-mono font-bold text-indigo-700">{log.time || '-'}</td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900">{log.employee_name}</span>
                          {log.user_role && (
                            <span className="ms-2 px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold">
                              {log.user_role}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                              isLogin
                                ? 'bg-emerald-100 text-emerald-800'
                                : isLogout
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isLogin ? (
                              <>
                                <LogIn className="w-3 h-3" />
                                <span>{isAr ? 'تسجيل دخول / حضور' : 'Log In / Check-In'}</span>
                              </>
                            ) : isLogout ? (
                              <>
                                <LogOut className="w-3 h-3" />
                                <span>{isAr ? 'تسجيل خروج / انصراف' : 'Log Out / Departure'}</span>
                              </>
                            ) : (
                              <span>{log.action}</span>
                            )}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium">{log.details}</td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                          {log.record_id || log.id}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 3: OFFICIAL WORK SCHEDULES */}
      {activeSection === 'schedules' && (
        <div className="space-y-4">
          {attendanceSettings && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
              <div>
                <h3 className="font-black text-slate-900 text-sm">
                  {isAr ? 'إعدادات الدوام الرسمي المعتمدة' : 'Default Company Attendance Policy'}
                </h3>
                <p className="text-slate-500 mt-0.5">
                  {isAr
                    ? `بداية الدوام: ${attendanceSettings.default_start_time} • نهاية الدوام: ${attendanceSettings.default_end_time} • فترة السماح: ${attendanceSettings.default_grace_period_minutes} دقيقة`
                    : `Official Shift: ${attendanceSettings.default_start_time} – ${attendanceSettings.default_end_time} • Grace Period: ${attendanceSettings.default_grace_period_minutes} mins`}
                </p>
              </div>
              {attendanceSettings.auto_record_on_login && (
                <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl font-bold">
                  {isAr ? 'التسجيل التلقائي مع الدخول مفعل' : 'Auto-Record on Employee Login Enabled'}
                </span>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {workSchedules.map(ws => (
              <div
                key={ws.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-900 text-sm">{ws.employee_name}</span>
                  <span className="font-mono text-[10px] text-slate-400">{ws.employee_id}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-700 font-mono font-bold">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700">
                    {ws.start_time}
                  </span>
                  <span>→</span>
                  <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700">{ws.end_time}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  {isAr
                    ? `فترة السماح: ${ws.grace_period_minutes} دقيقة`
                    : `Grace Period: ${ws.grace_period_minutes} mins`}
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  {(ws.working_days || []).map(day => (
                    <span
                      key={day}
                      className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold"
                    >
                      {day}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* IT Developer Manual Clock-In / Clock-Out Modal */}
      {showManualModal && isITAccount && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="px-2 py-0.5 bg-slate-900 text-cyan-300 rounded text-[10px] font-extrabold uppercase">
                  IT Developer Account
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  {isAr
                    ? 'إضافة / تعديل وقت حضور وانصراف موظف يدوياً'
                    : 'Manual Employee Check-In / Check-Out Entry'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitManual} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isAr ? 'اختر الموظف *' : 'Select Employee *'}
                </label>
                <select
                  required
                  value={manualForm.employee_id}
                  onChange={e => handleManualEmpOrDateChange(e.target.value, manualForm.date)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-bold text-slate-900"
                >
                  {employeeOptions.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isAr ? 'التاريخ *' : 'Date *'}
                </label>
                <input
                  type="date"
                  required
                  value={manualForm.date}
                  onChange={e => handleManualEmpOrDateChange(manualForm.employee_id, e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isAr ? 'وقت الحضور *' : 'Check-In Time *'}
                  </label>
                  <input
                    type="time"
                    required
                    value={manualForm.clock_in}
                    onChange={e => setManualForm(prev => ({ ...prev, clock_in: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono font-bold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isAr ? 'وقت الانصراف' : 'Check-Out Time'}
                  </label>
                  <input
                    type="time"
                    value={manualForm.clock_out}
                    onChange={e => setManualForm(prev => ({ ...prev, clock_out: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono font-bold text-blue-700"
                  />
                </div>
              </div>

              {/* Automatic Working Hours Calculation Preview */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <span className="font-bold text-emerald-900">
                  {isAr ? 'عدد ساعات العمل المحسوبة:' : 'Calculated Working Hours:'}
                </span>
                <span className="font-extrabold text-sm text-emerald-700 font-mono">
                  {manualForm.clock_out
                    ? `${previewCalc.working_hours_formatted} (${previewCalc.working_hours.toFixed(2)} hrs)`
                    : isAr
                    ? 'وردية مفتوحة (بدون انصراف)'
                    : 'Open Shift (No Check-Out)'}
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isAr ? 'ملاحظات (اختياري)' : 'Notes (Optional)'}
                </label>
                <input
                  type="text"
                  value={manualForm.notes}
                  onChange={e => setManualForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder={isAr ? 'ملاحظة على السجل...' : 'Optional note...'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 font-bold shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{isAr ? 'حفظ وحساب الساعات' : 'Save & Calculate Hours'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
