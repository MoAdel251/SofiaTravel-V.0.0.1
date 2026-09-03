import React from 'react';
import { Calendar as CalendarIcon, Plane, Hotel, CheckSquare, Clock } from 'lucide-react';
import { Reservation, Task } from '../types';

interface CalendarViewProps {
  reservations: Reservation[];
  tasks: Task[];
}

export function CalendarView({ reservations, tasks }: CalendarViewProps) {
  return (
    <div className="p-8 space-y-6 bg-slate-50 min-h-screen">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Interactive Operations Calendar</h1>
        <p className="text-sm text-slate-500">Scheduled trips, hotel check-ins, flight departures, and task deadlines.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Events List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <h3 className="text-base font-bold text-slate-900">Upcoming Schedule (September 2026)</h3>
          <div className="space-y-3">
            {reservations.map(res => (
              <div key={res.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100/70 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">
                    <Plane className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{res.destination} ({res.service_type})</h4>
                    <p className="text-xs text-slate-500">Traveler: {res.customer_name} • Status: {res.reservation_status}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-cyan-600 bg-cyan-50 px-2.5 py-1 rounded-lg">{res.travel_date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Task Deadlines */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <h3 className="text-base font-bold text-slate-900">Task Deadlines</h3>
          <div className="space-y-3">
            {tasks.map(t => (
              <div key={t.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    t.priority === 'Urgent' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {t.priority}
                  </span>
                  <span className="text-xs text-slate-500">{t.due_date}</span>
                </div>
                <p className="text-xs font-bold text-slate-900">{t.task_name}</p>
                <p className="text-[11px] text-slate-500">Assigned to: {t.assigned_employee_name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
