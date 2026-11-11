import React, { useEffect, useMemo, useState } from 'react';
import {
  Users,
  BookmarkCheck,
  Plane,
  DollarSign,
  AlertCircle,
  Clock,
  ArrowUpRight,
  Trash2,
  Database,
  Power,
  FileText,
  Ticket,
  MessageCircle,
  Layers,
  CalendarDays,
  Megaphone,
  Timer,
  Wallet,
  ArrowRight,
  Coffee,
  ChevronRight,
  Bell,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { AttendanceRecord, NotificationItem, UserRole, LeaveBalance, Announcement } from '../types';
import { formatCurrency } from '../utils/currency';
import { useLanguage } from '../context/LanguageContext';
import { hrFetch } from '../services/hrApi';

interface DashboardViewProps {
  stats: any;
  currentCurrency: string;
  isAdmin?: boolean;
  onOpenAdminReset?: () => void;
  dbConnected?: boolean;
  onVerifyDb?: () => void;
  isITAccount?: boolean;
  isSiteDisabled?: boolean;
  onOpenITSiteControl?: () => void;
  onNavigateTab?: (tab: string) => void;
  username?: string;
  userRole?: UserRole;
  currentUsername?: string;
  todayAttendance?: AttendanceRecord | null;
  notifications?: NotificationItem[];
  onClockIn?: () => void;
  onClockOut?: () => void;
}

function timeGreeting(hour: number, isAr: boolean) {
  if (hour < 12) return isAr ? 'صباح الخير' : 'Good morning';
  if (hour < 18) return isAr ? 'مساء الخير' : 'Good afternoon';
  return isAr ? 'مساء الخير' : 'Good evening';
}

export function DashboardView({
  stats,
  currentCurrency = 'EGP',
  isAdmin = false,
  onOpenAdminReset,
  dbConnected = true,
  onVerifyDb,
  isITAccount = false,
  isSiteDisabled = false,
  onOpenITSiteControl,
  onNavigateTab,
  username = '',
  userRole = 'Sales',
  currentUsername = '',
  todayAttendance = null,
  notifications = [],
  onClockIn,
  onClockOut,
}: DashboardViewProps) {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const activeCurrency = currentCurrency || 'EGP';

  const acting = useMemo(
    () => ({ username: currentUsername, role: isAdmin ? 'Administrator' : userRole, isIT: isITAccount }),
    [currentUsername, userRole, isAdmin, isITAccount]
  );

  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [hrLoaded, setHrLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    const year = new Date().getFullYear();
    (async () => {
      try {
        const rows = await hrFetch<LeaveBalance[]>(`/api/leave-balances?year=${year}`, acting);
        if (alive && Array.isArray(rows) && rows.length > 0) {
          const self = rows.find(row =>
            String(row.employee_name || '').trim().toLowerCase() === String(username || '').trim().toLowerCase()
          );
          setLeaveBalance(self || (rows.length === 1 ? rows[0] : null));
        }
      } catch {
        /* Dashboard card degrades gracefully if HR data is unavailable. */
      }
      try {
        const list = await hrFetch<Announcement[]>('/api/announcements', acting);
        if (alive && Array.isArray(list)) setAnnouncements(list);
      } catch {
        /* Keep notifications fallback */
      }
      if (alive) setHrLoaded(true);
    })();
    return () => {
      alive = false;
    };
  }, [acting, username]);

  if (!stats) {
    return (
      <div className="p-6 sm:p-8 text-center text-[var(--text-3)]">
        {isAr ? 'جاري تحميل تحليلات لوحة التحكم...' : 'Loading dashboard analytics...'}
      </div>
    );
  }

  const monthlyData = stats.monthlyData || [];
  const now = new Date();
  const greeting = timeGreeting(now.getHours(), isAr);
  const displayName = username || (isAr ? 'زميلنا العزيز' : 'there');

  const checkIn = todayAttendance?.clock_in || todayAttendance?.check_in_time || '';
  const checkOut = todayAttendance?.clock_out || todayAttendance?.check_out_time || '';
  const isShiftOpen = Boolean(checkIn && !checkOut);
  const lateMinutes = Number(todayAttendance?.late_minutes || 0);
  const workingHours = todayAttendance?.working_hours;

  const remaining = Number(leaveBalance?.remaining ?? 0);
  const totalAllowance = Number(leaveBalance?.total_allowance ?? leaveBalance?.annual_allowance ?? 0);
  const usedDays = Number(leaveBalance?.used ?? 0);
  const leavePct = totalAllowance > 0 ? Math.min(100, Math.round((remaining / totalAllowance) * 100)) : 0;

  const announcementFeed = announcements.slice(0, 3);
  const fallbackFeed = notifications.filter(n => !n.read).slice(0, 3);

  const kpis = [
    {
      label: isAr ? 'العملاء المسجلون' : 'Registered Customers',
      value: stats.total_customers ?? 0,
      icon: Users,
      tint: 'from-sofia-turquoise/20 to-sofia-turquoise/5 text-sofia-turquoise-600',
      hint: isAr ? 'قاعدة العملاء' : 'Customer base',
    },
    {
      label: isAr ? 'إجمالي الحجوزات' : 'Total Reservations',
      value: stats.active_reservations ?? 0,
      icon: BookmarkCheck,
      tint: 'from-sofia-lavender/25 to-sofia-lavender/5 text-sofia-purple-500',
      hint: `${stats.active_reservations ?? 0} ${isAr ? 'نشط' : 'active'}`,
    },
    {
      label: isAr ? 'رحلات قادمة' : 'Upcoming Trips',
      value: stats.upcoming_trips ?? 0,
      icon: Plane,
      tint: 'from-amber-400/25 to-amber-400/5 text-amber-600',
      hint: isAr ? 'خلال ٣٠ يوماً' : 'Next 30 days',
    },
    {
      label: isAr ? 'صافي الربح' : 'Net Profit',
      value: formatCurrency(stats.net_profit, activeCurrency),
      icon: DollarSign,
      tint: 'from-emerald-400/25 to-emerald-400/5 text-emerald-600',
      hint: `${isAr ? 'المبيعات' : 'Sales'} ${formatCurrency(stats.total_sales, activeCurrency)}`,
      highlight: true,
    },
  ];

  const quickLinks = [
    { id: 'attendance', label: isAr ? 'الحضور والانصراف' : 'Attendance', icon: Clock },
    { id: 'leave-management', label: isAr ? 'الإجازات' : 'Leave', icon: CalendarDays },
    { id: 'announcements', label: isAr ? 'الإعلانات' : 'Announcements', icon: Megaphone },
    { id: 'notifications', label: isAr ? 'الإشعارات' : 'Notifications', icon: Bell },
    { id: 'vouchers', label: isAr ? 'السندات' : 'Vouchers', icon: Ticket },
    { id: 'invoices', label: isAr ? 'الفواتير' : 'Invoices', icon: FileText },
  ];

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-5 p-3 sm:p-5 lg:p-8 bg-transparent min-h-full">
      {/* Welcome hero */}
      <section className="fluent-rise relative overflow-hidden rounded-2xl sm:rounded-3xl fluent-brand-gradient p-4 sm:p-8 text-white shadow-[var(--shadow-2)]">
        <div className="pointer-events-none absolute -end-10 -top-16 h-56 w-56 rounded-full bg-sofia-turquoise/30 blur-3xl" />
        <div className="pointer-events-none absolute -start-16 bottom-0 h-48 w-48 rounded-full bg-sofia-lavender/30 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/90 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-sofia-turquoise" />
              {now.toLocaleDateString(isAr ? 'ar-EG' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <h1 className="mt-3 sm:mt-4 text-[22px] leading-tight sm:text-3xl font-extrabold tracking-tight truncate">
              {greeting}, {displayName}
            </h1>
            <p className="mt-1.5 hidden sm:block text-xs sm:text-sm text-white/75 max-w-xl">
              {isAr
                ? 'إليك ملخصاً سريعاً للحضور والإجازات والعمليات اليومية.'
                : "Here's your attendance, leave balance and today's operations at a glance."}
            </p>

            <div className="mt-3 sm:mt-5 flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 border border-white/15 px-3 py-1.5 text-[11px] font-semibold">
                <Clock className="w-3.5 h-3.5 text-sofia-turquoise" />
                {checkIn
                  ? `${isAr ? 'حضور' : 'In'} ${checkIn}`
                  : (isAr ? 'لم يتم تسجيل الحضور' : 'Not clocked in')}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 border border-white/15 px-3 py-1.5 text-[11px] font-semibold">
                <Timer className="w-3.5 h-3.5 text-sofia-lavender" />
                {checkOut
                  ? `${isAr ? 'انصراف' : 'Out'} ${checkOut}`
                  : (workingHours ? `${workingHours}h ${isAr ? 'حتى الآن' : 'so far'}` : (isAr ? 'وردية مفتوحة' : 'Open shift'))}
              </span>
              {lateMinutes > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500/20 border border-rose-300/30 px-3 py-1.5 text-[11px] font-bold text-rose-100">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {isAr ? `تأخير ${lateMinutes} دقيقة` : `${lateMinutes} min late`}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 lg:flex lg:flex-col lg:gap-2.5 xl:flex-row">
            {(onClockIn || onClockOut) && (
              <button
                type="button"
                onClick={isShiftOpen ? onClockOut : onClockIn}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-sofia-turquoise px-3 py-2.5 text-[13px] sm:px-5 sm:py-3 sm:text-sm font-extrabold text-sofia-purple shadow-lg shadow-sofia-turquoise/25 transition-transform hover:scale-[1.02] active:scale-[0.99] cursor-pointer"
              >
                <Clock className="w-4 h-4" />
                {isShiftOpen
                  ? (isAr ? 'تسجيل الانصراف' : 'Clock Out')
                  : (isAr ? 'تسجيل الحضور' : 'Clock In')}
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('leave-management')}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-3 py-2.5 text-[13px] sm:px-5 sm:py-3 sm:text-sm font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/15 cursor-pointer"
            >
              <CalendarDays className="w-4 h-4" />
              {isAr ? 'طلب إجازة' : 'Request Leave'}
            </button>
          </div>
        </div>
      </section>

      {/* KPI cards */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <article
              key={kpi.label}
              className="fluent-card fluent-interactive fluent-rise p-4 sm:p-5"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${kpi.tint}`}>
                  <Icon className="h-5 w-5" />
                </div>
                {kpi.highlight ? (
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                    {isAr ? 'مباشر' : 'Live'}
                  </span>
                ) : (
                  <ArrowUpRight className="h-4 w-4 text-[var(--text-3)]" />
                )}
              </div>
              <div className="mt-4 min-w-0">
                <div className="truncate text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--text-1)]">
                  {kpi.value}
                </div>
                <div className="mt-1 truncate text-[11px] sm:text-xs font-semibold text-[var(--text-2)]">{kpi.label}</div>
                <div className="mt-0.5 truncate text-[10px] text-[var(--text-3)]">{kpi.hint}</div>
              </div>
            </article>
          );
        })}
      </section>

      {/* Attendance · Leave · Announcements */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Attendance */}
        <article className="fluent-card fluent-rise p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sofia-turquoise/12 text-sofia-turquoise-600">
                <Clock className="h-4.5 w-4.5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-1)]">{isAr ? 'حضور اليوم' : "Today's Attendance"}</h3>
                <p className="text-[10px] text-[var(--text-3)]">
                  {todayAttendance?.attendance_status || (isShiftOpen ? (isAr ? 'وردية مفتوحة' : 'Shift open') : (isAr ? 'بانتظار التسجيل' : 'Awaiting check-in'))}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('attendance')}
              className="text-[11px] font-bold text-sofia-turquoise-600 hover:underline cursor-pointer"
            >
              {isAr ? 'التفاصيل' : 'Details'}
            </button>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-[var(--surface-soft)] border border-[var(--stroke)] p-2.5">
              <div className="text-[10px] font-semibold text-[var(--text-3)]">{isAr ? 'حضور' : 'Check-in'}</div>
              <div className="mt-1 text-sm font-extrabold tabular-nums text-[var(--text-1)]">{checkIn || '--:--'}</div>
            </div>
            <div className="rounded-xl bg-[var(--surface-soft)] border border-[var(--stroke)] p-2.5">
              <div className="text-[10px] font-semibold text-[var(--text-3)]">{isAr ? 'انصراف' : 'Check-out'}</div>
              <div className="mt-1 text-sm font-extrabold tabular-nums text-[var(--text-1)]">{checkOut || '--:--'}</div>
            </div>
            <div className="rounded-xl bg-[var(--surface-soft)] border border-[var(--stroke)] p-2.5">
              <div className="text-[10px] font-semibold text-[var(--text-3)]">{isAr ? 'الساعات' : 'Hours'}</div>
              <div className="mt-1 text-sm font-extrabold tabular-nums text-[var(--text-1)]">
                {workingHours ? `${workingHours}h` : '--'}
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-xl border border-[var(--stroke)] bg-[var(--surface-soft)] px-3 py-2.5">
            <span className="inline-flex items-center gap-2 text-[11px] font-semibold text-[var(--text-2)]">
              <Coffee className="h-4 w-4 text-sofia-lavender" />
              {lateMinutes > 0
                ? (isAr ? `تأخير مسجل ${lateMinutes} دقيقة` : `Recorded ${lateMinutes} min late`)
                : (isAr ? 'لا يوجد تأخير مسجل' : 'No recorded delay')}
            </span>
            <span className={`h-2 w-2 rounded-full ${lateMinutes > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`} />
          </div>
        </article>

        {/* Leave balance */}
        <article className="fluent-card fluent-rise p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sofia-lavender/20 text-sofia-purple-500">
                <CalendarDays className="h-4.5 w-4.5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-1)]">{isAr ? 'رصيد الإجازات' : 'Leave Balance'}</h3>
                <p className="text-[10px] text-[var(--text-3)]">
                  {leaveBalance?.year || now.getFullYear()} · {isAr ? 'سنوي' : 'Annual'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('leave-management')}
              className="text-[11px] font-bold text-sofia-turquoise-600 hover:underline cursor-pointer"
            >
              {isAr ? 'إدارة' : 'Manage'}
            </button>
          </div>

          {leaveBalance ? (
            <>
              <div className="mt-5 flex items-end justify-between gap-3">
                <div>
                  <div className="text-3xl font-black tracking-tight text-[var(--text-1)]">
                    {remaining}
                    <span className="ms-1 text-xs font-bold text-[var(--text-3)]">{isAr ? 'يوم' : 'days'}</span>
                  </div>
                  <div className="text-[10px] font-semibold text-[var(--text-3)]">
                    {isAr ? 'متبقي من الرصيد' : 'remaining balance'}
                  </div>
                </div>
                <span className="rounded-full bg-[var(--surface-soft)] border border-[var(--stroke)] px-2.5 py-1 text-[10px] font-bold text-[var(--text-2)]">
                  {leavePct}%
                </span>
              </div>
              <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-[var(--surface-hover)]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sofia-turquoise to-sofia-lavender transition-[width] duration-500"
                  style={{ width: `${leavePct}%` }}
                />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center justify-between rounded-lg bg-[var(--surface-soft)] px-2.5 py-1.5">
                  <span className="text-[var(--text-3)]">{isAr ? 'الاستحقاق' : 'Allowance'}</span>
                  <span className="font-bold text-[var(--text-1)]">{totalAllowance}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-[var(--surface-soft)] px-2.5 py-1.5">
                  <span className="text-[var(--text-3)]">{isAr ? 'المستخدم' : 'Used'}</span>
                  <span className="font-bold text-[var(--text-1)]">{usedDays}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--stroke-strong)] p-6 text-center">
              <Wallet className="h-7 w-7 text-[var(--text-3)]" />
              <p className="mt-2 text-[11px] font-semibold text-[var(--text-3)]">
                {hrLoaded
                  ? (isAr ? 'لا يوجد رصيد إجازات مسجل لعامك الحالي.' : 'No leave balance recorded for the current year.')
                  : (isAr ? 'جاري تحميل الرصيد...' : 'Loading balance...')}
              </p>
            </div>
          )}
        </article>

        {/* Announcements */}
        <article className="fluent-card fluent-rise p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/15 text-amber-600">
                <Megaphone className="h-4.5 w-4.5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-1)]">{isAr ? 'الإعلانات والإشعارات' : 'Announcements'}</h3>
                <p className="text-[10px] text-[var(--text-3)]">
                  {isAr ? 'آخر التحديثات الداخلية' : 'Latest internal updates'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab('announcements')}
              className="text-[11px] font-bold text-sofia-turquoise-600 hover:underline cursor-pointer"
            >
              {isAr ? 'الكل' : 'View all'}
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {announcementFeed.length > 0 ? (
              announcementFeed.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigateTab && onNavigateTab('announcements')}
                  className="flex w-full items-start gap-2.5 rounded-xl border border-[var(--stroke)] bg-[var(--surface-soft)] p-2.5 text-start transition-colors hover:bg-[var(--surface-hover)] cursor-pointer"
                >
                  <span
                    className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                      item.priority === 'Urgent' ? 'bg-rose-500' : item.priority === 'Important' ? 'bg-amber-500' : 'bg-sofia-turquoise'
                    }`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11px] font-bold text-[var(--text-1)]">{item.title}</span>
                    <span className="mt-0.5 block truncate text-[10px] text-[var(--text-3)]">
                      {item.publish_date || item.created_at?.slice(0, 10)}
                    </span>
                  </span>
                  <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--text-3)] rtl:rotate-180" />
                </button>
              ))
            ) : fallbackFeed.length > 0 ? (
              fallbackFeed.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigateTab && onNavigateTab('notifications')}
                  className="flex w-full items-start gap-2.5 rounded-xl border border-[var(--stroke)] bg-[var(--surface-soft)] p-2.5 text-start transition-colors hover:bg-[var(--surface-hover)] cursor-pointer"
                >
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-sofia-lavender" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11px] font-bold text-[var(--text-1)]">{item.title}</span>
                    <span className="mt-0.5 block truncate text-[10px] text-[var(--text-3)]">{item.message}</span>
                  </span>
                </button>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--stroke-strong)] p-6 text-center">
                <Megaphone className="h-7 w-7 text-[var(--text-3)]" />
                <p className="mt-2 text-[11px] font-semibold text-[var(--text-3)]">
                  {hrLoaded
                    ? (isAr ? 'لا توجد إعلانات نشطة الآن.' : 'No active announcements right now.')
                    : (isAr ? 'جاري التحميل...' : 'Loading...')}
                </p>
              </div>
            )}
          </div>
        </article>
      </section>

      {/* Quick access */}
      <section className="fluent-card p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-bold text-[var(--text-1)]">
            {isAr ? 'وصول سريع' : 'Quick access'}
          </h3>
          <span className="text-[10px] font-semibold text-[var(--text-3)]">
            {isAr ? 'انتقل مباشرة إلى الميزات المتكررة' : 'Jump to your frequent features'}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
          {quickLinks.map(link => {
            const Icon = link.icon;
            return (
              <button
                key={link.id}
                type="button"
                onClick={() => onNavigateTab && onNavigateTab(link.id)}
                className="fluent-interactive flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-xl border border-[var(--stroke)] bg-[var(--surface-soft)] p-2 text-center hover:bg-[var(--surface-hover)] cursor-pointer"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sofia-turquoise/12 text-sofia-turquoise-600">
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <span className="text-[10px] font-bold leading-tight text-[var(--text-2)]">{link.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Live sync strip */}
      <section className="fluent-card p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-xs sm:text-sm font-bold text-[var(--text-1)]">
              {isAr ? 'مزامنة مدخلات الموظفين عبر الوحدات' : 'Live synchronized entries across all modules'}
            </h3>
          </div>
          <span className="text-[10px] font-semibold text-[var(--text-3)]">
            {isAr ? 'تحديث تلقائي فوري' : 'Auto-synced in real time'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5 text-xs">
          {[
            { id: 'vouchers', label: isAr ? 'السندات' : 'Vouchers', value: stats.total_vouchers ?? 0, sub: isAr ? 'سندات منشأة' : 'Created vouchers', icon: Ticket, tone: 'text-sofia-turquoise-600 bg-sofia-turquoise/10' },
            { id: 'customer-inquiries', label: isAr ? 'الاستفسارات' : 'Inquiries', value: stats.total_inquiries ?? 0, sub: `${stats.new_inquiries ?? 0} ${isAr ? 'جديد' : 'new'}`, icon: MessageCircle, tone: 'text-amber-600 bg-amber-400/12' },
            { id: 'invoices', label: isAr ? 'الفواتير' : 'Invoices', value: stats.total_invoices ?? 0, sub: isAr ? 'فواتير صادرة' : 'Issued invoices', icon: FileText, tone: 'text-sofia-purple-500 bg-sofia-lavender/15' },
            { id: 'services', label: isAr ? 'الخدمات' : 'Services', value: stats.total_services ?? 0, sub: isAr ? 'خدمات وبرامج' : 'Services & trips', icon: Layers, tone: 'text-teal-600 bg-teal-400/10' },
            { id: 'attendance', label: isAr ? 'الدوام' : 'Shifts', value: `${stats.today_working_hours ?? 0}h`, sub: `${stats.clocked_in_count ?? 0} ${isAr ? 'متواجد' : 'active'}`, icon: Clock, tone: 'text-emerald-600 bg-emerald-400/10' },
          ].map(card => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => onNavigateTab && onNavigateTab(card.id)}
                className="fluent-interactive rounded-xl border border-[var(--stroke)] bg-[var(--surface-soft)] p-3 text-start hover:bg-[var(--surface-hover)] cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${card.tone}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-[9px] font-bold text-[var(--text-3)]">{card.label}</span>
                </div>
                <div className="mt-2 text-lg font-black text-[var(--text-1)]">{card.value}</div>
                <div className="truncate text-[10px] text-[var(--text-3)]">{card.sub}</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Balances & admin actions */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="fluent-card p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/15 text-amber-600">
                <AlertCircle className="h-5 w-5" />
              </span>
              <div>
                <h4 className="text-sm font-bold text-[var(--text-1)]">{isAr ? 'مبالغ مستحقة للشركة' : 'Amounts owed to company'}</h4>
                <p className="text-[10px] text-[var(--text-3)]">{isAr ? 'حسابات عملاء غير مسددة' : 'Unpaid customer accounts'}</p>
              </div>
            </div>
            <span className="shrink-0 whitespace-nowrap text-base sm:text-lg font-black text-amber-600">
              {formatCurrency(stats.outstanding_customer_payments, activeCurrency)}
            </span>
          </div>
          {stats.outstanding_by_currency && Object.keys(stats.outstanding_by_currency).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--stroke)] pt-3">
              {Object.entries(stats.outstanding_by_currency).map(([curr, amt]) => (
                <span key={curr} className="inline-flex items-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/8 px-2.5 py-1">
                  <span className="text-[9px] font-extrabold uppercase text-amber-700">{curr}</span>
                  <span className="text-[11px] font-bold text-[var(--text-1)]">{formatCurrency(Number(amt), curr)}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="fluent-card p-4 sm:p-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600">
              <AlertCircle className="h-5 w-5" />
            </span>
            <div>
              <h4 className="text-sm font-bold text-[var(--text-1)]">{isAr ? 'مستحقات الموردين' : 'Outstanding supplier balances'}</h4>
              <p className="text-[10px] text-[var(--text-3)]">{isAr ? 'طيران وفنادق ومشغلو رحلات' : 'Airlines, hotels & operators'}</p>
            </div>
          </div>
          <span className="text-lg font-black text-rose-600">
            {formatCurrency(stats.outstanding_supplier_payments, activeCurrency)}
          </span>
        </div>
      </section>

      {/* System actions */}
      <section className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onVerifyDb}
          className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-[var(--stroke)] bg-[var(--surface-soft)] px-3 py-2 text-xs font-bold text-[var(--text-2)] hover:bg-[var(--surface-hover)] cursor-pointer"
        >
          <Database className="h-3.5 w-3.5 text-[var(--text-3)]" />
          <span className={`h-1.5 w-1.5 rounded-full ${dbConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          {dbConnected ? (isAr ? 'قاعدة البيانات متصلة' : 'Cloud DB live') : (isAr ? 'وضع محلي مؤقت' : 'Offline cache')}
        </button>

        {isITAccount && onOpenITSiteControl && (
          <button
            type="button"
            onClick={onOpenITSiteControl}
            className={`inline-flex min-h-[40px] items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold cursor-pointer ${
              isSiteDisabled
                ? 'border-emerald-500/35 bg-emerald-500/12 text-emerald-700'
                : 'border-amber-500/35 bg-amber-500/12 text-amber-700'
            }`}
          >
            <Power className="h-3.5 w-3.5" />
            {isSiteDisabled ? (isAr ? 'تفعيل الموقع (IT)' : 'Enable Site (IT)') : (isAr ? 'إيقاف مؤقت (IT)' : 'Disable Site (IT)')}
          </button>
        )}

        {isAdmin && onOpenAdminReset && (
          <button
            type="button"
            onClick={onOpenAdminReset}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-600 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {isAr ? 'حذف جميع البيانات' : 'Delete all data'}
          </button>
        )}
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="fluent-card p-4 sm:p-5 lg:col-span-2 min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-[var(--text-1)]">
              {isAr ? `الإيرادات والأرباح الشهرية (${activeCurrency})` : `Monthly revenue & profit (${activeCurrency})`}
            </h3>
            <div className="flex items-center gap-3 text-[10px] font-bold text-[var(--text-3)]">
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-sofia-turquoise" />{isAr ? 'المبيعات' : 'Sales'}</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-sofia-lavender" />{isAr ? 'الربح' : 'Profit'}</span>
            </div>
          </div>
          <div className="h-64 sm:h-72 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--stroke)" />
                <XAxis dataKey="month" stroke="var(--text-3)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-3)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: 'var(--surface-hover)' }}
                  contentStyle={{
                    background: 'var(--surface-solid)',
                    border: '1px solid var(--stroke)',
                    borderRadius: 12,
                    color: 'var(--text-1)',
                    fontSize: 12,
                    boxShadow: 'var(--shadow-2)',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Sales" fill="#13C8CC" radius={[8, 8, 0, 0]} maxBarSize={38} />
                <Bar dataKey="Profit" fill="#A49AEF" radius={[8, 8, 0, 0]} maxBarSize={38} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="fluent-card p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <h3 className="mb-4 text-sm font-bold text-[var(--text-1)]">
              {isAr ? 'شعبية الوجهات' : 'Destination popularity'}
            </h3>
            <div className="space-y-4">
              {stats.destinationPopularity?.map((dest: any, idx: number) => {
                const bars = ['bg-sofia-turquoise', 'bg-sofia-lavender', 'bg-amber-400'];
                return (
                  <div key={dest.name}>
                    <div className="mb-1 flex justify-between text-[11px] font-bold text-[var(--text-2)]">
                      <span className="truncate">{dest.name}</span>
                      <span>{dest.percentage}%</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--surface-hover)]">
                      <div className={`${bars[idx % bars.length]} h-full rounded-full`} style={{ width: `${dest.percentage}%` }} />
                    </div>
                  </div>
                );
              })}
              {(!stats.destinationPopularity || stats.destinationPopularity.length === 0) && (
                <div className="py-4 text-center text-[11px] text-[var(--text-3)]">
                  {isAr ? 'لا توجد بيانات وجهات.' : 'No destination data available.'}
                </div>
              )}
            </div>
          </div>
          <div className="mt-5 rounded-xl border border-[var(--stroke)] bg-[var(--surface-soft)] p-3">
            <div className="text-[10px] font-bold text-[var(--text-2)]">{isAr ? 'أفضل موظف مبيعات' : 'Top performing agent'}</div>
            <div className="mt-0.5 truncate text-sm font-extrabold text-sofia-turquoise-600">
              {stats.topAgent?.name || (isAr ? 'لا توجد بيانات' : 'No data')}{' '}
              {stats.topAgent?.sales ? `(${formatCurrency(stats.topAgent.sales, activeCurrency)})` : ''}
            </div>
          </div>
        </div>
      </section>

      {/* Recent records + activity */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="fluent-card overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between p-4 sm:p-5 pb-3">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-1)]">
                {isAr ? 'أحدث الحجوزات والسندات' : 'Latest bookings & vouchers'}
              </h3>
              <p className="text-[10px] text-[var(--text-3)]">{isAr ? 'متزامنة مباشرة مع إدخالات الموظفين' : 'Synced live with employee entries'}</p>
            </div>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('vouchers')}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-sofia-turquoise-600 hover:underline cursor-pointer"
              >
                {isAr ? 'عرض الكل' : 'View all'}
                <ArrowRight className="h-3 w-3 rtl:rotate-180" />
              </button>
            )}
          </div>
          <div className="table-responsive">
            <table className="w-full text-start text-xs">
              <thead>
                <tr className="border-y border-[var(--stroke)] bg-[var(--surface-soft)] text-[10px] uppercase tracking-wider text-[var(--text-3)]">
                  <th className="px-4 py-2.5 font-bold text-start">{isAr ? 'المرجع' : 'Reference'}</th>
                  <th className="px-3 py-2.5 font-bold text-start">{isAr ? 'العميل' : 'Customer'}</th>
                  <th className="px-3 py-2.5 font-bold text-start">{isAr ? 'الخدمة' : 'Service'}</th>
                  <th className="px-3 py-2.5 font-bold text-start">{isAr ? 'الموظف' : 'Entered by'}</th>
                  <th className="px-3 py-2.5 font-bold text-start">{isAr ? 'القيمة' : 'Amount'}</th>
                  <th className="px-4 py-2.5 font-bold text-start">{isAr ? 'الحالة' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--stroke)]">
                {(!stats.recent_reservations || stats.recent_reservations.length === 0) ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[11px] text-[var(--text-3)]">
                      {isAr ? 'لا توجد حجوزات أو سندات حتى الآن.' : 'No bookings or vouchers yet.'}
                    </td>
                  </tr>
                ) : (
                  stats.recent_reservations.map((res: any) => (
                    <tr key={res.id} className="transition-colors hover:bg-[var(--surface-hover)]">
                      <td className="px-4 py-3 font-bold text-[var(--text-1)]">{res.reservation_id}</td>
                      <td className="px-3 py-3 font-semibold text-[var(--text-2)]">{res.customer_name || (isAr ? 'عميل' : 'Customer')}</td>
                      <td className="px-3 py-3 text-[var(--text-3)]">{res.service_type} {res.destination ? `• ${res.destination}` : ''}</td>
                      <td className="px-3 py-3 font-semibold text-teal-700">{res.employee_name || (isAr ? 'موظف' : 'Staff')}</td>
                      <td className="px-3 py-3 font-bold text-sofia-turquoise-600">
                        {formatCurrency(res.display_selling_price ?? res.selling_price, res.display_currency || activeCurrency)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${
                          res.reservation_status === 'Confirmed' || res.reservation_status === 'Paid'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : res.reservation_status === 'Pending' || res.reservation_status === 'Draft'
                              ? 'bg-amber-500/10 text-amber-600'
                              : 'bg-[var(--surface-hover)] text-[var(--text-2)]'
                        }`}>
                          {res.reservation_status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="fluent-card flex flex-col p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[var(--text-1)]">
              {isAr ? 'سجل النشاط المباشر' : 'Live activity feed'}
            </h3>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('activity-log')}
                className="text-[10px] font-bold text-sofia-turquoise-600 hover:underline cursor-pointer"
              >
                {isAr ? 'السجل الكامل' : 'Full log'}
              </button>
            )}
          </div>
          <div className="fluent-scroll max-h-80 flex-1 space-y-2 overflow-y-auto pe-1">
            {(!stats.recent_activities || stats.recent_activities.length === 0) ? (
              <div className="py-8 text-center text-[11px] text-[var(--text-3)]">
                {isAr ? 'لا توجد إدخالات بعد.' : 'No employee entries logged yet.'}
              </div>
            ) : (
              stats.recent_activities.map((act: any) => (
                <div key={act.id} className="flex gap-3 rounded-xl border border-[var(--stroke)] bg-[var(--surface-soft)] p-3">
                  <span className="w-1 shrink-0 rounded-full bg-gradient-to-b from-sofia-turquoise to-sofia-lavender" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[11px] font-bold text-[var(--text-1)]">{act.user_name}</span>
                      {act.module && (
                        <span className="shrink-0 rounded-md bg-sofia-turquoise/10 px-1.5 py-0.5 text-[9px] font-bold text-teal-700">
                          {act.module}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 break-words text-[10px] text-[var(--text-2)]">
                      {act.action} {act.record ? `(${act.record})` : ''}
                    </div>
                    <div className="mt-1 text-[9px] text-[var(--text-3)]">{act.date} • {act.time}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
