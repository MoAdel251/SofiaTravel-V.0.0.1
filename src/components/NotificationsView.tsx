import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  BellRing,
  CheckCircle2,
  Clock,
  Send,
  Smartphone,
  Users,
  ShieldCheck,
  AlertCircle,
  CheckCheck,
  Sparkles,
} from 'lucide-react';
import {
  AttendanceSettings,
  Employee,
  NotificationItem,
  UserRole,
  WorkSchedule,
} from '../types';
import { useLanguage } from '../context/LanguageContext';
import {
  EmployeePushIdentity,
  PhoneNotificationSupportStatus,
  enableEmployeePhoneNotifications,
  getPhoneNotificationSupportStatus,
  isRunningStandalonePWA,
  resolveEmployeeDesignatedSchedule,
  sendSelfTestPhoneNotification,
} from '../services/pushNotificationService';
import { dataService } from '../services/dataService';

interface NotificationsViewProps {
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  onMarkAllRead?: () => void;
  employees?: Employee[];
  workSchedules?: WorkSchedule[];
  attendanceSettings?: AttendanceSettings | null;
  currentEmployee?: Employee | null;
  currentUsername?: string;
  currentEmpId?: string;
  userRole?: UserRole;
  isAdmin?: boolean;
  isITAccount?: boolean;
  onPermissionStatusChange?: (status: PhoneNotificationSupportStatus) => void;
  onShowToast?: (msg: string) => void;
}

export function NotificationsView({
  notifications,
  onMarkRead,
  onMarkAllRead,
  employees = [],
  workSchedules = [],
  attendanceSettings = null,
  currentEmployee = null,
  currentUsername = 'Employee',
  currentEmpId = '',
  userRole = 'Sales',
  isAdmin = false,
  isITAccount = false,
  onPermissionStatusChange,
  onShowToast,
}: NotificationsViewProps) {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const canSendCustom = Boolean(isAdmin || isITAccount || userRole === 'Administrator');

  const [permStatus, setPermStatus] = useState<PhoneNotificationSupportStatus>(() =>
    getPhoneNotificationSupportStatus()
  );
  const [isEnablingPush, setIsEnablingPush] = useState(false);
  const [isTestingPush, setIsTestingPush] = useState(false);
  const [subscribedStats, setSubscribedStats] = useState<{
    totalSubscribedDevices: number;
    employeeSubscribedDevices: number;
  }>({ totalSubscribedDevices: 0, employeeSubscribedDevices: 0 });

  // Custom Notification Composer State (Admin & IT Developer)
  const [targetScope, setTargetScope] = useState<'ALL' | 'SELECTED'>('ALL');
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([]);
  const [customCategory, setCustomCategory] = useState<string>('Announcement');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [isSendingCustom, setIsSendingCustom] = useState(false);
  const [isSendingScheduleBroadcast, setIsSendingScheduleBroadcast] = useState(false);
  const [statusBanner, setStatusBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Feed Filter State
  const [feedFilter, setFeedFilter] = useState<'all' | 'unread' | 'schedule' | 'custom'>('all');

  const activeEmpId = currentEmployee?.id || currentEmpId || currentUsername;
  const activeEmpName = currentEmployee?.name || currentEmployee?.full_name || currentUsername;

  const mySchedule = useMemo(
    () =>
      resolveEmployeeDesignatedSchedule(
        {
          id: activeEmpId,
          employee_id: currentEmployee?.employee_id || activeEmpId,
          name: activeEmpName,
          username: currentEmployee?.username || currentUsername,
        },
        workSchedules,
        attendanceSettings
      ),
    [activeEmpId, activeEmpName, currentEmployee, currentUsername, workSchedules, attendanceSettings]
  );

  const pushIdentity: EmployeePushIdentity = useMemo(
    () => ({
      employee_id: activeEmpId,
      employee_name: activeEmpName,
      username: currentUsername,
      user_role: isITAccount ? 'IT Developer' : userRole,
      language,
      designated_check_in: mySchedule.checkIn,
      designated_check_out: mySchedule.checkOut,
    }),
    [activeEmpId, activeEmpName, currentUsername, isITAccount, userRole, language, mySchedule]
  );

  const refreshPushStats = async () => {
    const currentPerm = getPhoneNotificationSupportStatus();
    setPermStatus(currentPerm);
    onPermissionStatusChange?.(currentPerm);
    try {
      const res = await fetch(
        `/api/push/status?employee_id=${encodeURIComponent(activeEmpId)}&employee_name=${encodeURIComponent(activeEmpName)}&t=${Date.now()}`
      );
      if (res.ok) {
        const data = await res.json();
        setSubscribedStats({
          totalSubscribedDevices: Number(data.totalSubscribedDevices) || 0,
          employeeSubscribedDevices: Number(data.employeeSubscribedDevices) || 0,
        });
      }
    } catch {}
  };

  useEffect(() => {
    refreshPushStats();
  }, [activeEmpId, activeEmpName]);

  // Unified selectable employees list for Admin/IT custom targeting
  const selectableEmployees = useMemo(() => {
    const map = new Map<string, { id: string; name: string; position: string; checkIn: string; checkOut: string }>();
    employees.forEach(emp => {
      const status = emp.account_status || emp.status || 'Active';
      if (status === 'Inactive' || status === 'Suspended' || emp.login_access_enabled === false) return;
      const id = emp.id || emp.employee_id || emp.name;
      const name = emp.name || emp.full_name || emp.username || id;
      const sched = resolveEmployeeDesignatedSchedule(
        { id: emp.id, employee_id: emp.employee_id, name, username: emp.username },
        workSchedules,
        attendanceSettings
      );
      map.set(id, {
        id,
        name,
        position: emp.position || 'Staff',
        checkIn: sched.checkIn,
        checkOut: sched.checkOut,
      });
    });

    workSchedules.forEach(ws => {
      const id = ws.employee_id || ws.id;
      if (id && !map.has(id)) {
        const existsByName = Array.from(map.values()).some(
          item => item.name.toLowerCase() === (ws.employee_name || '').toLowerCase()
        );
        if (!existsByName) {
          map.set(id, {
            id,
            name: ws.employee_name || id,
            position: 'Staff',
            checkIn: ws.start_time || '10:00',
            checkOut: ws.end_time || '18:00',
          });
        }
      }
    });

    return Array.from(map.values());
  }, [employees, workSchedules, attendanceSettings]);

  const showLocalFeedback = (type: 'success' | 'error', text: string) => {
    setStatusBanner({ type, text });
    if (onShowToast) onShowToast(text);
    setTimeout(() => {
      setStatusBanner(prev => (prev?.text === text ? null : prev));
    }, 5500);
  };

  const handleEnablePhoneAlerts = async () => {
    setIsEnablingPush(true);
    try {
      const result = await enableEmployeePhoneNotifications(pushIdentity);
      setPermStatus(result.status);
      onPermissionStatusChange?.(result.status);
      await refreshPushStats();

      if (result.granted) {
        showLocalFeedback(
          'success',
          isAr
            ? `تم تفعيل إشعارات الهاتف وإرسال تنبيه فوري لهاتفك! مواعيدك: حضور ${result.schedule.checkIn} • انصراف ${result.schedule.checkOut}.`
            : `Phone push notifications enabled & instant alert sent to your phone! Schedule: Check-In ${result.schedule.checkIn} • Check-Out ${result.schedule.checkOut}.`
        );
      } else if (result.status === 'ios_install_required') {
        showLocalFeedback(
          'error',
          isAr
            ? 'على أجهزة iPhone: اضغط زر المشاركة في Safari ثم "إضافة إلى الشاشة الرئيسية" لتفعيل إشعارات الويب الفورية.'
            : 'On iPhone/iPad: Tap Share in Safari and select "Add to Home Screen" first to enable direct Web Push alerts.'
        );
      } else if (result.status === 'denied') {
        showLocalFeedback(
          'error',
          isAr
            ? 'تم حظر الإشعارات في إعدادات المتصفح. يرجى السماح بالإشعارات من قفل العنوان أعلى المتصفح.'
            : 'Notifications are blocked in browser settings. Please allow notifications from your browser site settings.'
        );
      }
    } finally {
      setIsEnablingPush(false);
    }
  };

  const handleTestPhoneAlert = async () => {
    setIsTestingPush(true);
    try {
      const ok = await sendSelfTestPhoneNotification(pushIdentity);
      await refreshPushStats();
      if (ok) {
        showLocalFeedback(
          'success',
          isAr
            ? 'تم إرسال تنبيه تجريبي فوري إلى هاتفك الآن!'
            : 'Instant test alert dispatched directly to your phone!'
        );
      } else {
        showLocalFeedback(
          'error',
          isAr
            ? 'يرجى السماح بالإشعارات أولاً ليصلك التنبيه على الهاتف.'
            : 'Please allow notifications first to receive alerts on your phone.'
        );
      }
    } finally {
      setIsTestingPush(false);
    }
  };

  const toggleSelectEmployee = (id: string) => {
    setSelectedEmpIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSendCustomNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSendCustom) return;

    const titleClean = customTitle.trim();
    const msgClean = customMessage.trim();
    if (!titleClean || !msgClean) {
      showLocalFeedback(
        'error',
        isAr ? 'يرجى إدخال عنوان ونص الإشعار.' : 'Please enter both notification title and message.'
      );
      return;
    }

    if (targetScope === 'SELECTED' && selectedEmpIds.length === 0) {
      showLocalFeedback(
        'error',
        isAr ? 'يرجى اختيار موظف واحد على الأقل.' : 'Please select at least one employee.'
      );
      return;
    }

    setIsSendingCustom(true);
    try {
      const targetPayload =
        targetScope === 'SELECTED'
          ? selectableEmployees
              .filter(emp => selectedEmpIds.includes(emp.id))
              .map(emp => ({ id: emp.id, name: emp.name }))
          : [];

      const actingHeaderUser = isITAccount ? 'IT' : currentUsername;
      const res = await fetch('/api/push/send-custom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-acting-user': actingHeaderUser,
          'x-acting-role': isITAccount ? 'Administrator' : userRole,
        },
        body: JSON.stringify({
          title: titleClean,
          message: msgClean,
          target_scope: targetScope === 'ALL' ? 'ALL' : 'SELECTED',
          target_employees: targetPayload,
          category: customCategory,
          sender_name: actingHeaderUser,
          sender_role: isITAccount ? 'IT Developer' : userRole,
          is_it: isITAccount,
          language,
          tab: customCategory === 'Attendance' ? 'attendance' : 'notifications',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCustomTitle('');
        setCustomMessage('');
        if (targetScope === 'SELECTED') setSelectedEmpIds([]);
        await refreshPushStats();
        showLocalFeedback(
          'success',
          isAr
            ? `تم إرسال الإشعار المخصص بنجاح (${data.devicesNotified || 0} هاتف مشترك تم تنبيهه فوراً)!`
            : `Custom notification sent successfully (${data.devicesNotified || 0} subscribed phone(s) alerted immediately)!`
        );
      } else {
        // Direct Firestore fallback so real-time connected phones still receive the notification
        const nowIso = new Date().toISOString();
        if (targetScope === 'ALL') {
          const notifId = `NOTIF-CUSTOM-${Date.now()}`;
          await dataService.saveDocument('notifications', notifId, {
            id: notifId,
            title: titleClean,
            message: msgClean,
            type: 'custom',
            category: customCategory,
            target_scope: 'ALL',
            sender_name: actingHeaderUser,
            sender_role: isITAccount ? 'IT Developer' : userRole,
            date: nowIso.replace('T', ' ').substring(0, 16),
            created_at: nowIso,
            read: false,
            read_by: [],
          });
        } else {
          for (const emp of targetPayload) {
            const notifId = `NOTIF-CUSTOM-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
            await dataService.saveDocument('notifications', notifId, {
              id: notifId,
              title: titleClean,
              message: msgClean,
              type: 'custom',
              category: customCategory,
              target_scope: 'EMPLOYEE',
              target_employee_id: emp.id,
              target_employee_name: emp.name,
              sender_name: actingHeaderUser,
              sender_role: isITAccount ? 'IT Developer' : userRole,
              date: nowIso.replace('T', ' ').substring(0, 16),
              created_at: nowIso,
              read: false,
              read_by: [],
            });
          }
        }
        setCustomTitle('');
        setCustomMessage('');
        showLocalFeedback(
          'success',
          isAr ? 'تم إرسال الإشعار وحفظه في السحابة بنجاح!' : 'Custom notification saved & broadcast via Cloud!'
        );
      }
    } catch (err) {
      console.error('Error sending custom notification:', err);
      showLocalFeedback(
        'error',
        isAr ? 'تعذر إرسال الإشعار، حاول مرة أخرى.' : 'Failed to send notification. Please try again.'
      );
    } finally {
      setIsSendingCustom(false);
    }
  };

  const handleBroadcastScheduleRemindersNow = async () => {
    if (!canSendCustom) return;
    setIsSendingScheduleBroadcast(true);
    try {
      const actingHeaderUser = isITAccount ? 'IT' : currentUsername;
      const res = await fetch('/api/push/send-schedule-reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-acting-user': actingHeaderUser,
          'x-acting-role': isITAccount ? 'Administrator' : userRole,
        },
        body: JSON.stringify({
          sender_name: actingHeaderUser,
          sender_role: isITAccount ? 'IT Developer' : userRole,
          is_it: isITAccount,
          language,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        await refreshPushStats();
        showLocalFeedback(
          'success',
          isAr
            ? `تم إرسال تذكير بمواعيد الحضور والانصراف المحددة إلى ${data.employeesReminded || 0} موظف (${data.devicesNotified || 0} هاتف)!`
            : `Sent designated check-in & check-out reminders to ${data.employeesReminded || 0} employee(s) (${data.devicesNotified || 0} phone device(s))!`
        );
      } else {
        showLocalFeedback(
          'error',
          isAr ? 'حدث خطأ أثناء إرسال تذكير المواعيد.' : 'Could not trigger schedule reminders.'
        );
      }
    } catch {
      showLocalFeedback(
        'error',
        isAr ? 'حدث خطأ أثناء الاتصال بالخادم.' : 'Network error triggering schedule reminders.'
      );
    } finally {
      setIsSendingScheduleBroadcast(false);
    }
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (feedFilter === 'unread') return !n.read;
      if (feedFilter === 'schedule') return n.type === 'attendance_reminder';
      if (feedFilter === 'custom') return n.type === 'custom';
      return true;
    });
  }, [notifications, feedFilter]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);
  const isStandaloneApp = isRunningStandalonePWA();

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-50 min-h-screen">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <BellRing className="w-6 h-6 text-cyan-600 shrink-0" />
            <span>{isAr ? 'مركز الإشعارات وتنبيهات الهاتف الفورية' : 'Notifications & Phone Web Push Center'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {isAr
              ? 'إشعارات مباشرة على هواتف الموظفين وتذكير تلقائي بمواعيد الحضور والانصراف والتنبيهات الإدارية.'
              : 'Direct browser-to-phone push alerts, automatic check-in/check-out schedule reminders, and team announcements.'}
          </p>
        </div>

        {unreadCount > 0 && onMarkAllRead && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
          >
            <CheckCheck className="w-4 h-4 text-cyan-400" />
            <span>
              {isAr ? `تحديد الكل كمقروء (${unreadCount})` : `Mark All Read (${unreadCount})`}
            </span>
          </button>
        )}
      </div>

      {/* Status Feedback Banner */}
      {statusBanner && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2.5 ${
            statusBanner.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {statusBanner.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{statusBanner.text}</span>
        </div>
      )}

      {/* 1. EMPLOYEE PHONE WEB PUSH & DESIGNATED SHIFT SCHEDULE CARD */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950 text-white rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-lg space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${
                  permStatus === 'granted'
                    ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                    : permStatus === 'denied'
                    ? 'bg-rose-500/20 border-rose-400/40 text-rose-300'
                    : 'bg-amber-500/20 border-amber-400/40 text-amber-300'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>
                  {permStatus === 'granted'
                    ? isAr
                      ? 'إشعارات الهاتف مفعلة على هذا الجهاز'
                      : 'Phone Push Alerts Active on This Device'
                    : permStatus === 'denied'
                    ? isAr
                      ? 'الإشعارات محظورة في إعدادات المتصفح'
                      : 'Notifications Blocked in Browser Settings'
                    : permStatus === 'ios_install_required'
                    ? isAr
                      ? 'يتطلب إضافة التطبيق للشاشة الرئيسية (iOS)'
                      : 'Add App to Home Screen First (iOS)'
                    : isAr
                    ? 'بانتظار السماح بإشعارات الهاتف'
                    : 'Allow Notifications to Receive Phone Alerts'}
                </span>
              </span>

              {isStandaloneApp && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-200 text-[11px] font-bold">
                  <Sparkles className="w-3 h-3" />
                  <span>{isAr ? 'نسخة الهاتف المثبتة محدثة' : 'Installed Phone App Active'}</span>
                </span>
              )}
            </div>

            <h2 className="text-base sm:text-lg font-black text-white">
              {isAr
                ? `تنبيهات الموظف المباشرة على الهاتف — ${activeEmpName}`
                : `Direct Browser-to-Phone Alerts — ${activeEmpName}`}
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              {isAr
                ? 'بمجرد السماح بالإشعارات، يرسل النظام تنبيهاً فورياً مباشرة إلى هاتفك، كما يذكرك تلقائياً يومياً بموعد حضورك وموعد انصرافك المحددين وأي تنبيهات مخصصة من الإدارة.'
                : 'Immediately after allowing notifications, the browser sends push alerts directly to your phone and automatically reminds you of your designated check-in and check-out times.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {permStatus !== 'granted' ? (
              <button
                type="button"
                onClick={handleEnablePhoneAlerts}
                disabled={isEnablingPush}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs sm:text-sm font-black shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 min-h-[46px]"
              >
                <BellRing className="w-4 h-4 shrink-0" />
                <span>
                  {isEnablingPush
                    ? isAr
                      ? 'جاري التفعيل وإرسال التنبيه...'
                      : 'Activating & Sending Alert...'
                    : isAr
                    ? 'السماح بإشعارات الهاتف الآن'
                    : 'Allow Phone Notifications Now'}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleTestPhoneAlert}
                disabled={isTestingPush}
                className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors min-h-[44px]"
              >
                <Bell className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>
                  {isTestingPush
                    ? isAr
                      ? 'جاري الإرسال...'
                      : 'Sending...'
                    : isAr
                    ? 'إرسال تنبيه فوري تجريبي لهاتفي'
                    : 'Send Instant Test Alert to My Phone'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Designated Check-In & Check-Out Schedule Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/90 text-xs">
          <div className="p-3 rounded-2xl bg-slate-800/70 border border-slate-700/70 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300">
              <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{isAr ? 'موعد الحضور المحدد لك:' : 'Your Designated Check-In:'}</span>
            </div>
            <span className="font-mono font-black text-sm text-emerald-300">{mySchedule.checkIn}</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-800/70 border border-slate-700/70 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300">
              <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{isAr ? 'موعد الانصراف المحدد لك:' : 'Your Designated Check-Out:'}</span>
            </div>
            <span className="font-mono font-black text-sm text-cyan-300">{mySchedule.checkOut}</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-800/70 border border-slate-700/70 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{isAr ? 'التذكير التلقائي اليومي:' : 'Automatic Daily Reminders:'}</span>
            </div>
            <span className="font-bold text-amber-300">
              {isAr ? 'مفعل لجميع الموظفين' : 'Active for All Staff'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. ADMIN & DEVELOPER ("IT") CUSTOM NOTIFICATION & SCHEDULE BROADCAST COMPOSER */}
      {canSendCustom && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-slate-900 text-cyan-300 text-[10px] font-extrabold uppercase tracking-wider inline-flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>{isITAccount ? 'IT Developer' : 'Administrator'}</span>
                </span>
                <span className="text-[11px] font-bold text-slate-500">
                  {isAr
                    ? `الهواتف المشتركة حالياً: ${subscribedStats.totalSubscribedDevices}`
                    : `Subscribed Employee Phones/Browsers: ${subscribedStats.totalSubscribedDevices}`}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                {isAr
                  ? 'إرسال إشعارات مخصصة وتذكيرات الدوام للموظفين'
                  : 'Send Custom Notifications & Shift Reminders to Employees'}
              </h3>
            </div>

            <button
              type="button"
              onClick={handleBroadcastScheduleRemindersNow}
              disabled={isSendingScheduleBroadcast}
              className="px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-colors shrink-0 min-h-[42px]"
            >
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {isSendingScheduleBroadcast
                  ? isAr
                    ? 'جاري إرسال تذكير المواعيد...'
                    : 'Sending Schedule Reminders...'
                  : isAr
                  ? 'إرسال تذكير مواعيد الحضور والانصراف لجميع الموظفين الآن'
                  : 'Send Check-In & Check-Out Schedule Reminder Now'}
              </span>
            </button>
          </div>

          <form onSubmit={handleSendCustomNotification} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Target Audience */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  {isAr ? 'إرسال إلى *' : 'Target Recipients *'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetScope('ALL')}
                    className={`py-2.5 px-3 rounded-xl font-bold border flex items-center justify-center gap-1.5 cursor-pointer transition-colors min-h-[42px] ${
                      targetScope === 'ALL'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Users className="w-4 h-4 shrink-0" />
                    <span>{isAr ? 'جميع الموظفين' : 'All Employees'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetScope('SELECTED')}
                    className={`py-2.5 px-3 rounded-xl font-bold border flex items-center justify-center gap-1.5 cursor-pointer transition-colors min-h-[42px] ${
                      targetScope === 'SELECTED'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 shrink-0" />
                    <span>{isAr ? 'موظفين محددين' : 'Specific Employees'}</span>
                  </button>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  {isAr ? 'تصنيف الإشعار' : 'Notification Category'}
                </label>
                <select
                  value={customCategory}
                  onChange={e => setCustomCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-bold text-slate-900 min-h-[42px]"
                >
                  <option value="Announcement">
                    {isAr ? 'تعميم إداري عام' : 'General Announcement'}
                  </option>
                  <option value="Attendance">
                    {isAr ? 'تنبيه حضور وانصراف' : 'Attendance & Shift Alert'}
                  </option>
                  <option value="Urgent">
                    {isAr ? 'تنبيه عاجل ومهم' : 'Urgent Priority Alert'}
                  </option>
                  <option value="Operations">
                    {isAr ? 'مهام وعمليات التشغيل' : 'Tasks & Operations'}
                  </option>
                </select>
              </div>
            </div>

            {/* Specific Employee Multi-Select */}
            {targetScope === 'SELECTED' && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">
                    {isAr
                      ? `اختر الموظفين المستهدفين (${selectedEmpIds.length} محدد):`
                      : `Select Target Employees (${selectedEmpIds.length} selected):`}
                  </span>
                  {selectableEmployees.length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedEmpIds(
                          selectedEmpIds.length === selectableEmployees.length
                            ? []
                            : selectableEmployees.map(e => e.id)
                        )
                      }
                      className="text-[11px] font-bold text-cyan-700 hover:underline cursor-pointer"
                    >
                      {selectedEmpIds.length === selectableEmployees.length
                        ? isAr
                          ? 'إلغاء تحديد الكل'
                          : 'Clear All'
                        : isAr
                        ? 'تحديد الكل'
                        : 'Select All'}
                    </button>
                  )}
                </div>

                {selectableEmployees.length === 0 ? (
                  <p className="text-slate-400">
                    {isAr ? 'لا يوجد موظفون مضافون حالياً.' : 'No employee accounts found.'}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {selectableEmployees.map(emp => {
                      const active = selectedEmpIds.includes(emp.id);
                      return (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={() => toggleSelectEmployee(emp.id)}
                          className={`px-3 py-1.5 rounded-xl font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                            active
                              ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-cyan-400'
                          }`}
                        >
                          <span>{emp.name}</span>
                          <span
                            className={`text-[10px] font-mono ${
                              active ? 'text-cyan-100' : 'text-slate-400'
                            }`}
                          >
                            ({emp.checkIn}–{emp.checkOut})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Custom Title */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                {isAr ? 'عنوان الإشعار *' : 'Notification Title *'}
              </label>
              <input
                type="text"
                required
                value={customTitle}
                onChange={e => setCustomTitle(e.target.value)}
                placeholder={
                  isAr
                    ? 'مثال: اجتماع فريق المبيعات الساعة 2:00 ظهراً'
                    : 'e.g., Important Team Briefing at 2:00 PM'
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-semibold text-slate-900 focus:outline-none focus:border-cyan-600"
              />
            </div>

            {/* Custom Message */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                {isAr ? 'نص الرسالة والتنبيه *' : 'Notification Message *'}
              </label>
              <textarea
                required
                rows={3}
                value={customMessage}
                onChange={e => setCustomMessage(e.target.value)}
                placeholder={
                  isAr
                    ? 'اكتب تفاصيل الإشعار ليصل مباشرة إلى هواتف الموظفين وداخل التطبيق...'
                    : 'Write the custom alert message to deliver immediately to employees’ phones and in-app...'
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-medium text-slate-900 focus:outline-none focus:border-cyan-600 resize-none"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSendingCustom}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all min-h-[46px]"
              >
                <Send className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>
                  {isSendingCustom
                    ? isAr
                      ? 'جاري إرسال الإشعار للهواتف...'
                      : 'Sending Push Notification...'
                    : isAr
                    ? 'إرسال الإشعار المخصص الآن'
                    : 'Send Custom Notification Now'}
                </span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. FILTER PILLS & NOTIFICATIONS FEED */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', labelAr: `الكل (${notifications.length})`, labelEn: `All (${notifications.length})` },
            { id: 'unread', labelAr: `غير مقروء (${unreadCount})`, labelEn: `Unread (${unreadCount})` },
            {
              id: 'schedule',
              labelAr: 'تذكيرات الحضور والانصراف',
              labelEn: 'Check-In / Out Reminders',
            },
            { id: 'custom', labelAr: 'إشعارات الإدارة / المطور', labelEn: 'Admin / IT Alerts' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFeedFilter(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                feedFilter === tab.id
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {isAr ? tab.labelAr : tab.labelEn}
            </button>
          ))}
        </div>

        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Bell className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">
              {isAr ? 'لا توجد إشعارات في هذا القسم حالياً' : 'No notifications in this view right now'}
            </p>
            <p className="text-xs text-slate-400">
              {isAr
                ? 'ستظهر هنا تنبيهات الحضور والانصراف والإشعارات الإدارية فور وصولها.'
                : 'Attendance schedule reminders, custom alerts, and operational updates will appear here.'}
            </p>
          </div>
        ) : (
          filteredNotifications.map(n => {
            const isSchedule = n.type === 'attendance_reminder';
            const isCustom = n.type === 'custom';
            return (
              <div
                key={n.id}
                className={`p-4 rounded-2xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  n.read
                    ? 'bg-white border-slate-200 text-slate-600'
                    : 'bg-cyan-50/60 border-cyan-200 text-slate-900 font-medium shadow-2xs'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      n.read
                        ? 'bg-slate-100 text-slate-500'
                        : isSchedule
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : isCustom
                        ? 'bg-slate-900 text-cyan-300 shadow-xs'
                        : 'bg-cyan-600 text-white shadow-xs'
                    }`}
                  >
                    {isSchedule ? <Clock className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h4 className="text-sm font-bold text-slate-900 break-words">{n.title}</h4>
                      {n.category && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                          {n.category}
                        </span>
                      )}
                      {n.sender_name && (
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                          {isAr ? `من: ${n.sender_name}` : `From: ${n.sender_name}`}
                        </span>
                      )}
                      {canSendCustom && n.target_scope === 'EMPLOYEE' && n.target_employee_name && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-bold">
                          {isAr ? `إلى: ${n.target_employee_name}` : `To: ${n.target_employee_name}`}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed break-words">{n.message}</p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                      <span>{n.date}</span>
                      {n.designated_check_in && n.designated_check_out && (
                        <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          {n.designated_check_in} → {n.designated_check_out}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {!n.read && (
                  <button
                    type="button"
                    onClick={() => onMarkRead(n.id)}
                    className="self-end sm:self-center px-3.5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer min-h-[38px]"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{isAr ? 'تحديد كمقروء' : 'Mark Read'}</span>
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
