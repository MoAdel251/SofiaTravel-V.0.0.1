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
  ArrowUpRight,
  Trash2,
  Database
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
import { formatCurrency } from '../utils/currency';
import { useLanguage } from '../context/LanguageContext';

interface DashboardViewProps {
  stats: any;
  currentCurrency: string;
  isAdmin?: boolean;
  onOpenAdminReset?: () => void;
  dbConnected?: boolean;
  onVerifyDb?: () => void;
}

export function DashboardView({
  stats,
  currentCurrency = 'EGP',
  isAdmin = false,
  onOpenAdminReset,
  dbConnected = true,
  onVerifyDb,
}: DashboardViewProps) {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  if (!stats) {
    return (
      <div className="p-6 sm:p-8 text-center text-slate-500">
        {isAr ? 'جاري تحميل تحليلات لوحة التحكم...' : 'Loading dashboard analytics...'}
      </div>
    );
  }

  const monthlyData = stats.monthlyData || [];
  const activeCurrency = currentCurrency || 'EGP';

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 bg-slate-50 min-h-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            {isAr ? 'لوحة التحكم' : 'Dashboard'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            {isAr
              ? `نظرة عامة فورية على العمليات السياحية والأداء المالي (${activeCurrency})`
              : `Real-time tourism operations overview and financial intelligence (${activeCurrency}).`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={onVerifyDb}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border shadow-2xs transition-colors cursor-pointer min-h-[40px] ${
              dbConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
            }`}
            title={isAr ? 'التحقق من اتصال قاعدة البيانات السحابية' : 'Verify Cloud Firestore connection'}
          >
            <Database className="w-3.5 h-3.5 shrink-0" />
            <span className={`w-2 h-2 rounded-full ${dbConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span>
              {dbConnected
                ? (isAr ? `قاعدة البيانات متصلة (${activeCurrency})` : `Cloud DB Live (${activeCurrency})`)
                : (isAr ? 'الوضع المحلي المؤقت' : 'Offline Cache')}
            </span>
          </button>

          {isAdmin && onOpenAdminReset && (
            <button
              type="button"
              onClick={onOpenAdminReset}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all cursor-pointer min-h-[40px]"
              title={isAr ? 'حذف جميع البيانات الحالية وإعادة ضبط الموقع (للمسؤول فقط)' : 'Delete all existing data to republish clean (Administrator Only)'}
            >
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
              <span>{isAr ? 'حذف جميع البيانات' : 'Delete All Data'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Bento Grid Top Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
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

        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
              <BookmarkCheck className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-blue-500">{stats.active_reservations} Active</span>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-bold text-slate-900">{stats.active_reservations}</div>
            <div className="text-xs text-slate-400 mt-1 font-medium">Total Reservations</div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-orange-50 text-orange-600 rounded-2xl">
              <Plane className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-orange-500">Next 30 Days</span>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-bold text-slate-900">{stats.upcoming_trips}</div>
            <div className="text-xs text-slate-400 mt-1 font-medium">Upcoming Trips</div>
          </div>
        </div>

        <div className="bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl text-white flex flex-col justify-between overflow-hidden relative shadow-md">
          <div className="relative z-10 flex items-center justify-between">
            <span className="text-[11px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">Net Profit</span>
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="relative z-10 mt-4">
            <div className="text-lg sm:text-2xl font-black text-emerald-400 truncate">
              {formatCurrency(stats.net_profit, activeCurrency)}
            </div>
            <div className="text-[11px] sm:text-xs text-slate-300 mt-1 font-medium truncate">
              Sales: {formatCurrency(stats.total_sales, activeCurrency)}
            </div>
          </div>
          <div className="absolute -right-4 -top-4 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl"></div>
        </div>
      </div>

      {/* Financial & Alerts Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Amounts Owed to Company</h4>
                <p className="text-xs text-slate-400 mt-0.5">Unpaid customer accounts in primary currency</p>
              </div>
            </div>
            <span className="text-xl font-black text-amber-600">
              {formatCurrency(stats.outstanding_customer_payments, activeCurrency)}
            </span>
          </div>
          {stats.outstanding_by_currency && Object.keys(stats.outstanding_by_currency).length > 0 ? (
            <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2">
              {Object.entries(stats.outstanding_by_currency).map(([curr, amt]) => (
                <div key={curr} className="bg-amber-50 border border-amber-200/80 rounded-xl px-3 py-1.5 flex items-center gap-2">
                  <span className="text-[10px] font-extrabold text-amber-800 uppercase">{curr}</span>
                  <span className="text-xs font-bold text-slate-900">{formatCurrency(Number(amt), curr)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-100 text-xs text-slate-400">
              No outstanding balances owed by customers.
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Outstanding Supplier Balances</h4>
              <p className="text-xs text-slate-400 mt-0.5">Amounts owed to airlines, hotels & operators</p>
            </div>
          </div>
          <span className="text-xl font-black text-rose-600">
            {formatCurrency(stats.outstanding_supplier_payments, activeCurrency)}
          </span>
        </div>
      </div>

      {/* Analytics Charts & Bento Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Forecast (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-xs p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900">Monthly Revenue & Profit Forecast ({activeCurrency})</h3>
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

        {/* Destination Popularity & Agent (1 col) */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between">
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
              {stats.topAgent?.name || 'No data'} {stats.topAgent?.sales ? `(${formatCurrency(stats.topAgent.sales, activeCurrency)})` : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Reservations (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
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
                    <td className="py-3.5 font-bold text-blue-600">{formatCurrency(res.selling_price, activeCurrency)}</td>
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
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 flex flex-col">
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
