import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Bell, User, Clock, ArrowRight, X, Menu,
  LayoutDashboard, Users, Compass, Truck, FileText,
  Briefcase, Calendar, CheckSquare, BarChart3, Settings, Activity, Globe2, LogOut, ShieldCheck, Database, DollarSign,
  Ticket, Layers, MessageCircle, Instagram, Trash2, RefreshCw, Power
} from 'lucide-react';
import { UserRole, NotificationItem, AttendanceRecord } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { useLanguage } from '../context/LanguageContext';
import { SOFIA_LOGO_URL } from './SofiaLogo';

import { isTabAllowedForUser } from '../utils/permissions';

function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hidden 2xl:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 rounded-xl text-[11px] font-semibold text-slate-200 border border-slate-700 tabular-nums">
      <Clock className="w-3.5 h-3.5 text-cyan-400" />
      <span>{time.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
    </div>
  );
}

interface NavbarProps {
  userRole: UserRole;
  userPermissions?: string[];
  setUserRole: (role: UserRole) => void;
  currentCurrency: string;
  setCurrentCurrency: (currency: string) => void;
  onOpenSearch: () => void;
  onOpenAi: () => void;
  notifications: NotificationItem[];
  pendingPermissionCount?: number;
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead?: () => void;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  username: string;
  companyName: string;
  onLogout: () => void;
  isMobileMenuOpen?: boolean;
  setIsMobileMenuOpen?: (open: boolean) => void;
  dbConnected?: boolean;
  onVerifyDb?: () => void;
  isAdmin?: boolean;
  onOpenAdminReset?: () => void;
  isITAccount?: boolean;
  isSiteDisabled?: boolean;
  onOpenITSiteControl?: () => void;
  todayAttendance?: AttendanceRecord | null;
  onClockIn?: () => void;
  onClockOut?: () => void;
}

export function Navbar({
  userRole,
  userPermissions = [],
  currentCurrency,
  setCurrentCurrency,
  onOpenSearch,
  notifications = [],
  pendingPermissionCount = 0,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  currentTab,
  setCurrentTab,
  username,
  companyName,
  onLogout,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  dbConnected = true,
  onVerifyDb,
  isAdmin = false,
  onOpenAdminReset,
  isITAccount = false,
  isSiteDisabled = false,
  onOpenITSiteControl,
  todayAttendance,
  onClockIn,
  onClockOut,
}: NavbarProps) {
  const { language, setLanguage, toggleLanguage, t } = useLanguage();
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [internalMobileOpen, setInternalMobileOpen] = useState(false);

  const mobileMenuOpen = isMobileMenuOpen !== undefined ? isMobileMenuOpen : internalMobileOpen;
  const setMobileMenuOpen = (val: boolean) => {
    if (setIsMobileMenuOpen) setIsMobileMenuOpen(val);
    setInternalMobileOpen(val);
  };

  const notifRef = useRef<HTMLDivElement>(null);

  const hasPerm = (perm: string | string[]) => {
    if (userRole === 'Administrator') return true;
    if (Array.isArray(perm)) {
      return perm.some(p => userPermissions.includes(p));
    }
    return userPermissions.includes(perm);
  };

  const menuItems = [
    { id: 'dashboard', labelKey: 'nav_dashboard', defaultLabel: 'Dashboard', icon: LayoutDashboard, roles: ['Administrator', 'Manager', 'Sales', 'Operations', 'Customer Service', 'Accountant'], perm: 'view_dashboard' },
    { id: 'vouchers', labelKey: 'nav_vouchers', defaultLabel: 'Customer Vouchers', icon: Ticket, roles: ['Administrator', 'Manager', 'Sales', 'Operations', 'Customer Service'], perm: 'view_bookings' },
    { id: 'services', labelKey: 'nav_services', defaultLabel: 'Tourism Services', icon: Layers, roles: ['Administrator', 'Manager', 'Sales', 'Operations', 'Customer Service', 'Accountant'], perm: 'view_trips' },
    { id: 'customers', labelKey: 'nav_customers', defaultLabel: 'Customers', icon: Users, roles: ['Administrator', 'Manager', 'Sales', 'Operations', 'Customer Service', 'Accountant'], perm: 'view_customers' },
    { id: 'customer-inquiries', labelKey: 'nav_customer_inquiries', defaultLabel: 'Customer Inquiries', icon: MessageCircle, roles: ['Administrator', 'Manager', 'Sales', 'Operations', 'Customer Service', 'Accountant'], perm: 'view_customers' },
    { id: 'invoices', labelKey: 'nav_invoices', defaultLabel: 'Invoices', icon: FileText, roles: ['Administrator', 'Manager', 'Sales', 'Accountant', 'Operations', 'Customer Service'], perm: 'view_sales' },
    { id: 'suppliers', labelKey: 'nav_suppliers', defaultLabel: 'Suppliers', icon: Truck, roles: ['Administrator', 'Manager', 'Operations', 'Accountant'], perm: 'view_finance' },
    { id: 'packages', labelKey: 'nav_packages', defaultLabel: 'Tour Packages', icon: Compass, roles: ['Administrator', 'Manager', 'Sales', 'Accountant'], perm: 'view_trips' },
    { id: 'permission-requests', labelKey: 'nav_approval_requests', defaultLabel: 'Approval Requests', icon: ShieldCheck, roles: ['Administrator', 'Manager', 'Sales', 'Operations', 'Customer Service', 'Accountant'], badge: pendingPermissionCount, perm: 'view_dashboard' },
    { id: 'employees', labelKey: 'nav_employees', defaultLabel: 'Employees', icon: Briefcase, roles: ['Administrator', 'Manager'], perm: 'view_employees' },
    { id: 'attendance', labelKey: 'nav_attendance', defaultLabel: 'Attendance & Departure', icon: Clock, roles: ['Administrator', 'Manager', 'Sales', 'Operations', 'Customer Service', 'Accountant'], perm: 'view_dashboard' },
    { id: 'calendar', labelKey: 'nav_calendar', defaultLabel: 'Calendar', icon: Calendar, roles: ['Administrator', 'Manager', 'Sales', 'Operations', 'Customer Service'], perm: 'view_dashboard' },
    { id: 'tasks', labelKey: 'nav_tasks', defaultLabel: 'Tasks', icon: CheckSquare, roles: ['Administrator', 'Manager', 'Sales', 'Operations', 'Customer Service', 'Accountant'], perm: 'view_dashboard' },
    { id: 'documents', labelKey: 'nav_documents', defaultLabel: 'Documents', icon: FileText, roles: ['Administrator', 'Manager', 'Operations', 'Customer Service', 'Sales', 'Accountant'], perm: 'view_dashboard' },
    { id: 'reports', labelKey: 'nav_reports', defaultLabel: 'Reports', icon: BarChart3, roles: ['Administrator', 'Manager', 'Accountant'], perm: 'view_reports' },
    { id: 'finance-payroll', labelKey: 'nav_finance_payroll', defaultLabel: 'Finance & Payroll', icon: DollarSign, roles: ['Administrator', 'Accountant'], perm: ['view_finance', 'view_payroll'] },
    { id: 'notifications', labelKey: 'nav_notifications', defaultLabel: 'Notifications', icon: Bell, roles: ['Administrator', 'Manager', 'Sales', 'Accountant', 'Operations', 'Customer Service'], perm: 'view_dashboard' },
    { id: 'settings', labelKey: 'nav_settings', defaultLabel: 'Settings', icon: Settings, roles: ['Administrator', 'Manager'], perm: 'view_settings' },
    { id: 'activity-log', labelKey: 'nav_audit_log', defaultLabel: 'Audit Log', icon: Activity, roles: ['Administrator', 'Manager'], perm: 'view_settings' }
  ];

  const isTodayShiftOpen = Boolean(
    todayAttendance &&
    (todayAttendance.clock_in || todayAttendance.check_in_time) &&
    !todayAttendance.clock_out &&
    (!todayAttendance.check_out_time || todayAttendance.check_out_time === '--')
  );
  const todayInDisplay = todayAttendance?.clock_in || todayAttendance?.check_in_time || '';

  const filteredItems = menuItems.filter(item =>
    isTabAllowedForUser(item.id, userRole, userPermissions, isAdmin, isITAccount)
  );

  const activeItem = filteredItems.find(i => i.id === currentTab) || filteredItems[0];
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotificationsDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="sticky top-0 z-40 w-full flex flex-col shrink-0">
      {/* Top App Bar (Mobile-App Optimized + Desktop Clean Header) */}
      <header className="h-14 sm:h-16 bg-slate-900 border-b border-slate-800 px-3 sm:px-5 lg:px-6 flex items-center justify-between gap-2 text-white">
        {/* Left: Attached Logo As-Is & Active Section Title on Mobile */}
        <div className="flex items-center gap-2.5 min-w-0 shrink-0">
          <button
            type="button"
            onClick={() => setCurrentTab('dashboard')}
            className="flex items-center gap-2.5 focus:outline-none cursor-pointer shrink-0"
            title={companyName}
          >
            <img
              src={SOFIA_LOGO_URL}
              alt={companyName}
              className="h-10 sm:h-11 w-auto object-contain rounded-lg bg-white px-1.5 py-0.5 shadow-sm border border-slate-700/60 select-none shrink-0"
              onError={(e) => {
                const img = e.currentTarget;
                if (!img.src.endsWith('/sofia-logo.png')) {
                  img.src = '/sofia-logo.png';
                }
              }}
            />
          </button>

          {/* Current Screen Title on Mobile (Native App Bar Style) */}
          <div className="flex flex-col min-w-0 lg:hidden">
            <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[130px] sm:max-w-[200px]">
              {activeItem ? (t(activeItem.labelKey) || activeItem.defaultLabel) : companyName}
            </span>
            <span className="text-[10px] text-slate-400 truncate">
              {dbConnected ? t('cloud_live') : t('cloud_offline')}
            </span>
          </div>

          {/* Desktop Brand Name */}
          <div className="hidden lg:flex flex-col min-w-0">
            <span className="font-bold text-sm tracking-tight text-white truncate">
              {companyName}
            </span>
            <span className="text-[10px] text-cyan-400 font-medium truncate">
              {t('app_subtitle')}
            </span>
          </div>
        </div>

        {/* Center: Search Trigger (Full bar on md+, clean icon button on small phones) */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-3">
          <button
            type="button"
            onClick={onOpenSearch}
            className="relative w-full text-start cursor-pointer group"
          >
            <input
              type="text"
              readOnly
              placeholder={t('search_placeholder')}
              className="w-full bg-slate-800 group-hover:bg-slate-800/80 border border-slate-700 rounded-xl py-2 ps-9 pe-3 text-xs cursor-pointer text-slate-200 outline-none transition-all placeholder:text-slate-400"
            />
            <Search className="w-4 h-4 absolute start-3 top-2.5 text-slate-400 pointer-events-none group-hover:text-cyan-400 transition-colors" />
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Mobile Search Icon Button (>= 40px touch target) */}
          <button
            type="button"
            onClick={onOpenSearch}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label={t('search')}
          >
            <Search className="w-4.5 h-4.5" />
          </button>

          {/* Language Switcher */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="h-9 sm:h-9 px-2.5 sm:px-3 flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-cyan-300 transition-colors cursor-pointer shrink-0"
            title={language === 'en' ? 'تغيير اللغة إلى العربية' : 'Switch language to English'}
          >
            <Globe2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>{language === 'en' ? 'AR' : 'EN'}</span>
          </button>

          {/* PWA Install Button on Desktop/Tablet */}
          <div className="hidden sm:block">
            <PWAInstallButton variant="header" companyName={companyName} />
          </div>

          {/* Instagram Compact Button */}
          <a
            href="https://www.instagram.com/sofiatravel?stkn=MWt1ZGk1NGllams1cg=="
            target="_blank"
            rel="noopener noreferrer"
            className="hidden xl:flex items-center gap-1.5 h-9 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-pink-300 transition-colors shrink-0"
            title="Sofia Travel Instagram"
          >
            <Instagram className="w-3.5 h-3.5 text-pink-400 shrink-0" />
            <span>Instagram</span>
          </a>

          {/* Live Database Connection Status Button */}
          <button
            type="button"
            onClick={onVerifyDb}
            className={`hidden lg:flex items-center gap-1.5 h-9 px-2.5 rounded-xl border text-[11px] font-semibold transition-colors cursor-pointer ${
              dbConnected
                ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-300 hover:bg-emerald-950/80'
                : 'bg-amber-950/50 border-amber-500/30 text-amber-300 hover:bg-amber-950/80'
            }`}
            title={t('db_verify_btn')}
          >
            <Database className="w-3.5 h-3.5 shrink-0" />
            <span>{dbConnected ? t('cloud_live') : t('cloud_offline')}</span>
          </button>

          {/* Employee Self Clock-In / Clock-Out Button (Desktop) */}
          {(onClockIn || onClockOut) && (
            isTodayShiftOpen ? (
              <button
                type="button"
                onClick={onClockOut}
                className="hidden lg:flex items-center gap-1.5 h-9 px-3 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/40 rounded-xl text-xs font-bold text-amber-300 hover:text-white transition-colors cursor-pointer shrink-0"
                title={language === 'ar' ? `تم الحضور ${todayInDisplay} — اضغط لتسجيل الانصراف` : `Clocked in at ${todayInDisplay} — Click to Clock Out`}
              >
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{language === 'ar' ? `انصراف (${todayInDisplay})` : `Clock Out (${todayInDisplay})`}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClockIn}
                className="hidden lg:flex items-center gap-1.5 h-9 px-3 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 rounded-xl text-xs font-bold text-cyan-300 hover:text-white transition-colors cursor-pointer shrink-0"
                title={
                  todayAttendance?.working_hours
                    ? (language === 'ar' ? `ساعات اليوم: ${todayAttendance.working_hours_formatted || `${todayAttendance.working_hours}h`}` : `Today: ${todayAttendance.working_hours_formatted || `${todayAttendance.working_hours}h`}`)
                    : (language === 'ar' ? 'تسجيل حضور الموظف' : 'Employee Clock In')
                }
              >
                <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>
                  {todayAttendance && todayInDisplay && (todayAttendance.clock_out || todayAttendance.check_out_time)
                    ? `${todayAttendance.working_hours_formatted || `${todayAttendance.working_hours}h`}`
                    : (language === 'ar' ? 'تسجيل حضور' : 'Clock In')}
                </span>
              </button>
            )
          )}

          {/* IT Developer Exclusive: Temporarily Disable / Re-enable Site Button (Zero Data Deletion) */}
          {isITAccount && onOpenITSiteControl && (
            <button
              type="button"
              onClick={onOpenITSiteControl}
              className={`hidden md:flex items-center gap-1.5 h-9 px-3 border rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                isSiteDisabled
                  ? 'bg-emerald-950/70 hover:bg-emerald-900 border-emerald-500/50 text-emerald-300 hover:text-white'
                  : 'bg-amber-950/70 hover:bg-amber-900 border-amber-500/50 text-amber-300 hover:text-white'
              }`}
              title={
                isSiteDisabled
                  ? (language === 'ar' ? 'إعادة تفعيل الموقع للمستخدمين (حساب IT فقط)' : 'Re-enable site for users (IT account only)')
                  : (language === 'ar' ? 'إيقاف الموقع مؤقتاً للتحديث بدون حذف البيانات (حساب IT فقط)' : 'Temporarily disable site for updates without deleting data (IT account only)')
              }
            >
              <Power className="w-3.5 h-3.5 shrink-0" />
              <span>
                {isSiteDisabled
                  ? (language === 'ar' ? 'تفعيل الموقع' : 'Enable Site')
                  : (language === 'ar' ? 'إيقاف مؤقت للموقع' : 'Disable Site')}
              </span>
            </button>
          )}

          {/* Administrator-Only Delete All Data Quick Button (Desktop) */}
          {isAdmin && onOpenAdminReset && (
            <button
              type="button"
              onClick={onOpenAdminReset}
              className="hidden xl:flex items-center gap-1.5 h-9 px-3 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 rounded-xl text-xs font-bold text-rose-300 hover:text-white transition-colors cursor-pointer shrink-0"
              title={t('admin_reset_title')}
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>{t('admin_delete_all_btn')}</span>
            </button>
          )}

          <LiveClock />

          {/* Logged-in User (Desktop) */}
          <div className="hidden md:flex items-center gap-1.5 h-9 px-2.5 bg-slate-800 rounded-xl text-xs font-semibold text-slate-200 border border-slate-700">
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate max-w-[90px]">{username}</span>
            {(isAdmin || userRole === 'Administrator') && (
              <span className="px-1.5 py-0.5 rounded-md bg-blue-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-extrabold uppercase tracking-wider shrink-0">
                Admin
              </span>
            )}
          </div>

          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors cursor-pointer relative ${
                showNotificationsDropdown ? 'bg-blue-900/50 text-blue-400' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              aria-label={t('nav_notifications')}
            >
              <Bell className="w-5 h-5" />
              {(unreadCount > 0 || pendingPermissionCount > 0) && (
                <span className="absolute top-1 end-1 min-w-[16px] h-4 px-1 bg-rose-500 text-white text-[10px] flex items-center justify-center rounded-full font-bold border border-slate-900">
                  {unreadCount + pendingPermissionCount}
                </span>
              )}
            </button>

            {showNotificationsDropdown && (
              <div className="fixed sm:absolute inset-x-3 sm:inset-x-auto sm:end-0 top-16 sm:top-auto sm:mt-2 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden text-slate-900">
                <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold">{t('nav_notifications')}</span>
                  </div>
                  <span className="text-[11px] text-cyan-300 font-semibold">
                    {unreadCount}
                  </span>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      {language === 'ar' ? 'لا توجد إشعارات حالياً.' : 'No active notifications.'}
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          if (!notif.read) onMarkNotificationRead(notif.id);
                        }}
                        className={`p-3 text-xs transition-colors cursor-pointer hover:bg-slate-50 flex gap-3 items-start ${
                          notif.read ? 'opacity-70 bg-white' : 'bg-blue-50/40 font-medium'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                          <Bell className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 truncate">{notif.title}</p>
                          <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed break-words">{notif.message}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">{notif.date}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      if (onMarkAllNotificationsRead) {
                        onMarkAllNotificationsRead();
                      } else {
                        notifications.forEach(n => {
                          if (!n.read) onMarkNotificationRead(n.id);
                        });
                      }
                    }}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer px-2 py-1 rounded-md hover:bg-blue-50"
                  >
                    {language === 'ar' ? 'تحديد الكل كمقروء' : 'Mark all read'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNotificationsDropdown(false);
                      setCurrentTab('notifications');
                    }}
                    className="text-[11px] text-slate-700 hover:text-slate-900 font-bold flex items-center gap-1 cursor-pointer px-2 py-1 rounded-md hover:bg-slate-200"
                  >
                    <span>
                      {(isAdmin || isITAccount)
                        ? (language === 'ar' ? 'إرسال / عرض الكل' : 'Send / View All')
                        : t('view')}
                    </span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Sign Out */}
          <button
            type="button"
            onClick={onLogout}
            className="hidden sm:flex w-10 h-10 items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
            title={t('sign_out')}
          >
            <LogOut className="w-5 h-5" />
          </button>

          {/* Mobile App Launcher Drawer Trigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden w-10 h-10 flex items-center justify-center text-slate-200 hover:text-white bg-slate-800/90 hover:bg-slate-800 border border-slate-700 rounded-xl cursor-pointer"
            aria-label={t('nav_menu')}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Desktop Navigation Bar (Hidden on Mobile < lg so Mobile uses Clean Native Bottom Bar & App Grid Sheet) */}
      <nav className="hidden lg:flex bg-white border-b border-slate-200 shadow-2xs overflow-x-auto custom-scrollbar items-center px-4 lg:px-6">
        <div className="flex items-center gap-1 py-1.5 min-w-max">
          {filteredItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{t(item.labelKey) || item.defaultLabel}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ms-1 px-1.5 py-0.5 bg-amber-500 text-white rounded-md text-[10px] font-bold leading-none">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Native App Launcher Sheet / Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end sm:justify-start sm:flex-row">
          <div
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-full sm:w-96 sm:max-w-[90vw] bg-slate-900 text-white max-h-[88dvh] sm:h-full sm:max-h-full rounded-t-3xl sm:rounded-none flex flex-col shadow-2xl overflow-hidden border-t sm:border-t-0 sm:border-e border-slate-800 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {/* Drag Handle on Phone */}
            <div className="sm:hidden flex justify-center pt-2.5 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-700" />
            </div>

            {/* Sheet Header with Attached Logo As-Is */}
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={SOFIA_LOGO_URL}
                  alt={companyName}
                  className="h-11 w-auto object-contain rounded-xl bg-white p-1 border border-slate-700 shrink-0 select-none"
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (!img.src.endsWith('/sofia-logo.png')) {
                      img.src = '/sofia-logo.png';
                    }
                  }}
                />
                <div className="min-w-0">
                  <p className="font-bold text-sm text-white truncate">{companyName}</p>
                  <p className="text-[11px] text-slate-400 truncate flex items-center gap-1.5">
                    <span className="truncate">{username}</span>
                    <span>·</span>
                    <span className={(isAdmin || userRole === 'Administrator') ? 'text-cyan-300 font-extrabold' : ''}>
                      {(isAdmin || userRole === 'Administrator') ? 'Admin' : userRole}
                    </span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white rounded-xl bg-slate-800 cursor-pointer shrink-0"
                aria-label={t('close')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
              {/* App Grid Launcher (3-Column Native App Icons) */}
              <div>
                <div className="flex items-center justify-between mb-2.5 px-1">
                  <span className="text-xs font-bold text-slate-300">{t('all_modules')}</span>
                  <button
                    type="button"
                    onClick={onVerifyDb}
                    className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg border cursor-pointer ${
                      dbConnected
                        ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
                        : 'bg-amber-950/60 border-amber-500/30 text-amber-300'
                    }`}
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>{dbConnected ? t('cloud_live') : t('cloud_offline')}</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  {filteredItems.map(item => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setCurrentTab(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`relative flex flex-col items-center justify-center text-center p-3 rounded-2xl min-h-[76px] transition-all cursor-pointer border ${
                          isActive
                            ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                            : 'bg-slate-800/80 text-slate-200 border-slate-700/70 hover:bg-slate-800 active:scale-95'
                        }`}
                      >
                        <Icon className={`w-5 h-5 mb-1.5 ${isActive ? 'text-white' : 'text-cyan-400'}`} />
                        <span className="text-[11px] font-semibold leading-tight line-clamp-2">
                          {t(item.labelKey) || item.defaultLabel}
                        </span>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="absolute top-1.5 end-1.5 min-w-[18px] h-[18px] px-1 bg-amber-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Language & Currency Quick Controls */}
              <div className="grid grid-cols-1 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <span className="text-[11px] text-slate-400 font-semibold block mb-1.5 px-1">
                    {t('language')}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setLanguage('en')}
                      className={`min-h-[42px] rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        language === 'en' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      onClick={() => setLanguage('ar')}
                      className={`min-h-[42px] rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        language === 'ar' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      العربية
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 font-semibold block mb-1.5 px-1">
                    {t('display_currency')}
                  </span>
                  <div className="grid grid-cols-5 gap-1.5">
                    {['EGP', 'USD', 'EUR', 'SAR', 'GBP'].map((curr) => (
                      <button
                        key={curr}
                        type="button"
                        onClick={() => setCurrentCurrency(curr)}
                        className={`min-h-[40px] rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                          currentCurrency === curr
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {curr}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* PWA Install + Instagram */}
              <div className="space-y-2.5 pt-2 border-t border-slate-800">
                <PWAInstallButton variant="drawer" companyName={companyName} />

                <a
                  href="https://www.instagram.com/sofiatravel?stkn=MWt1ZGk1NGllams1cg=="
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-800 border border-slate-700 text-pink-300 text-xs font-semibold min-h-[44px]"
                >
                  <div className="flex items-center gap-2">
                    <Instagram className="w-4 h-4 text-pink-400 shrink-0" />
                    <span>Sofia Travel Instagram</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                </a>

                {/* Employee Self Clock-In / Clock-Out Action (Mobile Drawer) */}
                {(onClockIn || onClockOut) && (
                  isTodayShiftOpen ? (
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        if (onClockOut) onClockOut();
                      }}
                      className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-amber-950/70 hover:bg-amber-900 border border-amber-500/40 text-amber-300 hover:text-white text-xs font-bold transition-colors cursor-pointer min-h-[46px]"
                    >
                      <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>
                        {language === 'ar'
                          ? `تسجيل انصراف (تم الحضور ${todayInDisplay})`
                          : `Clock Out (Clocked in at ${todayInDisplay})`}
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        if (onClockIn) onClockIn();
                      }}
                      className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 hover:text-white text-xs font-bold transition-colors cursor-pointer min-h-[46px]"
                    >
                      <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>
                        {todayAttendance && todayInDisplay && (todayAttendance.clock_out || todayAttendance.check_out_time)
                          ? (language === 'ar'
                              ? `بدء وردية جديدة (اليوم: ${todayAttendance.working_hours_formatted || `${todayAttendance.working_hours}h`})`
                              : `Clock In Again (Today: ${todayAttendance.working_hours_formatted || `${todayAttendance.working_hours}h`})`)
                          : (language === 'ar' ? 'تسجيل حضور الموظف' : 'Employee Clock In')}
                      </span>
                    </button>
                  )
                )}

                {/* IT Developer Exclusive: Temporarily Disable / Re-enable Site Action (Mobile Drawer) */}
                {isITAccount && onOpenITSiteControl && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenITSiteControl();
                    }}
                    className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-colors cursor-pointer min-h-[46px] ${
                      isSiteDisabled
                        ? 'bg-emerald-950/70 hover:bg-emerald-900 border-emerald-500/40 text-emerald-300 hover:text-white'
                        : 'bg-amber-950/70 hover:bg-amber-900 border-amber-500/40 text-amber-300 hover:text-white'
                    }`}
                  >
                    <Power className="w-4 h-4 shrink-0" />
                    <span>
                      {isSiteDisabled
                        ? (language === 'ar' ? 'إعادة تفعيل الموقع الآن (IT)' : 'Re-enable Site Now (IT)')
                        : (language === 'ar' ? 'إيقاف الموقع مؤقتاً للتحديث (IT)' : 'Temporarily Disable Site (IT)')}
                    </span>
                  </button>
                )}

                {/* Administrator-Only Delete All Data Action */}
                {isAdmin && onOpenAdminReset && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAdminReset();
                    }}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-500/40 text-rose-300 hover:text-white text-xs font-bold transition-colors cursor-pointer min-h-[46px]"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{t('admin_reset_title')}</span>
                  </button>
                )}
              </div>

              {/* Sign Out */}
              <div className="pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-rose-500/20 text-rose-400 min-h-[46px] rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('sign_out')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
