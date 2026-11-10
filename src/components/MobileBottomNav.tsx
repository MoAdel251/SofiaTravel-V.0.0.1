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
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-2xl"
      >
        <div className="grid grid-cols-2 items-center max-w-sm mx-auto">
          <button
            type="button"
            onClick={() => setCurrentTab('attendance')}
            className={`flex flex-col items-center justify-center min-h-[48px] rounded-xl transition-colors cursor-pointer ${
              currentTab === 'attendance' || currentTab === 'leave-management'
                ? 'text-cyan-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] leading-tight truncate max-w-full px-1">{t('nav_attendance')}</span>
          </button>
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="relative flex flex-col items-center justify-center min-h-[48px] rounded-xl text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <LayoutGrid className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] leading-tight truncate max-w-full px-1">{t('nav_menu')}</span>
          </button>
        </div>
      </nav>
    );
  }

  return (
    <nav
      aria-label="Mobile Primary Navigation"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-2xl"
    >
      <div className="grid grid-cols-5 items-center max-w-lg mx-auto">
        {/* Dashboard */}
        <button
          type="button"
          onClick={() => setCurrentTab('dashboard')}
          className={`flex flex-col items-center justify-center min-h-[48px] rounded-xl transition-colors cursor-pointer ${
            currentTab === 'dashboard'
              ? 'text-cyan-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] leading-tight truncate max-w-full px-1">{t('nav_dashboard')}</span>
        </button>

        {/* Vouchers */}
        {canViewVouchers ? (
          <button
            type="button"
            onClick={() => setCurrentTab('vouchers')}
            className={`flex flex-col items-center justify-center min-h-[48px] rounded-xl transition-colors cursor-pointer ${
              isVouchersActive
                ? 'text-cyan-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Ticket className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] leading-tight truncate max-w-full px-1">{t('nav_vouchers_short')}</span>
          </button>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[48px] text-slate-700 opacity-40">
            <Ticket className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] leading-tight truncate max-w-full px-1">{t('nav_vouchers_short')}</span>
          </div>
        )}

        {/* Center Quick Add Button */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onOpenQuickAdd}
            className="relative -top-2.5 flex flex-col items-center justify-center cursor-pointer group"
            aria-label={t('nav_quick_add')}
          >
            <div className="w-12 h-12 rounded-2xl bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 flex items-center justify-center shadow-lg border-2 border-slate-900 transition-transform">
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </div>
            <span className="text-[10px] font-bold text-cyan-300 mt-0.5 leading-none">{t('nav_quick_add')}</span>
          </button>
        </div>

        {/* Invoices */}
        {canViewInvoices ? (
          <button
            type="button"
            onClick={() => setCurrentTab('invoices')}
            className={`flex flex-col items-center justify-center min-h-[48px] rounded-xl transition-colors cursor-pointer ${
              isInvoicesActive
                ? 'text-cyan-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] leading-tight truncate max-w-full px-1">{t('nav_invoices_short')}</span>
          </button>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[48px] text-slate-700 opacity-40">
            <FileText className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] leading-tight truncate max-w-full px-1">{t('nav_invoices_short')}</span>
          </div>
        )}

        {/* All Modules App Drawer */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="relative flex flex-col items-center justify-center min-h-[48px] rounded-xl text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          <LayoutGrid className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] leading-tight truncate max-w-full px-1">{t('nav_menu')}</span>
          {pendingPermissionCount > 0 && (
            <span className="absolute top-1 end-3 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
              {pendingPermissionCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}
