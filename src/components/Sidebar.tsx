import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  Moon,
  Search,
  Sun,
} from 'lucide-react';
import { UserRole } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { isTabAllowedForUser } from '../utils/permissions';
import { NAV_GROUPS, NAV_ITEMS } from '../config/navigation';
import { SOFIA_LOGO_URL } from './SofiaLogo';
import { APP_VERSION } from '../utils/appVersion';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  userRole: UserRole;
  userPermissions?: string[];
  username: string;
  companyName: string;
  onLogout: () => void;
  pendingPermissionCount?: number;
  isAdmin?: boolean;
  isITAccount?: boolean;
  restrictToAttendance?: boolean;
  onOpenSearch?: () => void;
}

const COLLAPSE_KEY = 'sofia_sidebar_collapsed';

export function Sidebar({
  currentTab,
  setCurrentTab,
  userRole,
  userPermissions = [],
  username,
  companyName,
  onLogout,
  pendingPermissionCount = 0,
  isAdmin = false,
  isITAccount = false,
  restrictToAttendance = false,
  onOpenSearch,
}: SidebarProps) {
  const { language, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const isAr = language === 'ar';

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  const filteredItems = useMemo(
    () =>
      NAV_ITEMS.filter(item =>
        restrictToAttendance
          ? item.id === 'attendance'
          : isTabAllowedForUser(item.id, userRole, userPermissions, isAdmin, isITAccount)
      ),
    [restrictToAttendance, userRole, userPermissions, isAdmin, isITAccount]
  );

  const initials = useMemo(() => {
    const clean = String(username || '').trim();
    if (!clean) return 'ST';
    const parts = clean.split(/\s+/).slice(0, 2);
    return parts.map(p => p.charAt(0).toUpperCase()).join('');
  }, [username]);

  const roleLabel = isAdmin
    ? (isAr ? 'مسؤول النظام' : 'Administrator')
    : userRole === 'Office Boy'
      ? (isAr ? 'عامل مكتب' : 'Office Boy')
      : userRole;

  const renderNavItem = (item: (typeof NAV_ITEMS)[number]) => {
    const Icon = item.icon;
    const isActive = currentTab === item.id;
    const badge = item.id === 'permission-requests' ? pendingPermissionCount : 0;
    const label = t(item.labelKey) || item.defaultLabel;

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => setCurrentTab(item.id)}
        aria-current={isActive ? 'page' : undefined}
        title={collapsed ? label : undefined}
        className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all duration-200 cursor-pointer min-h-[44px] ${
          collapsed ? 'justify-center px-0' : ''
        } ${
          isActive
            ? 'bg-[var(--surface-active)] text-[var(--text-1)] shadow-[inset_0_0_0_1px_var(--stroke)]'
            : 'text-[var(--text-2)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-1)]'
        }`}
      >
        {isActive && (
          <span
            aria-hidden="true"
            className="absolute start-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-sofia-turquoise"
          />
        )}
        <Icon
          className={`h-[18px] w-[18px] shrink-0 transition-colors ${
            isActive
              ? 'text-sofia-turquoise'
              : 'text-[var(--text-3)] group-hover:text-sofia-turquoise'
          }`}
        />
        {!collapsed && (
          <span className="flex-1 truncate text-start">{label}</span>
        )}
        {!collapsed && badge > 0 && (
          <span className="ms-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-sofia-turquoise px-1.5 text-[10px] font-bold text-sofia-purple">
            {badge}
          </span>
        )}
        {collapsed && badge > 0 && (
          <span className="absolute -top-0.5 end-1 h-2.5 w-2.5 rounded-full bg-sofia-turquoise ring-2 ring-[var(--surface-solid)]" />
        )}
      </button>
    );
  };

  return (
    <aside
      className="hidden lg:flex shrink-0 flex-col fluent-mica border-e border-[var(--stroke)] relative z-30 transition-[width] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
      style={{ width: collapsed ? 'var(--sidebar-w-collapsed)' : 'var(--sidebar-w)' }}
      aria-label={isAr ? 'التنقل الرئيسي' : 'Main navigation'}
    >
      {/* Brand */}
      <div className={`flex items-center gap-3 px-4 pt-5 pb-4 ${collapsed ? 'flex-col' : ''}`}>
        <button
          type="button"
          onClick={() => setCurrentTab(userRole === 'Office Boy' ? 'attendance' : 'dashboard')}
          className="flex items-center gap-3 min-w-0 cursor-pointer focus:outline-none"
          title={companyName}
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm border border-[var(--stroke)] p-1">
            <img
              src={SOFIA_LOGO_URL}
              alt={companyName}
              className="h-full w-auto object-contain select-none"
              onError={(e) => {
                const img = e.currentTarget;
                if (!img.src.endsWith('/sofia-logo.png')) img.src = '/sofia-logo.png';
              }}
            />
          </span>
          {!collapsed && (
            <span className="min-w-0 flex flex-col">
              <span className="truncate text-[13px] font-extrabold tracking-tight text-[var(--text-1)]">
                {companyName || 'SOFIA TRAVEL'}
              </span>
              <span className="truncate text-[10px] font-semibold text-[var(--text-3)]">
                {isAr ? 'منصة إدارة السفر' : 'Travel Operations Suite'}
              </span>
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setCollapsed(v => !v)}
          className={`${collapsed ? '' : 'ms-auto'} flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-3)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-1)] transition-colors cursor-pointer`}
          aria-label={isAr ? 'طي القائمة الجانبية' : 'Collapse sidebar'}
          title={isAr ? 'طي القائمة الجانبية' : 'Collapse sidebar'}
        >
          {collapsed
            ? (isAr ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />)
            : (isAr ? <ChevronsLeft className="h-4 w-4" /> : <ChevronsRight className="h-4 w-4" />)}
        </button>
      </div>

      {/* Search shortcut */}
      {!collapsed && onOpenSearch && (
        <div className="px-3 pb-3">
          <button
            type="button"
            onClick={onOpenSearch}
            className="flex w-full items-center gap-2 rounded-xl border border-[var(--stroke)] bg-[var(--surface-soft)] px-3 py-2 text-xs font-medium text-[var(--text-3)] hover:border-[var(--stroke-strong)] hover:text-[var(--text-2)] transition-colors cursor-pointer min-h-[38px]"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="flex-1 text-start">{t('search_placeholder') || (isAr ? 'بحث سريع...' : 'Search...')}</span>
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="fluent-scroll flex-1 overflow-y-auto overflow-x-hidden px-3 pb-4 space-y-4">
        {NAV_GROUPS.map(group => {
          const items = filteredItems.filter(item => item.group === group.id);
          if (items.length === 0) return null;
          return (
            <div key={group.id} className="space-y-1">
              {!collapsed && (
                <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-3)]">
                  {isAr ? group.labelAr : group.labelEn}
                </div>
              )}
              {collapsed && <div className="mx-auto my-2 h-px w-6 bg-[var(--stroke)]" />}
              {items.map(renderNavItem)}
            </div>
          );
        })}
      </nav>

      {/* Profile + utilities */}
      <div className="border-t border-[var(--stroke)] p-3 space-y-2">
        <div
          className={`flex items-center gap-3 rounded-xl px-2 py-2 ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sofia-turquoise to-sofia-lavender text-[11px] font-black text-sofia-purple shadow-sm">
            {initials}
          </span>
          {!collapsed && (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-bold text-[var(--text-1)]">{username}</span>
              <span className="block truncate text-[10px] font-semibold text-[var(--text-3)]">{roleLabel}</span>
            </span>
          )}
          {!collapsed && (
            <button
              type="button"
              onClick={onLogout}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-3)] hover:bg-rose-500/10 hover:text-rose-500 transition-colors cursor-pointer"
              aria-label={t('sign_out')}
              title={t('sign_out')}
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className={`flex items-center gap-2 ${collapsed ? 'flex-col' : ''}`}>
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-9 flex-1 w-full items-center justify-center gap-2 rounded-xl border border-[var(--stroke)] text-[11px] font-bold text-[var(--text-2)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-1)] transition-colors cursor-pointer"
            aria-label={isAr ? 'تبديل الوضع الداكن' : 'Toggle dark mode'}
            title={isAr ? 'الوضع الداكن' : 'Dark mode'}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 text-sofia-turquoise" /> : <Moon className="h-4 w-4 text-sofia-lavender" />}
            {!collapsed && <span>{theme === 'dark' ? (isAr ? 'فاتح' : 'Light') : (isAr ? 'داكن' : 'Dark')}</span>}
          </button>
          {collapsed && (
            <button
              type="button"
              onClick={onLogout}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--stroke)] text-[var(--text-3)] hover:bg-rose-500/10 hover:text-rose-500 transition-colors cursor-pointer"
              aria-label={t('sign_out')}
              title={t('sign_out')}
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>

        {!collapsed && (
          <div className="flex items-center justify-between px-2 pt-1 text-[10px] font-semibold text-[var(--text-3)]">
            <span>SOFIA · {APP_VERSION}</span>
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {isAr ? 'متصل' : 'Live'}
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
