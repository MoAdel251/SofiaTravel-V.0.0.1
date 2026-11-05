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
  RotateCcw,
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
  onResetAttendanceTime?: (id: string, target: 'clock_in' | 'clock_out' | 'both') => Promise<void> | void;
  onDeleteAttendance?: (id: string) => Promise<void> | void;
  onSaveWorkSchedule?: (schedule: Partial<WorkSchedule>) => Promise<void> | void;
  onSaveAttendanceSettings?: (settings: Partial<AttendanceSettings>) => Promise<void> | void;
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
  onResetAttendanceTime,
  onDeleteAttendance,
  onSaveWorkSchedule,
  onSaveAttendanceSettings,
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
  const [resetModalRecord, setResetModalRecord] = useState<AttendanceRecord | null>(null);
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

  // Both Developer (IT) AND Administrator have authority to adjust work schedules & grace periods
  const canAdjustSchedules = isAdmin || isITAccount || userRole === 'Administrator';

  // IT-controlled visibility: tardiness only appears once explicitly enabled, and the
  // platform/system login timestamp can be hidden so only manual clock times are used.
  const tardinessEnabled = attendanceSettings?.track_tardiness === true;
  const showSystemLoginTime =
    isAdmin || isITAccount || attendanceSettings?.show_system_login_time === true;

  // Work Schedule & Grace Period Modal State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<WorkSchedule | null>(null);
  const [scheduleForm, setScheduleForm] = useState<{
    id?: string;
    employee_id: string;
    employee_name: string;
    start_time: string;
    end_time: string;
    grace_period_minutes: number;
    working_days: string[];
  }>({
    employee_id: '',
    employee_name: '',
    start_time: '09:00',
    end_time: '17:00',
    grace_period_minutes: 15,
    working_days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'],
  });

  const [showCompanySettingsModal, setShowCompanySettingsModal] = useState(false);
  const [companySettingsForm, setCompanySettingsForm] = useState<{
    default_start_time: string;
    default_end_time: string;
    default_grace_period_minutes: number;
    track_tardiness: boolean;
    show_system_login_time: boolean;
    calendar_reminder_time: string;
  }>({
    default_start_time: attendanceSettings?.default_start_time || '09:00',
    default_end_time: attendanceSettings?.default_end_time || '17:00',
    default_grace_period_minutes: attendanceSettings?.default_grace_period_minutes ?? 15,
    track_tardiness: attendanceSettings?.track_tardiness === true,
    show_system_login_time: attendanceSettings?.show_system_login_time === true,
    calendar_reminder_time: attendanceSettings?.calendar_reminder_time || '09:00',
  });

  // Calculate current site login time for Requirement 2
  const currentLoginLogToday = useMemo(() => {
    const myName = (currentUsername || '').trim().toLowerCase();
    const myId = (currentEmpId || '').trim();
    return loginLogs.find(
      l =>
        l.date === prevTwoDaysInfo.today &&
        ((myId && (l.employee_id === myId || l.record_id === myId)) ||
          (myName && (l.employee_name || '').trim().toLowerCase() === myName)) &&
        String(l.action || l.details).toLowerCase().includes('log in')
    );
  }, [loginLogs, currentUsername, currentEmpId, prevTwoDaysInfo.today]);

  const displaySiteLoginTime =
    todaySelfAttendance?.login_time ||
    todaySelfAttendance?.clock_in ||
    todaySelfAttendance?.check_in_time ||
    currentLoginLogToday?.time ||
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Manual times are the authoritative reference for employees when IT hides the system login time.
  const manualClockInTime =
    todaySelfAttendance?.clock_in || todaySelfAttendance?.check_in_time || '';
  const sessionReferenceTime =
    showSystemLoginTime && displaySiteLoginTime
      ? displaySiteLoginTime
      : manualClockInTime || displaySiteLoginTime;

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

  const totalOvertimeFiltered = useMemo(
    () =>
      filteredAttendance.reduce(
        (acc, rec) => acc + (Number(rec.overtime_minutes) || 0),
        0
      ),
    [filteredAttendance]
  );

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

  const handleConfirmResetTime = async (rec: AttendanceRecord, target: 'clock_in' | 'clock_out' | 'both') => {
    if (!isITAccount || !onResetAttendanceTime) return;
    await onResetAttendanceTime(rec.id, target);
    setResetModalRecord(null);
    setShowManualModal(false);
    setBannerMessage(
      target === 'clock_out'
        ? isAr
          ? `تمت إعادة ضبط وقت الانصراف للموظف ${rec.employee_name} (${rec.date}) — يمكن للموظف الآن تسجيل الانصراف بشكل طبيعي.`
          : `Reset departure time for ${rec.employee_name} (${rec.date}) — employee can now clock out normally.`
        : target === 'clock_in'
        ? isAr
          ? `تمت إعادة ضبط وقت الحضور للموظف ${rec.employee_name} (${rec.date}) — يمكن للموظف الآن تسجيل الحضور بشكل طبيعي.`
          : `Reset check-in time for ${rec.employee_name} (${rec.date}) — employee can now clock in normally.`
        : isAr
        ? `تمت إعادة ضبط وقتي الحضور والانصراف للموظف ${rec.employee_name} (${rec.date}) — يمكن للموظف الآن التسجيل بشكل طبيعي.`
        : `Reset check-in & departure times for ${rec.employee_name} (${rec.date}) — employee can now clock in and out normally.`
    );
    setTimeout(() => setBannerMessage(null), 5000);
  };

  const handleOpenScheduleModal = (existing?: WorkSchedule) => {
    if (existing) {
      setEditingSchedule(existing);
      setScheduleForm({
        id: existing.id,
        employee_id: existing.employee_id,
        employee_name: existing.employee_name,
        start_time: existing.start_time || '09:00',
        end_time: existing.end_time || '17:00',
        grace_period_minutes: existing.grace_period_minutes ?? 15,
        working_days: existing.working_days || ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'],
      });
    } else {
      const firstEmp = employeeOptions[0];
      setEditingSchedule(null);
      setScheduleForm({
        employee_id: firstEmp?.id || '',
        employee_name: firstEmp?.name || '',
        start_time: attendanceSettings?.default_start_time || '09:00',
        end_time: attendanceSettings?.default_end_time || '17:00',
        grace_period_minutes: attendanceSettings?.default_grace_period_minutes ?? 15,
        working_days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'],
      });
    }
    setShowScheduleModal(true);
  };

  const handleSubmitSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdjustSchedules || !onSaveWorkSchedule) return;
    const targetEmp = employeeOptions.find(o => o.id === scheduleForm.employee_id);
    const empName = targetEmp?.name || scheduleForm.employee_name || 'Employee';

    await onSaveWorkSchedule({
      id: scheduleForm.id,
      employee_id: scheduleForm.employee_id || empName,
      employee_name: empName,
      start_time: scheduleForm.start_time,
      end_time: scheduleForm.end_time,
      grace_period_minutes: Number(scheduleForm.grace_period_minutes),
      working_days: scheduleForm.working_days,
    });

    setShowScheduleModal(false);
    setBannerMessage(
      isAr
        ? `تم حفظ مواعيد العمل وفترة السماح (${scheduleForm.grace_period_minutes} دقيقة) للموظف ${empName}`
        : `Saved work schedule & grace period (${scheduleForm.grace_period_minutes} mins) for ${empName}`
    );
    setTimeout(() => setBannerMessage(null), 4500);
  };

  const handleSubmitCompanySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdjustSchedules || !onSaveAttendanceSettings) return;

    await onSaveAttendanceSettings({
      default_start_time: companySettingsForm.default_start_time,
      default_end_time: companySettingsForm.default_end_time,
      default_grace_period_minutes: Number(companySettingsForm.default_grace_period_minutes),
      track_tardiness: companySettingsForm.track_tardiness,
      show_system_login_time: companySettingsForm.show_system_login_time,
      calendar_reminder_time: companySettingsForm.calendar_reminder_time,
    });

    setShowCompanySettingsModal(false);
    setBannerMessage(
      isAr
        ? `تم تحديث فترة السماح الافتراضية للشركة (${companySettingsForm.default_grace_period_minutes} دقيقة)`
        : `Updated default company grace period (${companySettingsForm.default_grace_period_minutes} mins)`
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

      {/* Requirement 2: Employee Self Clock-In / Clock-Out & Site Login Time Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-5 sm:p-6 text-white shadow-xl border border-slate-700/60 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[11px] font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                {isAr ? 'جلسة تسجيل دخول الموظف الحالية' : 'Active Employee Session'}
              </span>
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-[11px] font-mono font-bold">
                {isAr ? `التاريخ: ${prevTwoDaysInfo.today}` : `Today: ${prevTwoDaysInfo.today}`}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>{currentUsername}</span>
              <span className="text-xs font-bold text-slate-300 px-2.5 py-0.5 rounded-lg bg-slate-800 border border-slate-700">
                {isITAccount ? 'IT Developer' : userRole}
              </span>
            </h2>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 pt-1">
              {showSystemLoginTime && (
                <div className="flex items-center gap-2 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700 font-mono">
                  <LogIn className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    {isAr ? 'وقت تسجيل دخول الموقع:' : 'Site Login Time:'}{' '}
                    <strong className="text-emerald-300 font-bold">{displaySiteLoginTime}</strong>
                  </span>
                </div>
              )}

              {todaySelfAttendance?.clock_in && (
                <div className="flex items-center gap-2 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700 font-mono">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    {isAr ? 'وقت الحضور المسجل:' : 'Clock-In Time:'}{' '}
                    <strong className="text-amber-300 font-bold">{todaySelfAttendance.clock_in}</strong>
                  </span>
                </div>
              )}

              {todaySelfAttendance?.clock_out && (
                <div className="flex items-center gap-2 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700 font-mono">
                  <LogOut className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>
                    {isAr ? 'وقت الانصراف المسجل:' : 'Clock-Out Time:'}{' '}
                    <strong className="text-blue-300 font-bold">{todaySelfAttendance.clock_out}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {(onSelfClockIn || onSelfClockOut) &&
              (selfShiftOpen ? (
                <button
                  type="button"
                  onClick={onSelfClockOut}
                  className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white rounded-2xl text-xs sm:text-sm font-black shadow-lg hover:shadow-xl flex items-center gap-2.5 cursor-pointer transition-all border border-amber-400/30"
                >
                  <LogOut className="w-5 h-5" />
                  <span>
                    {isAr
                      ? `تسجيل الخروج (انصراف) - وقت الدخول: ${sessionReferenceTime}`
                      : `Log Out (Check Out) - Check-In: ${sessionReferenceTime}`}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onSelfClockIn}
                  className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl text-xs sm:text-sm font-black shadow-lg hover:shadow-xl flex items-center gap-2.5 cursor-pointer transition-all border border-emerald-400/30"
                >
                  <LogIn className="w-5 h-5" />
                  <span>
                    {isAr
                      ? `تسجيل الدخول (حضور) - الوقت: ${sessionReferenceTime}`
                      : `Log In (Check In) - Time: ${sessionReferenceTime}`}
                  </span>
                </button>
              ))}
          </div>
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
            {totalOvertimeFiltered > 0
              ? isAr
                ? `منها ${totalOvertimeFiltered} دقيقة إضافي (بعد خصم التأخير)`
                : `${totalOvertimeFiltered} overtime mins (after delay deduction)`
              : isAr
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
                  {showSystemLoginTime && (
                    <th className="py-3.5 px-4 font-semibold text-start">{isAr ? 'تسجيل الدخول' : 'System Log-In'}</th>
                  )}
                  <th className="py-3.5 px-4 font-semibold text-start">{isAr ? 'وقت الحضور' : 'Check-In Time'}</th>
                  <th className="py-3.5 px-4 font-semibold text-start">{isAr ? 'وقت الانصراف' : 'Departure Time'}</th>
                  <th className="py-3.5 px-4 font-semibold text-start">{isAr ? 'عدد ساعات العمل' : 'Working Hours'}</th>
                  <th className="py-3.5 px-4 font-semibold text-start">{isAr ? 'مصدر السجل' : 'Source'}</th>
                  <th className="py-3.5 px-4 font-semibold text-start">
                    {tardinessEnabled
                      ? isAr
                        ? 'الحالة / التأخير'
                        : 'Status / Late'
                      : isAr
                      ? 'الحالة'
                      : 'Status'}
                  </th>
                  {isITAccount && (
                    <th className="py-3.5 px-4 font-semibold text-end">{isAr ? 'إجراءات IT' : 'IT Actions'}</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAttendance.length === 0 ? (
                  <tr>
                    <td
                      colSpan={(showSystemLoginTime ? 8 : 7) + (isITAccount ? 1 : 0)}
                      className="py-12 text-center text-slate-400"
                    >
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

                        {showSystemLoginTime && (
                          <td className="py-3.5 px-4 font-mono text-indigo-700 font-semibold">
                            {rec.login_time || '-'}
                          </td>
                        )}

                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                          {checkIn ? (
                            checkIn
                          ) : (
                            <span className="text-amber-600 font-sans font-semibold">
                              {isAr ? 'بانتظار تسجيل الحضور...' : 'Awaiting Check-In...'}
                            </span>
                          )}
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
                          {!shiftOpen && checkIn && checkOut ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold">
                              <Clock className="w-3.5 h-3.5 text-emerald-600" />
                              {formatWorkingHoursLabel(hoursNum, hoursFmt, isAr)}
                            </span>
                          ) : !checkIn ? (
                            <span className="text-amber-600 font-semibold">
                              {isAr ? 'بانتظار تسجيل الحضور' : 'Awaiting Check-In'}
                            </span>
                          ) : (
                            <span className="text-amber-600 font-semibold">
                              {isAr ? 'قيد العمل (لم ينصرف بعد)' : 'On Duty (Awaiting Check-Out)'}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1">
                            {rec.entry_source === 'IT Manual' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900 text-cyan-300 text-[10px] font-extrabold w-fit">
                                <Shield className="w-3 h-3" />
                                {isAr ? 'إدخال يدوي — IT' : 'IT Manual Entry'}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold w-fit">
                                {isAr ? 'تسجيل الموظف' : 'Employee Clock'}
                              </span>
                            )}
                            {rec.reset_by_it && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold w-fit">
                                {isAr ? 'إعادة ضبط بواسطة IT' : 'Reset by IT'}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                shiftOpen || !checkIn
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {!checkIn
                                ? isAr
                                  ? 'بانتظار الحضور'
                                  : 'Awaiting Check-In'
                                : shiftOpen
                                ? isAr
                                  ? 'حاضر الآن'
                                  : 'Checked In'
                                : isAr
                                ? 'مكتمل'
                                : 'Completed'}
                            </span>

                            {tardinessEnabled &&
                              ((rec.attendance_status === 'Late' || lateMins > 0) ? (
                                <span className="px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold">
                                  {isAr ? `تأخير ${lateMins} د` : `Late ${lateMins}m`}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 text-[10px] font-bold">
                                  {isAr ? 'منتظم' : 'On Time'}
                                </span>
                              ))}

                            {(Number(rec.overtime_minutes) || 0) > 0 && (
                              <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold">
                                {isAr
                                  ? `إضافي ${rec.overtime_minutes} د`
                                  : `+${rec.overtime_minutes}m OT`}
                              </span>
                            )}
                          </div>
                        </td>

                        {isITAccount && (
                          <td className="py-3.5 px-4 text-end">
                            <div className="inline-flex items-center gap-1.5 flex-wrap justify-end">
                              <button
                                type="button"
                                onClick={() => openManualModal(rec)}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>{isAr ? 'تعديل' : 'Edit'}</span>
                              </button>
                              {onResetAttendanceTime && (
                                <button
                                  type="button"
                                  onClick={() => setResetModalRecord(rec)}
                                  className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                                  title={
                                    isAr
                                      ? 'إعادة ضبط وقت الحضور أو الانصراف للسماح للموظف بالتسجيل بشكل طبيعي'
                                      : 'Reset clock-in or clock-out time so the employee can clock in/out normally'
                                  }
                                >
                                  <RotateCcw className="w-3 h-3 text-amber-700" />
                                  <span>{isAr ? 'إعادة ضبط الوقت' : 'Reset Time'}</span>
                                </button>
                              )}
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
                  <th className="py-3 px-4 font-semibold text-start">{isAr ? 'المنفذ / المصدر' : 'Actor / Source'}</th>
                  <th className="py-3 px-4 font-semibold text-start">{isAr ? 'نوع العملية' : 'Event Type'}</th>
                  <th className="py-3 px-4 font-semibold text-start">{isAr ? 'التفاصيل المسجلة' : 'Recorded Details'}</th>
                  <th className="py-3 px-4 font-semibold text-start">{isAr ? 'مرجع السجل' : 'Record ID'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLoginLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
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
                          <div className="flex flex-col gap-1">
                            <span className="text-[11px] font-bold text-slate-700">
                              {log.actor_name || log.employee_name}
                            </span>
                            {log.entry_source === 'IT Manual' || /^\[IT Manual\]/i.test(log.action) ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 text-cyan-300 text-[9px] font-extrabold w-fit">
                                <Shield className="w-2.5 h-2.5" />
                                {isAr ? 'تعديل يدوي IT' : 'IT Manual'}
                              </span>
                            ) : (
                              <span className="text-[9px] font-semibold text-slate-400">
                                {isAr ? 'تسجيل الموظف' : 'Employee'}
                              </span>
                            )}
                          </div>
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
          {/* Section Header Controls for Administrator and Developer */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="font-black text-slate-900 text-sm">
                {isAr ? 'جدول مواعيد العمل الرسمية وفترات السماح للموظفين' : 'Official Employee Work Schedules & Grace Periods'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAr
                  ? 'للمطور (IT) والمدير العام صلاحية تعديل جدول مواعيد العمل وفترة السماح لكل موظف.'
                  : 'Developer (IT) & Administrator have authority to adjust work schedules and grace periods.'}
              </p>
            </div>

            {canAdjustSchedules && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCompanySettingsForm({
                      default_start_time: attendanceSettings?.default_start_time || '09:00',
                      default_end_time: attendanceSettings?.default_end_time || '17:00',
                      default_grace_period_minutes: attendanceSettings?.default_grace_period_minutes ?? 15,
                      track_tardiness: attendanceSettings?.track_tardiness === true,
                      show_system_login_time: attendanceSettings?.show_system_login_time === true,
                      calendar_reminder_time: attendanceSettings?.calendar_reminder_time || '09:00',
                    });
                    setShowCompanySettingsModal(true);
                  }}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                  <span>{isAr ? 'تعديل فترة السماح العامة للشركة' : 'Edit Company Grace Period'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenScheduleModal()}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-cyan-300 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{isAr ? 'تعديل / إضافة جدول موظف' : 'Add / Adjust Employee Schedule'}</span>
                </button>
              </div>
            )}
          </div>

          {attendanceSettings && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
              <div>
                <h3 className="font-black text-slate-900 text-sm">
                  {isAr ? 'إعدادات الدوام الرسمي المعتمدة' : 'Default Company Attendance Policy'}
                </h3>
                <p className="text-slate-500 mt-0.5">
                  {isAr
                    ? `بداية الدوام: ${attendanceSettings.default_start_time} • نهاية الدوام: ${attendanceSettings.default_end_time} • فترة السماح الافتراضية: ${attendanceSettings.default_grace_period_minutes} دقيقة • تذكير التقويم: ${attendanceSettings.calendar_reminder_time || '09:00'}`
                    : `Official Shift: ${attendanceSettings.default_start_time} – ${attendanceSettings.default_end_time} • Grace: ${attendanceSettings.default_grace_period_minutes} mins • Calendar Reminder: ${attendanceSettings.calendar_reminder_time || '09:00'}`}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-xl font-bold border ${
                    attendanceSettings.track_tardiness
                      ? 'bg-rose-50 border-rose-200 text-rose-700'
                      : 'bg-slate-100 border-slate-200 text-slate-500'
                  }`}
                >
                  {attendanceSettings.track_tardiness
                    ? isAr ? 'احتساب التأخير مفعل' : 'Tardiness Tracking ON'
                    : isAr ? 'احتساب التأخير متوقف' : 'Tardiness Tracking OFF'}
                </span>
                <span
                  className={`px-3 py-1 rounded-xl font-bold border ${
                    attendanceSettings.show_system_login_time
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                      : 'bg-slate-100 border-slate-200 text-slate-500'
                  }`}
                >
                  {attendanceSettings.show_system_login_time
                    ? isAr ? 'وقت دخول النظام ظاهر' : 'System Login Visible'
                    : isAr ? 'وقت دخول النظام مخفي' : 'System Login Hidden'}
                </span>
                {attendanceSettings.auto_record_on_login && (
                  <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl font-bold">
                    {isAr ? 'التسجيل التلقائي مع الدخول مفعل' : 'Auto-Record on Employee Login Enabled'}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {workSchedules.map(ws => (
              <div
                key={ws.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2.5 text-xs flex flex-col justify-between"
              >
                <div className="space-y-2.5">
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
                  <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                    <span>{isAr ? 'فترة السماح:' : 'Grace Period:'}</span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 font-mono">
                      {ws.grace_period_minutes} {isAr ? 'دقيقة' : 'mins'}
                    </span>
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

                {canAdjustSchedules && (
                  <div className="pt-3 border-t border-slate-100 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleOpenScheduleModal(ws)}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-cyan-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{isAr ? 'تعديل الموعد وفترة السماح' : 'Edit Schedule & Grace Period'}</span>
                    </button>
                  </div>
                )}
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

              {manualForm.id && onResetAttendanceTime && (() => {
                const matchedRec = accessibleRecords.find(r => r.id === manualForm.id);
                if (!matchedRec) return null;
                const hasIn = Boolean((matchedRec.clock_in || matchedRec.check_in_time || '').trim());
                const rawMOut = (matchedRec.clock_out || matchedRec.check_out_time || '').trim();
                const hasOut = Boolean(rawMOut && rawMOut !== '--' && rawMOut !== '-');
                return (
                  <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                      <RotateCcw className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>
                        {isAr
                          ? 'إعادة ضبط الوقت المضاف بالخطأ (للسماح للموظف بالتسجيل بنفسه):'
                          : 'Reset Mistaken Manual Time (Allow Employee to Clock In/Out Normally):'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {hasIn && (
                        <button
                          type="button"
                          onClick={() => handleConfirmResetTime(matchedRec, 'clock_in')}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>{isAr ? 'إعادة ضبط وقت الحضور' : 'Reset Clock-In'}</span>
                        </button>
                      )}
                      {hasOut && (
                        <button
                          type="button"
                          onClick={() => handleConfirmResetTime(matchedRec, 'clock_out')}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>{isAr ? 'إعادة ضبط وقت الانصراف' : 'Reset Clock-Out'}</span>
                        </button>
                      )}
                      {hasIn && hasOut && (
                        <button
                          type="button"
                          onClick={() => handleConfirmResetTime(matchedRec, 'both')}
                          className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>{isAr ? 'إعادة ضبط الحضور والانصراف معاً' : 'Reset Both Times'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}

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

      {/* IT Reset Clock-In / Clock-Out Time Modal */}
      {resetModalRecord && isITAccount && onResetAttendanceTime && (() => {
        const recIn = (resetModalRecord.clock_in || resetModalRecord.check_in_time || '').trim();
        const rawRecOut = (resetModalRecord.clock_out || resetModalRecord.check_out_time || '').trim();
        const recOut = rawRecOut === '--' || rawRecOut === '-' ? '' : rawRecOut;
        return (
          <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-extrabold uppercase">
                    {isAr ? 'إعادة ضبط بواسطة IT' : 'IT Time Reset'}
                  </span>
                  <h3 className="text-base font-black text-slate-900 mt-1">
                    {isAr
                      ? 'إعادة ضبط وقت الحضور أو الانصراف'
                      : 'Reset Employee Clock-In / Clock-Out Time'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setResetModalRecord(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">{isAr ? 'الموظف:' : 'Employee:'}</span>
                  <span className="font-black text-slate-900">{resetModalRecord.employee_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">{isAr ? 'التاريخ:' : 'Date:'}</span>
                  <span className="font-mono font-bold text-slate-800">{resetModalRecord.date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">{isAr ? 'وقت الحضور الحالي:' : 'Current Check-In:'}</span>
                  <span className="font-mono font-bold text-emerald-700">{recIn || (isAr ? 'غير مسجل' : 'Not set')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">{isAr ? 'وقت الانصراف الحالي:' : 'Current Check-Out:'}</span>
                  <span className="font-mono font-bold text-blue-700">{recOut || (isAr ? 'غير مسجل' : 'Not set')}</span>
                </div>
              </div>

              <p className="text-slate-600 leading-relaxed">
                {isAr
                  ? 'اختر الوقت الذي تمت إضافته بالخطأ لإعادة ضبطه، وسيتمكن الموظف فوراً من تسجيل الحضور أو الانصراف بنفسه بشكل طبيعي:'
                  : 'Select which time entry was added by mistake to reset it. The employee will immediately be able to clock in or clock out normally:'}
              </p>

              <div className="space-y-2.5">
                {recIn && (
                  <button
                    type="button"
                    onClick={() => handleConfirmResetTime(resetModalRecord, 'clock_in')}
                    className="w-full p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 font-bold flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>
                        {isAr
                          ? `إعادة ضبط وقت الحضور (${recIn})`
                          : `Reset Clock-In Time (${recIn})`}
                      </span>
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-white text-emerald-700 border border-emerald-200">
                      {isAr ? 'يسمح بتسجيل الحضور' : 'Allows Clock-In'}
                    </span>
                  </button>
                )}

                {recOut && (
                  <button
                    type="button"
                    onClick={() => handleConfirmResetTime(resetModalRecord, 'clock_out')}
                    className="w-full p-3 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 font-bold flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 text-blue-700 shrink-0" />
                      <span>
                        {isAr
                          ? `إعادة ضبط وقت الانصراف (${recOut})`
                          : `Reset Clock-Out Time (${recOut})`}
                      </span>
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-white text-blue-700 border border-blue-200">
                      {isAr ? 'يسمح بتسجيل الانصراف' : 'Allows Clock-Out'}
                    </span>
                  </button>
                )}

                {recIn && recOut && (
                  <button
                    type="button"
                    onClick={() => handleConfirmResetTime(resetModalRecord, 'both')}
                    className="w-full p-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center justify-between cursor-pointer transition-colors shadow-xs"
                  >
                    <span className="flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 shrink-0" />
                      <span>
                        {isAr
                          ? 'إعادة ضبط وقتي الحضور والانصراف معاً'
                          : 'Reset Both Clock-In & Clock-Out'}
                      </span>
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-800 text-amber-100">
                      {isAr ? 'إعادة ضبط كاملة' : 'Full Reset'}
                    </span>
                  </button>
                )}
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResetModalRecord(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      {/* Edit Employee Work Schedule & Grace Period Modal (IT & Administrator Authority) */}
      {showScheduleModal && canAdjustSchedules && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded text-[10px] font-extrabold uppercase">
                  {isAr ? 'صلاحية المدير والـ IT' : 'Admin & IT Authority'}
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  {editingSchedule
                    ? isAr
                      ? `تعديل جدول وعذر السماح للموظف ${scheduleForm.employee_name}`
                      : `Edit Schedule & Grace Period for ${scheduleForm.employee_name}`
                    : isAr
                    ? 'إضافة / تعديل جدول عمل ومواعيد موظف'
                    : 'Add / Adjust Employee Work Schedule & Grace Period'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitSchedule} className="space-y-4">
              {!editingSchedule && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isAr ? 'اختر الموظف' : 'Select Employee'}
                  </label>
                  <select
                    value={scheduleForm.employee_id}
                    onChange={e => {
                      const empId = e.target.value;
                      const emp = employeeOptions.find(o => o.id === empId);
                      setScheduleForm(prev => ({
                        ...prev,
                        employee_id: empId,
                        employee_name: emp?.name || '',
                      }));
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800"
                    required
                  >
                    <option value="">{isAr ? '-- اختر موظفاً --' : '-- Select Employee --'}</option>
                    {employeeOptions.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isAr ? 'وقت بدء العمل (الحضور)' : 'Shift Start Time'}
                  </label>
                  <input
                    type="time"
                    value={scheduleForm.start_time}
                    onChange={e => setScheduleForm(prev => ({ ...prev, start_time: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isAr ? 'وقت انتهاء العمل (الانصراف)' : 'Shift End Time'}
                  </label>
                  <input
                    type="time"
                    value={scheduleForm.end_time}
                    onChange={e => setScheduleForm(prev => ({ ...prev, end_time: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-slate-800"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isAr ? 'فترة السماح والتأخير المقبولة (بالدقائق)' : 'Grace Period (Minutes)'}
                </label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={scheduleForm.grace_period_minutes}
                  onChange={e => setScheduleForm(prev => ({ ...prev, grace_period_minutes: Number(e.target.value) }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-slate-800"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  {isAr
                    ? 'مثال: 15 دقيقة سماح بعد وقت بدء الشفت دون احتساب التأخير'
                    : 'Example: 15 minutes grace period allowed after shift start before marked late.'}
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-2">
                  {isAr ? 'أيام العمل الأسبوعية' : 'Working Days'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { day: 'Sun', labelAr: 'الأحد', labelEn: 'Sun' },
                    { day: 'Mon', labelAr: 'الإثنين', labelEn: 'Mon' },
                    { day: 'Tue', labelAr: 'الثلاثاء', labelEn: 'Tue' },
                    { day: 'Wed', labelAr: 'الأربعاء', labelEn: 'Wed' },
                    { day: 'Thu', labelAr: 'الخميس', labelEn: 'Thu' },
                    { day: 'Fri', labelAr: 'الجمعة', labelEn: 'Fri' },
                    { day: 'Sat', labelAr: 'السبت', labelEn: 'Sat' },
                  ].map(d => {
                    const active = scheduleForm.working_days.includes(d.day);
                    return (
                      <button
                        type="button"
                        key={d.day}
                        onClick={() => {
                          setScheduleForm(prev => {
                            const exists = prev.working_days.includes(d.day);
                            return {
                              ...prev,
                              working_days: exists
                                ? prev.working_days.filter(item => item !== d.day)
                                : [...prev.working_days, d.day],
                            };
                          });
                        }}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          active
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {isAr ? d.labelAr : d.labelEn}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{isAr ? 'حفظ جدول المواعيد' : 'Save Schedule'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Company Default Grace Period & Shift Settings Modal */}
      {showCompanySettingsModal && canAdjustSchedules && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="px-2 py-0.5 bg-slate-900 text-cyan-300 rounded text-[10px] font-extrabold uppercase">
                  {isAr ? 'إعدادات الشركة العالامة' : 'Company Default Settings'}
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  {isAr ? 'تعديل فترة السماح الافتراضية للشركة' : 'Edit Company Grace Period & Default Shift'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCompanySettingsModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCompanySettings} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isAr ? 'بداية الشفت الافتراضية' : 'Default Start Time'}
                  </label>
                  <input
                    type="time"
                    value={companySettingsForm.default_start_time}
                    onChange={e =>
                      setCompanySettingsForm(prev => ({ ...prev, default_start_time: e.target.value }))
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isAr ? 'نهاية الشفت الافتراضية' : 'Default End Time'}
                  </label>
                  <input
                    type="time"
                    value={companySettingsForm.default_end_time}
                    onChange={e =>
                      setCompanySettingsForm(prev => ({ ...prev, default_end_time: e.target.value }))
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-slate-800"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isAr ? 'فترة السماح الافتراضية للشركة (بالدقائق)' : 'Default Grace Period (Minutes)'}
                </label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={companySettingsForm.default_grace_period_minutes}
                  onChange={e =>
                    setCompanySettingsForm(prev => ({
                      ...prev,
                      default_grace_period_minutes: Number(e.target.value),
                    }))
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-slate-800"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  {isAr
                    ? 'يطبق هذا العذر الافتراضي على جميع الموظفين الذين ليس لديهم جدول مخصص'
                    : 'Applies as default grace period for employees without individual custom schedules.'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={companySettingsForm.track_tardiness}
                    onChange={e =>
                      setCompanySettingsForm(prev => ({ ...prev, track_tardiness: e.target.checked }))
                    }
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-indigo-600 cursor-pointer"
                  />
                  <span>
                    <span className="block font-bold text-slate-800">
                      {isAr ? 'تفعيل احتساب التأخير للموظفين' : 'Enable Employee Tardiness Tracking'}
                    </span>
                    <span className="block text-[11px] text-slate-500">
                      {isAr
                        ? 'عند الإيقاف لا تظهر أي سجلات تأخير. يتم الحساب من وقت الحضور اليدوي للموظف بعد فترة السماح.'
                        : 'When off, no tardiness records appear. Late minutes are calculated from the employee’s manual clock-in after the grace period.'}
                    </span>
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={companySettingsForm.show_system_login_time}
                    onChange={e =>
                      setCompanySettingsForm(prev => ({ ...prev, show_system_login_time: e.target.checked }))
                    }
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-indigo-600 cursor-pointer"
                  />
                  <span>
                    <span className="block font-bold text-slate-800">
                      {isAr ? 'إظهار وقت تسجيل دخول النظام للموظفين' : 'Show System Log-In Time to Employees'}
                    </span>
                    <span className="block text-[11px] text-slate-500">
                      {isAr
                        ? 'عند الإيقاف يعتمد الموظف على أوقات الحضور والانصراف اليدوية فقط (المدير و IT يرون سجل التدقيق دائماً).'
                        : 'When off, employees rely only on manual clock-in/out times (Admin & IT still see the audit trail).'}
                    </span>
                  </span>
                </label>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isAr ? 'وقت تذكير التقويم اليومي' : 'Daily Calendar Reminder Time'}
                </label>
                <input
                  type="time"
                  value={companySettingsForm.calendar_reminder_time}
                  onChange={e =>
                    setCompanySettingsForm(prev => ({ ...prev, calendar_reminder_time: e.target.value }))
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-slate-800"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  {isAr
                    ? 'الوقت الذي تُرسل فيه تنبيهات متابعات العملاء والرحلات والمستحقات المستحقة اليوم.'
                    : 'Time of day when due follow-ups, trips, and invoice reminders are pushed.'}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCompanySettingsModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{isAr ? 'حفظ إعدادات الشركة' : 'Save Default Grace Settings'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
