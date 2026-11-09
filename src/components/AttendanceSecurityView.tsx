import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  MapPin, ShieldCheck, RefreshCw, AlertTriangle, Smartphone, Monitor,
  Tablet, CheckCircle2, XCircle, Users, Search, ListFilter, Fingerprint, ExternalLink,
} from 'lucide-react';
import type { Employee, UserRole } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { formatDateTime, hrFetch, type ActingContext } from '../services/hrApi';
import { AttendanceMap, type AttendanceMapPoint } from './AttendanceMap';

interface AttendanceSecurityViewProps {
  employees: Employee[];
  currentUsername: string;
  userRole: UserRole;
  isAdmin: boolean;
  isITAccount: boolean;
  onShowToast?: (message: string) => void;
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
  device_info?: {
    device_type?: string;
    os?: string;
    browser?: string;
    browser_version?: string;
    device_fingerprint?: string;
  } | null;
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
  device_info?: SecurityLog['device_info'];
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

function deviceLabel(device: SecurityLog['device_info']): string {
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

      const [security, geofence] = await Promise.all([
        hrFetch<SecurityResponse>(`/api/attendance/security-logs?${query.toString()}`, acting),
        hrFetch<GeofenceSettings>('/api/geofencing/settings', acting).catch(() => null),
      ]);
      setData({
        logs: Array.isArray(security?.logs) ? security.logs : [],
        attendance_records: Array.isArray(security?.attendance_records) ? security.attendance_records : [],
        totals: security?.totals || { returned: 0, blocked: 0, allowed: 0 },
      });
      setSettings(geofence);
    } catch (err: any) {
      setError(err?.message || L('Unable to load attendance security data.', 'تعذر تحميل بيانات أمن الحضور.'));
    } finally {
      setLoading(false);
    }
  }, [acting, employeeFilter, outcomeFilter, actionFilter, fromDate, toDate, isAr]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const companyCenter = settings?.company_latitude != null && settings?.company_longitude != null
    ? { latitude: Number(settings.company_latitude), longitude: Number(settings.company_longitude) }
    : null;

  const mapPoints = useMemo<AttendanceMapPoint[]>(() => {
    const points: AttendanceMapPoint[] = [];
    for (const record of data.attendance_records) {
      if (record.check_in_location) {
        points.push({
          id: `${record.id}-in`,
          latitude: Number(record.check_in_location.latitude),
          longitude: Number(record.check_in_location.longitude),
          label: record.employee_name,
          detail: `${record.date} ${record.clock_in || ''}`,
          tone: 'allowed',
        });
      } else if (record.attendance_location) {
        points.push({
          id: `${record.id}-latest`,
          latitude: Number(record.attendance_location.latitude),
          longitude: Number(record.attendance_location.longitude),
          label: record.employee_name,
          detail: `${record.date} ${record.clock_in || ''}`,
          tone: 'neutral',
        });
      }
      if (record.check_out_location) {
        points.push({
          id: `${record.id}-out`,
          latitude: Number(record.check_out_location.latitude),
          longitude: Number(record.check_out_location.longitude),
          label: `${record.employee_name} (${L('out', 'انصراف')})`,
          detail: `${record.date} ${record.clock_out || ''}`,
          tone: 'neutral',
        });
      }
    }
    for (const log of data.logs) {
      if (log.outcome === 'blocked' && typeof log.submitted_latitude === 'number' && typeof log.submitted_longitude === 'number') {
        points.push({
          id: `log-${log.id}`,
          latitude: log.submitted_latitude,
          longitude: log.submitted_longitude,
          label: log.employee_name,
          detail: `${log.result} · ${formatDateTime(log.verified_at)}`,
          tone: 'blocked',
        });
      }
    }
    return points.filter(point => Number.isFinite(point.latitude) && Number.isFinite(point.longitude));
  }, [data, isAr]);

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
          {highlightedId && (
            <div className="mt-2 text-[11px] text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
              {mapPoints.find(point => point.id === highlightedId)?.label}
              {' · '}
              {mapPoints.find(point => point.id === highlightedId)?.detail}
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
                          <DeviceIcon type={record.device_info?.device_type} />
                          {deviceLabel(record.device_info)}
                        </div>
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
