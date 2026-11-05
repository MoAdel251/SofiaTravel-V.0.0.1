import {
  Employee,
  AttendanceRecord,
  ActivityLog,
  FinanceAuditLog,
  AttendanceLoginLog,
  WorkSchedule,
  AttendanceSettings,
} from '../types';

/**
 * Checks strictly if the logged-in account is the "IT" developer account.
 */
export function isITDeveloperAccount(
  username?: string,
  empId?: string,
  employee?: Partial<Employee> | null
): boolean {
  const cleanUser = (username || '').trim();
  const cleanEmpUsername = (employee?.username || '').trim();
  const cleanEmpName = (employee?.name || '').trim();
  return (
    cleanUser === 'IT' ||
    empId === 'SYS-IT-ADMIN' ||
    cleanEmpUsername === 'IT' ||
    cleanEmpName === 'IT'
  );
}

/**
 * Returns local calendar date formatted as YYYY-MM-DD.
 */
export function getLocalDateYYYYMMDD(refDate: Date = new Date()): string {
  const y = refDate.getFullYear();
  const m = String(refDate.getMonth() + 1).padStart(2, '0');
  const d = String(refDate.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Computes the previous two calendar days relative to refDate (default: today).
 * For example, if today is 2026-11-03, returns:
 * { today: "2026-11-03", yesterday: "2026-11-02", twoDaysAgo: "2026-11-01", dates: ["2026-11-01", "2026-11-02"] }
 */
export function getPreviousTwoDaysDates(refDate: Date = new Date()): {
  today: string;
  yesterday: string;
  twoDaysAgo: string;
  dates: [string, string];
} {
  const base = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate(), 12, 0, 0);
  const d1 = new Date(base);
  d1.setDate(base.getDate() - 1);
  const d2 = new Date(base);
  d2.setDate(base.getDate() - 2);

  const today = getLocalDateYYYYMMDD(base);
  const yesterday = getLocalDateYYYYMMDD(d1);
  const twoDaysAgo = getLocalDateYYYYMMDD(d2);
  return {
    today,
    yesterday,
    twoDaysAgo,
    dates: [twoDaysAgo, yesterday],
  };
}

/**
 * Checks whether an attendance record represents an active/open shift
 * (checked in with no check-out / departure time yet).
 */
export function isAttendanceShiftOpen(rec?: Partial<AttendanceRecord> | null): boolean {
  if (!rec) return false;
  const hasCheckIn = Boolean((rec.clock_in && rec.clock_in.trim()) || (rec.check_in_time && rec.check_in_time.trim()));
  const rawOut = (rec.clock_out || rec.check_out_time || '').trim();
  const hasCheckOut = Boolean(rawOut && rawOut !== '--' && rawOut !== '-');
  return hasCheckIn && !hasCheckOut;
}

/**
 * Parses a time string ("HH:mm", "HH:mm:ss", "hh:mm AM/PM", or ISO datetime)
 * into total seconds since midnight (0 - 86399).
 */
export function parseTimeToSeconds(timeStr?: string | null): number | null {
  if (!timeStr) return null;
  const raw = String(timeStr).trim();
  if (!raw || raw === '--' || raw === '-') return null;

  // Handle ISO datetime string if passed
  if (raw.includes('T')) {
    const dt = new Date(raw);
    if (!isNaN(dt.getTime())) {
      return dt.getHours() * 3600 + dt.getMinutes() * 60 + dt.getSeconds();
    }
  }

  // Handle 12-hour AM/PM format (e.g., "09:30 AM", "5:45:10 PM")
  const amPmMatch = raw.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM|am|pm|ص|م)$/);
  if (amPmMatch) {
    let hours = parseInt(amPmMatch[1], 10);
    const mins = parseInt(amPmMatch[2], 10);
    const secs = amPmMatch[3] ? parseInt(amPmMatch[3], 10) : 0;
    const period = amPmMatch[4].toUpperCase();
    const isPM = period === 'PM' || period === 'م';
    const isAM = period === 'AM' || period === 'ص';
    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;
    if (hours >= 0 && hours < 24 && mins >= 0 && mins < 60 && secs >= 0 && secs < 60) {
      return hours * 3600 + mins * 60 + secs;
    }
  }

  // Handle standard 24-hour format ("HH:mm" or "HH:mm:ss")
  const match24 = raw.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const mins = parseInt(match24[2], 10);
    const secs = match24[3] ? parseInt(match24[3], 10) : 0;
    if (hours >= 0 && hours < 24 && mins >= 0 && mins < 60 && secs >= 0 && secs < 60) {
      return hours * 3600 + mins * 60 + secs;
    }
  }

  return null;
}

/**
 * Formats a time string into normalized 24h "HH:mm" for HTML <input type="time" /> and storage.
 */
export function normalizeTimeHHMM(timeStr?: string | null): string {
  const secs = parseTimeToSeconds(timeStr);
  if (secs === null) return '';
  const hrs = Math.floor(secs / 3600);
  const mins = Math.floor((secs % 3600) / 60);
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Unified working hours calculator used identically whether:
 * - An employee clocks in / clocks out themselves, OR
 * - The "IT" developer account manually adds or edits clock-in / clock-out times.
 */
export function calculateWorkingHours(
  clockIn?: string | null,
  clockOut?: string | null
): {
  working_hours: number;
  working_hours_formatted: string;
  total_minutes: number;
  status: 'Clocked In' | 'Completed';
} {
  const inSec = parseTimeToSeconds(clockIn);
  const outSec = parseTimeToSeconds(clockOut);

  if (inSec === null || outSec === null) {
    return {
      working_hours: 0,
      working_hours_formatted: '0h 00m',
      total_minutes: 0,
      status: 'Clocked In',
    };
  }

  // Calculate elapsed seconds; support overnight shifts crossing midnight
  let diffSeconds = outSec - inSec;
  if (diffSeconds < 0) {
    diffSeconds += 24 * 3600;
  }

  const totalMinutes = Math.round(diffSeconds / 60);
  const hoursInt = Math.floor(totalMinutes / 60);
  const minsRemainder = totalMinutes % 60;
  const decimalHours = Math.round((diffSeconds / 3600) * 100) / 100;

  return {
    working_hours: decimalHours,
    working_hours_formatted: `${hoursInt}h ${String(minsRemainder).padStart(2, '0')}m`,
    total_minutes: totalMinutes,
    status: 'Completed',
  };
}

/**
 * Formats decimal working hours into localized EN/AR readable duration.
 */
export function formatWorkingHoursLabel(hours: number, formatted?: string, isAr: boolean = false): string {
  const safeHours = Number(hours) || 0;
  const totalMins = Math.round(safeHours * 60);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (isAr) {
    return `${h} س ${String(m).padStart(2, '0')} د (${safeHours.toFixed(2)})`;
  }
  return formatted && formatted !== '--'
    ? `${formatted} (${safeHours.toFixed(2)} hrs)`
    : `${h}h ${String(m).padStart(2, '0')}m (${safeHours.toFixed(2)} hrs)`;
}

export interface ResolvedAttendanceSchedule {
  start_time: string;
  end_time: string;
  grace_period_minutes: number;
  working_days: string[];
}

/**
 * Resolves the effective shift for an employee, falling back to the company
 * defaults when no individual work schedule has been configured.
 */
export function resolveEmployeeScheduleForAttendance(
  empQuery: { id?: string; employee_id?: string; name?: string; username?: string },
  workSchedules: WorkSchedule[] = [],
  attendanceSettings?: AttendanceSettings | null
): ResolvedAttendanceSchedule {
  const defaultStart = normalizeTimeHHMM(attendanceSettings?.default_start_time) || '10:00';
  const defaultEnd = normalizeTimeHHMM(attendanceSettings?.default_end_time) || '18:00';
  const defaultGrace = Number(attendanceSettings?.default_grace_period_minutes) || 0;
  const defaultDays = Array.isArray(attendanceSettings?.default_working_days)
    ? attendanceSettings!.default_working_days!
    : [];

  const qIds = [empQuery.id, empQuery.employee_id]
    .map(v => String(v || '').trim().toLowerCase())
    .filter(Boolean);
  const qNames = [empQuery.name, empQuery.username]
    .map(v => String(v || '').trim().toLowerCase())
    .filter(Boolean);

  const matched = workSchedules.find(ws => {
    const wsId = String(ws.employee_id || ws.id || '').trim().toLowerCase();
    const wsName = String(ws.employee_name || '').trim().toLowerCase();
    if (wsId && qIds.includes(wsId)) return true;
    if (wsName && (qNames.includes(wsName) || qIds.includes(wsName))) return true;
    return false;
  });

  if (matched) {
    return {
      start_time: normalizeTimeHHMM(matched.start_time) || defaultStart,
      end_time: normalizeTimeHHMM(matched.end_time) || defaultEnd,
      grace_period_minutes: Math.max(0, Number(matched.grace_period_minutes) || 0),
      working_days: Array.isArray(matched.working_days) ? matched.working_days : defaultDays,
    };
  }

  return {
    start_time: defaultStart,
    end_time: defaultEnd,
    grace_period_minutes: Math.max(0, defaultGrace),
    working_days: defaultDays,
  };
}

function timeToMinutes(timeStr?: string | null): number | null {
  const seconds = parseTimeToSeconds(timeStr);
  return seconds === null ? null : Math.floor(seconds / 60);
}

/**
 * Computes tardiness, early departure, and overtime for a record.
 *
 * Tardiness is derived exclusively from the employee's own manual clock-in
 * (never from the platform/system login timestamp). The grace period is
 * applied first; any delay beyond the grace window is then deducted from the
 * computed overtime so extra hours are only credited after the shift is made up.
 */
export function applyAttendancePolicy(
  record: AttendanceRecord,
  schedule: ResolvedAttendanceSchedule,
  options: { trackTardiness: boolean }
): AttendanceRecord {
  const startMin = timeToMinutes(schedule.start_time);
  const endMin = timeToMinutes(schedule.end_time);
  const inMinRaw = timeToMinutes(record.clock_in || record.check_in_time);
  const outMinRaw = timeToMinutes(record.clock_out || record.check_out_time);

  const isOvernight = startMin !== null && endMin !== null && endMin <= startMin;

  let inMin = inMinRaw;
  if (isOvernight && startMin !== null && inMin !== null && inMin < startMin) {
    inMin += 24 * 60;
  }
  let outMin = outMinRaw;
  if (inMin !== null && outMin !== null && outMin < inMin) {
    outMin += 24 * 60;
  }

  const scheduledMinutes =
    startMin !== null && endMin !== null
      ? endMin >= startMin
        ? endMin - startMin
        : endMin + 24 * 60 - startMin
      : 0;

  const workedMinutes = inMin !== null && outMin !== null ? Math.max(0, outMin - inMin) : 0;

  let lateMinutes = 0;
  if (options.trackTardiness && startMin !== null && inMin !== null) {
    const grace = Math.max(0, Number(schedule.grace_period_minutes) || 0);
    lateMinutes = Math.max(0, Math.round(inMin - (startMin + grace)));
  }

  let overtimeMinutes = 0;
  if (scheduledMinutes > 0 && workedMinutes > 0) {
    const rawOvertime = Math.max(0, workedMinutes - scheduledMinutes);
    overtimeMinutes = Math.max(0, rawOvertime - lateMinutes);
  }

  const earlyDepartureMinutes =
    scheduledMinutes > 0 && workedMinutes > 0 && overtimeMinutes === 0
      ? Math.max(0, scheduledMinutes - workedMinutes)
      : 0;

  const nextStatus = options.trackTardiness
    ? lateMinutes > 0
      ? 'Late'
      : 'Present'
    : record.attendance_status === 'Absent'
    ? 'Absent'
    : 'Present';

  return {
    ...record,
    scheduled_start_time: schedule.start_time,
    scheduled_end_time: schedule.end_time,
    grace_period_minutes: schedule.grace_period_minutes,
    late_minutes: options.trackTardiness ? lateMinutes : 0,
    overtime_minutes: overtimeMinutes,
    early_departure_minutes: earlyDepartureMinutes,
    attendance_status: nextStatus,
  };
}

/**
 * Resolves an employee display name from employees list when a record stores an employee code (e.g. "EMP-MVXJQYGS").
 */
export function resolveEmployeeDisplayName(
  rawId?: string,
  rawName?: string,
  employees: Employee[] = []
): string {
  const candidateName = (rawName || '').trim();
  const candidateId = (rawId || '').trim();
  const looksLikeCode = !candidateName || candidateName.startsWith('EMP-') || candidateName === candidateId;

  const matched = employees.find(
    e =>
      (candidateId && (e.id === candidateId || e.employee_id === candidateId)) ||
      (candidateName && (e.id === candidateName || e.employee_id === candidateName || e.name === candidateName || e.username === candidateName))
  );

  if (matched) {
    return matched.name || matched.full_name || matched.username || candidateName || candidateId;
  }
  if (!looksLikeCode && candidateName) return candidateName;
  return candidateName || candidateId || 'Employee';
}

/**
 * Safely extracts YYYY-MM-DD and HH:mm from ISO timestamps or explicit YYYY-MM-DD fields,
 * avoiding locale ambiguity between DD/MM/YYYY and M/D/YYYY in audit strings.
 */
function extractSafeDateAndTime(
  explicitDate?: string,
  explicitTime?: string,
  isoStr?: string,
  fallbackDateTimeStr?: string
): { date: string; time: string; timestamp: number } {
  let date = '';
  let time = '';
  let timestamp = 0;

  if (explicitDate && /^\d{4}-\d{2}-\d{2}$/.test(explicitDate.trim())) {
    date = explicitDate.trim();
  }

  if (isoStr) {
    const dt = new Date(isoStr);
    if (!isNaN(dt.getTime())) {
      timestamp = dt.getTime();
      if (!date) {
        date = getLocalDateYYYYMMDD(dt);
      }
      if (!explicitTime) {
        time = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
      }
    }
  }

  if (explicitTime) {
    const hhmm = normalizeTimeHHMM(explicitTime);
    time = hhmm || explicitTime;
  }

  if ((!date || !time) && fallbackDateTimeStr) {
    const raw = String(fallbackDateTimeStr).trim();
    // Extract time part after comma if present
    const parts = raw.split(',');
    if (parts.length >= 2 && !time) {
      const tNorm = normalizeTimeHHMM(parts[1].trim());
      if (tNorm) time = tNorm;
    }
    if (!date) {
      const isoMatch = raw.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (isoMatch) {
        date = `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
      }
    }
  }

  if (!timestamp && date) {
    const tPart = normalizeTimeHHMM(time) || '00:00';
    const parsed = new Date(`${date}T${tPart}:00`).getTime();
    if (!isNaN(parsed)) timestamp = parsed;
  }

  return { date, time, timestamp };
}

/**
 * Extracts and merges employee attendance & log-in / log-out events from Firestore
 * `activity_logs` and `finance_audit_logs`, deduplicating `ACT-LOG-*` and `LOG-*` pairs.
 */
export function extractAttendanceAndLoginLogs(
  activityLogs: ActivityLog[] = [],
  financeAuditLogs: FinanceAuditLog[] = [],
  employees: Employee[] = []
): AttendanceLoginLog[] {
  const mergedMap = new Map<string, AttendanceLoginLog>();

  const isAttendanceOrLoginEvent = (moduleOrType?: string, action?: string, details?: string) => {
    const m = (moduleOrType || '').toLowerCase();
    const a = (action || '').toLowerCase();
    const d = (details || '').toLowerCase();
    return (
      m.includes('attendance') ||
      m.includes('auth') ||
      m.includes('login') ||
      a.includes('log in') ||
      a.includes('log out') ||
      a.includes('login') ||
      a.includes('logout') ||
      a.includes('clocked in') ||
      a.includes('clocked out') ||
      a.includes('attendance') ||
      d.includes('logged in at') ||
      d.includes('logged out at')
    );
  };

  for (const act of activityLogs) {
    if (!isAttendanceOrLoginEvent(act.module, act.action, act.record)) continue;
    const baseKey = String(act.id || '').replace(/^ACT-/, '');
    const { date, time, timestamp } = extractSafeDateAndTime(
      act.date,
      act.time,
      act.createdAt || act.updatedAt
    );

    const resolvedName = resolveEmployeeDisplayName(act.record, act.user_name, employees);
    const matchedEmp = employees.find(
      e =>
        e.id === act.record ||
        e.employee_id === act.record ||
        e.name === resolvedName ||
        e.username === act.user_name
    );

    mergedMap.set(baseKey, {
      id: baseKey || act.id,
      employee_id: matchedEmp?.id || (String(act.record || '').startsWith('EMP-') ? act.record : undefined),
      employee_name: resolvedName,
      actor_name: act.user_name,
      entry_source: act.entry_source || (/^\[IT Manual\]/i.test(act.action || '') ? 'IT Manual' : 'Employee'),
      action: act.action || 'Attendance Activity',
      details: act.action || '',
      date,
      time,
      timestamp,
      record_id: act.record,
      source: 'activity_logs',
    });
  }

  for (const fin of financeAuditLogs) {
    const anyFin = fin as any;
    if (!isAttendanceOrLoginEvent(fin.record_type, fin.action, fin.new_value)) continue;
    const baseKey = String(fin.id || '').replace(/^ACT-/, '');
    const existing = mergedMap.get(baseKey);

    const { date, time, timestamp } = extractSafeDateAndTime(
      existing?.date,
      undefined,
      anyFin.updatedAt || anyFin.createdAt,
      fin.date_time
    );

    // Extract explicit "Logged in at HH:mm" / "Logged out at HH:mm" time if present in new_value
    let loggedTime = time || existing?.time || '';
    const matchLoggedAt = String(fin.new_value || '').match(/(?:at|في)\s+(\d{1,2}:\d{2})/i);
    if (matchLoggedAt) {
      loggedTime = normalizeTimeHHMM(matchLoggedAt[1]) || matchLoggedAt[1];
    }

    const resolvedName = resolveEmployeeDisplayName(fin.record_id, fin.user_name || existing?.employee_name, employees);
    const matchedEmp = employees.find(
      e =>
        e.id === fin.record_id ||
        e.employee_id === fin.record_id ||
        e.name === resolvedName ||
        e.username === fin.user_name
    );

    mergedMap.set(baseKey, {
      id: baseKey || fin.id,
      employee_id: matchedEmp?.id || existing?.employee_id || (String(fin.record_id || '').startsWith('EMP-') ? fin.record_id : undefined),
      employee_name: resolvedName,
      user_role: fin.user_role || existing?.user_role,
      actor_name: fin.user_name || existing?.actor_name,
      entry_source: existing?.entry_source || (/^\[IT Manual\]/i.test(fin.new_value || '') ? 'IT Manual' : 'Employee'),
      action: existing?.action && existing.action !== 'Updated' ? existing.action : (fin.new_value || fin.action),
      details: fin.new_value || existing?.details || fin.action,
      date: existing?.date || date,
      time: loggedTime || existing?.time || time,
      timestamp: existing?.timestamp || timestamp,
      record_id: fin.record_id || existing?.record_id,
      source: existing ? 'merged' : 'finance_audit_logs',
    });
  }

  return Array.from(mergedMap.values()).sort((a, b) => {
    const keyA = `${a.date || ''} ${a.time || ''}`;
    const keyB = `${b.date || ''} ${b.time || ''}`;
    if (keyA !== keyB) return keyB.localeCompare(keyA);
    return (b.timestamp || 0) - (a.timestamp || 0);
  });
}

/**
 * Normalizes a raw attendance document from Firestore (`attendance` or `employee_attendance`)
 * so both schemas (`check_in_time`/`check_out_time` and `clock_in`/`clock_out`) work seamlessly,
 * resolves employee names, attaches matched login/logout times, and computes working hours.
 */
export function normalizeAttendanceRecord(
  raw: any,
  employees: Employee[] = [],
  loginLogs: AttendanceLoginLog[] = []
): AttendanceRecord {
  const rawIn = raw.clock_in || raw.check_in_time || '';
  const rawOutCandidate = raw.clock_out || raw.check_out_time || '';
  const rawOut = rawOutCandidate === '--' || rawOutCandidate === '-' ? '' : rawOutCandidate;

  const cleanIn = normalizeTimeHHMM(rawIn) || String(rawIn || '').trim();
  const cleanOut = rawOut ? (normalizeTimeHHMM(rawOut) || String(rawOut).trim()) : '';

  const calc = calculateWorkingHours(cleanIn, cleanOut || undefined);
  const resolvedName = resolveEmployeeDisplayName(raw.employee_id, raw.employee_name, employees);
  const dateStr = String(raw.date || '').trim();

  // Match employee log-in / log-out timestamps for this date if available
  let loginTime = raw.login_time || '';
  let logoutTime = raw.logout_time || '';
  if (dateStr && loginLogs.length > 0 && !raw.reset_by_it) {
    const dayLogs = loginLogs.filter(
      l =>
        l.date === dateStr &&
        ((raw.employee_id && l.employee_id === raw.employee_id) ||
          (raw.employee_id && l.record_id === raw.employee_id) ||
          l.employee_name.toLowerCase() === resolvedName.toLowerCase())
    );
    const loginEntry = [...dayLogs]
      .reverse()
      .find(l => /log\s*in|logged\s*in|clocked\s*in/i.test(`${l.action} ${l.details}`));
    const logoutEntry = dayLogs.find(l => /log\s*out|logged\s*out|clocked\s*out/i.test(`${l.action} ${l.details}`));
    if (!loginTime && loginEntry?.time) loginTime = loginEntry.time;
    if (!logoutTime && logoutEntry?.time) logoutTime = logoutEntry.time;
  }
  if (raw.reset_by_it && !cleanIn) loginTime = '';
  if (raw.reset_by_it && !cleanOut) logoutTime = '';

  const isEditedByIT = raw.reset_by_it
    ? raw.entry_source === 'IT Manual'
    : (
        raw.entry_source === 'IT Manual' ||
        raw.recorded_by === 'IT' ||
        loginLogs.some(
          l =>
            l.record_id === raw.id &&
            /attendance edited|manual/i.test(`${l.action} ${l.details}`)
        )
      );

  const originalAttendanceStatus =
    raw.attendance_status ||
    (raw.status === 'Present' || raw.status === 'Late' || raw.status === 'Absent' ? raw.status : undefined);

  const shiftCompleted = Boolean(cleanIn && cleanOut);
  const effectiveHours = shiftCompleted ? calc.working_hours : 0;
  const effectiveFormatted = shiftCompleted
    ? calc.working_hours_formatted
    : (raw.total_working_hours && raw.total_working_hours !== '--' ? raw.total_working_hours : '0h 00m');

  return {
    ...raw,
    id: raw.id || raw.attendance_id || `ATT-${Date.now()}`,
    attendance_id: raw.attendance_id || raw.id,
    employee_id: raw.employee_id || '',
    employee_name: resolvedName,
    date: dateStr,
    clock_in: cleanIn,
    clock_out: cleanOut,
    check_in_time: cleanIn,
    check_out_time: cleanOut,
    working_hours: effectiveHours,
    working_hours_formatted: effectiveFormatted,
    total_working_hours: shiftCompleted ? calc.working_hours_formatted : '--',
    late_minutes: Number(raw.late_minutes) || 0,
    early_departure_minutes: Number(raw.early_departure_minutes) || 0,
    attendance_status: originalAttendanceStatus || (Number(raw.late_minutes) > 0 ? 'Late' : 'Present'),
    status: shiftCompleted ? 'Completed' : 'Clocked In',
    entry_source: isEditedByIT ? 'IT Manual' : (raw.entry_source || 'Employee'),
    recorded_by: raw.recorded_by || (isEditedByIT ? 'IT' : resolvedName),
    reset_by_it: Boolean(raw.reset_by_it),
    reset_at: raw.reset_at,
    login_time: loginTime || cleanIn || undefined,
    logout_time: logoutTime || cleanOut || undefined,
    notes: raw.notes || '',
    created_at: raw.created_at || raw.createdAt,
    updated_at: raw.updated_at || raw.updatedAt,
    createdAt: raw.createdAt || raw.created_at,
    updatedAt: raw.updatedAt || raw.updated_at,
  };
}
