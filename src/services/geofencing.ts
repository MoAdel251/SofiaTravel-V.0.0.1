import type { AttendanceRecord } from '../types';

export type GeofenceReasonCode =
  | 'WITHIN_GEOFENCE'
  | 'GEOFENCING_DISABLED'
  | 'GEOFENCE_NOT_CONFIGURED'
  | 'LOCATION_REQUIRED'
  | 'LOCATION_ACCURACY_UNAVAILABLE'
  | 'LOCATION_ACCURACY_LOW'
  | 'OUTSIDE_GEOFENCE'
  | 'INVALID_ACTION'
  | 'LOCATION_PERMISSION_DENIED'
  | 'LOCATION_UNAVAILABLE'
  | 'LOCATION_TIMEOUT'
  | 'LOCATION_INSECURE_CONTEXT'
  | 'AUTH_REQUIRED'
  | 'IDENTITY_MISMATCH'
  | 'EMPLOYEE_INACTIVE'
  | 'ALREADY_CLOCKED_IN'
  | 'NO_OPEN_SHIFT'
  | 'INVALID_QR_CODE'
  | 'QR_TOKEN_EXPIRED'
  | 'QR_TOKEN_REVOKED'
  | 'SERVER_UNAVAILABLE'
  | 'SERVER_ERROR';

export interface GeofenceStatus {
  is_enabled: boolean;
  configured: boolean;
  max_accuracy_meters: number;
}

export interface BrowserPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export type SelfAttendanceAction = 'clock_in' | 'clock_out';

export interface SubmitSelfAttendanceParams {
  employeeId: string;
  employeeName: string;
  action: SelfAttendanceAction;
  actingUser: string;
  actingRole?: string;
  position?: BrowserPosition | null;
  /** Optional attendance QR token scanned at the office entrance. */
  qrCode?: string | null;
}

export type SelfAttendanceResult =
  | { ok: true; record: AttendanceRecord; messageEn: string; messageAr: string }
  | { ok: false; code: GeofenceReasonCode; messageEn: string; messageAr: string; status: number };

const MESSAGES: Record<GeofenceReasonCode, { en: string; ar: string }> = {
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
  LOCATION_PERMISSION_DENIED: {
    en: 'Please enable location services to register your attendance.',
    ar: 'يرجى تفعيل خدمات الموقع لتسجيل الحضور.',
  },
  LOCATION_UNAVAILABLE: {
    en: 'Unable to determine your location. Please try again.',
    ar: 'تعذر تحديد موقعك. يرجى المحاولة مرة أخرى.',
  },
  LOCATION_TIMEOUT: {
    en: 'Unable to determine your location. Please try again.',
    ar: 'تعذر تحديد موقعك. يرجى المحاولة مرة أخرى.',
  },
  LOCATION_INSECURE_CONTEXT: {
    en: 'Location services require a secure HTTPS connection.',
    ar: 'تتطلب خدمات الموقع اتصالاً آمناً عبر HTTPS.',
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
  INVALID_QR_CODE: {
    en: 'This attendance QR code is invalid. Please scan the official company QR code.',
    ar: 'رمز QR للحضور غير صالح. يرجى مسح رمز الشركة الرسمي.',
  },
  QR_TOKEN_EXPIRED: {
    en: 'This attendance QR code has expired. Please ask IT to generate a new one.',
    ar: 'انتهت صلاحية رمز QR للحضور. يرجى طلب رمز جديد من تقنية المعلومات.',
  },
  QR_TOKEN_REVOKED: {
    en: 'This attendance QR code has been revoked by IT. Please scan the current code.',
    ar: 'تم إلغاء رمز QR للحضور بواسطة تقنية المعلومات. يرجى مسح الرمز الحالي.',
  },
  SERVER_UNAVAILABLE: {
    en: 'Unable to verify your location with the server. Please try again.',
    ar: 'تعذر التحقق من موقعك عبر الخادم. يرجى المحاولة مرة أخرى.',
  },
  SERVER_ERROR: {
    en: 'Unable to register attendance. Please try again.',
    ar: 'تعذر تسجيل الحضور. يرجى المحاولة مرة أخرى.',
  },
};

export function getGeofenceMessage(code: GeofenceReasonCode, isAr: boolean, fallback?: string): string {
  return MESSAGES[code]?.[isAr ? 'ar' : 'en'] || fallback || MESSAGES.SERVER_ERROR[isAr ? 'ar' : 'en'];
}

export async function getGeofenceStatus(): Promise<GeofenceStatus | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`/api/geofencing/status?t=${Date.now()}`, {
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      is_enabled: data?.is_enabled === true,
      configured: data?.configured === true,
      max_accuracy_meters: Number(data?.max_accuracy_meters) || 100,
    };
  } catch {
    return null;
  }
}

function positionErrorCode(error: GeolocationPositionError): GeofenceReasonCode {
  if (error.code === error.PERMISSION_DENIED) return 'LOCATION_PERMISSION_DENIED';
  if (error.code === error.TIMEOUT) return 'LOCATION_TIMEOUT';
  return 'LOCATION_UNAVAILABLE';
}

function getCurrentPositionOnce(options: PositionOptions): Promise<BrowserPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      position => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      error => reject(error),
      options
    );
  });
}

/**
 * Collects a browser GPS fix with high accuracy. Retries a few times when the
 * reported accuracy is too coarse. The server still makes the final decision.
 */
export async function getBrowserPosition(maxAccuracyMeters = 100): Promise<BrowserPosition> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    throw new Error('LOCATION_UNAVAILABLE');
  }
  if (typeof window !== 'undefined' && window.isSecureContext === false) {
    throw new Error('LOCATION_INSECURE_CONTEXT');
  }

  if (typeof navigator.permissions?.query === 'function') {
    try {
      const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      if (status.state === 'denied') {
        throw new Error('LOCATION_PERMISSION_DENIED');
      }
    } catch (err: any) {
      if (err?.message === 'LOCATION_PERMISSION_DENIED') throw err;
    }
  }

  const attempts = 3;
  let best: BrowserPosition | null = null;
  let lastError: any = null;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const position = await getCurrentPositionOnce({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      });
      if (!best || position.accuracy < best.accuracy) {
        best = position;
      }
      if (position.accuracy <= maxAccuracyMeters) {
        return position;
      }
    } catch (err: any) {
      lastError = err;
      if (err?.code === 1) {
        throw new Error('LOCATION_PERMISSION_DENIED');
      }
    }
    if (attempt < attempts - 1) {
      await new Promise(resolve => setTimeout(resolve, 700));
    }
  }

  if (best) {
    if (best.accuracy > maxAccuracyMeters) {
      throw new Error('LOCATION_ACCURACY_LOW');
    }
    return best;
  }

  if (lastError && typeof lastError.code === 'number') {
    throw new Error(positionErrorCode(lastError));
  }
  throw new Error('LOCATION_UNAVAILABLE');
}

export async function submitSelfAttendance({
  employeeId,
  employeeName,
  action,
  actingUser,
  actingRole,
  position,
  qrCode: qrCodeInput,
}: SubmitSelfAttendanceParams): Promise<SelfAttendanceResult> {
  const body: Record<string, any> = {
    employee_id: employeeId,
    employee_name: employeeName,
    action,
  };
  if (position) {
    body.latitude = position.latitude;
    body.longitude = position.longitude;
    body.accuracy = position.accuracy;
  }
  const qrCode = String(qrCodeInput || '').trim();
  if (qrCode) {
    body.qr_code = qrCode;
  }
  try {
    const nav: any = typeof navigator !== 'undefined' ? navigator : null;
    if (nav) {
      body.platform = String(nav.userAgentData?.platform || nav.platform || '');
      body.language = String(nav.language || '');
    }
  } catch {}

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    const res = await fetch('/api/attendance/self', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(actingUser ? { 'x-acting-user': actingUser } : {}),
        ...(actingRole ? { 'x-acting-role': actingRole } : {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timer);
    const data = await res.json().catch(() => ({}));

    if (res.ok && data?.record) {
      return {
        ok: true,
        record: data.record,
        messageEn: data.message || MESSAGES.WITHIN_GEOFENCE.en,
        messageAr: data.message_ar || MESSAGES.WITHIN_GEOFENCE.ar,
      };
    }

    const code = String(data?.code || 'SERVER_ERROR') as GeofenceReasonCode;
    return {
      ok: false,
      code,
      status: res.status,
      messageEn: data?.error || data?.message || getGeofenceMessage(code, false),
      messageAr: data?.message_ar || getGeofenceMessage(code, true),
    };
  } catch {
    return {
      ok: false,
      code: 'SERVER_UNAVAILABLE',
      status: 0,
      messageEn: MESSAGES.SERVER_UNAVAILABLE.en,
      messageAr: MESSAGES.SERVER_UNAVAILABLE.ar,
    };
  }
}
