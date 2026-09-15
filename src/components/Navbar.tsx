import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Bell, Sparkles, Globe, Shield, ChevronDown, Check, User, Clock, ArrowRight, X, Menu,
  LayoutDashboard, Users, BookmarkCheck, Compass, Plane, Hotel, Truck, FileText, 
  Briefcase, Calendar, CheckSquare, BarChart3, Settings, Activity, Globe2, LogOut, ShieldCheck, Database, DollarSign
} from 'lucide-react';
import { UserRole, NotificationItem } from '../types';
import { getCurrencySymbol } from '../utils/currency';

function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 rounded-xl text-[11px] font-bold text-slate-200 border border-slate-700 tabular-nums shadow-inner">
      <Clock className="w-3.5 h-3.5 text-blue-400" />
      <span>{time.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
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
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  username: string;
  companyName: string;
  onLogout: () => void;
}

export function Navbar({
  userRole,
  userPermissions = [],
  setUserRole,
  currentCurrency,
  setCurrentCurrency,
  onOpenSearch,
  onOpenAi,
  notifications = [],
  pendingPermissionCount = 0,
  onMarkNotificationRead,
  currentTab,
  setCurrentTab,
  username,
  companyName,
  onLogout
}: NavbarProps) {
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);

  const hasPerm = (perm: string | string[]) => {
    if (userRole === 'Administrator') return true;
    if (Array.isArray(perm)) {
      return perm.some(p => userPermissions.includes(p));
    }
    return userPermissions.includes(perm);
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Administrator', 'Manager', 'Sales', 'Operations', 'Customer Service'], perm: 'view_dashboard' },
    { id: 'permission-requests', label: 'Approval Requests', icon: ShieldCheck, roles: ['Administrator', 'Manager', 'Sales', 'Operations', 'Customer Service', 'Accountant'], badge: pendingPermissionCount, perm: 'view_dashboard' },
    { id: 'customers', label: 'Customers', icon: Users, roles: ['Administrator', 'Manager', 'Sales', 'Operations', 'Customer Service', 'Accountant'], perm: 'view_customers' },
    { id: 'suppliers', label: 'Suppliers', icon: Truck, roles: ['Administrator', 'Manager', 'Operations', 'Accountant'], perm: 'view_finance' },
    { id: 'invoices', label: 'Invoices', icon: FileText, roles: ['Administrator', 'Manager', 'Sales', 'Accountant', 'Operations', 'Customer Service'], perm: 'view_sales' },
    { id: 'reservations', label: 'Reservations', icon: BookmarkCheck, roles: ['Administrator', 'Manager', 'Sales', 'Operations', 'Customer Service'], perm: 'view_bookings' },
    { id: 'packages', label: 'Tour Packages', icon: Compass, roles: ['Administrator', 'Manager', 'Sales', 'Accountant'], perm: 'view_trips' },
    { id: 'flights', label: 'Flights', icon: Plane, roles: ['Administrator', 'Manager', 'Sales', 'Operations'], perm: 'view_trips' },
    { id: 'hotels', label: 'Hotels', icon: Hotel, roles: ['Administrator', 'Manager', 'Sales', 'Operations', 'Accountant'], perm: 'view_trips' },
    { id: 'employees', label: 'Employees', icon: Briefcase, roles: ['Administrator', 'Manager'], perm: 'view_employees' },
    { id: 'attendance', label: 'Attendance & Departure', icon: Clock, roles: ['Administrator'], perm: ['view_attendance', 'add_check_in', 'add_check_out'] },
    { id: 'calendar', label: 'Calendar', icon: Calendar, roles: ['Administrator', 'Manager', 'Sales', 'Operations', 'Customer Service'], perm: 'view_dashboard' },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, roles: ['Administrator', 'Manager', 'Sales', 'Operations', 'Customer Service', 'Accountant'], perm: 'view_dashboard' },
    { id: 'documents', label: 'Documents', icon: FileText, roles: ['Administrator', 'Manager', 'Operations', 'Customer Service', 'Sales', 'Accountant'], perm: 'view_dashboard' },
    { id: 'reports', label: 'Reports', icon: BarChart3, roles: ['Administrator', 'Manager', 'Accountant'], perm: 'view_reports' },
    { id: 'finance-payroll', label: 'Finance & Payroll', icon: DollarSign, roles: ['Administrator'], perm: ['view_finance', 'view_payroll'] },
    { id: 'notifications', label: 'Notifications', icon: Bell, roles: ['Administrator', 'Manager', 'Sales', 'Accountant', 'Operations', 'Customer Service'], perm: 'view_dashboard' },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['Administrator', 'Manager'], perm: 'view_settings' },
    { id: 'activity-log', label: 'Audit Log', icon: Activity, roles: ['Administrator', 'Manager'], perm: 'view_settings' }
  ];

  const filteredItems = menuItems.filter(item => userPermissions.length > 0 ? hasPerm(item.perm) : item.roles.includes(userRole));
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotificationsDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="sticky top-0 z-40 w-full flex flex-col">
      {/* Top Header */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-xs text-white">
        {/* Brand & Mobile Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-400 hover:text-white rounded-xl lg:hidden focus:outline-none cursor-pointer"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-blue-600/30">
            <Globe2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <span className="font-bold text-sm sm:text-base tracking-tight truncate max-w-[120px] sm:max-w-none">
            {companyName} <span className="text-blue-400">OS</span>
          </span>
        </div>

        {/* Search Bar Trigger */}
        <div className="flex items-center gap-4 flex-1 justify-center max-w-xs sm:max-w-md lg:max-w-xl mx-2">
          <button
            onClick={onOpenSearch}
            className="relative w-full text-left cursor-pointer group"
          >
            <input
              type="text"
              readOnly
              placeholder="Search (Name, PNR, Invoice...)"
              className="w-full bg-slate-800 group-hover:bg-slate-700/70 border border-slate-700 rounded-xl py-1.5 sm:py-2 pl-9 sm:pl-10 pr-3 text-xs cursor-pointer text-slate-300 outline-none transition-all placeholder:text-slate-500"
            />
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 absolute left-3 top-2.5 text-slate-500 pointer-events-none group-hover:text-blue-400 transition-colors" />
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0 justify-end">
          {/* Live System Clock */}
          <LiveClock />
          
          {/* Cloud Sync Status Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/60 border border-emerald-500/30 rounded-full text-[11px] text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <Database className="w-3 h-3 text-emerald-400" />
            <span>Firestore Cloud Live</span>
          </div>

          {/* Logged in Username */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-xl text-xs font-bold text-slate-200 border border-slate-700">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate max-w-[100px]">{username}</span>
            <span className="text-[10px] bg-slate-700 text-blue-300 px-1.5 py-0.5 rounded-md">{userRole}</span>
          </div>

          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
              className={`p-2 rounded-xl transition-all cursor-pointer relative ${
                showNotificationsDropdown ? 'bg-blue-900/50 text-blue-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
              title="System Actions & Notifications"
            >
              <Bell className="w-5 h-5" />
              {(unreadCount > 0 || pendingPermissionCount > 0) && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white text-[10px] flex items-center justify-center rounded-full font-bold shadow-xs animate-pulse border border-slate-900">
                  {unreadCount + pendingPermissionCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotificationsDropdown && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-900">
                <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold tracking-tight">System Actions & Employee Activity</span>
                  </div>
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 font-semibold px-2 py-0.5 rounded-full">
                    {unreadCount} Unread
                  </span>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No active notifications or employee action logs.
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
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-slate-900 truncate">{notif.title}</p>
                            {!notif.read && (
                              <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                            )}
                          </div>
                          <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed break-words">{notif.message}</p>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1">
                            <Clock className="w-3 h-3" />
                            <span>{notif.date}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                  <button
                    onClick={() => {
                      notifications.forEach(n => {
                        if (!n.read) onMarkNotificationRead(n.id);
                      });
                    }}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer px-2 py-1 rounded-md hover:bg-blue-50"
                  >
                    Mark all as read
                  </button>
                  <button
                    onClick={() => {
                      setShowNotificationsDropdown(false);
                      setCurrentTab('notifications');
                    }}
                    className="text-[11px] text-slate-700 hover:text-slate-900 font-bold flex items-center gap-1 cursor-pointer px-2 py-1 rounded-md hover:bg-slate-200"
                  >
                    <span>View all logs</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Log out */}
          <button
            onClick={onLogout}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Desktop Navigation Tabs Bar */}
      <div className="hidden lg:flex bg-white border-b border-slate-200 shadow-xs overflow-x-auto custom-scrollbar items-center px-4 sm:px-6">
        <div className="flex space-x-1 py-2 min-w-max">
          {filteredItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600 shadow-xs' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-b-2 border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Navigation Drawer / Slide-Over */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" 
            onClick={() => setMobileMenuOpen(false)} 
          />
          <div className="relative z-10 w-72 max-w-[80vw] bg-slate-900 text-white h-full flex flex-col p-4 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white">
                  <Globe2 className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm">{companyName}</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-3 border-b border-slate-800 space-y-1">
              <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider px-2">User Profile</div>
              <div className="px-2 py-1 text-xs text-slate-200 font-semibold">{username}</div>
              <div className="px-2 text-[10px] text-blue-400 font-bold">{userRole}</div>
            </div>

            <div className="py-4 space-y-1 flex-1">
              <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider px-2 mb-2">Navigation Menu</div>
              {filteredItems.map(item => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                      isActive ? 'bg-blue-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-bold">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 py-2.5 rounded-xl text-xs font-bold"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

