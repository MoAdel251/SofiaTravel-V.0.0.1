import React from 'react';
import { Bell, CheckCircle2 } from 'lucide-react';
import { NotificationItem } from '../types';

interface NotificationsViewProps {
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
}

export function NotificationsView({ notifications, onMarkRead }: NotificationsViewProps) {
  return (
    <div className="p-8 space-y-6 bg-slate-50 min-h-screen">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Notifications Center</h1>
        <p className="text-sm text-slate-500">Upcoming trips, flight departures, unpaid balances, supplier payments, and task alerts.</p>
      </div>

      <div className="space-y-3">
        {notifications.map(n => (
          <div key={n.id} className={`p-4 rounded-2xl border transition-colors flex items-center justify-between ${n.read ? 'bg-white border-slate-200 text-slate-600' : 'bg-cyan-50/50 border-cyan-200 text-slate-900 font-medium'}`}>
            <div className="flex items-center space-x-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${n.read ? 'bg-slate-100 text-slate-500' : 'bg-cyan-600 text-white shadow-sm'}`}>
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold">{n.title}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                <span className="text-[10px] text-slate-400 mt-1 block">{n.date}</span>
              </div>
            </div>
            {!n.read && (
              <button
                onClick={() => onMarkRead(n.id)}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center space-x-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark Read</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
