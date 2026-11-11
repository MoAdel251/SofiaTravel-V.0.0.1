import React from 'react';
import {
  LayoutDashboard,
  Ticket,
  Plus,
  FileText,
  LayoutGrid,
  Clock,
} from 'lucide-react';
import { UserRole } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { isTabAllowedForUser } from '../utils/permissions';

interface MobileBottomNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  pendingPermissionCount?: number;
  onOpenQuickAdd: () => void;
  onOpenMobileMenu: () => void;
  userRole?: UserRole;
  userPermissions?: string[];
  isAdmin?: boolean;
  isITAccount?: boolean;
}

function NavButton({
  active,
  label,
  onClick,
  children,
  badge,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`relative flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-xl px-1 transition-colors cursor-pointer ${
        active ? 'text-sofia-turquoise-600' : 'text-[var(--text-3)] hover:text-[var(--text-1)]'
      }`}
    >
      <span
        className={`flex h-7 w-11 items-center justify-center rounded-lg transition-colors ${
          active ? 'bg-sofia-turquoise/14' : ''
        }`}
      >
        {children}
      </span>
      <span className={`max-w-full truncate px-1 text-[10px] leading-tight ${active ? 'font-bold' : 'font-semibold'}`}>
        {label}
      </span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute top-1 end-2.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  );
}

export function MobileBottomNav({
  currentTab,
  setCurrentTab,
  pendingPermissionCount = 0,
  onOpenQuickAdd,
  onOpenMobileMenu,
  userRole = 'Sales',
  userPermissions = [],
  isAdmin = false,
  isITAccount = false,
}: MobileBottomNavProps) {
  const { t } = useLanguage();

  const canViewVouchers = isTabAllowedForUser('vouchers', userRole, userPermissions, isAdmin, isITAccount);
  const canViewInvoices = isTabAllowedForUser('invoices', userRole, userPermissions, isAdmin, isITAccount);

  const isInvoicesActive =
    currentTab === 'invoices' ||
    currentTab === 'finance' ||
    currentTab === 'customer-payments' ||
    currentTab === 'supplier-payments';

  const isVouchersActive = currentTab === 'vouchers' || currentTab === 'reservations';

  // Attendance-only accounts (Office Boy) get a reduced bar: attendance + menu.
  if (userRole === 'Office Boy') {
    return (
      <nav
        aria-label="Mobile Primary Navigation"
        className="fluent-bottom-nav lg:hidden fixed bottom-0 inset-x-0 z-40 px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      >
        <div className="mx-auto grid max-w-sm grid-cols-2 items-center">
          <NavButton
            active={currentTab === 'attendance' || currentTab === 'leave-management'}
            label={t('nav_attendance')}
            onClick={() => setCurrentTab('attendance')}
          >
            <Clock className="h-[19px] w-[19px]" />
          </NavButton>
          <NavButton active={false} label={t('nav_menu')} onClick={onOpenMobileMenu}>
            <LayoutGrid className="h-[19px] w-[19px]" />
          </NavButton>
        </div>
      </nav>
    );
  }

  return (
    <nav
      aria-label="Mobile Primary Navigation"
      className="fluent-bottom-nav lg:hidden fixed bottom-0 inset-x-0 z-40 px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
    >
      <div className="mx-auto grid max-w-lg grid-cols-5 items-center">
        <NavButton
          active={currentTab === 'dashboard'}
          label={t('nav_dashboard')}
          onClick={() => setCurrentTab('dashboard')}
        >
          <LayoutDashboard className="h-[19px] w-[19px]" />
        </NavButton>

        {canViewVouchers ? (
          <NavButton
            active={isVouchersActive}
            label={t('nav_vouchers_short')}
            onClick={() => setCurrentTab('vouchers')}
          >
            <Ticket className="h-[19px] w-[19px]" />
          </NavButton>
        ) : (
          <div className="flex min-h-[52px] flex-col items-center justify-center text-[var(--text-3)] opacity-35">
            <Ticket className="h-[19px] w-[19px]" />
            <span className="mt-0.5 text-[10px] font-semibold">{t('nav_vouchers_short')}</span>
          </div>
        )}

        <div className="flex justify-center">
          <button
            type="button"
            onClick={onOpenQuickAdd}
            className="relative -top-3 flex flex-col items-center justify-center cursor-pointer group"
            aria-label={t('nav_quick_add')}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl fluent-brand-gradient text-sofia-turquoise shadow-[0_10px_24px_rgba(41,24,63,0.35)] ring-1 ring-white/20 transition-transform active:scale-95">
              <Plus className="h-6 w-6 stroke-[2.5]" />
            </span>
            <span className="mt-0.5 text-[9px] font-bold leading-none text-sofia-turquoise-600">
              {t('nav_quick_add')}
            </span>
          </button>
        </div>

        {canViewInvoices ? (
          <NavButton
            active={isInvoicesActive}
            label={t('nav_invoices_short')}
            onClick={() => setCurrentTab('invoices')}
          >
            <FileText className="h-[19px] w-[19px]" />
          </NavButton>
        ) : (
          <div className="flex min-h-[52px] flex-col items-center justify-center text-[var(--text-3)] opacity-35">
            <FileText className="h-[19px] w-[19px]" />
            <span className="mt-0.5 text-[10px] font-semibold">{t('nav_invoices_short')}</span>
          </div>
        )}

        <NavButton
          active={false}
          label={t('nav_menu')}
          onClick={onOpenMobileMenu}
          badge={pendingPermissionCount}
        >
          <LayoutGrid className="h-[19px] w-[19px]" />
        </NavButton>
      </div>
    </nav>
  );
}
