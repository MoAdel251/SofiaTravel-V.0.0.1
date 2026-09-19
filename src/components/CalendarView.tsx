import React, { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plane, MapPin, Briefcase, CheckSquare, Clock, Filter, Plus, CalendarDays } from 'lucide-react';
import { Reservation, Task, Flight, Hotel as HotelType, TourPackage } from '../types';

interface CalendarViewProps {
  reservations: Reservation[];
  tasks: Task[];
  flights?: Flight[];
  tourPackages?: TourPackage[];
  hotels?: HotelType[];
}

export function CalendarView({ reservations, tasks, flights = [], tourPackages = [], hotels = [] }: CalendarViewProps) {
  // Synchronized with current actual date
  const today = useMemo(() => new Date(), []);
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(() => {
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth(); // 0-indexed

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Helper to format Date to YYYY-MM-DD
  const formatDateStr = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayStr = useMemo(() => formatDateStr(today), [today]);

  // Gather all schedule events mapped by YYYY-MM-DD
  const eventsByDate = useMemo(() => {
    const map = new Map<string, { id: string; title: string; subtitle: string; type: 'reservation' | 'flight' | 'tour' | 'task'; icon: any; color: string; status?: string }[]>();

    const addEvent = (dateStr: string, eventObj: any) => {
      if (!dateStr) return;
      // standardizing date format if needed
      const cleanDate = dateStr.trim();
      if (!map.has(cleanDate)) {
        map.set(cleanDate, []);
      }
      map.get(cleanDate)!.push(eventObj);
    };

    reservations.forEach(r => {
      if (r.travel_date) {
        addEvent(r.travel_date, {
          id: `res-${r.id}`,
          title: `Trip: ${r.destination}`,
          subtitle: `${r.customer_name} • ${r.service_type}`,
          type: 'reservation',
          icon: Briefcase,
          color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
          status: r.reservation_status
        });
      }
    });

    flights.forEach(f => {
      if (f.departure_date) {
        addEvent(f.departure_date, {
          id: `fl-${f.id}`,
          title: `Flight ${f.flight_number}`,
          subtitle: `To ${f.arrival_airport} (${f.departure_time})`,
          type: 'flight',
          icon: Plane,
          color: 'bg-cyan-100 text-cyan-700 border-cyan-200',
          status: f.status
        });
      }
    });

    tourPackages.forEach(t => {
      if (t.start_date) {
        addEvent(t.start_date, {
          id: `tour-${t.id}`,
          title: `Tour: ${t.package_name}`,
          subtitle: `${t.destination} (${t.duration})`,
          type: 'tour',
          icon: MapPin,
          color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
          status: 'Active'
        });
      }
    });

    tasks.forEach(tsk => {
      if (tsk.due_date) {
        addEvent(tsk.due_date, {
          id: `task-${tsk.id}`,
          title: `Task: ${tsk.task_name}`,
          subtitle: `Assigned: ${tsk.assigned_employee_name}`,
          type: 'task',
          icon: CheckSquare,
          color: 'bg-amber-100 text-amber-800 border-amber-200',
          status: tsk.status
        });
      }
    });

    return map;
  }, [reservations, flights, tourPackages, tasks]);

  // Calendar Grid Days Calculation
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun, 1 = Mon ...
    const totalDaysInMonth = lastDayOfMonth.getDate();

    const days: { date: Date; dateStr: string; isCurrentMonth: boolean; isToday: boolean }[] = [];

    // Previous month padding days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const pDate = new Date(year, month - 1, prevMonthLastDay - i);
      const dStr = formatDateStr(pDate);
      days.push({
        date: pDate,
        dateStr: dStr,
        isCurrentMonth: false,
        isToday: dStr === todayStr
      });
    }

    // Current month days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const cDate = new Date(year, month, d);
      const dStr = formatDateStr(cDate);
      days.push({
        date: cDate,
        dateStr: dStr,
        isCurrentMonth: true,
        isToday: dStr === todayStr
      });
    }

    // Next month padding days to reach 35 or 42 cells
    const remainingCells = (7 - (days.length % 7)) % 7;
    for (let n = 1; n <= remainingCells; n++) {
      const nDate = new Date(year, month + 1, n);
      const dStr = formatDateStr(nDate);
      days.push({
        date: nDate,
        dateStr: dStr,
        isCurrentMonth: false,
        isToday: dStr === todayStr
      });
    }

    return days;
  }, [year, month, todayStr]);

  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  const handleTodayClick = () => {
    setCurrentMonthDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDateStr(todayStr);
  };

  const selectedDayEvents = selectedDateStr ? eventsByDate.get(selectedDateStr) || [] : [];

  return (
    <div className="p-6 md:p-8 space-y-6 bg-slate-50 min-h-screen">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-sm">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">Synchronized Operations Calendar</h1>
              <p className="text-xs text-slate-500">Real-time schedule for trips, flights, tour departures, and task deadlines.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTodayClick}
            className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>Today ({today.toLocaleDateString()})</span>
          </button>
          
          <div className="flex items-center bg-white rounded-xl border border-slate-200 shadow-2xs p-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-slate-100 text-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-black text-slate-900 min-w-[120px] text-center">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-slate-100 text-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Calendar View + Selected Day Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar Month Grid (8 cols on desktop) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
              <div key={d} className={`py-2 text-[11px] font-extrabold uppercase tracking-wider ${i === 0 || i === 6 ? 'text-amber-600' : 'text-slate-500'}`}>
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Day Cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((cell) => {
              const events = eventsByDate.get(cell.dateStr) || [];
              const isSelected = selectedDateStr === cell.dateStr;

              return (
                <div
                  key={cell.dateStr}
                  onClick={() => setSelectedDateStr(cell.dateStr)}
                  className={`min-h-[85px] p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                      : cell.isToday
                      ? 'bg-amber-50/60 border-amber-300 ring-2 ring-amber-400/20'
                      : cell.isCurrentMonth
                      ? 'bg-white border-slate-200/80 hover:bg-slate-50/80'
                      : 'bg-slate-50/50 border-slate-100 opacity-40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${
                        cell.isToday
                          ? 'bg-amber-500 text-white font-black'
                          : isSelected
                          ? 'bg-blue-600 text-white'
                          : cell.isCurrentMonth
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {cell.date.getDate()}
                    </span>

                    {events.length > 0 && (
                      <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-slate-900 text-white">
                        {events.length}
                      </span>
                    )}
                  </div>

                  {/* Event Badges preview */}
                  <div className="space-y-1 mt-1">
                    {events.slice(0, 2).map((ev) => (
                      <div
                        key={ev.id}
                        className={`text-[9.5px] font-bold truncate px-1.5 py-0.5 rounded-md border ${ev.color}`}
                        title={ev.title}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {events.length > 2 && (
                      <div className="text-[9px] font-bold text-slate-500 pl-1">
                        +{events.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day / Unified Schedule Sidebar (4 cols on desktop) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Day Schedule Panel */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  {selectedDateStr ? `Schedule for ${selectedDateStr}` : 'Selected Day Overview'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {selectedDateStr === todayStr ? '⭐ Today’s Active Operations' : 'Scheduled departues & tasks'}
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
                {selectedDayEvents.length} Event{selectedDayEvents.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {selectedDayEvents.map((ev) => {
                const Icon = ev.icon;
                return (
                  <div
                    key={ev.id}
                    className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 hover:bg-slate-100/70 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${ev.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-900">{ev.title}</span>
                      </div>
                      {ev.status && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 shadow-2xs">
                          {ev.status}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 pl-7">{ev.subtitle}</p>
                  </div>
                );
              })}

              {selectedDayEvents.length === 0 && (
                <div className="text-center py-10 space-y-2">
                  <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500 font-medium">No events scheduled for {selectedDateStr}.</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Tasks & Pending Action Items */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900">Task Deadlines & Priority Items</h3>
            <div className="space-y-2.5 max-h-[220px] overflow-y-auto">
              {tasks.map((t) => (
                <div key={t.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.priority === 'Urgent'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {t.priority}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">{t.due_date}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-900">{t.task_name}</p>
                  <p className="text-[10px] text-slate-500">Assigned: {t.assigned_employee_name}</p>
                </div>
              ))}
              {tasks.length === 0 && (
                <div className="text-xs text-slate-400 text-center py-4">No task deadlines pending.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
