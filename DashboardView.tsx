import React from 'react';
import { 
  Users, 
  BookmarkCheck, 
  Calendar, 
  Plane, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell,
  CartesianGrid
} from 'recharts';

interface DashboardViewProps {
  stats: any;
  currentCurrency: string;
}

export function DashboardView({ stats, currentCurrency }: DashboardViewProps) {
  if (!stats) {
    return <div className="p-8 text-center text-slate-500">Loading dashboard analytics...</div>;
  }

  const monthlyData = stats.monthlyData || [];

  const serviceTypeData = [
    { name: 'Travel Package', value: 35, color: '#2563eb' },
    { name: 'Flight', value: 25, color: '#3b82f6' },
    { name: 'Hotel', value: 20, color: '#60a5fa' },
    { name: 'Tour / Cruise', value: 15, color: '#f97316' },
    { name: 'Other', value: 5, color: '#cbd5e1' },
  ];

  return (
    <div className="p-8 space-y-6 bg-slate-50 min-h-screen">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-400">Real-time tourism operations overview and financial intelligence.</p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
            <span className="w-2 h-2 mr-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            System Live ({currentCurrency})
          </span>
        </div>
      </div>

      {/* Bento Grid Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-emerald-500">+12%</span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-slate-900">{stats.total_customers}</div>
            <div className="text-xs text-slate-400 mt-1 font-medium">Registered Customers</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
              <BookmarkCheck className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-blue-500">{stats.active_reservations} Active</span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-slate-900">{stats.active_reservations}</div>
            <div className="text-xs text-slate-400 mt-1 font-medium">Total Reservations</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-orange-50 text-orange-600 rounded-2xl">
              <Plane className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-orange-500">Next 30 Days</span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-slate-900">{stats.upcoming_trips}</div>
            <div className="text-xs text-slate-400 mt-1 font-medium">Upcoming Trips</div>
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-3xl text-white flex flex-col justify-between overflow-hidden relative">
          <div className="relative z-10 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Net Profit (MTD)</span>
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="relative z-10 mt-4">
            <div className="text-3xl font-bold">${stats.net_profit?.toLocaleString()}</div>
            <div className="text-xs text-slate-400 mt-1 font-medium">Revenue: ${stats.total_sales?.toLocaleString()}</div>
          </div>
          <div className="absolute -right-4 -top-4 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl"></div>
        </div>
      </div>

      {/* Financial & Alerts Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Outstanding Customer Balances</h4>
              <p className="text-xs text-slate-400 mt-0.5">Unpaid customer accounts awaiting settlement</p>
            </div>
          </div>
          <span className="text-2xl font-extrabold text-amber-600">${stats.outstanding_customer_payments?.toLocaleString()}</span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Outstanding Supplier Balances</h4>
              <p className="text-xs text-slate-400 mt-0.5">Amounts owed to airlines, hotels & operators</p>
            </div>
          </div>
          <span className="text-2xl font-extrabold text-rose-600">${stats.outstanding_supplier_payments?.toLocaleString()}</span>
        </div>
      </div>

      {/* Analytics Charts & Bento Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Forecast (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900">Monthly Revenue & Profit Forecast</h3>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-blue-600 rounded-full"></span>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Target Met</span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Sales" fill="#2563eb" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Profit" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Destination / Service Popularity (1 col) */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-4">Destination Popularity</h3>
            <div className="space-y-4">
              {stats.destinationPopularity?.map((dest: any, idx: number) => {
                const colors = ['bg-blue-600', 'bg-orange-500', 'bg-emerald-500'];
                const color = colors[idx % colors.length];
                return (
                  <div key={dest.name}>
                    <div className="flex justify-between text-xs mb-1 font-bold text-slate-600"><span>{dest.name}</span><span>{dest.percentage}%</span></div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden"><div className={`${color} h-full rounded-full`} style={{ width: `${dest.percentage}%` }}></div></div>
                  </div>
                );
              })}
              {(!stats.destinationPopularity || stats.destinationPopularity.length === 0) && (
                <div className="text-xs text-slate-400 text-center py-4">No destination data available</div>
              )}
            </div>
          </div>
          <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="text-xs font-bold text-slate-700">Top Performing Agent</div>
            <div className="text-sm font-extrabold text-blue-600 mt-0.5">
              {stats.topAgent?.name || 'No data'} {stats.topAgent?.sales ? `($${stats.topAgent.sales.toLocaleString()} Sales)` : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Reservations (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm">Recent Reservations</h3>
            <span className="text-xs text-blue-600 font-bold uppercase cursor-pointer">View All</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 uppercase text-[10px] tracking-wider">
                  <th className="pb-3 font-semibold">Reservation</th>
                  <th className="pb-3 font-semibold">Customer</th>
                  <th className="pb-3 font-semibold">Service</th>
                  <th className="pb-3 font-semibold">Destination</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.recent_reservations?.map((res: any) => (
                  <tr key={res.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 font-bold text-slate-900">{res.reservation_id}</td>
                    <td className="py-3.5 font-semibold text-slate-800">{res.customer_name || 'Customer'}</td>
                    <td className="py-3.5 text-slate-500">{res.service_type}</td>
                    <td className="py-3.5 text-slate-500">{res.destination}</td>
                    <td className="py-3.5 font-bold text-blue-600">${res.selling_price}</td>
                    <td className="py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        res.reservation_status === 'Confirmed' ? 'bg-emerald-50 text-emerald-600' :
                        res.reservation_status === 'Pending' ? 'bg-amber-50 text-amber-600' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {res.reservation_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Priority Tasks / Recent Activity (1 col) */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Recent Audit Activity</h3>
          <div className="space-y-3 flex-1 overflow-y-auto max-h-72">
            {stats.recent_activities?.map((act: any) => (
              <div key={act.id} className="flex gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-2 bg-blue-600 rounded-full h-full shrink-0"></div>
                <div>
                  <div className="text-xs font-bold text-slate-900">{act.user_name}</div>
                  <div className="text-[11px] text-slate-500">{act.action} ({act.record})</div>
                  <div className="text-[10px] text-slate-400 mt-1">{act.date} at {act.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
