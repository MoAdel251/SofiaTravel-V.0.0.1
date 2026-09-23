import React from 'react';
import { 
  LayoutDashboard, 
  Ticket, 
  Plus, 
  MessageCircle, 
  Menu,
  ShieldCheck,
  FileText,
  Users
} from 'lucide-react';
import { UserRole } from '../types';

interface MobileBottomNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  pendingPermissionCount?: number;
  onOpenQuickAdd: () => void;
  onOpenMobileMenu: () => void;
  userRole?: UserRole;
}

export function MobileBottomNav({
  currentTab,
  setCurrentTab,
  pendingPermissionCount = 0,
  onOpenQuickAdd,
  onOpenMobileMenu,
  userRole
}: MobileBottomNavProps) {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-2xl">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* Dashboard */}
        <button
          onClick={() => setCurrentTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
            currentTab === 'dashboard' 
              ? 'text-blue-400 font-bold scale-105' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">Dashboard</span>
        </button>

        {/* Vouchers */}
        <button
          onClick={() => setCurrentTab('vouchers')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
            currentTab === 'vouchers' 
              ? 'text-blue-400 font-bold scale-105' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Ticket className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">Vouchers</span>
        </button>

        {/* Center Quick Add Action Button */}
        <button
          onClick={onOpenQuickAdd}
          className="relative -top-3.5 flex flex-col items-center justify-center cursor-pointer group"
          title="Quick Add Record"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 text-white flex items-center justify-center shadow-lg shadow-blue-500/40 border-2 border-slate-900 group-hover:scale-105 group-active:scale-95 transition-all">
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="text-[10px] font-bold text-blue-300 mt-0.5">Add</span>
        </button>

        {/* Customer Inquiries / Customers */}
        <button
          onClick={() => setCurrentTab('customer-inquiries')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
            currentTab === 'customer-inquiries' 
              ? 'text-blue-400 font-bold scale-105' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageCircle className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">Inquiries</span>
        </button>

        {/* All Menus Drawer Toggle */}
        <button
          onClick={onOpenMobileMenu}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-slate-400 hover:text-slate-200 transition-all cursor-pointer relative"
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">Menu</span>
          {pendingPermissionCount > 0 && (
            <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          )}
        </button>
      </div>
    </div>
  );
}
