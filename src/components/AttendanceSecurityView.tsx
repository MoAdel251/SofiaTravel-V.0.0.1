import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  MapPin, ShieldCheck, RefreshCw, AlertTriangle, Smartphone, Monitor,
  Tablet, CheckCircle2, XCircle, Users, Search, ListFilter, Fingerprint, ExternalLink,
  QrCode, Printer, Copy, CalendarClock,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { Employee, UserRole } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { formatDateTime, hrFetch, type ActingContext } from '../services/hrApi';
import { AttendanceMap, type AttendanceMapPoint } from './AttendanceMap';
import {
  buildAttendanceQrUrl,
  saveAttendanceQrSettings,
  type AttendanceQrPayload,
} from '../services/attendanceQr';

interface AttendanceSecurityViewProps {
  employees: Employee[];
  currentUsername: string;
  userRole: UserRole;
  isAdmin: boolean;
  isITAccount: boolean;
  onShowToast?: (message: string) => void;
}

interface SecurityDeviceInfo {
  device_type?: string;
  os?: string;
  browser?: string;
  browser_version?: string;
  device_fingerprint?: string;
}

interface SecurityLog {
  id: string;
  employee_id: string;
  employee_name: string;
  action: string;
  outcome: 'allowed' | 'blocked';
  result: string;
  distance_meters: number | null;
  accuracy_meters: number | null;
  radius_meters: number | null;
  verified_at: string;
  submitted_latitude?: number;
  submitted_longitude?: number;
  device_info?: SecurityDeviceInfo | null;
  qr_required?: boolean;
  qr_verified?: boolean;
  qr_month?: string;
  qr_token_supplied?: boolean;
}

interface SecurityAttendance {
  id: string;
  employee_id: string;
  employee_name: string;
  date: string;
  clock_in: string;
  clock_out: string;
  status: string;
  attendance_location?: { latitude: number; longitude: number; accuracy: number; recorded_at: string } | null;
  check_in_location?: { latitude: number; longitude: number; accuracy: number; recorded_at: string } | null;
  check_out_location?: { latitude: number; longitude: number; accuracy: number; recorded_at: string } | null;
  device_info?: SecurityDeviceInfo | null;
  check_in_device_info?: SecurityDeviceInfo | null;
  check_out_device_info?: SecurityDeviceInfo | null;
  qr_verification?: { verified?: boolean; month?: string; action?: string; verified_at?: string } | null;
  location_verification_result?: string;
  location_verified_at?: string;
  geofence_verification?: { verification_result?: string; distance_meters?: number | null } | null;
  server_recorded_at?: string;
}

interface SecurityResponse {
  logs: SecurityLog[];
  attendance_records: SecurityAttendance[];
  totals: { returned: number; blocked: number; allowed: number };
}

interface GeofenceSettings {
  company_latitude: number | null;
  company_longitude: number | null;
  allowed_radius_meters: number;
  is_enabled: boolean;
}

function DeviceIcon({ type }: { type?: string }) {
  if (type === 'Mobile') return <Smartphone className="w-3.5 h-3.5" />;
  if (type === 'Tablet') return <Tablet className="w-3.5 h-3.5" />;
  return <Monitor className="w-3.5 h-3.5" />;
}

function deviceLabel(device: SecurityDeviceInfo | null | undefined): string {
  if (!device) return '—';
  const browser = [device.browser, device.browser_version].filter(Boolean).join(' ');
  return [device.device_type, device.os, browser].filter(Boolean).join(' · ') || '—';
}

export function AttendanceSecurityView({
  employees,
  currentUsername,
  userRole,
  isAdmin,
  isITAccount,
  onShowToast,
}: AttendanceSecurityViewProps) {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const L = (en: string, ar: string) => (isAr ? ar : en);

  const acting: ActingContext = useMemo(
    () => ({ username: currentUsername, role: isAdmin ? 'Administrator' : userRole, isIT: isITAccount }),
    [currentUsername, userRole, isAdmin, isITAccount]
  );

  const [data, setData] = useState<SecurityResponse>({ logs: [], attendance_records: [], totals: { returned: 0, blocked: 0, allowed: 0 } });
  const [settings, setSettings] = useState<GeofenceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'logs' | 'records'>('logs');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [qrInfo, setQrInfo] = useState<AttendanceQrPayload | null>(null);
  const [qrSaving, setQrSaving] = useState(false);
  const qrPrintRef = useRef<HTMLDivElement | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams();
      if (employeeFilter) query.set('employee_id', employeeFilter);
      if (outcomeFilter) query.set('outcome', outcomeFilter);
      if (actionFilter) query.set('action', actionFilter);
      if (fromDate) query.set('from', fromDate);
      if (toDate) query.set('to', toDate);
      query.set('limit', '400');

      const [security, geofence, qr] = await Promise.all([
        hrFetch<SecurityResponse>(`/api/attendance/security-logs?${query.toString()}`, acting),
        hrFetch<GeofenceSettings>('/api/geofencing/settings', acting).catch(() => null),
        hrFetch<AttendanceQrPayload>('/api/attendance/qr', acting).catch(() => null),
      ]);
      setData({
        logs: Array.isArray(security?.logs) ? security.logs : [],
        attendance_records: Array.isArray(security?.attendance_records) ? security.attendance_records : [],
        totals: security?.totals || { returned: 0, blocked: 0, allowed: 0 },
      });
      setSettings(geofence);
      setQrInfo(qr);
    } catch (err: any) {
      setError(err?.message || L('Unable to load attendance security data.', 'تعذر تحميل بيانات أمن الحضور.'));
    } finally {
      setLoading(false);
    }
  }, [acting, employeeFilter, outcomeFilter, actionFilter, fromDate, toDate, isAr]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const toggleQrEnforcement = async () => {
    if (!qrInfo || qrSaving) return;
    setQrSaving(true);
    const next = !qrInfo.is_enabled;
    const saved = await saveAttendanceQrSettings(next, currentUsername, acting.role);
    setQrSaving(false);
    if (!saved) {
      onShowToast?.(L('Unable to update the attendance QR settings.', 'تعذر تحديث إعدادات رمز QR للحضور.'));
      return;
    }
    setQrInfo(saved);
    onShowToast?.(
      next
        ? L('QR scan is now required for clock-in / clock-out.', 'أصبح مسح رمز QR مطلوباً لتسجيل الحضور والانصراف.')
        : L('QR scan is now optional for clock-in / clock-out.', 'أصبح مسح رمز QR اختيارياً لتسجيل الحضور والانصراف.')
    );
  };

  const copyQrToken = async () => {
    if (!qrInfo) return;
    try {
      await navigator.clipboard.writeText(qrInfo.token);
      onShowToast?.(L('Attendance code copied.', 'تم نسخ رمز الحضور.'));
    } catch {
      onShowToast?.(qrInfo.token);
    }
  };

  const printQr = () => {
    const svg = qrPrintRef.current?.querySelector('svg');
    if (!svg || !qrInfo) return;
    const win = window.open('', '_blank', 'width=760,height=900');
    if (!win) {
      onShowToast?.(L('Please allow pop-ups to print the QR code.', 'يرجى السماح بالنوافذ المنبثقة لطباعة رمز QR.'));
      return;
    }
    const title = L('Monthly Attendance QR', 'رمز QR الشهري للحضور');
    const note = L(
      'Scan this code with your phone camera, then clock in or out from the attendance page.',
      'امسح هذا الرمز بكاميرا الهاتف، ثم سجّل الحضور أو الانصراف من صفحة الحضور.'
    );
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title} - ${qrInfo.month}</title>
      <style>
        body{font-family:Arial,Helvetica,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:95vh;margin:0;color:#0f172a}
        h1{font-size:22px;margin:0 0 4px}
        .month{font-size:15px;color:#475569;margin-bottom:18px}
        .code{margin-top:18px;font-family:monospace;font-size:16px;letter-spacing:3px;font-weight:bold}
        .note{max-width:340px;text-align:center;color:#475569;font-size:12px;margin-top:14px;line-height:1.5}
      </style></head><body>
      <h1>${title}</h1>
      <div class="month">${qrInfo.month} · ${qrInfo.valid_from.slice(0, 10)} → ${qrInfo.valid_until.slice(0, 10)}</div>
      ${svg.outerHTML}
      <div class="code">${qrInfo.token}</div>
      <div class="note">${note}</div>
      <script>window.onload=function(){setTimeout(function(){window.print();},250);};</script>
      </body></html>`);
    win.document.close();
  };

  const companyCenter = settings?.company_latitude != null && settings?.company_longitude != null
    ? { latitude: Number(settings.company_latitude), longitude: Number(settings.company_longitude) }
    : null;

  const mapPoints = useMemo<AttendanceMapPoint[]>(() => {
    const points: AttendanceMapPoint[] = [];
    const recordSignatures = new Set<string>();
    const signature = (lat: number, lng: number) => `${lat.toFixed(5)},${lng.toFixed(5)}`;

    const pushPoint = (point: AttendanceMapPoint, remember: boolean) => {
      if (!Number.isFinite(point.latitude) || !Number.isFinite(point.longitude)) return;
      if (remember) recordSignatures.add(signature(point.latitude, point.longitude));
      points.push(point);
    };

    for (const record of data.attendance_records) {
      const checkInDevice = record.check_in_device_info || record.device_info;
      const checkOutDevice = record.check_out_device_info;
      const result = record.geofence_verification?.verification_result
        || record.location_verification_result
        || '';
      const qr = record.qr_verification || null;
      const inLoc = record.check_in_location || record.attendance_location;

      if (inLoc) {
        pushPoint({
          id: `${record.id}-in`,
          latitude: Number(inLoc.latitude),
          longitude: Number(inLoc.longitude),
          label: record.employee_name,
          detail: `${L('Check-in', 'حضور')} · ${record.date} ${record.clock_in || ''}`,
          tone: 'allowed',
          employeeId: record.employee_id,
          action: 'clock_in',
          time: record.clock_in,
          result,
          deviceLabel: deviceLabel(checkInDevice),
          fingerprint: checkInDevice?.device_fingerprint || '',
          qrVerified: qr ? qr.verified === true : null,
          qrMonth: qr?.month || '',
        }, true);
      }

      if (record.check_out_location) {
        pushPoint({
          id: `${record.id}-out`,
          latitude: Number(record.check_out_location.latitude),
          longitude: Number(record.check_out_location.longitude),
          label: `${record.employee_name} (${L('out', 'انصراف')})`,
          detail: `${L('Check-out', 'انصراف')} · ${record.date} ${record.clock_out || ''}`,
          tone: 'neutral',
          employeeId: record.employee_id,
          action: 'clock_out',
          time: record.clock_out,
          result,
          deviceLabel: deviceLabel(checkOutDevice || checkInDevice),
          fingerprint: checkOutDevice?.device_fingerprint || '',
          qrVerified: qr ? qr.verified === true : null,
          qrMonth: qr?.month || '',
        }, true);
      }
    }

    // Verification logs keep the fingerprint of every attempt, including allowed
    // ones whose attendance record predates per-action device storage.
    for (const log of data.logs) {
      if (typeof log.submitted_latitude !== 'number' || typeof log.submitted_longitude !== 'number') continue;
      if (recordSignatures.has(signature(log.submitted_latitude, log.submitted_longitude))) continue;
      pushPoint({
        id: `log-${log.id}`,
        latitude: log.submitted_latitude,
        longitude: log.submitted_longitude,
        label: log.employee_name,
        detail: `${log.action === 'clock_out' ? L('Check-out', 'انصراف') : L('Check-in', 'حضور')} · ${formatDateTime(log.verified_at)}`,
        tone: log.outcome === 'allowed' ? 'allowed' : 'blocked',
        employeeId: log.employee_id,
        action: log.action,
        time: log.verified_at,
        result: log.result,
        distanceMeters: log.distance_meters,
        accuracyMeters: log.accuracy_meters,
        deviceLabel: deviceLabel(log.device_info),
        fingerprint: log.device_info?.device_fingerprint || '',
        qrVerified: typeof log.qr_verified === 'boolean' ? log.qr_verified : null,
        qrRequired: log.qr_required === true,
        qrMonth: log.qr_month || '',
      }, false);
    }

    return points;
  }, [data, isAr]);

  const selectedPoint = useMemo(
    () => (highlightedId ? mapPoints.find(point => point.id === highlightedId) || null : null),
    [highlightedId, mapPoints]
  );

  const employeesForFilter = useMemo(() => {
    const known = new Map<string, string>();
    employees.forEach(emp => known.set(emp.id, emp.name));
    data.logs.forEach(log => {
      if (log.employee_id) known.set(log.employee_id, log.employee_name || log.employee_id);
    });
    return Array.from(known.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [employees, data.logs]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-slate-900 rounded-xl text-white shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {L('Attendance Security & Location Review', 'أمن الحضور ومراجعة المواقع')}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {L(
              'Geofence decisions, device fingerprints, GPS coordinates and rejected attempts for every attendance transaction.',
              'قرارات النطاق الجغرافي وبصمات الأجهزة وإحداثيات GPS والمحاولات المرفوضة لكل عملية حضور.'
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadData()}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-100 self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {L('Refresh', 'تحديث')}
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="text-[11px] font-bold text-slate-500 uppercase">{L('Transactions checked', 'عمليات تم فحصها')}</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{data.totals.returned}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="text-[11px] font-bold text-slate-500 uppercase">{L('Inside geofence', 'داخل النطاق')}</div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">{data.totals.allowed}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="text-[11px] font-bold text-slate-500 uppercase">{L('Rejected attempts', 'محاولات مرفوضة')}</div>
          <div className="text-2xl font-extrabold text-rose-600 mt-1">{data.totals.blocked}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="text-[11px] font-bold text-slate-500 uppercase">{L('Geofencing status', 'حالة النطاق')}</div>
          <div className={`text-sm font-extrabold mt-2 ${settings?.is_enabled ? 'text-emerald-600' : 'text-slate-500'}`}>
            {settings?.is_enabled ? L('Enabled', 'مُفعّل') : L('Disabled', 'غير مُفعّل')}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {settings ? `${settings.allowed_radius_meters} m` : L('Not configured', 'غير مُهيأ')}
          </div>
        </div>
      </div>

      {/* Monthly attendance QR code */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row gap-5">
          <div className="flex flex-col items-center justify-center shrink-0">
            <div ref={qrPrintRef} className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
              {qrInfo ? (
                <QRCodeSVG value={buildAttendanceQrUrl(qrInfo.token)} size={176} level="M" />
              ) : (
                <div className="w-44 h-44 flex items-center justify-center text-slate-300">
                  <QrCode className="w-16 h-16" />
                </div>
              )}
            </div>
            <div className="mt-2 text-[11px] font-mono font-bold tracking-[0.2em] text-slate-700 break-all text-center">
              {qrInfo ? qrInfo.token : '— — — —'}
            </div>
          </div>

          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-cyan-600" />
                  {L('Monthly Attendance QR Code', 'رمز QR الشهري للحضور')}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {L(
                    'One code per month. It stays the same all month and rotates automatically on the 1st.',
                    'رمز واحد لكل شهر. يبقى ثابتاً طوال الشهر ويتغير تلقائياً في أول يوم من الشهر الجديد.'
                  )}
                </p>
              </div>
              <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                qrInfo?.is_enabled
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-50 text-slate-500 border-slate-200'
              }`}>
                {qrInfo?.is_enabled ? L('Scan required', 'المسح مطلوب') : L('Scan optional', 'المسح اختياري')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2">
                <div className="font-bold text-slate-500 uppercase flex items-center gap-1">
                  <CalendarClock className="w-3 h-3" /> {L('Month', 'الشهر')}
                </div>
                <div className="font-extrabold text-slate-800">{qrInfo?.month || '—'}</div>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2">
                <div className="font-bold text-slate-500 uppercase">{L('Valid period', 'فترة الصلاحية')}</div>
                <div className="font-semibold text-slate-800">
                  {qrInfo ? `${qrInfo.valid_from.slice(0, 10)} → ${qrInfo.valid_until.slice(0, 10)}` : '—'}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={printQr}
                disabled={!qrInfo}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold"
              >
                <Printer className="w-3.5 h-3.5" />
                {L('Print QR', 'طباعة الرمز')}
              </button>
              <button
                type="button"
                onClick={() => void copyQrToken()}
                disabled={!qrInfo}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 text-xs font-bold"
              >
                <Copy className="w-3.5 h-3.5" />
                {L('Copy code', 'نسخ الرمز')}
              </button>
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={qrInfo?.is_enabled === true}
                  disabled={!qrInfo || qrSaving}
                  onChange={() => void toggleQrEnforcement()}
                  className="w-4 h-4 accent-cyan-600"
                />
                {L('Require QR scan to clock in/out', 'اشتراط مسح QR لتسجيل الحضور والانصراف')}
                {qrSaving && <RefreshCw className="w-3 h-3 animate-spin" />}
              </label>
            </div>

            <p className="text-[10px] text-slate-500 leading-relaxed">
              {L(
                'Print this code and place it at the office entrance. Employees scan it with the phone camera; the app then attaches the monthly code automatically to every clock-in and clock-out.',
                'اطبع هذا الرمز وضعه عند مدخل المكتب. يقوم الموظفون بمسحه بكاميرا الهاتف، ثم يرفق التطبيق رمز الشهر تلقائياً مع كل تسجيل حضور أو انصراف.'
              )}
            </p>
          </div>
        </div>
      </div>

      {mapPoints.length > 0 || companyCenter ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-500" />
              {L('Recorded locations', 'المواقع المسجلة')}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-500">
              <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> {L('Allowed', 'مسموح')}</span>
              <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> {L('Rejected', 'مرفوض')}</span>
              <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-cyan-600" /> {L('Check-out', 'انصراف')}</span>
            </div>
          </div>
          <AttendanceMap
            points={mapPoints}
            center={companyCenter}
            radiusMeters={settings?.allowed_radius_meters || null}
            onSelect={id => setHighlightedId(id)}
          />
          {selectedPoint && (
            <div className="mt-2 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-extrabold text-slate-800">
                  {selectedPoint.label}
                  <span className="ms-2 text-[10px] font-bold text-slate-500">{selectedPoint.detail}</span>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  selectedPoint.tone === 'blocked'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : selectedPoint.tone === 'allowed'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-cyan-50 text-cyan-700 border-cyan-200'
                }`}>
                  {selectedPoint.tone === 'blocked' ? <XCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                  {selectedPoint.result || (selectedPoint.tone === 'blocked' ? L('Blocked', 'مرفوض') : L('Allowed', 'مسموح'))}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px]">
                <div className="bg-white rounded-lg border border-slate-200 px-2.5 py-1.5">
                  <div className="font-bold text-slate-500 uppercase">{L('Device fingerprint', 'بصمة الجهاز')}</div>
                  <div className="font-mono text-slate-800 break-all inline-flex items-center gap-1">
                    <Fingerprint className="w-3 h-3 shrink-0" />
                    {selectedPoint.fingerprint || L('Not stored', 'غير محفوظة')}
                  </div>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 px-2.5 py-1.5">
                  <div className="font-bold text-slate-500 uppercase">{L('Device', 'الجهاز')}</div>
                  <div className="font-semibold text-slate-800">{selectedPoint.deviceLabel || '—'}</div>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 px-2.5 py-1.5">
                  <div className="font-bold text-slate-500 uppercase">{L('Location check', 'فحص الموقع')}</div>
                  <div className="font-semibold text-slate-800">
                    {typeof selectedPoint.distanceMeters === 'number'
                      ? `${selectedPoint.distanceMeters} m${typeof selectedPoint.accuracyMeters === 'number' ? ` · ±${selectedPoint.accuracyMeters}m` : ''}`
                      : selectedPoint.result || '—'}
                  </div>
                  <div className="text-slate-500">
                    {selectedPoint.qrVerified === null
                      ? L('QR not recorded', 'لم يُسجل رمز QR')
                      : selectedPoint.qrVerified
                        ? L(`QR verified${selectedPoint.qrMonth ? ` (${selectedPoint.qrMonth})` : ''}`, `تم التحقق من QR${selectedPoint.qrMonth ? ` (${selectedPoint.qrMonth})` : ''}`)
                        : L('QR not verified', 'لم يتم التحقق من QR')}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTab('logs')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border ${tab === 'logs' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}
            >
              {L('Verification log', 'سجل التحقق')} ({data.logs.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('records')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border ${tab === 'records' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}
            >
              {L('Attendance records', 'سجلات الحضور')} ({data.attendance_records.length})
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            <select
              value={employeeFilter}
              onChange={e => setEmployeeFilter(e.target.value)}
              className="px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold"
            >
              <option value="">{L('All employees', 'كل الموظفين')}</option>
              {employeesForFilter.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
            <select
              value={outcomeFilter}
              onChange={e => setOutcomeFilter(e.target.value)}
              className="px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold"
            >
              <option value="">{L('All outcomes', 'كل النتائج')}</option>
              <option value="allowed">{L('Allowed', 'مسموح')}</option>
              <option value="blocked">{L('Blocked', 'مرفوض')}</option>
            </select>
            <select
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
              className="px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold"
            >
              <option value="">{L('All actions', 'كل العمليات')}</option>
              <option value="clock_in">{L('Check-in', 'حضور')}</option>
              <option value="clock_out">{L('Check-out', 'انصراف')}</option>
            </select>
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              aria-label={L('From date', 'من تاريخ')}
              className="px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold"
            />
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              aria-label={L('To date', 'إلى تاريخ')}
              className="px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold"
            />
          </div>
        </div>

        {tab === 'logs' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="text-start px-3 py-2 font-bold">{L('Time', 'الوقت')}</th>
                  <th className="text-start px-3 py-2 font-bold">{L('Employee', 'الموظف')}</th>
                  <th className="text-start px-3 py-2 font-bold">{L('Action', 'العملية')}</th>
                  <th className="text-start px-3 py-2 font-bold">{L('Result', 'النتيجة')}</th>
                  <th className="text-start px-3 py-2 font-bold">{L('Device', 'الجهاز')}</th>
                  <th className="text-start px-3 py-2 font-bold">{L('Location', 'الموقع')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.logs.map(log => (
                  <tr key={log.id} className={`hover:bg-slate-50 ${highlightedId === `log-${log.id}` ? 'bg-amber-50' : ''}`}>
                    <td className="px-3 py-2.5 whitespace-nowrap text-slate-500">{formatDateTime(log.verified_at)}</td>
                    <td className="px-3 py-2.5">
                      <div className="font-bold text-slate-800">{log.employee_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{log.employee_id}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                        {log.action === 'clock_out' ? L('Check-out', 'انصراف') : L('Check-in', 'حضور')}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        log.outcome === 'allowed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {log.outcome === 'allowed' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {log.result}
                      </span>
                      {typeof log.distance_meters === 'number' && (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {log.distance_meters} m / {log.radius_meters ?? '—'} m
                          {typeof log.accuracy_meters === 'number' ? ` · ±${log.accuracy_meters}m` : ''}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="inline-flex items-center gap-1.5 text-slate-700 font-semibold">
                        <DeviceIcon type={log.device_info?.device_type} />
                        {deviceLabel(log.device_info)}
                      </div>
                      {log.device_info?.device_fingerprint && (
                        <div className="text-[10px] text-slate-400 font-mono inline-flex items-center gap-1 mt-0.5">
                          <Fingerprint className="w-3 h-3" /> {log.device_info.device_fingerprint}
                        </div>
                      )}
                      {typeof log.qr_verified === 'boolean' && (
                        <div className={`text-[10px] font-bold mt-0.5 ${log.qr_verified ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {log.qr_verified
                            ? L(`QR verified${log.qr_month ? ` · ${log.qr_month}` : ''}`, `تم التحقق من QR${log.qr_month ? ` · ${log.qr_month}` : ''}`)
                            : L(`QR not verified${log.qr_required ? ' (required)' : ''}`, `لم يتم التحقق من QR${log.qr_required ? ' (مطلوب)' : ''}`)}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      {typeof log.submitted_latitude === 'number' && typeof log.submitted_longitude === 'number' ? (
                        <a
                          href={`https://www.openstreetmap.org/?mlat=${log.submitted_latitude}&mlon=${log.submitted_longitude}#map=17/${log.submitted_latitude}/${log.submitted_longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-700 hover:underline"
                        >
                          {log.submitted_latitude.toFixed(5)}, {log.submitted_longitude.toFixed(5)}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-400">{L('Not stored', 'غير محفوظ')}</span>
                      )}
                    </td>
                  </tr>
                ))}
                {data.logs.length === 0 && !loading && (
                  <tr><td colSpan={6} className="px-3 py-10 text-center text-slate-400">{L('No verification logs found.', 'لا توجد سجلات تحقق.')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="text-start px-3 py-2 font-bold">{L('Date', 'التاريخ')}</th>
                  <th className="text-start px-3 py-2 font-bold">{L('Employee', 'الموظف')}</th>
                  <th className="text-start px-3 py-2 font-bold">{L('Check-in / out', 'الحضور / الانصراف')}</th>
                  <th className="text-start px-3 py-2 font-bold">{L('Device', 'الجهاز')}</th>
                  <th className="text-start px-3 py-2 font-bold">{L('Coordinates', 'الإحداثيات')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.attendance_records.map(record => {
                  const inLoc = record.check_in_location || record.attendance_location;
                  const outLoc = record.check_out_location;
                  return (
                    <tr key={record.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5 whitespace-nowrap font-bold text-slate-700">{record.date}</td>
                      <td className="px-3 py-2.5">
                        <div className="font-bold text-slate-800">{record.employee_name}</div>
                        <div className="text-[10px] text-slate-400">{record.status}</div>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-slate-600">
                        <span className="font-semibold">{record.clock_in || '—'}</span>
                        {' → '}
                        <span className="font-semibold">{record.clock_out || '—'}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="inline-flex items-center gap-1.5 text-slate-700 font-semibold">
                          <DeviceIcon type={(record.check_in_device_info || record.device_info)?.device_type} />
                          {deviceLabel(record.check_in_device_info || record.device_info)}
                        </div>
                        {(record.check_in_device_info || record.device_info)?.device_fingerprint && (
                          <div className="text-[10px] text-slate-500 font-mono inline-flex items-center gap-1 mt-0.5">
                            <Fingerprint className="w-3 h-3" />
                            {L('In', 'حضور')}: {(record.check_in_device_info || record.device_info)?.device_fingerprint}
                          </div>
                        )}
                        {record.check_out_device_info?.device_fingerprint && (
                          <div className="text-[10px] text-slate-500 font-mono inline-flex items-center gap-1 mt-0.5">
                            <Fingerprint className="w-3 h-3" />
                            {L('Out', 'انصراف')}: {record.check_out_device_info.device_fingerprint}
                          </div>
                        )}
                        {record.check_out_device_info && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {L('Out device', 'جهاز الانصراف')}: {deviceLabel(record.check_out_device_info)}
                          </div>
                        )}
                        {record.qr_verification && (
                          <div className={`text-[10px] font-bold mt-0.5 ${record.qr_verification.verified ? 'text-emerald-700' : 'text-rose-600'}`}>
                            {record.qr_verification.verified
                              ? L(`QR verified${record.qr_verification.month ? ` · ${record.qr_verification.month}` : ''}`, `تم التحقق من QR${record.qr_verification.month ? ` · ${record.qr_verification.month}` : ''}`)
                              : L('QR not verified', 'لم يتم التحقق من QR')}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="space-y-0.5">
                          {inLoc ? (
                            <a
                              href={`https://www.openstreetmap.org/?mlat=${inLoc.latitude}&mlon=${inLoc.longitude}#map=17/${inLoc.latitude}/${inLoc.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 hover:underline"
                            >
                              {L('In', 'حضور')}: {Number(inLoc.latitude).toFixed(5)}, {Number(inLoc.longitude).toFixed(5)}
                            </a>
                          ) : (
                            <div className="text-[10px] text-slate-400">{L('No stored check-in location', 'لا يوجد موقع حضور محفوظ')}</div>
                          )}
                          {outLoc && (
                            <a
                              href={`https://www.openstreetmap.org/?mlat=${outLoc.latitude}&mlon=${outLoc.longitude}#map=17/${outLoc.latitude}/${outLoc.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-700 hover:underline"
                            >
                              {L('Out', 'انصراف')}: {Number(outLoc.latitude).toFixed(5)}, {Number(outLoc.longitude).toFixed(5)}
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {data.attendance_records.length === 0 && !loading && (
                  <tr><td colSpan={5} className="px-3 py-10 text-center text-slate-400">{L('No attendance records found.', 'لا توجد سجلات حضور.')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {loading && (
          <div className="p-8 text-center text-slate-400 text-xs">
            <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin" />
            {L('Loading security data…', 'جاري تحميل بيانات الأمن…')}
          </div>
        )}
      </div>
    </div>
  );
}

export default AttendanceSecurityView;
