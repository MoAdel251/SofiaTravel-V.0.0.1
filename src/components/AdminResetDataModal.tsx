import React, { useState } from 'react';
import { AlertTriangle, Trash2, RefreshCw, ShieldAlert, CheckCircle2, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface AdminResetDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDeleteAll: (includeEmployees: boolean) => Promise<void>;
  isAdmin: boolean;
}

export function AdminResetDataModal({
  isOpen,
  onClose,
  onConfirmDeleteAll,
  isAdmin,
}: AdminResetDataModalProps) {
  const { t } = useLanguage();
  const [includeEmployees, setIncludeEmployees] = useState(true);
  const [confirmedCheck, setConfirmedCheck] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !isAdmin) return null;

  const handleExecuteReset = async () => {
    if (!confirmedCheck || isDeleting) return;
    setIsDeleting(true);
    setErrorMsg('');
    try {
      await onConfirmDeleteAll(includeEmployees);
      setCompleted(true);
      setTimeout(() => {
        setCompleted(false);
        setConfirmedCheck(false);
        onClose();
      }, 2200);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to clear database records. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90dvh] pb-[max(1rem,env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Banner */}
        <div className="p-5 bg-rose-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold leading-snug">{t('admin_reset_modal_title')}</h3>
              <p className="text-xs text-rose-100 mt-0.5">{t('admin_reset_subtitle')}</p>
            </div>
          </div>
          {!isDeleting && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              aria-label={t('close')}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          {completed ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <p className="text-sm font-bold text-slate-900 px-2">{t('admin_reset_success')}</p>
            </div>
          ) : (
            <>
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <p className="text-xs text-rose-900 leading-relaxed font-medium">
                  {t('admin_reset_warning')}
                </p>
              </div>

              <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition-colors">
                <input
                  type="checkbox"
                  checked={includeEmployees}
                  onChange={(e) => setIncludeEmployees(e.target.checked)}
                  disabled={isDeleting}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 shrink-0"
                />
                <span className="text-xs font-semibold text-slate-700 leading-relaxed">
                  {t('admin_reset_keep_employees_label')}
                </span>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-amber-50/70 border border-amber-300 cursor-pointer hover:bg-amber-50 transition-colors">
                <input
                  type="checkbox"
                  checked={confirmedCheck}
                  onChange={(e) => setConfirmedCheck(e.target.checked)}
                  disabled={isDeleting}
                  className="mt-0.5 w-4 h-4 rounded border-amber-400 text-rose-600 focus:ring-rose-500 shrink-0"
                />
                <span className="text-xs font-bold text-slate-900 leading-relaxed">
                  {t('admin_reset_confirm_check')}
                </span>
              </label>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-100 text-rose-800 text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer min-h-[44px]"
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  disabled={!confirmedCheck || isDeleting}
                  onClick={handleExecuteReset}
                  className={`w-full sm:w-auto px-5 py-3 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all min-h-[44px] ${
                    confirmedCheck && !isDeleting
                      ? 'bg-rose-600 hover:bg-rose-700 shadow-md cursor-pointer'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{t('admin_reset_in_progress')}</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>{t('admin_reset_execute_btn')}</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
