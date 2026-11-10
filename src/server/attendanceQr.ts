import crypto from 'crypto';
import { ATTENDANCE_TIMEZONE } from './geofencing';

/**
 * Monthly attendance QR.
 *
 * The token is an HMAC of the attendance month, so every month automatically
 * produces a new code and the previous one stops working on the 1st. The secret
 * lives on the server only; the browser never receives it.
 */
export const ATTENDANCE_QR_COLLECTION = 'attendance_qr_settings';
export const ATTENDANCE_QR_DOC_ID = 'main';

const TOKEN_LENGTH = 16;
const TOKEN_PREFIX = 'sofia-attendance-qr';

export interface AttendanceQrConfig {
  id: string;
  is_enabled: boolean;
  secret: string;
  updated_by?: string;
  updated_at?: string;
  created_at?: string;
}

export function createAttendanceQrSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function resolveAttendanceMonth(
  now: Date = new Date(),
  timeZone: string = ATTENDANCE_TIMEZONE
): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(now);
  const get = (type: string) => parts.find(part => part.type === type)?.value || '';
  return `${get('year')}-${get('month')}`;
}

export function attendanceMonthBounds(month: string): { valid_from: string; valid_until: string } {
  const [year, monthNumber] = month.split('-').map(Number);
  if (!Number.isFinite(year) || !Number.isFinite(monthNumber)) {
    return { valid_from: '', valid_until: '' };
  }
  const start = new Date(Date.UTC(year, monthNumber - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, monthNumber, 1, 0, 0, 0) - 1);
  return { valid_from: start.toISOString(), valid_until: end.toISOString() };
}

export function buildAttendanceQrToken(secret: string, month: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(`${TOKEN_PREFIX}|${month}`)
    .digest('hex')
    .slice(0, TOKEN_LENGTH)
    .toUpperCase();
}

/** Accepts tokens that were pasted with spaces/dashes and any letter case. */
export function normalizeAttendanceQrToken(value: unknown): string {
  return String(value || '').replace(/[^0-9a-z]/gi, '').toUpperCase();
}

export function verifyAttendanceQrToken(
  secret: string,
  token: unknown,
  now: Date = new Date(),
  timeZone: string = ATTENDANCE_TIMEZONE
): { valid: boolean; month: string } {
  const month = resolveAttendanceMonth(now, timeZone);
  const submitted = normalizeAttendanceQrToken(token);
  const expected = buildAttendanceQrToken(secret, month);
  if (!submitted || submitted.length !== expected.length) {
    return { valid: false, month };
  }
  const valid = crypto.timingSafeEqual(Buffer.from(submitted), Buffer.from(expected));
  return { valid, month };
}

export function normalizeAttendanceQrConfig(raw: any, secret: string): AttendanceQrConfig {
  return {
    id: String(raw?.id || ATTENDANCE_QR_DOC_ID),
    is_enabled: raw?.is_enabled === true,
    secret: String(raw?.secret || secret),
    updated_by: raw?.updated_by ? String(raw.updated_by) : undefined,
    updated_at: raw?.updated_at ? String(raw.updated_at) : undefined,
    created_at: raw?.created_at ? String(raw.created_at) : undefined,
  };
}
