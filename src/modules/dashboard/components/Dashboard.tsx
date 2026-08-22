import React, { useEffect, useState } from 'react'
import { 
  Users, 
  IndianRupee, 
  AlertTriangle, 
  FileText, 
  UserPlus, 
  PlusCircle, 
  ChevronRight,
  PackageCheck,
  Calendar,
  Clock,
  TrendingUp,
  ShieldAlert,
  ArrowUpRight,
  Sparkles,
  Package,
  CreditCard,
  CheckCircle2,
  Layers,
  ShoppingBag,
  ExternalLink
} from 'lucide-react'
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  Cell 
} from 'recharts'
import { useDashboardStore, DateRangeOption } from '../store'
import { useSettingsStore } from '../../settings/store'
import { useShellStore } from '../../shell/store'

// Skeleton Loader Components
function KPICardSkeleton() {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm animate-pulse space-y-3">
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 bg-slate-100 rounded-xl"></div>
        <div className="w-12 h-4 bg-slate-100 rounded-md"></div>
      </div>
      <div className="space-y-1.5 pt-1">
        <div className="w-20 h-3 bg-slate-100 rounded"></div>
        <div className="w-28 h-6 bg-slate-200 rounded"></div>
      </div>
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm animate-pulse space-y-4">
      <div className="w-40 h-5 bg-slate-200 rounded"></div>
      <div className="space-y-3 pt-2">
        <div className="w-full h-10 bg-slate-100 rounded-xl"></div>
        <div className="w-full h-10 bg-slate-100 rounded-xl"></div>
        <div className="w-full h-10 bg-slate-100 rounded-xl"></div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const {
    dateRange,
    stats,
    outstandingBills,
    recentBills,
    recentPatients,
    recentPurchases,
    expiringBatches,
    lowStockList,
    patientCount,
    lowStockCount,
    expiringCount,
    revenueTrendData,
    categoryData,
    loading,
    setDateRange,
    loadDashboardData
  } = useDashboardStore()

  const profile = useSettingsStore((state) => state.profile)
  const setActiveTab = useShellStore((state) => state.setActiveTab)

  const [activeActionTab, setActiveActionTab] = useState<'dues' | 'stock' | 'expiring'>('dues')

  useEffect(() => {
    loadDashboardData()
  }, [])

  const totalRevenue = stats?.totalCollected || 0
  const paymentCount = stats?.paymentCount || 0
  const totalDuesAmount = outstandingBills.reduce((sum, b) => sum + (b?.balance_due ?? 0), 0)

  // Chart Palette Colors
  const BAR_COLORS = ['#00E5FF', '#0284c7', '#6366f1', '#8b5cf6', '#ec4899']

  return (
    <div className="space-y-6 animate-fade-in pb-12 text-slate-800">
      
      {/* HEADER BANNER & DATE RANGE SELECTOR */}
      <div className="bg-[#0B132B] rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[#162244]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">
              {profile?.name || 'Clinic Manager'} Dashboard
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase tracking-wider">
              Live Overview
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Real-time operational signals, inventory warnings, and daily financials.
          </p>
        </div>

        {/* Global Date-Range Pill Selector & Quick Launcher */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-[#162244]/90 p-1 rounded-xl border border-[#1E2B4D] flex items-center gap-1 text-xs">
            {(['today', 'week', 'month', 'all'] as DateRangeOption[]).map((option) => (
              <button
                key={option}
                onClick={() => setDateRange(option)}
                className={`px-3 py-1.5 rounded-lg font-bold capitalize transition-all cursor-pointer ${
                  dateRange === option
                    ? 'bg-cyan-500 text-[#0B132B] shadow-md shadow-cyan-500/20 font-extrabold'
                    : 'text-slate-400 hover:text-white hover:bg-[#0B132B]/50'
                }`}
              >
                {option === 'today' ? 'Today' : option === 'week' ? '7 Days' : option === 'month' ? '30 Days' : 'All Time'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('billing')}
              className="flex items-center bg-cyan-500 hover:bg-cyan-400 text-[#0B132B] font-extrabold px-3.5 py-2 rounded-xl text-xs transition shadow-md shadow-cyan-500/10 cursor-pointer"
            >
              <PlusCircle className="h-4 w-4 mr-1.5" />
              New Bill
            </button>
            <button
              onClick={() => setActiveTab('patients')}
              className="flex items-center bg-[#162244] hover:bg-[#1E2B4D] text-cyan-400 font-bold border border-[#1E2B4D] px-3.5 py-2 rounded-xl text-xs transition cursor-pointer"
            >
              <UserPlus className="h-4 w-4 mr-1.5" />
              Add Patient
            </button>
          </div>
        </div>
      </div>

      {/* TOP 6 INTERACTIVE KPI DRILL-DOWN LAUNCHPAD CARDS */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <KPICardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          
          {/* Card 1: Today's Revenue */}
          <div
            onClick={() => setActiveTab('invoices')}
            className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-cyan-400 transition-all group cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <IndianRupee className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-cyan-600 transition-colors" />
            </div>
            <div className="mt-3">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {dateRange === 'today' ? "Today's Revenue" : 'Period Revenue'}
              </p>
              <h3 className="text-xl font-extrabold text-slate-900 font-mono mt-0.5">
                ₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-[10px] text-cyan-600 font-semibold mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> {paymentCount} payments logged
              </p>
            </div>
          </div>

          {/* Card 2: Period Invoices */}
          <div
            onClick={() => setActiveTab('billing')}
            className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-400 transition-all group cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
            </div>
            <div className="mt-3">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Invoices Generated</p>
              <h3 className="text-xl font-extrabold text-slate-900 font-mono mt-0.5">
                {recentBills.length}
              </h3>
              <p className="text-[10px] text-slate-500 font-medium mt-1">
                Click to open billing
              </p>
            </div>
          </div>

          {/* Card 3: Registered Patients */}
          <div
            onClick={() => setActiveTab('patients')}
            className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-cyan-400 transition-all group cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-cyan-600 transition-colors" />
            </div>
            <div className="mt-3">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Registered Patients</p>
              <h3 className="text-xl font-extrabold text-slate-900 font-mono mt-0.5">
                {patientCount}
              </h3>
              <p className="text-[10px] text-cyan-600 font-semibold mt-1">
                Active directory
              </p>
            </div>
          </div>

          {/* Card 4: Outstanding Dues */}
          <div
            onClick={() => setActiveTab('invoices')}
            className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-amber-400 transition-all group cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-amber-600 transition-colors" />
            </div>
            <div className="mt-3">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Outstanding Dues</p>
              <h3 className="text-xl font-extrabold text-slate-900 font-mono mt-0.5">
                ₹{totalDuesAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-[10px] text-amber-700 font-bold mt-1">
                {outstandingBills.length} unpaid invoices
              </p>
            </div>
          </div>

          {/* Card 5: Low Stock Items */}
          <div
            onClick={() => setActiveTab('inventory')}
            className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-rose-400 transition-all group cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <PackageCheck className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-rose-600 transition-colors" />
            </div>
            <div className="mt-3">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Low Stock Items</p>
              <h3 className="text-xl font-extrabold text-slate-900 font-mono mt-0.5">
                {lowStockCount}
              </h3>
              <p className={`text-[10px] font-bold mt-1 ${lowStockCount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                {lowStockCount > 0 ? 'Action required' : 'Stock healthy'}
              </p>
            </div>
          </div>

          {/* Card 6: Expiring Batches */}
          <div
            onClick={() => setActiveTab('inventory')}
            className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-purple-400 transition-all group cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-purple-600 transition-colors" />
            </div>
            <div className="mt-3">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Expiring Batches</p>
              <h3 className="text-xl font-extrabold text-slate-900 font-mono mt-0.5">
                {expiringCount}
              </h3>
              <p className={`text-[10px] font-bold mt-1 ${expiringCount > 0 ? 'text-purple-600' : 'text-slate-400'}`}>
                {expiringCount > 0 ? 'Within 60 days' : 'No near expiries'}
              </p>
            </div>
          </div>

        </div>
      )}



      {/* ACTION-NEEDED ZONE & LIGHTWEIGHT CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT 7 COLS: ACTION-NEEDED ZONE */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col">
          <div className="p-4 bg-[#0B132B] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#162244]">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-sm">Action-Needed Operational Zone</h3>
            </div>

            {/* Action Zone Sub-Tabs */}
            <div className="flex items-center gap-1 bg-[#162244]/90 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setActiveActionTab('dues')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeActionTab === 'dues'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Overdue Dues ({outstandingBills.length})
              </button>
              <button
                onClick={() => setActiveActionTab('stock')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeActionTab === 'stock'
                    ? 'bg-rose-500 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Low Stock ({lowStockList.length})
              </button>
              <button
                onClick={() => setActiveActionTab('expiring')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  activeActionTab === 'expiring'
                    ? 'bg-purple-500 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Expiring ({expiringBatches.length})
              </button>
            </div>
          </div>

          <div className="p-4 flex-1">
            
            {/* OVERDUE DUES LIST */}
            {activeActionTab === 'dues' && (
              <div className="space-y-3">
                {outstandingBills.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-cyan-500 mx-auto" />
                    <p className="font-bold text-slate-800 text-sm">No overdue payments — all clear! 🎉</p>
                    <p className="text-xs text-slate-400">All customer invoices have been settled in full.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {outstandingBills.map((bill, idx) => (
                      <div key={bill?.id || idx} className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/60 px-2 rounded-xl transition">
                        <div>
                          <p className="font-bold text-slate-900 text-sm">
                            {bill.patient?.full_name || bill.walkin_name || 'Walk-in Patient'}
                          </p>
                          <p className="text-xs text-slate-400 font-mono">
                            Bill #{bill.bill_no} • {bill.bill_date}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-extrabold text-amber-700 font-mono text-sm">
                              ₹{(bill?.balance_due ?? 0).toFixed(2)}
                            </p>
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded uppercase">
                              {(bill?.amount_paid ?? 0) > 0 ? 'PARTIAL' : 'UNPAID'}
                            </span>
                          </div>
                          <button
                            onClick={() => setActiveTab('invoices')}
                            className="px-3 py-1.5 bg-[#0B132B] hover:bg-[#162244] text-cyan-400 font-bold rounded-xl text-xs cursor-pointer transition shadow-2xs border border-[#162244]"
                          >
                            Collect
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* LOW STOCK LIST */}
            {activeActionTab === 'stock' && (
              <div className="space-y-3">
                {lowStockList.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-cyan-500 mx-auto" />
                    <p className="font-bold text-slate-800 text-sm">Inventory Stock Healthy! 📦</p>
                    <p className="text-xs text-slate-400">All medicine batches are above reorder thresholds.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {lowStockList.map((item) => (
                      <div key={item.id} className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/60 px-2 rounded-xl transition">
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{item.name}</p>
                          <p className="text-xs text-slate-500">
                            Reorder Level: <strong className="font-mono">{item.reorderLevel} units</strong>
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-extrabold font-mono">
                            {item.currentStock} in stock
                          </span>
                          <button
                            onClick={() => setActiveTab('inventory')}
                            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-2xs"
                          >
                            + Purchase Stock
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* EXPIRING BATCHES LIST */}
            {activeActionTab === 'expiring' && (
              <div className="space-y-3">
                {expiringBatches.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-purple-500 mx-auto" />
                    <p className="font-bold text-slate-800 text-sm">No Near Expiries Detected! 💊</p>
                    <p className="text-xs text-slate-400">No active stock batches expiring within the next 60 days.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {expiringBatches.map((b) => (
                      <div key={b.id} className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/60 px-2 rounded-xl transition">
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{b.medicineName}</p>
                          <p className="text-xs text-slate-400 font-mono">
                            Batch: {b.batchNo} • Expiry: {b.expiryDate}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold font-mono border ${
                            b.daysLeft <= 0 
                              ? 'bg-red-100 text-red-800 border-red-200' 
                              : 'bg-purple-50 text-purple-800 border-purple-200'
                          }`}>
                            {b.daysLeft <= 0 ? 'EXPIRED' : `${b.daysLeft} days left`} ({b.qtyAvailable} qty)
                          </span>
                          <button
                            onClick={() => setActiveTab('inventory')}
                            className="px-3 py-1.5 bg-[#0B132B] hover:bg-[#162244] text-cyan-400 font-bold rounded-xl text-xs cursor-pointer transition shadow-2xs border border-[#162244]"
                          >
                            View Stock
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* RIGHT 5 COLS: LIGHTWEIGHT RECHARTS TREND ANALYTICS */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Revenue & Invoices Trend Area Chart */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-600" /> Revenue & Invoices Trend
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">
                {dateRange === 'month' ? '14 Days' : '7 Days'}
              </span>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#00E5FF" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                    formatter={(val: any) => [`₹${val}`, 'Revenue']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#00E5FF" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Revenue Category Breakdown Bar Chart */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-600" /> Revenue Category Split
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Revenue Distribution</span>
            </div>

            <div className="h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                    formatter={(val: any) => [`₹${val}`, 'Revenue']}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </div>

      {/* RECENT ACTIVITY STREAM (Recent Invoices, Purchases, Patients) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Recent Invoices Feed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-600" /> Recent Billing Invoices
              </h4>
              <button onClick={() => setActiveTab('invoices')} className="text-xs text-cyan-600 hover:text-cyan-700 font-bold cursor-pointer">
                View All
              </button>
            </div>

            <div className="divide-y divide-slate-100 text-xs mt-2">
              {recentBills.slice(0, 4).map((b, idx) => (
                <div key={b?.id || idx} className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">{b.patient?.full_name || b.walkin_name || 'Walk-in'}</p>
                    <p className="text-[10px] text-slate-400 font-mono">#{b.bill_no}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold font-mono text-slate-900">₹{(b.grand_total || 0).toFixed(2)}</p>
                    <span className="text-[9px] font-bold text-cyan-700 uppercase bg-cyan-50 px-1.5 py-0.5 rounded">
                      {b.status}
                    </span>
                  </div>
                </div>
              ))}
              {recentBills.length === 0 && (
                <p className="py-6 text-center text-slate-400 text-xs">No recent invoices logged.</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Stock Purchases Feed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-indigo-600" /> Recent Stock Purchases
              </h4>
              <button onClick={() => setActiveTab('inventory')} className="text-xs text-cyan-600 hover:text-cyan-700 font-bold cursor-pointer">
                View Stock
              </button>
            </div>

            <div className="divide-y divide-slate-100 text-xs mt-2">
              {recentPurchases.slice(0, 4).map((p, idx) => (
                <div key={p?.id || idx} className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">{p.vendor?.name || 'Pharmacy Vendor'}</p>
                    <p className="text-[10px] text-slate-400 font-mono">Inv #{p.purchase_invoice_no}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold font-mono text-slate-900">₹{(p.total_amount || 0).toFixed(2)}</p>
                    <span className="text-[9px] font-bold text-indigo-700 uppercase bg-indigo-50 px-1.5 py-0.5 rounded">
                      Purchase
                    </span>
                  </div>
                </div>
              ))}
              {recentPurchases.length === 0 && (
                <p className="py-6 text-center text-slate-400 text-xs">No recent stock purchases.</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Registered Patients Feed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-600" /> Registered Patients
              </h4>
              <button onClick={() => setActiveTab('patients')} className="text-xs text-cyan-600 hover:text-cyan-700 font-bold cursor-pointer">
                Directory
              </button>
            </div>

            <div className="divide-y divide-slate-100 text-xs mt-2">
              {recentPatients.slice(0, 4).map((pt, idx) => (
                <div key={pt?.id || idx} className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">{pt.full_name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{pt.patient_code} • {pt.phone}</p>
                  </div>
                  <span className="text-[9px] font-bold text-cyan-700 uppercase bg-cyan-50 px-1.5 py-0.5 rounded">
                    Patient
                  </span>
                </div>
              ))}
              {recentPatients.length === 0 && (
                <p className="py-6 text-center text-slate-400 text-xs">No recent patient registrations.</p>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  )
}
