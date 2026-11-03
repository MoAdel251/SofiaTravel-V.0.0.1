import { Employee } from '../types';

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
 * Parses a time string ("HH:mm", "HH:mm:ss", "hh:mm AM/PM", or ISO datetime)
 * into total seconds since midnight (0 - 86399).
 */
export function parseTimeToSeconds(timeStr?: string | null): number | null {
  if (!timeStr) return null;
  const raw = String(timeStr).trim();
  if (!raw) return null;

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

  if (inSec === null) {
    return {
      working_hours: 0,
      working_hours_formatted: '0h 00m',
      total_minutes: 0,
      status: 'Clocked In',
    };
  }

  if (outSec === null) {
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
  return formatted ? `${formatted} (${safeHours.toFixed(2)} hrs)` : `${h}h ${String(m).padStart(2, '0')}m (${safeHours.toFixed(2)} hrs)`;
}
