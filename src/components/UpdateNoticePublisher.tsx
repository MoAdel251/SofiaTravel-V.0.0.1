import React, { useEffect, useState } from 'react';
import { Megaphone, Send, EyeOff, CheckCircle2, AlertTriangle, RefreshCw, Smartphone } from 'lucide-react';
import { CompanySettings, UserRole } from '../types';
import { APP_VERSION, APP_VERSION_LABEL } from '../lib/appVersion';

interface UpdateNoticePublisherProps {
  settings: CompanySettings;
  onUpdateSettings: (settings: CompanySettings) => Promise<void> | void;
  language: string;
  isITAccount?: boolean;
  userRole?: UserRole;
}

/**
 * IT dashboard control used to publish the sticky update message
 * (refresh page + uninstall/reinstall shortcut instructions) to all employees.
 */
export function UpdateNoticePublisher({
  settings,
  onUpdateSettings,
  language,
  isITAccount = false,
  userRole = 'Administrator',
}: UpdateNoticePublisherProps) {
  const isAr = language === 'ar';

  const defaultMessage = isAr
    ? `تم إصدار تحديث جديد للموقع (${APP_VERSION_LABEL}).\n\nيرجى تحديث الصفحة الآن لرؤية التحديث.\nإذا كنت تستخدم اختصار الموقع على الشاشة الرئيسية: قم بإلغاء تثبيت الاختصار القديم، ثم أعد تثبيته من جديد من متصفح الهاتف.`
    : `A new website update has been released (${APP_VERSION_LABEL}).\n\nPlease refresh the page now to view the update.\nIf you use the website shortcut on your home screen: uninstall the old shortcut, then reinstall it again from your phone browser.`;

  const [enabled, setEnabled] = useState<boolean>(Boolean(settings.update_notice_enabled));
  const [title, setTitle] = useState<string>(
    settings.update_notice_title || (isAr ? 'تحديث جديد للموقع متاح الآن' : 'A new website update is available')
  );
  const [message, setMessage] = useState<string>(settings.update_notice_message || defaultMessage);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingPush, setIsSendingPush] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setEnabled(Boolean(settings.update_notice_enabled));
    setTitle(settings.update_notice_title || (isAr ? 'تحديث جديد للموقع متاح الآن' : 'A new website update is available'));
    setMessage(settings.update_notice_message || defaultMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.update_notice_enabled, settings.update_notice_title, settings.update_notice_message, isAr]);

  const buildNextSettings = (nextEnabled: boolean): CompanySettings => ({
    ...settings,
    update_notice_enabled: nextEnabled,
    update_notice_title: title.trim(),
    update_notice_message: message.trim(),
    update_notice_version: APP_VERSION,
    update_notice_updated_at: new Date().toISOString(),
    update_notice_updated_by: isITAccount ? 'IT' : (userRole || 'Administrator'),
  });

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatus({ type, text });
    setTimeout(() => setStatus(prev => (prev?.text === text ? null : prev)), 5000);
  };

  const handlePublish = async () => {
    if (!message.trim()) {
      showStatus('error', isAr ? 'يرجى كتابة نص الرسالة أولاً.' : 'Please enter the message text first.');
      return;
    }
    setIsSaving(true);
    try {
      await onUpdateSettings(buildNextSettings(true));
      setEnabled(true);
      showStatus(
        'success',
        isAr
          ? 'تم نشر الرسالة الثابتة لجميع الموظفين. سيظهر الشريط أعلى الموقع مباشرةً.'
          : 'Sticky message published for all employees. The banner now appears at the top of the website.'
      );
    } catch {
      showStatus('error', isAr ? 'تعذر حفظ الرسالة.' : 'Could not save the message.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleHide = async () => {
    setIsSaving(true);
    try {
      await onUpdateSettings({ ...settings, update_notice_enabled: false, update_notice_updated_at: new Date().toISOString() });
      setEnabled(false);
      showStatus('success', isAr ? 'تم إخفاء الرسالة الثابتة من الموقع.' : 'Sticky message hidden from the website.');
    } catch {
      showStatus('error', isAr ? 'تعذر إخفاء الرسالة.' : 'Could not hide the message.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendPush = async () => {
    if (!message.trim()) {
      showStatus('error', isAr ? 'يرجى كتابة نص الرسالة أولاً.' : 'Please enter the message text first.');
      return;
    }
    setIsSendingPush(true);
    try {
      await onUpdateSettings(buildNextSettings(true));
      setEnabled(true);
      const res = await fetch('/api/push/send-custom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-acting-user': isITAccount ? 'IT' : (userRole || 'Administrator'),
          'x-acting-role': userRole || 'Administrator',
        },
        body: JSON.stringify({
          title: title.trim() || (isAr ? 'تحديث الموقع' : 'Website Update'),
          message: message.trim(),
          target_scope: 'ALL',
          category: 'Announcement',
          tab: 'dashboard',
          language: isAr ? 'ar' : 'en',
          is_it: isITAccount,
        }),
      });
      if (!res.ok) throw new Error('push failed');
      showStatus(
        'success',
        isAr
          ? 'تم إرسال إشعار فوري لهواتف الموظفين المسجلين بالإضافة إلى الرسالة الثابتة.'
          : 'Instant push notification sent to subscribed employee phones in addition to the sticky banner.'
      );
    } catch {
      showStatus(
        'error',
        isAr
          ? 'تم حفظ الرسالة، لكن تعذر إرسال إشعار الهاتف (قد لا يوجد أجهزة مشتركة).'
          : 'Message saved, but the phone push could not be sent (there may be no subscribed devices).'
      );
    } finally {
      setIsSendingPush(false);
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="px-4 sm:px-6 py-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0">
            <Megaphone className="w-5 h-5 text-amber-300" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-black">
              {isAr ? 'رسالة التحديث الثابتة للموظفين (IT)' : 'Sticky Website Update Message (IT)'}
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5 leading-relaxed">
              {isAr
                ? 'تُعرض أعلى الموقع لكل الموظفين وتطلب تحديث الصفحة وإعادة تثبيت الاختصار.'
                : 'Shown at the top of the website for every employee, asking them to refresh the page and reinstall the shortcut.'}
            </p>
          </div>
        </div>
        <span className="self-start sm:self-auto px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-[11px] font-mono font-bold text-cyan-300 shrink-0">
          {APP_VERSION_LABEL}
        </span>
      </div>

      <div className="p-4 sm:p-6 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {isAr ? 'عنوان الرسالة' : 'Message title'}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-amber-500 focus:bg-white"
              placeholder={isAr ? 'تحديث جديد للموقع متاح الآن' : 'A new website update is available'}
            />
          </div>
          <div className="flex items-end">
            <div
              className={`w-full rounded-xl border px-3.5 py-2.5 text-[11px] font-semibold flex items-start gap-2 ${
                enabled ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>
                {enabled
                  ? (isAr ? 'الرسالة ظاهرة حالياً لجميع الموظفين.' : 'The sticky message is currently visible to all employees.')
                  : (isAr ? 'الرسالة مخفية حالياً من الموقع.' : 'The sticky message is currently hidden.')}
              </span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {isAr ? 'نص الرسالة (تعليمات التحديث والاختصار)' : 'Message text (refresh & shortcut instructions)'}
          </label>
          <textarea
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm leading-relaxed focus:outline-none focus:border-amber-500 focus:bg-white resize-y min-h-[120px]"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            {isAr
              ? 'سيتم إرفاق رقم إصدار الموقع الحالي تلقائياً بجانب العنوان.'
              : 'The current website version number is attached automatically next to the title.'}
          </p>
        </div>

        {/* Live preview */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-amber-800 mb-1.5">
            {isAr ? 'معاينة الشريط' : 'Banner preview'}
          </p>
          <div className="rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-slate-950 px-3 py-2">
            <p className="text-[11px] font-black flex flex-wrap items-center gap-1.5">
              <span>{(title || '').trim() || (isAr ? 'تحديث جديد للموقع متاح الآن' : 'A new website update is available')}</span>
              <span className="px-1.5 py-0.5 rounded-md bg-slate-950 text-amber-200 font-mono text-[10px]">
                {APP_VERSION_LABEL}
              </span>
            </p>
            <p className="text-[11px] font-semibold whitespace-pre-line mt-1">
              {message || (isAr ? 'اكتب نص الرسالة...' : 'Write the message...')}
            </p>
          </div>
        </div>

        {status && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold flex items-start gap-2 ${
              status.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            {status.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <span>{status.text}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handlePublish}
            disabled={isSaving}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shadow-xs cursor-pointer transition-colors min-h-[42px]"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
            <span>{isAr ? 'نشر الرسالة الثابتة' : 'Publish Sticky Message'}</span>
          </button>
          <button
            type="button"
            onClick={handleSendPush}
            disabled={isSendingPush}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black shadow-xs cursor-pointer transition-colors min-h-[42px]"
          >
            {isSendingPush ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>{isAr ? 'إرسال إشعار للهواتف' : 'Send Phone Alert'}</span>
          </button>
          <button
            type="button"
            onClick={handleHide}
            disabled={isSaving}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-colors min-h-[42px]"
          >
            <EyeOff className="w-4 h-4" />
            <span>{isAr ? 'إخفاء الرسالة' : 'Hide Message'}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
