import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Navigation,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
} from 'lucide-react';
import type { CompanyGeofencing } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { GeofenceMap } from './GeofenceMap';

interface GeofencingSettingsSectionProps {
  actingUser: string;
  actingRole: string;
}

interface GeocodeResult {
  display_name: string;
  latitude: number;
  longitude: number;
  type?: string;
}

interface GeofenceFormState {
  latitude: string;
  longitude: string;
  radius: string;
  isEnabled: boolean;
  storeCoordinates: boolean;
}

const EMPTY_FORM: GeofenceFormState = {
  latitude: '',
  longitude: '',
  radius: '50',
  isEnabled: false,
  storeCoordinates: true,
};

function parseCoordinate(value: string): number | null {
  if (value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function GeofencingSettingsSection({ actingUser, actingRole }: GeofencingSettingsSectionProps) {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [config, setConfig] = useState<CompanyGeofencing | null>(null);
  const [form, setForm] = useState<GeofenceFormState>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);

  const authHeaders = useMemo(
    () => ({
      'x-acting-user': actingUser || 'Administrator',
      'x-acting-role': actingRole || 'Administrator',
    }),
    [actingUser, actingRole]
  );

  const applyConfigToForm = (next: CompanyGeofencing) => {
    setForm({
      latitude: next.company_latitude !== null && next.company_latitude !== undefined
        ? String(next.company_latitude)
        : '',
      longitude: next.company_longitude !== null && next.company_longitude !== undefined
        ? String(next.company_longitude)
        : '',
      radius: String(next.allowed_radius_meters || 50),
      isEnabled: next.is_enabled === true,
      storeCoordinates: next.store_coordinates !== false,
    });
  };

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/geofencing/settings?t=${Date.now()}`, {
        headers: authHeaders,
        cache: 'no-store',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Unable to load geofencing settings.');
      }
      const data: CompanyGeofencing = await res.json();
      setConfig(data);
      applyConfigToForm(data);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to load geofencing settings.');
    } finally {
      setIsLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const latitude = parseCoordinate(form.latitude);
  const longitude = parseCoordinate(form.longitude);

  const handleMapPick = (nextLatitude: number, nextLongitude: number) => {
    setForm(prev => ({
      ...prev,
      latitude: String(nextLatitude),
      longitude: String(nextLongitude),
    }));
    setSuccessMessage(null);
  };

  const handleSearch = async () => {
    const query = searchQuery.trim();
    if (query.length < 3) {
      setErrorMessage(isAr ? 'يرجى إدخال 3 أحرف على الأقل للبحث.' : 'Please enter at least 3 characters to search.');
      return;
    }
    setIsSearching(true);
    setErrorMessage(null);
    setSearchResults([]);
    try {
      const res = await fetch(`/api/geofencing/geocode?q=${encodeURIComponent(query)}`, {
        headers: authHeaders,
        cache: 'no-store',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || (isAr ? 'تعذر البحث عن العنوان.' : 'Unable to search for the address.'));
      }
      const results: GeocodeResult[] = Array.isArray(data?.results) ? data.results : [];
      setSearchResults(results);
      if (results.length === 0) {
        setErrorMessage(isAr ? 'لم يتم العثور على نتائج. جرّب عنواناً أكثر تحديداً.' : 'No results found. Try a more specific address.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || (isAr ? 'تعذر البحث عن العنوان.' : 'Unable to search for the address.'));
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectResult = (result: GeocodeResult) => {
    setForm(prev => ({
      ...prev,
      latitude: String(Number(result.latitude.toFixed(6))),
      longitude: String(Number(result.longitude.toFixed(6))),
    }));
    setSearchResults([]);
    setSuccessMessage(null);
  };

  const handleSave = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (latitude !== null && (latitude < -90 || latitude > 90)) {
      setErrorMessage(isAr ? 'خط العرض يجب أن يكون بين -90 و 90.' : 'Latitude must be between -90 and 90.');
      return;
    }
    if (longitude !== null && (longitude < -180 || longitude > 180)) {
      setErrorMessage(isAr ? 'خط الطول يجب أن يكون بين -180 و 180.' : 'Longitude must be between -180 and 180.');
      return;
    }
    if ((latitude === null) !== (longitude === null)) {
      setErrorMessage(isAr ? 'يجب إدخال خط العرض وخط الطول معاً.' : 'Please provide both latitude and longitude.');
      return;
    }
    if (form.isEnabled && (latitude === null || longitude === null)) {
      setErrorMessage(
        isAr
          ? 'حدد موقع الشركة على الخريطة قبل تفعيل التحقق الجغرافي.'
          : 'Please select the company location on the map before enabling geofencing.'
      );
      return;
    }
    const radius = Number(form.radius);
    if (!Number.isFinite(radius) || radius < 5 || radius > 10000) {
      setErrorMessage(isAr ? 'نطاق الحضور يجب أن يكون بين 5 و 10000 متر.' : 'Allowed radius must be between 5 and 10000 meters.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/geofencing/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          company_latitude: latitude,
          company_longitude: longitude,
          allowed_radius_meters: radius,
          is_enabled: form.isEnabled,
          store_coordinates: form.storeCoordinates,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || (isAr ? 'تعذر حفظ الإعدادات.' : 'Unable to save settings.'));
      }
      setConfig(data);
      applyConfigToForm(data);
      setSuccessMessage(
        isAr
          ? 'تم حفظ إعدادات التحقق الجغرافي بنجاح.'
          : 'Geofencing settings saved successfully.'
      );
    } catch (err: any) {
      setErrorMessage(err?.message || (isAr ? 'تعذر حفظ الإعدادات.' : 'Unable to save settings.'));
    } finally {
      setIsSaving(false);
    }
  };

  const updatedAtLabel = config?.updated_at
    ? new Date(config.updated_at).toLocaleString(isAr ? 'ar-EG' : 'en-GB')
    : (isAr ? 'لم يتم الحفظ بعد' : 'Not saved yet');

  return (
    <div className="bg-white rounded-2xl border-2 border-cyan-200 p-4 sm:p-6 space-y-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                {isAr ? 'التحقق الجغرافي للحضور والانصراف' : 'Geofencing Attendance Verification'}
              </h2>
              <span className="px-2 py-0.5 bg-slate-900 text-cyan-300 rounded-md text-[10px] font-black uppercase">
                {isAr ? 'مسؤول IT فقط' : 'IT Administrator Only'}
              </span>
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                  config?.is_enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {config?.is_enabled
                  ? (isAr ? 'مفعّل' : 'Enabled')
                  : (isAr ? 'معطّل' : 'Disabled')}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isAr
                ? 'حدد موقع الشركة ونطاق الحضور المسموح. يتم التحقق من الموقع على الخادم قبل تسجيل أي حضور أو انصراف.'
                : 'Define the company location and permitted radius. Every employee check-in/out is verified on the server before it is recorded.'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={loadSettings}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-60 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isAr ? 'تحديث' : 'Refresh'}</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Current configuration summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
          <span className="text-slate-400 font-semibold block mb-0.5">{isAr ? 'الحالة' : 'Status'}</span>
          <span className={`font-bold ${config?.is_enabled ? 'text-emerald-700' : 'text-slate-700'}`}>
            {config?.is_enabled ? (isAr ? 'مفعّل' : 'Enabled') : (isAr ? 'معطّل' : 'Disabled')}
          </span>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
          <span className="text-slate-400 font-semibold block mb-0.5">{isAr ? 'موقع الشركة' : 'Company Location'}</span>
          <span className="font-mono font-bold text-slate-800">
            {config?.company_latitude !== null && config?.company_latitude !== undefined && config?.company_longitude !== null && config?.company_longitude !== undefined
              ? `${config.company_latitude}, ${config.company_longitude}`
              : (isAr ? 'غير محدد' : 'Not set')}
          </span>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
          <span className="text-slate-400 font-semibold block mb-0.5">{isAr ? 'النطاق المسموح' : 'Allowed Radius'}</span>
          <span className="font-bold text-slate-800">
            {config?.allowed_radius_meters ?? 50} {isAr ? 'متر' : 'm'}
          </span>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
          <span className="text-slate-400 font-semibold block mb-0.5">{isAr ? 'آخر تحديث' : 'Last Updated'}</span>
          <span className="font-bold text-slate-800 break-words">{updatedAtLabel}</span>
          {config?.updated_by && (
            <span className="block text-[10px] text-slate-500 mt-0.5">{config.updated_by}</span>
          )}
        </div>
      </div>

      {/* Address search */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <Search className="w-3.5 h-3.5 text-cyan-600" />
          {isAr ? 'البحث عن عنوان الشركة' : 'Search for the company address'}
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleSearch();
              }
            }}
            placeholder={isAr ? 'مثال: 124 ميدان التحرير، القاهرة' : 'e.g. 124 Tahrir Square, Cairo'}
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={isSearching}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-60"
          >
            {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>{isAr ? 'بحث' : 'Search'}</span>
          </button>
        </div>
        {searchResults.length > 0 && (
          <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
            {searchResults.map((result, index) => (
              <button
                key={`${result.latitude}-${result.longitude}-${index}`}
                type="button"
                onClick={() => handleSelectResult(result)}
                className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-cyan-50 transition-colors cursor-pointer flex items-start gap-2"
              >
                <Navigation className="w-3.5 h-3.5 text-cyan-600 shrink-0 mt-0.5" />
                <span className="text-slate-700">{result.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Interactive map */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-cyan-600" />
            {isAr ? 'موقع الشركة على الخريطة' : 'Company location on the map'}
          </label>
          <span className="text-[10px] text-slate-500">
            {isAr ? 'انقر على الخريطة لتحديد الموقع' : 'Click the map to select the location'}
          </span>
        </div>
        <GeofenceMap latitude={latitude} longitude={longitude} onPick={handleMapPick} />
      </div>

      {/* Coordinates + radius */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            {isAr ? 'خط العرض (Latitude)' : 'Latitude'}
          </label>
          <input
            type="number"
            step="any"
            value={form.latitude}
            onChange={event => setForm(prev => ({ ...prev, latitude: event.target.value }))}
            onKeyDown={event => { if (event.key === 'Enter') event.preventDefault(); }}
            placeholder="30.044400"
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            {isAr ? 'خط الطول (Longitude)' : 'Longitude'}
          </label>
          <input
            type="number"
            step="any"
            value={form.longitude}
            onChange={event => setForm(prev => ({ ...prev, longitude: event.target.value }))}
            onKeyDown={event => { if (event.key === 'Enter') event.preventDefault(); }}
            placeholder="31.235700"
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            {isAr ? 'النطاق المسموح (متر)' : 'Allowed radius (meters)'}
          </label>
          <input
            type="number"
            min={5}
            max={10000}
            step={1}
            value={form.radius}
            onChange={event => setForm(prev => ({ ...prev, radius: event.target.value }))}
            onKeyDown={event => { if (event.key === 'Enter') event.preventDefault(); }}
            placeholder="50"
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Toggles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setForm(prev => ({ ...prev, isEnabled: !prev.isEnabled }))}
          className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-left transition-colors cursor-pointer ${
            form.isEnabled
              ? 'bg-emerald-50 border-emerald-300'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <span>
            <span className="block text-xs font-bold text-slate-900">
              {isAr ? 'تفعيل التحقق الجغرافي' : 'Enable geofencing'}
            </span>
            <span className="block text-[10px] text-slate-500 mt-0.5">
              {isAr
                ? 'منع تسجيل الحضور خارج نطاق الشركة'
                : 'Block attendance outside the company radius'}
            </span>
          </span>
          <span
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
              form.isEnabled ? 'bg-emerald-500' : 'bg-slate-300'
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                form.isEnabled ? 'left-[22px]' : 'left-0.5'
              }`}
            />
          </span>
        </button>

        <button
          type="button"
          onClick={() => setForm(prev => ({ ...prev, storeCoordinates: !prev.storeCoordinates }))}
          className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-left transition-colors cursor-pointer ${
            form.storeCoordinates
              ? 'bg-cyan-50 border-cyan-200'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <span>
            <span className="block text-xs font-bold text-slate-900">
              {isAr ? 'حفظ إحداثيات الموظف' : 'Store employee coordinates'}
            </span>
            <span className="block text-[10px] text-slate-500 mt-0.5">
              {isAr
                ? 'حسب سياسة الخصوصية المعتمدة للشركة'
                : 'Only if permitted by company privacy policy'}
            </span>
          </span>
          <span
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
              form.storeCoordinates ? 'bg-cyan-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                form.storeCoordinates ? 'left-[22px]' : 'left-0.5'
              }`}
            />
          </span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
        <div className="flex items-start gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
          <span>
            {isAr
              ? 'يتم التحقق من كل حضور وانصراف على الخادم باستخدام معادلة هافرساين. لا يمكن للموظفين تغيير هذه الإعدادات.'
              : 'Every check-in/out is verified server-side with the Haversine formula. Employees cannot modify these settings.'}
          </span>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || isLoading}
          className="flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-sm cursor-pointer disabled:opacity-60 shrink-0 min-h-[44px]"
        >
          {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{isAr ? 'حفظ إعدادات التحقق الجغرافي' : 'Save Geofencing Settings'}</span>
        </button>
      </div>
    </div>
  );
}
