import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Bell, Sparkles, Globe, Shield, ChevronDown, Check, User, Clock, ArrowRight, X,
  LayoutDashboard, Users, BookmarkCheck, Compass, Plane, Hotel, Truck, FileText, 
  Briefcase, Calendar, CheckSquare, BarChart3, Settings, Activity, Globe2, LogOut
} from 'lucide-react';
import { UserRole, NotificationItem } from '../types';
import { getCurrencySymbol } from '../utils/currency';

interface NavbarProps {
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  currentCurrency: string;
  setCurrentCurrency: (currency: string) => void;
  onOpenSearch: () => void;
  onOpenAi: () => void;
  notifications: NotificationItem[];
  onMarkNotificationRead: (id: string) => void;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  username: string;
  companyName: string;
  onLogout: () => void;
}

export function Navbar({
  userRole,
  setUserRole,
  currentCurrency,
  setCurrentCurrency,
  onOpenSearch,
  onOpenAi,
  notifications = [],
  onMarkNotificationRead,
  currentTab,
  setCurrentTab,
  username,
  companyName,
  onLogout
}: NavbarProps) {
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Administrator', 'Manager', 'Sales', 'Operations', 'Customer Service'] },
    { id: 'customers', label: 'Customers', icon: Users, roles: ['Administrator', 'Manager', 'Sales', 'Operations', 'Customer Service', 'Accountant'] },
    { id: 'suppliers', label: 'Suppliers', icon: Truck, roles: ['Administrator', 'Manager', 'Operations', 'Accountant'] },
    { id: 'invoices', label: 'Invoices', icon: FileText, roles: ['Administrator', 'Manager', 'Sales', 'Accountant', 'Operations', 'Customer Service'] },
    { id: 'reservations', label: 'Reservations', icon: BookmarkCheck, roles: ['Administrator', 'Manager', 'Sales', 'Operations', 'Customer Service'] },
    { id: 'packages', label: 'Tour Packages', icon: Compass, roles: ['Administrator', 'Manager', 'Sales', 'Accountant'] },
    { id: 'flights', label: 'Flights', icon: Plane, roles: ['Administrator', 'Manager', 'Sales', 'Operations'] },
    { id: 'hotels', label: 'Hotels', icon: Hotel, roles: ['Administrator', 'Manager', 'Sales', 'Operations', 'Accountant'] },
    { id: 'employees', label: 'Employees', icon: Briefcase, roles: ['Administrator', 'Manager'] },
    { id: 'calendar', label: 'Calendar', icon: Calendar, roles: ['Administrator', 'Manager', 'Sales', 'Operations', 'Customer Service'] },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, roles: ['Administrator', 'Manager', 'Sales', 'Operations', 'Customer Service', 'Accountant'] },
    { id: 'documents', label: 'Documents', icon: FileText, roles: ['Administrator', 'Manager', 'Operations', 'Customer Service', 'Sales', 'Accountant'] },
    { id: 'reports', label: 'Reports', icon: BarChart3, roles: ['Administrator', 'Manager', 'Accountant'] },
    { id: 'notifications', label: 'Notifications', icon: Bell, roles: ['Administrator', 'Manager', 'Sales', 'Accountant', 'Operations', 'Customer Service'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['Administrator', 'Manager'] },
    { id: 'activity-log', label: 'Audit Log', icon: Activity, roles: ['Administrator', 'Manager'] }
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(userRole));

  const unreadCount = notifications.filter(n => !n.read).length;

  // Handle outside clicks to close dropdowns
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
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 sm:px-8 flex items-center justify-between shadow-xs text-white">
        {/* Brand */}
        <div className="flex items-center gap-3 w-64 shrink-0">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-blue-600/30">
            <Globe2 className="w-5 h-5" />
          </div>
          <span className="font-bold text-base tracking-tight truncate">{companyName} <span className="text-blue-400">OS</span></span>
        </div>

        {/* Search Bar Trigger */}
        <div className="flex items-center gap-4 flex-1 justify-center max-w-xl">
          <button
            onClick={onOpenSearch}
            className="relative w-full text-left cursor-pointer group"
          >
            <input
              type="text"
              readOnly
              placeholder="Global Search (Name, PNR, Invoice, Passport...)"
              className="w-full bg-slate-800 group-hover:bg-slate-700/70 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-xs cursor-pointer text-slate-300 outline-none transition-all placeholder:text-slate-500"
            />
            <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-500 pointer-events-none group-hover:text-blue-400 transition-colors" />
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0 justify-end">
          {/* Logged in Username */}
          <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 rounded-xl text-xs font-bold text-slate-200 border border-slate-700">
            <User className="w-4 h-4 text-slate-400" />
            <span>{username}</span>
          </div>

          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setShowNotificationsDropdown(!showNotificationsDropdown);
              }}
              className={`p-2 rounded-xl transition-all cursor-pointer relative ${
                showNotificationsDropdown ? 'bg-blue-900/50 text-blue-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
              title="System Actions & Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white text-[10px] flex items-center justify-center rounded-full font-bold shadow-xs animate-pulse border border-slate-900">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Interactive Notifications Popup */}
            {showNotificationsDropdown && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-900">
                <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold tracking-tight">System Actions & Employee Logs</span>
                  </div>
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 font-semibold px-2 py-0.5 rounded-full">
                    {unreadCount} Unread
                  </span>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No active notifications or action logs.
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
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer ml-1"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>
      
      {/* Navigation Tabs Bar */}
      <div className="bg-white border-b border-slate-200 shadow-sm overflow-x-auto custom-scrollbar flex items-center px-4 sm:px-6">
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
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600 shadow-xs rounded-b-none' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-b-2 border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
