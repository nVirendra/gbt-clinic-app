import React, { useEffect } from 'react'
import { 
  Users, 
  IndianRupee, 
  AlertTriangle, 
  FileText, 
  UserPlus, 
  PlusCircle, 
  ChevronRight,
  PackageCheck
} from 'lucide-react'
import { useDashboardStore } from '../store'
import { useSettingsStore } from '../../settings/store'
import { useShellStore } from '../../shell/store'

export default function Dashboard() {
  const stats = useDashboardStore((state) => state.stats)
  const outstandingBills = useDashboardStore((state) => state.outstandingBills)
  const recentBills = useDashboardStore((state) => state.recentBills)
  const patientCount = useDashboardStore((state) => state.patientCount)
  const lowStockCount = useDashboardStore((state) => state.lowStockCount)
  const loading = useDashboardStore((state) => state.loading)
  const loadDashboardData = useDashboardStore((state) => state.loadDashboardData)

  const profile = useSettingsStore((state) => state.profile)
  const setActiveTab = useShellStore((state) => state.setActiveTab)

  useEffect(() => {
    loadDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-700 rounded-2xl p-6 text-white shadow-xl shadow-teal-600/10 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Welcome back to {profile?.name || 'Clinic Manager'}</h2>
          <p className="text-teal-100/90 text-sm mt-1">Here is a quick overview of today's activities and records.</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setActiveTab('patients')}
            className="flex items-center bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2 rounded-xl text-sm font-medium transition cursor-pointer"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Patient
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className="flex items-center bg-white text-teal-700 hover:bg-teal-50 px-4 py-2 rounded-xl text-sm font-medium transition shadow-sm cursor-pointer"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            New Bill
          </button>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Today's Collection Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 flex items-center space-x-4 hover:shadow-md transition">
          <div className="h-12 w-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
            <IndianRupee className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Collection</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-0.5 font-mono">
              ₹{(stats?.totalCollected || 0).toFixed(2)}
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">{stats?.paymentCount || 0} payments logged</p>
          </div>
        </div>

        {/* Outstanding Dues Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 flex items-center space-x-4 hover:shadow-md transition">
          <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Outstanding Dues</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-0.5 font-mono">
              ₹{(outstandingBills.reduce((sum, b) => sum + (b?.balance_due ?? 0), 0) || 0).toFixed(2)}
            </h3>
            <p className="text-[10px] text-amber-600 font-medium mt-0.5">Pending collection dues</p>
          </div>
        </div>

        {/* Total Patients Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 flex items-center space-x-4 hover:shadow-md transition">
          <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Patients</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{patientCount}</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Registered patients</p>
          </div>
        </div>

        {/* Low Stock Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 flex items-center space-x-4 hover:shadow-md transition">
          <div className="h-12 w-12 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600">
            <PackageCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Low Stock Items</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{lowStockCount}</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Medicines below reorder level</p>
          </div>
        </div>
      </div>

      {/* Tables section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Outstanding Dues */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-slate-800 flex items-center">
              <AlertTriangle className="h-4.5 w-4.5 text-amber-500 mr-2" />
              Recent Outstanding Dues
            </h3>
            <button 
              onClick={() => setActiveTab('reports')} 
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center transition cursor-pointer"
            >
              View All Dues <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-x-auto">
            {outstandingBills.length === 0 ? (
              <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-slate-400 text-sm">
                No outstanding dues found! All bills are settled.
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-100/50 border-b border-slate-100 text-slate-500 font-semibold">
                    <th className="px-6 py-3">Patient</th>
                    <th className="px-6 py-3">Invoice No</th>
                    <th className="px-6 py-3 text-right">Balance Due</th>
                    <th className="px-6 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {outstandingBills.map((bill, idx) => (
                    <tr key={bill?.id || bill?.bill_no || `outstanding-${idx}`} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4.5 font-semibold text-slate-800">
                        {bill.patient?.full_name || bill.walkin_name}
                      </td>
                      <td className="px-6 py-4.5 font-mono text-xs">{bill.bill_no}</td>
                      <td className="px-6 py-4.5 text-right font-bold text-red-650 font-mono">
                        ₹{(bill?.balance_due ?? 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4.5 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          (bill?.amount_paid ?? 0) > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {(bill?.amount_paid ?? 0) > 0 ? 'PARTIAL' : 'UNPAID'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-slate-800 flex items-center">
              <FileText className="h-4.5 w-4.5 text-teal-500 mr-2" />
              Recent Invoices
            </h3>
            <button 
              onClick={() => setActiveTab('invoices')} 
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center transition cursor-pointer"
            >
              View All Bills <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-x-auto">
            {recentBills.length === 0 ? (
              <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-slate-400 text-sm">
                No invoices created yet. Start by generating one.
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-100/50 border-b border-slate-100 text-slate-500 font-semibold">
                    <th className="px-6 py-3">Patient</th>
                    <th className="px-6 py-3">Invoice No</th>
                    <th className="px-6 py-3 text-right">Total</th>
                    <th className="px-6 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-655">
                  {recentBills.map((bill, idx) => (
                    <tr key={bill?.id || bill?.bill_no || `recent-${idx}`} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4.5 font-semibold text-slate-800">
                        {bill.patient?.full_name || bill.walkin_name}
                      </td>
                      <td className="px-6 py-4.5 font-mono text-xs">{bill.bill_no}</td>
                      <td className="px-6 py-4.5 text-right font-bold text-slate-900 font-mono">
                        ₹{(bill?.grand_total ?? 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4.5 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          bill.status === 'CANCELLED'
                            ? 'bg-red-150 text-red-800 border border-red-200'
                            : bill.status === 'DRAFT'
                            ? 'bg-slate-100 text-slate-700 border border-slate-200'
                            : (bill?.balance_due ?? 0) === 0
                            ? 'bg-teal-50 text-teal-700 border border-teal-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {bill.status === 'FINALIZED' && (bill?.balance_due ?? 0) === 0 ? 'PAID' : bill.status === 'FINALIZED' && (bill?.balance_due ?? 0) > 0 ? 'PARTIAL' : bill.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
