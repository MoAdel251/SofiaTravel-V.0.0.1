import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Bell, Clock, ArrowRight, X, Menu,
  Globe2, LogOut, Database, Trash2, RefreshCw, Power, Moon, Sun
} from 'lucide-react';
import { UserRole, NotificationItem, AttendanceRecord } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { SOFIA_LOGO_URL } from './SofiaLogo';
import { APP_VERSION } from '../utils/appVersion';
import { NAV_ITEMS } from '../config/navigation';

import { isTabAllowedForUser } from '../utils/permissions';

function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hidden 2xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--surface-soft)] text-[11px] font-semibold text-[var(--text-2)] border border-[var(--stroke)] tabular-nums">
      <Clock className="w-3.5 h-3.5 text-sofia-turquoise" />
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
  /** Attendance-only employee accounts see a single navigation entry. */
  restrictToAttendance?: boolean;
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
  restrictToAttendance = false,
}: NavbarProps) {
  const { language, setLanguage, toggleLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
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

  const menuItems = NAV_ITEMS;

  const isTodayShiftOpen = Boolean(
    todayAttendance &&
    (todayAttendance.clock_in || todayAttendance.check_in_time) &&
    !todayAttendance.clock_out &&
    (!todayAttendance.check_out_time || todayAttendance.check_out_time === '--')
  );
  const todayInDisplay = todayAttendance?.clock_in || todayAttendance?.check_in_time || '';

  const filteredItems = menuItems.filter(item =>
    restrictToAttendance
      ? item.id === 'attendance'
      : isTabAllowedForUser(item.id, userRole, userPermissions, isAdmin, isITAccount)
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
      {/* Top Command Bar — Fluent acrylic surface */}
      <header className="h-14 sm:h-16 fluent-mica border-b border-[var(--stroke)] px-3 sm:px-4 lg:px-6 flex items-center justify-between gap-2 text-[var(--text-1)]">
        {/* Left: logo (mobile) + active section title */}
        <div className="flex items-center gap-2.5 min-w-0 shrink-0">
          <button
            type="button"
            onClick={() => setCurrentTab(userRole === 'Office Boy' ? 'attendance' : 'dashboard')}
            className="flex items-center gap-2.5 focus:outline-none cursor-pointer shrink-0"
            title={companyName}
          >
            <img
              src={SOFIA_LOGO_URL}
              alt={companyName}
              className="h-10 sm:h-11 w-auto object-contain rounded-lg bg-white px-1.5 py-0.5 shadow-sm border border-[var(--stroke)] select-none shrink-0 lg:hidden"
              onError={(e) => {
                const img = e.currentTarget;
                if (!img.src.endsWith('/sofia-logo.png')) {
                  img.src = '/sofia-logo.png';
                }
              }}
            />
          </button>

          {/* Current screen title */}
          <div className="flex flex-col min-w-0">
            <span className="text-xs sm:text-sm font-bold text-[var(--text-1)] truncate max-w-[130px] sm:max-w-[220px]">
              {activeItem ? (t(activeItem.labelKey) || activeItem.defaultLabel) : companyName}
            </span>
            <span className="text-[10px] text-[var(--text-3)] truncate">
              {companyName}
              <span className="text-sofia-turquoise font-bold"> • {APP_VERSION}</span>
            </span>
          </div>
        </div>

        {/* Center: Search trigger */}
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
              className="w-full bg-[var(--surface-soft)] group-hover:bg-[var(--surface-hover)] border border-[var(--stroke)] rounded-xl py-2 ps-9 pe-3 text-xs cursor-pointer text-[var(--text-1)] outline-none transition-all placeholder:text-[var(--text-3)]"
            />
            <Search className="w-4 h-4 absolute start-3 top-2.5 text-[var(--text-3)] pointer-events-none group-hover:text-sofia-turquoise transition-colors" />
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Mobile Search Icon Button (>= 40px touch target) */}
          <button
            type="button"
            onClick={onOpenSearch}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl text-[var(--text-2)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-1)] transition-colors cursor-pointer"
            aria-label={t('search')}
          >
            <Search className="w-[18px] h-[18px]" />
          </button>

          {/* Language Switcher */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="hidden sm:flex h-9 px-2.5 sm:px-3 items-center gap-1.5 bg-[var(--surface-soft)] hover:bg-[var(--surface-hover)] border border-[var(--stroke)] rounded-xl text-xs font-bold text-[var(--text-2)] transition-colors cursor-pointer shrink-0"
            title={language === 'en' ? 'تغيير اللغة إلى العربية' : 'Switch language to English'}
          >
            <Globe2 className="w-3.5 h-3.5 text-sofia-turquoise shrink-0" />
            <span>{language === 'en' ? 'AR' : 'EN'}</span>
          </button>

          {/* Dark / Light theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="hidden sm:flex w-9 h-9 items-center justify-center rounded-xl bg-[var(--surface-soft)] hover:bg-[var(--surface-hover)] border border-[var(--stroke)] text-[var(--text-2)] transition-colors cursor-pointer shrink-0"
            aria-label={theme === 'dark' ? (language === 'ar' ? 'التبديل إلى الوضع الفاتح' : 'Switch to light mode') : (language === 'ar' ? 'التبديل إلى الوضع الداكن' : 'Switch to dark mode')}
            title={theme === 'dark' ? (language === 'ar' ? 'الوضع الفاتح' : 'Light mode') : (language === 'ar' ? 'الوضع الداكن' : 'Dark mode')}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-sofia-turquoise" /> : <Moon className="w-4 h-4 text-sofia-lavender" />}
          </button>

          {/* PWA Install Button on Desktop/Tablet */}
          <div className="hidden sm:block">
            <PWAInstallButton variant="header" companyName={companyName} />
          </div>

          {/* Live Database Connection Status Button */}
          <button
            type="button"
            onClick={onVerifyDb}
            className="hidden lg:flex items-center gap-1.5 h-9 px-2.5 rounded-xl border border-[var(--stroke)] bg-[var(--surface-soft)] hover:bg-[var(--surface-hover)] text-[11px] font-semibold text-[var(--text-2)] transition-colors cursor-pointer"
            title={t('db_verify_btn')}
          >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dbConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <Database className="w-3.5 h-3.5 shrink-0 text-[var(--text-3)]" />
            <span>{dbConnected ? t('cloud_live') : t('cloud_offline')}</span>
          </button>

          {/* Employee Self Clock-In / Clock-Out Button (Desktop) */}
          {(onClockIn || onClockOut) && (
            isTodayShiftOpen ? (
              <button
                type="button"
                onClick={onClockOut}
                className="hidden lg:flex items-center gap-1.5 h-9 px-3 bg-amber-500/12 hover:bg-amber-500/20 border border-amber-500/35 rounded-xl text-xs font-bold text-amber-700 transition-colors cursor-pointer shrink-0"
                title={language === 'ar' ? `تم الحضور ${todayInDisplay} — اضغط لتسجيل الانصراف` : `Clocked in at ${todayInDisplay} — Click to Clock Out`}
              >
                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{language === 'ar' ? `انصراف (${todayInDisplay})` : `Clock Out (${todayInDisplay})`}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClockIn}
                className="hidden lg:flex items-center gap-1.5 h-9 px-3 bg-sofia-turquoise/12 hover:bg-sofia-turquoise/20 border border-sofia-turquoise/40 rounded-xl text-xs font-bold text-teal-700 transition-colors cursor-pointer shrink-0"
                title={
                  todayAttendance?.working_hours
                    ? (language === 'ar' ? `ساعات اليوم: ${todayAttendance.working_hours_formatted || `${todayAttendance.working_hours}h`}` : `Today: ${todayAttendance.working_hours_formatted || `${todayAttendance.working_hours}h`}`)
                    : (language === 'ar' ? 'تسجيل حضور الموظف' : 'Employee Clock In')
                }
              >
                <Clock className="w-3.5 h-3.5 text-sofia-turquoise-600 shrink-0" />
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
                  ? 'bg-emerald-500/12 hover:bg-emerald-500/20 border-emerald-500/35 text-emerald-700'
                  : 'bg-amber-500/12 hover:bg-amber-500/20 border-amber-500/35 text-amber-700'
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
              className="hidden xl:flex items-center gap-1.5 h-9 px-3 bg-rose-500/10 hover:bg-rose-500/18 border border-rose-500/30 rounded-xl text-xs font-bold text-rose-600 transition-colors cursor-pointer shrink-0"
              title={t('admin_reset_title')}
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>{t('admin_delete_all_btn')}</span>
            </button>
          )}

          <LiveClock />

          {/* Logged-in User (Desktop) */}
          <div className="hidden md:flex items-center gap-1.5 h-9 px-2 bg-[var(--surface-soft)] rounded-xl text-xs font-semibold text-[var(--text-2)] border border-[var(--stroke)]">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-sofia-turquoise to-sofia-lavender text-[9px] font-black text-sofia-purple shrink-0">
              {String(username || 'S').trim().charAt(0).toUpperCase()}
            </span>
            <span className="truncate max-w-[90px]">{username}</span>
            {(isAdmin || userRole === 'Administrator') && (
              <span className="px-1.5 py-0.5 rounded-md bg-sofia-turquoise/15 text-teal-700 border border-sofia-turquoise/30 text-[10px] font-extrabold uppercase tracking-wider shrink-0">
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
                showNotificationsDropdown ? 'bg-sofia-turquoise/15 text-sofia-turquoise-600' : 'text-[var(--text-2)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-1)]'
              }`}
              aria-label={t('nav_notifications')}
            >
              <Bell className="w-5 h-5" />
              {(unreadCount > 0 || pendingPermissionCount > 0) && (
                <span className="absolute top-1 end-1 min-w-[16px] h-4 px-1 bg-rose-500 text-white text-[10px] flex items-center justify-center rounded-full font-bold border-2 border-[var(--surface-solid)]">
                  {unreadCount + pendingPermissionCount}
                </span>
              )}
            </button>

            {showNotificationsDropdown && (
              <div className="fluent-pop fixed sm:absolute inset-x-3 sm:inset-x-auto sm:end-0 top-16 sm:top-auto sm:mt-2 sm:w-96 fluent-acrylic rounded-2xl shadow-[var(--shadow-3)] z-50 overflow-hidden text-[var(--text-1)]">
                <div className="p-3.5 fluent-brand-gradient text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-sofia-turquoise" />
                    <span className="text-xs font-bold">{t('nav_notifications')}</span>
                  </div>
                  <span className="text-[11px] text-sofia-turquoise font-semibold">
                    {unreadCount}
                  </span>
                </div>

                <div className="max-h-72 overflow-y-auto fluent-scroll divide-y divide-[var(--stroke)]">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[var(--text-3)]">
                      {language === 'ar' ? 'لا توجد إشعارات حالياً.' : 'No active notifications.'}
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          if (!notif.read) onMarkNotificationRead(notif.id);
                        }}
                        className={`p-3 text-xs transition-colors cursor-pointer hover:bg-[var(--surface-hover)] flex gap-3 items-start ${
                          notif.read ? 'opacity-70' : 'bg-sofia-turquoise/6 font-medium'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-sofia-turquoise/15 text-sofia-turquoise-600 flex items-center justify-center shrink-0 mt-0.5">
                          <Bell className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[var(--text-1)] truncate">{notif.title}</p>
                          <p className="text-[var(--text-2)] text-[11px] mt-0.5 leading-relaxed break-words">{notif.message}</p>
                          <span className="text-[10px] text-[var(--text-3)] mt-1 block">{notif.date}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2.5 bg-[var(--surface-soft)] border-t border-[var(--stroke)] flex items-center justify-between">
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
                    className="text-[11px] text-sofia-turquoise-600 hover:text-sofia-turquoise font-semibold cursor-pointer px-2 py-1 rounded-md hover:bg-[var(--surface-hover)]"
                  >
                    {language === 'ar' ? 'تحديد الكل كمقروء' : 'Mark all read'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNotificationsDropdown(false);
                      setCurrentTab('notifications');
                    }}
                    className="text-[11px] text-[var(--text-2)] hover:text-[var(--text-1)] font-bold flex items-center gap-1 cursor-pointer px-2 py-1 rounded-md hover:bg-[var(--surface-hover)]"
                  >
                    <span>
                      {(isAdmin || isITAccount)
                        ? (language === 'ar' ? 'إرسال / عرض الكل' : 'Send / View All')
                        : t('view')}
                    </span>
                    <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Sign Out */}
          <button
            type="button"
            onClick={onLogout}
            className="hidden sm:flex w-10 h-10 items-center justify-center text-[var(--text-3)] hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
            title={t('sign_out')}
          >
            <LogOut className="w-5 h-5" />
          </button>

          {/* Mobile App Launcher Drawer Trigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden w-10 h-10 flex items-center justify-center text-[var(--text-2)] hover:text-[var(--text-1)] bg-[var(--surface-soft)] hover:bg-[var(--surface-hover)] border border-[var(--stroke)] rounded-xl cursor-pointer"
            aria-label={t('nav_menu')}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Native App Launcher Sheet / Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end sm:justify-start sm:flex-row">
          <div
            className="fixed inset-0 bg-sofia-purple/45 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fluent-pop relative z-10 w-full sm:w-96 sm:max-w-[90vw] fluent-acrylic text-[var(--text-1)] max-h-[88dvh] sm:h-full sm:max-h-full rounded-t-3xl sm:rounded-none flex flex-col shadow-[var(--shadow-3)] overflow-hidden border-t sm:border-t-0 sm:border-e border-[var(--stroke)] pb-[max(1rem,env(safe-area-inset-bottom))]">
            {/* Drag Handle on Phone */}
            <div className="sm:hidden flex justify-center pt-2.5 pb-1">
              <div className="w-10 h-1 rounded-full bg-[var(--stroke-strong)]" />
            </div>

            {/* Sheet Header */}
            <div className="px-4 py-3 border-b border-[var(--stroke)] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={SOFIA_LOGO_URL}
                  alt={companyName}
                  className="h-11 w-auto object-contain rounded-xl bg-white p-1 border border-[var(--stroke)] shrink-0 select-none"
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (!img.src.endsWith('/sofia-logo.png')) {
                      img.src = '/sofia-logo.png';
                    }
                  }}
                />
                <div className="min-w-0">
                  <p className="font-bold text-sm text-[var(--text-1)] truncate">{companyName}</p>
                  <p className="text-[11px] text-[var(--text-3)] truncate flex items-center gap-1.5">
                    <span className="truncate">{username}</span>
                    <span>·</span>
                    <span className={(isAdmin || userRole === 'Administrator') ? 'text-teal-700 font-extrabold' : ''}>
                      {(isAdmin || userRole === 'Administrator') ? 'Admin' : userRole}
                    </span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="w-10 h-10 flex items-center justify-center text-[var(--text-2)] hover:text-[var(--text-1)] rounded-xl bg-[var(--surface-soft)] border border-[var(--stroke)] cursor-pointer shrink-0"
                aria-label={t('close')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="fluent-scroll flex-1 overflow-y-auto px-4 pt-4 pb-24 sm:pb-4 space-y-5">
              {/* App Grid Launcher */}
              <div>
                <div className="flex items-center justify-between mb-2.5 px-1">
                  <span className="text-xs font-bold text-[var(--text-2)]">{t('all_modules')}</span>
                  <button
                    type="button"
                    onClick={onVerifyDb}
                    className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-[var(--stroke)] bg-[var(--surface-soft)] text-[var(--text-2)] cursor-pointer"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${dbConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <RefreshCw className="w-3 h-3" />
                    <span>{dbConnected ? t('cloud_live') : t('cloud_offline')}</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  {filteredItems.map(item => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    const badge = item.id === 'permission-requests' ? pendingPermissionCount : 0;
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
                            ? 'fluent-brand-gradient text-white border-transparent shadow-md'
                            : 'bg-[var(--surface-soft)] text-[var(--text-2)] border-[var(--stroke)] hover:bg-[var(--surface-hover)] active:scale-95'
                        }`}
                      >
                        <Icon className={`w-5 h-5 mb-1.5 ${isActive ? 'text-sofia-turquoise' : 'text-sofia-lavender'}`} />
                        <span className="text-[11px] font-semibold leading-tight line-clamp-2">
                          {t(item.labelKey) || item.defaultLabel}
                        </span>
                        {badge > 0 && (
                          <span className="absolute top-1.5 end-1.5 min-w-[18px] h-[18px] px-1 bg-sofia-turquoise text-sofia-purple rounded-full text-[10px] font-bold flex items-center justify-center">
                            {badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Language & Currency Quick Controls */}
              <div className="grid grid-cols-1 gap-3 pt-2 border-t border-[var(--stroke)]">
                <div>
                  <span className="text-[11px] text-[var(--text-3)] font-semibold block mb-1.5 px-1">
                    {t('language')}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setLanguage('en')}
                      className={`min-h-[42px] rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        language === 'en' ? 'bg-sofia-purple text-white' : 'bg-[var(--surface-soft)] text-[var(--text-2)] border border-[var(--stroke)]'
                      }`}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      onClick={() => setLanguage('ar')}
                      className={`min-h-[42px] rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        language === 'ar' ? 'bg-sofia-turquoise text-sofia-purple' : 'bg-[var(--surface-soft)] text-[var(--text-2)] border border-[var(--stroke)]'
                      }`}
                    >
                      العربية
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-[var(--text-3)] font-semibold block mb-1.5 px-1">
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
                            ? 'bg-sofia-purple text-white'
                            : 'bg-[var(--surface-soft)] text-[var(--text-2)] border border-[var(--stroke)]'
                        }`}
                      >
                        {curr}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex items-center justify-between min-h-[44px] rounded-xl border border-[var(--stroke)] bg-[var(--surface-soft)] px-3 text-xs font-bold text-[var(--text-2)] cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    {theme === 'dark' ? <Sun className="w-4 h-4 text-sofia-turquoise" /> : <Moon className="w-4 h-4 text-sofia-lavender" />}
                    {theme === 'dark' ? (language === 'ar' ? 'الوضع الفاتح' : 'Light mode') : (language === 'ar' ? 'الوضع الداكن' : 'Dark mode')}
                  </span>
                  <span className="text-[10px] text-[var(--text-3)]">{theme === 'dark' ? 'On' : 'Off'}</span>
                </button>
              </div>

              {/* PWA Install */}
              <div className="space-y-2.5 pt-2 border-t border-[var(--stroke)]">
                <PWAInstallButton variant="drawer" companyName={companyName} />

                {/* Employee Self Clock-In / Clock-Out Action (Mobile Drawer) */}
                {(onClockIn || onClockOut) && (
                  isTodayShiftOpen ? (
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        if (onClockOut) onClockOut();
                      }}
                      className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-amber-500/12 hover:bg-amber-500/20 border border-amber-500/35 text-amber-700 text-xs font-bold transition-colors cursor-pointer min-h-[46px]"
                    >
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
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
                      className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-sofia-turquoise/12 hover:bg-sofia-turquoise/20 border border-sofia-turquoise/40 text-teal-700 text-xs font-bold transition-colors cursor-pointer min-h-[46px]"
                    >
                      <Clock className="w-4 h-4 text-sofia-turquoise-600 shrink-0" />
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
                        ? 'bg-emerald-500/12 hover:bg-emerald-500/20 border-emerald-500/35 text-emerald-700'
                        : 'bg-amber-500/12 hover:bg-amber-500/20 border-amber-500/35 text-amber-700'
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
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/18 border border-rose-500/30 text-rose-600 text-xs font-bold transition-colors cursor-pointer min-h-[46px]"
                  >
                    <Trash2 className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{t('admin_reset_title')}</span>
                  </button>
                )}
              </div>

              {/* Sign Out */}
              <div className="pt-2 border-t border-[var(--stroke)]">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-[var(--surface-soft)] hover:bg-rose-500/10 text-rose-500 min-h-[46px] rounded-xl text-xs font-bold cursor-pointer transition-colors border border-[var(--stroke)]"
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
