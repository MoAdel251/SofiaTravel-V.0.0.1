import React, { useState } from 'react';
import { ShieldAlert, Wrench, Lock, CheckCircle2, Power, Globe2, X, Database } from 'lucide-react';
import { SOFIA_LOGO_URL } from './SofiaLogo';
import { useLanguage } from '../context/LanguageContext';

interface SiteMaintenanceOverlayProps {
  companyName: string;
  disabledMessage?: string;
  disabledAt?: string;
  onOpenITLogin: () => void;
  isAuthenticatedNonIT?: boolean;
  currentUsername?: string;
  onLogout?: () => void;
}

export function SiteMaintenanceOverlay({
  companyName,
  disabledMessage,
  disabledAt,
  onOpenITLogin,
  isAuthenticatedNonIT = false,
  currentUsername,
  onLogout,
}: SiteMaintenanceOverlayProps) {
  const { language, toggleLanguage } = useLanguage();
  const isAr = language === 'ar';

  return (
    <div className="fixed inset-0 z-40 bg-slate-950 text-white flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto">
        <div className="p-6 sm:p-8 text-center border-b border-slate-800 relative">
          <button
            type="button"
            onClick={toggleLanguage}
            className="absolute top-4 end-4 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-cyan-300 flex items-center gap-1.5 cursor-pointer"
          >
            <Globe2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isAr ? 'English' : 'العربية'}</span>
          </button>

          <div className="inline-flex items-center justify-center bg-white rounded-2xl p-2.5 shadow-lg mb-4">
            <img
              src={SOFIA_LOGO_URL}
              alt={companyName}
              className="h-20 sm:h-24 w-auto object-contain select-none"
              onError={(e) => {
                const img = e.currentTarget;
                if (!img.src.endsWith('/sofia-logo.png')) {
                  img.src = '/sofia-logo.png';
                }
              }}
            />
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold mb-3">
            <Wrench className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              {isAr
                ? 'الموقع متوقف مؤقتاً للتحديث والصيانة'
                : 'Site Temporarily Disabled for Updates'}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            {companyName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            {disabledMessage?.trim()
              ? disabledMessage
              : isAr
              ? 'يقوم قسم تكنولوجيا المعلومات (IT) حالياً بإجراء تحديثات وتعديلات فنية على النظام. جميع البيانات والسجلات محفوظة بالكامل وسيعود الموقع للعمل قريباً.'
              : 'The IT department is currently performing scheduled modifications and updates on the platform. All company data and records are 100% preserved and the site will be back online shortly.'}
          </p>

          {disabledAt && (
            <p className="text-[11px] text-slate-500 mt-3 font-mono">
              {isAr ? `بدء التحديث: ${disabledAt}` : `Maintenance started: ${disabledAt}`}
            </p>
          )}
        </div>

        <div className="p-5 sm:p-6 bg-slate-950/60 space-y-4">
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/25 text-emerald-200 text-xs">
            <Database className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              {isAr
                ? 'قاعدة البيانات السحابية آمنة ومحفوظة بالكامل بدون حذف أي بيانات.'
                : 'Cloud database records remain completely safe and intact — zero data deleted.'}
            </span>
          </div>

          {isAuthenticatedNonIT && currentUsername && (
            <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-800/70 border border-slate-700 text-xs text-slate-300">
              <span>
                {isAr
                  ? `مسجل حالياً بحساب: ${currentUsername}`
                  : `Signed in as: ${currentUsername}`}
              </span>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="text-rose-400 hover:text-rose-300 font-bold cursor-pointer"
                >
                  {isAr ? 'تسجيل الخروج' : 'Sign Out'}
                </button>
              )}
            </div>
          )}

          <div className="pt-1 flex justify-center">
            <button
              type="button"
              onClick={onOpenITLogin}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-cyan-300 transition-colors cursor-pointer min-h-[44px]"
            >
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                {isAr
                  ? 'دخول مطور النظام فقط (حساب IT)'
                  : 'IT Developer Account Login Only'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ITMaintenanceControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSiteDisabled: boolean;
  currentMessage?: string;
  onConfirmToggle: (disable: boolean, message?: string) => Promise<void> | void;
}

export function ITMaintenanceControlModal({
  isOpen,
  onClose,
  isSiteDisabled,
  currentMessage = '',
  onConfirmToggle,
}: ITMaintenanceControlModalProps) {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [customMessage, setCustomMessage] = useState(currentMessage);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onConfirmToggle(!isSiteDisabled, customMessage.trim());
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-auto">
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                isSiteDisabled
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-amber-50 text-amber-600'
              }`}
            >
              {isSiteDisabled ? <CheckCircle2 className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
            </div>
            <div>
              <span className="px-2 py-0.5 rounded-md bg-slate-900 text-cyan-300 text-[10px] font-extrabold uppercase tracking-wider">
                IT Developer Exclusive
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                {isSiteDisabled
                  ? isAr
                    ? 'إعادة تفعيل الموقع لجميع المستخدمين'
                    : 'Re-enable Site for All Users'
                  : isAr
                  ? 'إيقاف الموقع مؤقتاً للتعديلات والتحديثات'
                  : 'Temporarily Disable Site for Updates'}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleAction} className="space-y-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 leading-relaxed">
            <p className="font-bold">
              {isAr
                ? '✓ حماية كاملة للبيانات (بدون حذف أي سجل)'
                : '✓ 100% Data Preservation (Zero Data Deleted)'}
            </p>
            <p className="text-[11px] text-emerald-800 mt-0.5">
              {isSiteDisabled
                ? isAr
                  ? 'سيتم فتح الموقع فوراً لجميع الموظفين والإدارة مع بقاء كافة البيانات كما هي.'
                  : 'All employees and management accounts will immediately regain live access with all records intact.'
                : isAr
                ? 'سيتم إيقاف وصول الموظفين والمستخدمين مؤقتاً أثناء إجراء التحديثات، بينما يظل حساب المطور (IT) متصلاً بكامل الصلاحيات دون المساس بأي بيانات.'
                : 'Temporarily pauses employee and user access while updates or modifications are performed. Your "IT" account keeps full live access and no data is deleted.'}
            </p>
          </div>

          {!isSiteDisabled && (
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                {isAr
                  ? 'رسالة التنبيه للموظفين أثناء التحديث (اختياري)'
                  : 'Maintenance Notice Shown to Staff (Optional)'}
              </label>
              <textarea
                rows={3}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder={
                  isAr
                    ? 'مثال: جاري تحديث النظام وإضافة تحسينات جديدة، سيعود الموقع خلال دقائق...'
                    : 'e.g., Applying system updates and modifications. The portal will reopen shortly...'
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-amber-500"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer min-h-[42px]"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-5 py-2.5 rounded-xl text-white font-bold shadow-xs flex items-center gap-2 cursor-pointer min-h-[42px] disabled:opacity-60 ${
                isSiteDisabled
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>
                {submitting
                  ? isAr
                    ? 'جاري التنفيذ...'
                    : 'Applying...'
                  : isSiteDisabled
                  ? isAr
                    ? 'تفعيل الموقع الآن'
                    : 'Enable Site Now'
                  : isAr
                  ? 'تأكيد الإيقاف المؤقت للموقع'
                  : 'Temporarily Disable Site'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
