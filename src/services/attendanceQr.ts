/**
 * Client helpers for the monthly attendance QR code.
 *
 * The QR code encodes a token generated on the server from the current
 * attendance month, so the printed code stays identical all month and rotates
 * automatically on the 1st. The client only stores the scanned token; the
 * server makes the final decision on every clock-in / clock-out.
 */

const TOKEN_STORAGE_KEY = 'sofia_attendance_qr_token';
const MONTH_STORAGE_KEY = 'sofia_attendance_qr_month';
const URL_PARAM = 'clock';

export interface AttendanceQrStatus {
  is_enabled: boolean;
  month: string;
}

export interface AttendanceQrPayload {
  month: string;
  token: string;
  is_enabled: boolean;
  valid_from: string;
  valid_until: string;
  checked_at: string;
}

export function normalizeAttendanceQrToken(value: unknown): string {
  return String(value || '').replace(/[^0-9a-z]/gi, '').toUpperCase();
}

export function getStoredAttendanceQrToken(): string {
  try {
    return normalizeAttendanceQrToken(window.localStorage.getItem(TOKEN_STORAGE_KEY));
  } catch {
    return '';
  }
}

export function storeAttendanceQrToken(token: string, month?: string): string {
  const normalized = normalizeAttendanceQrToken(token);
  try {
    if (!normalized) {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      window.localStorage.removeItem(MONTH_STORAGE_KEY);
      return '';
    }
    window.localStorage.setItem(TOKEN_STORAGE_KEY, normalized);
    if (month) window.localStorage.setItem(MONTH_STORAGE_KEY, month);
  } catch {
    /* storage unavailable (private mode) — the token still works for this session */
  }
  return normalized;
}

export function clearStoredAttendanceQrToken(): void {
  storeAttendanceQrToken('');
}

export function getStoredAttendanceQrMonth(): string {
  try {
    return String(window.localStorage.getItem(MONTH_STORAGE_KEY) || '');
  } catch {
    return '';
  }
}

/**
 * Reads `?clock=TOKEN` from the address bar after the employee scans the
 * printed office QR code, stores it and removes it from the URL.
 */
export function captureAttendanceQrFromUrl(): string {
  if (typeof window === 'undefined') return '';
  try {
    const url = new URL(window.location.href);
    const raw = url.searchParams.get(URL_PARAM);
    if (!raw) return '';
    const token = storeAttendanceQrToken(raw);
    url.searchParams.delete(URL_PARAM);
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    return token;
  } catch {
    return '';
  }
}

export function buildAttendanceQrUrl(token: string): string {
  if (typeof window === 'undefined') return `/?clock=${normalizeAttendanceQrToken(token)}`;
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set(URL_PARAM, normalizeAttendanceQrToken(token));
  return url.toString();
}

function actingHeaders(actingUser?: string, actingRole?: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    ...(actingUser ? { 'x-acting-user': actingUser } : {}),
    ...(actingRole ? { 'x-acting-role': actingRole } : {}),
  };
}

export async function getAttendanceQrStatus(): Promise<AttendanceQrStatus | null> {
  try {
    const res = await fetch(`/api/attendance/qr/status?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      is_enabled: data?.is_enabled === true,
      month: String(data?.month || ''),
    };
  } catch {
    return null;
  }
}

export async function fetchAttendanceQr(
  actingUser: string,
  actingRole: string
): Promise<AttendanceQrPayload | null> {
  try {
    const res = await fetch(`/api/attendance/qr?t=${Date.now()}`, {
      headers: actingHeaders(actingUser, actingRole),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.token) return null;
    return {
      month: String(data.month || ''),
      token: normalizeAttendanceQrToken(data.token),
      is_enabled: data.is_enabled === true,
      valid_from: String(data.valid_from || ''),
      valid_until: String(data.valid_until || ''),
      checked_at: String(data.checked_at || ''),
    };
  } catch {
    return null;
  }
}

export async function saveAttendanceQrSettings(
  isEnabled: boolean,
  actingUser: string,
  actingRole: string
): Promise<AttendanceQrPayload | null> {
  try {
    const res = await fetch('/api/attendance/qr/settings', {
      method: 'PUT',
      headers: actingHeaders(actingUser, actingRole),
      body: JSON.stringify({ is_enabled: isEnabled, _actingUser: actingUser, _actingRole: actingRole }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.token) return null;
    return {
      month: String(data.month || ''),
      token: normalizeAttendanceQrToken(data.token),
      is_enabled: data.is_enabled === true,
      valid_from: String(data.valid_from || ''),
      valid_until: String(data.valid_until || ''),
      checked_at: String(data.checked_at || ''),
    };
  } catch {
    return null;
  }
}
