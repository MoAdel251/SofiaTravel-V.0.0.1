/**
 * Server-only geofencing helpers.
 *
 * All distance calculations and decisions MUST run on the server. The browser
 * only supplies raw coordinates collected from the Geolocation API; it never
 * decides whether an employee is inside the authorized area.
 */

export const GEOFENCE_COLLECTION = 'company_geofencing';
export const GEOFENCE_CONFIG_DOC_ID = 'main';
export const GEOFENCE_VERIFICATION_LOG_COLLECTION = 'attendance_verification_logs';
export const DEFAULT_ALLOWED_RADIUS_METERS = 50;
export const MIN_ALLOWED_RADIUS_METERS = 5;
export const MAX_ALLOWED_RADIUS_METERS = 10000;
export const MAX_ACCURACY_CAP_METERS = 100;
export const ATTENDANCE_TIMEZONE = process.env.ATTENDANCE_TIMEZONE || 'Africa/Cairo';

const EARTH_RADIUS_METERS = 6371000;

export interface CompanyGeofencingConfig {
  id: string;
  company_latitude: number | null;
  company_longitude: number | null;
  allowed_radius_meters: number;
  is_enabled: boolean;
  store_coordinates: boolean;
  updated_by?: string;
  updated_at?: string;
  created_at?: string;
}

export type GeofenceReasonCode =
  | 'WITHIN_GEOFENCE'
  | 'GEOFENCING_DISABLED'
  | 'GEOFENCE_NOT_CONFIGURED'
  | 'LOCATION_REQUIRED'
  | 'LOCATION_ACCURACY_UNAVAILABLE'
  | 'LOCATION_ACCURACY_LOW'
  | 'OUTSIDE_GEOFENCE'
  | 'INVALID_ACTION'
  | 'AUTH_REQUIRED'
  | 'IDENTITY_MISMATCH'
  | 'EMPLOYEE_INACTIVE'
  | 'ALREADY_CLOCKED_IN'
  | 'NO_OPEN_SHIFT'
  | 'QR_REQUIRED'
  | 'QR_INVALID';

export interface GeofenceDecision {
  allowed: boolean;
  reasonCode: GeofenceReasonCode;
  distanceMeters: number | null;
  accuracyMeters: number | null;
  radiusMeters: number;
  maxAccuracyMeters: number;
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function isValidLatitude(value: unknown): value is number {
  return isFiniteNumber(value) && value >= -90 && value <= 90;
}

export function isValidLongitude(value: unknown): value is number {
  return isFiniteNumber(value) && value >= -180 && value <= 180;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Great-circle distance between two coordinates using the Haversine formula.
 * Returns meters.
 */
export function haversineDistanceMeters(
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number
): number {
  const dLat = toRadians(latitude2 - latitude1);
  const dLon = toRadians(longitude2 - longitude1);
  const lat1 = toRadians(latitude1);
  const lat2 = toRadians(latitude2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

export function clampRadiusMeters(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_ALLOWED_RADIUS_METERS;
  return Math.min(MAX_ALLOWED_RADIUS_METERS, Math.max(MIN_ALLOWED_RADIUS_METERS, Math.round(parsed)));
}

/**
 * Maximum acceptable GPS accuracy for the configured radius. A tighter radius
 * requires a more precise fix, and we never accept worse than 100 m.
 */
export function resolveMaxAccuracyMeters(radiusMeters: number): number {
  const safeRadius = clampRadiusMeters(radiusMeters);
  return Math.max(25, Math.min(MAX_ACCURACY_CAP_METERS, safeRadius));
}

export function normalizeGeofencingConfig(raw: any): CompanyGeofencingConfig {
  const rawLatitude = raw?.company_latitude;
  const rawLongitude = raw?.company_longitude;
  const latitude = rawLatitude === null || rawLatitude === undefined || rawLatitude === ''
    ? NaN
    : Number(rawLatitude);
  const longitude = rawLongitude === null || rawLongitude === undefined || rawLongitude === ''
    ? NaN
    : Number(rawLongitude);
  return {
    id: String(raw?.id || GEOFENCE_CONFIG_DOC_ID),
    company_latitude: isValidLatitude(latitude) ? latitude : null,
    company_longitude: isValidLongitude(longitude) ? longitude : null,
    allowed_radius_meters: clampRadiusMeters(raw?.allowed_radius_meters),
    is_enabled: raw?.is_enabled === true,
    store_coordinates: raw?.store_coordinates !== false,
    updated_by: raw?.updated_by ? String(raw.updated_by) : undefined,
    updated_at: raw?.updated_at ? String(raw.updated_at) : undefined,
    created_at: raw?.created_at ? String(raw.created_at) : undefined,
  };
}

export function isCompanyLocationConfigured(config: CompanyGeofencingConfig): boolean {
  return isValidLatitude(config.company_latitude) && isValidLongitude(config.company_longitude);
}

/**
 * Evaluate an attendance request against the server-side company geofence.
 * The result is authoritative for the attendance workflow.
 */
export function evaluateGeofence(
  config: CompanyGeofencingConfig,
  latitude: unknown,
  longitude: unknown,
  accuracyMeters: unknown
): GeofenceDecision {
  const radiusMeters = clampRadiusMeters(config.allowed_radius_meters);
  const maxAccuracyMeters = resolveMaxAccuracyMeters(radiusMeters);

  if (!config.is_enabled) {
    return {
      allowed: true,
      reasonCode: 'GEOFENCING_DISABLED',
      distanceMeters: null,
      accuracyMeters: isFiniteNumber(accuracyMeters) ? Number(accuracyMeters) : null,
      radiusMeters,
      maxAccuracyMeters,
    };
  }

  if (!isCompanyLocationConfigured(config)) {
    return {
      allowed: false,
      reasonCode: 'GEOFENCE_NOT_CONFIGURED',
      distanceMeters: null,
      accuracyMeters: isFiniteNumber(accuracyMeters) ? Number(accuracyMeters) : null,
      radiusMeters,
      maxAccuracyMeters,
    };
  }

  if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) {
    return {
      allowed: false,
      reasonCode: 'LOCATION_REQUIRED',
      distanceMeters: null,
      accuracyMeters: isFiniteNumber(accuracyMeters) ? Number(accuracyMeters) : null,
      radiusMeters,
      maxAccuracyMeters,
    };
  }

  const accuracy = Number(accuracyMeters);
  if (!isFiniteNumber(accuracy) || accuracy <= 0) {
    return {
      allowed: false,
      reasonCode: 'LOCATION_ACCURACY_UNAVAILABLE',
      distanceMeters: null,
      accuracyMeters: null,
      radiusMeters,
      maxAccuracyMeters,
    };
  }

  const distanceMeters = haversineDistanceMeters(
    latitude,
    longitude,
    config.company_latitude as number,
    config.company_longitude as number
  );

  if (accuracy > maxAccuracyMeters) {
    return {
      allowed: false,
      reasonCode: 'LOCATION_ACCURACY_LOW',
      distanceMeters,
      accuracyMeters: accuracy,
      radiusMeters,
      maxAccuracyMeters,
    };
  }

  if (distanceMeters > radiusMeters) {
    return {
      allowed: false,
      reasonCode: 'OUTSIDE_GEOFENCE',
      distanceMeters,
      accuracyMeters: accuracy,
      radiusMeters,
      maxAccuracyMeters,
    };
  }

  return {
    allowed: true,
    reasonCode: 'WITHIN_GEOFENCE',
    distanceMeters,
    accuracyMeters: accuracy,
    radiusMeters,
    maxAccuracyMeters,
  };
}

/**
 * Server-generated attendance date/time. Device clocks are never trusted.
 */
export function getServerAttendanceTime(timeZone: string = ATTENDANCE_TIMEZONE): {
  date: string;
  time: string;
  iso: string;
} {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const get = (type: string) => parts.find(p => p.type === type)?.value || '';
  let hour = get('hour');
  if (hour === '24') hour = '00';

  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${hour}:${get('minute')}`,
    iso: now.toISOString(),
  };
}

export const GEOFENCE_MESSAGES: Record<
  GeofenceReasonCode | 'ATTENDANCE_REGISTERED' | 'DEPARTURE_REGISTERED',
  { en: string; ar: string }
> = {
  WITHIN_GEOFENCE: {
    en: 'Location verified. Attendance registered successfully.',
    ar: 'تم التحقق من الموقع. تم تسجيل الحضور بنجاح.',
  },
  GEOFENCING_DISABLED: {
    en: 'Attendance registered successfully.',
    ar: 'تم تسجيل الحضور بنجاح.',
  },
  GEOFENCE_NOT_CONFIGURED: {
    en: 'Attendance verification is not configured. Please contact the IT administrator.',
    ar: 'التحقق من الموقع غير مُهيأ. يرجى التواصل مع مسؤول تقنية المعلومات.',
  },
  LOCATION_REQUIRED: {
    en: 'Unable to determine your location. Please try again.',
    ar: 'تعذر تحديد موقعك. يرجى المحاولة مرة أخرى.',
  },
  LOCATION_ACCURACY_UNAVAILABLE: {
    en: 'Unable to determine your location accurately. Please try again.',
    ar: 'تعذر تحديد موقعك بدقة. يرجى المحاولة مرة أخرى.',
  },
  LOCATION_ACCURACY_LOW: {
    en: 'Your location accuracy is too low. Please move to an open area and try again.',
    ar: 'دقة موقعك منخفضة جداً. يرجى الانتقال إلى مكان مفتوح والمحاولة مرة أخرى.',
  },
  OUTSIDE_GEOFENCE: {
    en: "You are outside the company's authorized location. Please move closer to the company building.",
    ar: 'أنت خارج الموقع المعتمد للشركة. يرجى الاقتراب من مبنى الشركة.',
  },
  INVALID_ACTION: {
    en: 'Unable to register attendance. Please try again.',
    ar: 'تعذر تسجيل الحضور. يرجى المحاولة مرة أخرى.',
  },
  AUTH_REQUIRED: {
    en: 'Unable to verify your employee account. Please sign in again.',
    ar: 'تعذر التحقق من حساب الموظف. يرجى تسجيل الدخول مرة أخرى.',
  },
  IDENTITY_MISMATCH: {
    en: 'Unable to verify your employee account. Please sign in again.',
    ar: 'تعذر التحقق من حساب الموظف. يرجى تسجيل الدخول مرة أخرى.',
  },
  EMPLOYEE_INACTIVE: {
    en: 'Your employee account is not active. Please contact the IT administrator.',
    ar: 'حساب الموظف غير نشط. يرجى التواصل مع مسؤول تقنية المعلومات.',
  },
  ALREADY_CLOCKED_IN: {
    en: 'You already have an open clock-in session.',
    ar: 'لديك جلسة حضور مفتوحة بالفعل.',
  },
  NO_OPEN_SHIFT: {
    en: 'No active clock-in session found.',
    ar: 'لا يوجد تسجيل حضور مفتوح حالياً.',
  },
  QR_REQUIRED: {
    en: 'Scan the office attendance QR code before clocking in or out.',
    ar: 'يرجى مسح رمز QR الخاص بالحضور في المكتب قبل تسجيل الحضور أو الانصراف.',
  },
  QR_INVALID: {
    en: 'This attendance QR code is not valid for the current month. Please scan the code shown at the office.',
    ar: 'رمز QR هذا غير صالح للشهر الحالي. يرجى مسح الرمز المعروض في المكتب.',
  },
  ATTENDANCE_REGISTERED: {
    en: 'Attendance registered successfully.',
    ar: 'تم تسجيل الحضور بنجاح.',
  },
  DEPARTURE_REGISTERED: {
    en: 'Departure registered successfully.',
    ar: 'تم تسجيل الانصراف بنجاح.',
  },
};
