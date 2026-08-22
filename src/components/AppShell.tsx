"use client"
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Users,
  ReceiptText,
  Settings as SettingsIcon,
  TrendingUp,
  LayoutDashboard,
  Layers,
  LogOut,
  Building2,
  FileSpreadsheet,
  Package,
  History,
  AlertTriangle,
  X,
  ShieldAlert,
  Clock,
  PackageX,
  Wallet,
  ChevronRight
} from 'lucide-react'

import { useSettingsStore } from '../modules/settings'
import { Login, useAuthStore } from '../modules/auth'
import { useShellStore } from '../modules/shell'
import { useAlertsStore } from '../modules/alerts'
import { api, checkBackendHealth } from '../lib/api'

interface AppShellProps {
  children: React.ReactNode
  activeTab: string
}

export default function AppShell({ children, activeTab }: AppShellProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isApiConnected, setIsApiConnected] = useState<boolean>(false)
  const [showAdminMenu, setShowAdminMenu] = useState<boolean>(false)

  const user = useAuthStore((state) => state.user)
  const initializing = useAuthStore((state) => state.initializing)
  const checkAuth = useAuthStore((state) => state.checkAuth)
  const logout = useAuthStore((state) => state.logout)

  const profile = useSettingsStore((state) => state.profile)
  const fetchProfile = useSettingsStore((state) => state.fetchProfile)
  const setActiveTab = useShellStore((state) => state.setActiveTab)

  const [showAlertsModal, setShowAlertsModal] = useState(false)
  const expiredBatches = useAlertsStore((state) => state.expiredBatches)
  const nearExpiryBatches = useAlertsStore((state) => state.nearExpiryBatches)
  const lowStockItems = useAlertsStore((state) => state.lowStockItems)
  const patientDues = useAlertsStore((state) => state.patientDues)
  const fetchAlerts = useAlertsStore((state) => state.fetchAlerts)
  const totalAlertCount = expiredBatches.length + nearExpiryBatches.length + lowStockItems.length + patientDues.length

  // Bind api manager to window.api & check health & restore auth session
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.api = api
      checkBackendHealth().then((connected) => {
        setIsApiConnected(connected)
        fetchProfile()
      })
      checkAuth()
    }
  }, [])

  // Sync activeTab state with current pathname
  useEffect(() => {
    setActiveTab(activeTab)
  }, [activeTab, setActiveTab])

  // Load profile on start
  useEffect(() => {
    fetchProfile()
  }, [])

  // Critical alerts: fetch on login and refresh periodically
  useEffect(() => {
    if (!user) return
    fetchAlerts()
    const intervalId = setInterval(fetchAlerts, 3 * 60 * 1000)
    return () => clearInterval(intervalId)
  }, [user, fetchAlerts])

  // Session auto-lock
  useEffect(() => {
    if (!user || !profile?.autoLockMinutes) return

    const timeoutMs = profile.autoLockMinutes * 60 * 1000
    let timeoutId: NodeJS.Timeout

    const resetTimer = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        logout()
      }, timeoutMs)
    }

    const events = ['mousemove', 'keydown', 'click', 'scroll']
    events.forEach((event) => window.addEventListener(event, resetTimer))
    resetTimer()

    return () => {
      clearTimeout(timeoutId)
      events.forEach((event) => window.removeEventListener(event, resetTimer))
    }
  }, [user, profile, logout])

  // If session is restoring on page refresh, show loading indicator
  if (initializing) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-slate-100">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-9 w-9 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-400">Verifying session...</p>
        </div>
      </div>
    )
  }

  // If user is not logged in, render the login page
  if (!user) {
    return <Login />
  }

  // Primary daily routine sidebar navigation items
  const dailyMenuItems = [
    { id: 'dashboard', href: '/dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'patients', href: '/patients', name: 'Patients', icon: Users },
    { id: 'inventory', href: '/inventory', name: 'Inventory', icon: Package },
    { id: 'billing', href: '/billing', name: 'New Invoice', icon: ReceiptText }
  ]

  // Secondary management/admin items (moved to top header dropdown to simplify sidebar for daily staff)
  const adminMenuItems = [
    { id: 'invoices', href: '/invoices', name: 'Bills & Payments', icon: FileSpreadsheet },
    { id: 'reports', href: '/reports', name: 'Reports', icon: TrendingUp },
    ...(user.role === 'ADMIN' ? [{ id: 'audit-log', href: '/audit-log', name: 'Audit Log', icon: History }] : []),
    { id: 'settings', href: '/settings', name: 'Settings', icon: SettingsIcon }
  ]

  const allMenuItems = [...dailyMenuItems, ...adminMenuItems]

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F4F5F7] text-[#0B132B] font-sans selection:bg-cyan-500 selection:text-[#0B132B]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0B132B] text-slate-100 flex flex-col flex-shrink-0 border-r border-[#162244]">
        {/* Clinic Header */}
        <div className="h-16 flex items-center px-6 border-b border-[#162244] space-x-3">
          <Building2 className="h-6 w-6 text-cyan-500" />
          <div className="truncate font-bold text-lg text-white tracking-tight">
            {profile?.name || 'Clinic Manager'}
          </div>
        </div>

        {/* Navigation Items — DAILY ROUTINE ROUTER */}
        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
            Daily Routine
          </p>
          {dailyMenuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || activeTab === item.id
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-bold transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500 text-[#0B132B] shadow-md shadow-cyan-500/20 font-black'
                    : 'text-slate-300 hover:bg-[#162244] hover:text-cyan-500'
                }`}
              >
                <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-[#0B132B]' : 'text-slate-400 group-hover:text-cyan-500'}`} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Critical Alerts Trigger */}
        <div className="px-4 pb-3 flex-shrink-0">
          <button
            onClick={() => setShowAlertsModal(true)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-colors cursor-pointer border-2 ${
              totalAlertCount > 0
                ? 'bg-red-500/20 border-red-400 text-red-300 hover:bg-red-500/30 animate-alert-blink'
                : 'bg-[#162244]/50 border-[#1E2B4D] text-slate-400 hover:text-cyan-500'
            }`}
          >
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Critical Alerts
            </span>
            {totalAlertCount > 0 && (
              <span className="h-5 min-w-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-black flex items-center justify-center">
                {totalAlertCount}
              </span>
            )}
          </button>
        </div>

        {/* User profile footer */}
        <div className="p-4 border-t border-[#162244] flex items-center justify-between">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="h-8 w-8 rounded-full bg-cyan-500 text-[#0B132B] flex items-center justify-center text-sm font-extrabold uppercase flex-shrink-0">
              {user.username.slice(0, 2)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-200 truncate">{user.username}</p>
              <p className="text-xs text-cyan-500 capitalize truncate font-semibold">{user.role.toLowerCase()}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Logout"
            className="p-1.5 rounded-lg text-slate-400 hover:bg-[#162244] hover:text-cyan-500 transition-colors cursor-pointer"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F4F5F7]">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-8 flex-shrink-0 shadow-2xs">
          <h1 className="text-xl font-black text-[#0B132B] capitalize tracking-tight">
            {allMenuItems.find((item) => item.id === activeTab || item.href === pathname)?.name || activeTab}
          </h1>

          <div className="flex items-center space-x-4">
            {/* Top Bar Admin & Management Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAdminMenu((v) => !v)}
                className={`flex items-center gap-2 px-3.5 py-2 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  adminMenuItems.some((item) => pathname === item.href || activeTab === item.id)
                    ? 'bg-[#0B132B] text-cyan-400 border-[#162244] shadow-sm font-black'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <SettingsIcon className="w-4 h-4 text-cyan-600" />
                <span>Management & Admin</span>
              </button>

              {showAdminMenu && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowAdminMenu(false)} />
                  <div className="absolute right-0 top-full mt-2 w-60 bg-white border border-slate-200 rounded-2xl shadow-xl z-40 p-2 space-y-1 animate-fade-in">
                    <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Admin & System Tools
                      </p>
                    </div>
                    {adminMenuItems.map((item) => {
                      const Icon = item.icon
                      const isActive = pathname === item.href || activeTab === item.id
                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          onClick={() => setShowAdminMenu(false)}
                          className={`flex items-center px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                            isActive
                              ? 'bg-cyan-50 text-cyan-900 font-extrabold border border-cyan-200'
                              : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <Icon className="w-4 h-4 mr-2.5 text-cyan-600" />
                          {item.name}
                        </Link>
                      )
                    })}
                  </div>
                </>
              )}
            </div>

            {/* API Connection Status Badge */}
            <div className={`text-xs px-3.5 py-1.5 rounded-full font-bold flex items-center space-x-1.5 ${
              isApiConnected ? 'bg-cyan-50 text-cyan-800 border border-cyan-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}>
              <span className={`h-2 w-2 rounded-full ${isApiConnected ? 'bg-cyan-500 animate-pulse' : 'bg-amber-500'}`} />
              <span>{isApiConnected ? 'Backend API Connected (v1)' : 'Backend Offline / Disconnected'}</span>
            </div>
          </div>
        </header>

        {/* View container */}
        <div className="flex-1 overflow-y-auto p-8 bg-[#F4F5F7]">
          {children}
        </div>
      </main>

      {/* --- CRITICAL ALERTS MODAL --- */}
      {showAlertsModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-slate-100">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" /> Critical Alerts Center
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">{totalAlertCount} active</span>
              </h3>
              <button
                onClick={() => setShowAlertsModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {totalAlertCount === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-2">
                  <ShieldAlert className="w-10 h-10 text-slate-300" />
                  <p className="font-bold text-slate-600 text-sm">All Clear</p>
                  <p className="text-xs">No expired stock, low stock, or pending patient dues right now.</p>
                </div>
              ) : (
                <>
                  {/* Expired Stock */}
                  {expiredBatches.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-red-600 uppercase mb-2 flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4" /> Expired Stock ({expiredBatches.length})
                      </p>
                      <div className="border border-red-100 rounded-xl divide-y divide-red-50 overflow-hidden">
                        {expiredBatches.slice(0, 8).map((b) => (
                          <div key={b.id} className="flex items-center justify-between px-4 py-2.5 bg-red-50/40 text-sm">
                            <div>
                              <span className="font-semibold text-slate-900">{b.medicineName}</span>
                              <span className="ml-2 text-xs font-mono text-slate-500">Batch: {b.batchNo}</span>
                            </div>
                            <div className="text-xs font-bold text-red-600">
                              Expired {Math.abs(b.daysLeft)}d ago &middot; {b.qtyAvailable} units
                            </div>
                          </div>
                        ))}
                      </div>
                      {expiredBatches.length > 8 && (
                        <p className="text-xs text-slate-400 mt-1.5">+{expiredBatches.length - 8} more expired batches</p>
                      )}
                    </div>
                  )}

                  {/* Near Expiry */}
                  {nearExpiryBatches.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-amber-700 uppercase mb-2 flex items-center gap-1.5">
                        <Clock className="w-4 h-4" /> Expiring Within 30 Days ({nearExpiryBatches.length})
                      </p>
                      <div className="border border-amber-100 rounded-xl divide-y divide-amber-50 overflow-hidden">
                        {nearExpiryBatches.slice(0, 8).map((b) => (
                          <div key={b.id} className="flex items-center justify-between px-4 py-2.5 bg-amber-50/40 text-sm">
                            <div>
                              <span className="font-semibold text-slate-900">{b.medicineName}</span>
                              <span className="ml-2 text-xs font-mono text-slate-500">Batch: {b.batchNo}</span>
                            </div>
                            <div className="text-xs font-bold text-amber-700">
                              Expires in {b.daysLeft}d &middot; {b.qtyAvailable} units
                            </div>
                          </div>
                        ))}
                      </div>
                      {nearExpiryBatches.length > 8 && (
                        <p className="text-xs text-slate-400 mt-1.5">+{nearExpiryBatches.length - 8} more expiring soon</p>
                      )}
                    </div>
                  )}

                  {/* Low Stock */}
                  {lowStockItems.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-orange-700 uppercase mb-2 flex items-center gap-1.5">
                        <PackageX className="w-4 h-4" /> Low Stock ({lowStockItems.length})
                      </p>
                      <div className="border border-orange-100 rounded-xl divide-y divide-orange-50 overflow-hidden">
                        {lowStockItems.slice(0, 8).map((m) => (
                          <div key={m.id} className="flex items-center justify-between px-4 py-2.5 bg-orange-50/40 text-sm">
                            <span className="font-semibold text-slate-900">{m.name}</span>
                            <div className="text-xs font-bold text-orange-700">
                              {m.currentStock} available &middot; reorder at {m.reorderLevel}
                            </div>
                          </div>
                        ))}
                      </div>
                      {lowStockItems.length > 8 && (
                        <p className="text-xs text-slate-400 mt-1.5">+{lowStockItems.length - 8} more low stock items</p>
                      )}
                    </div>
                  )}

                  {/* Patient Dues */}
                  {patientDues.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-cyan-700 uppercase mb-2 flex items-center gap-1.5">
                        <Wallet className="w-4 h-4" /> Patient Dues ({patientDues.length})
                      </p>
                      <div className="border border-cyan-100 rounded-xl divide-y divide-cyan-50 overflow-hidden">
                        {patientDues.slice(0, 8).map((d) => (
                          <div key={d.id} className="flex items-center justify-between px-4 py-2.5 bg-cyan-50/40 text-sm">
                            <div>
                              <span className="font-semibold text-slate-900">{d.patientName}</span>
                              <span className="ml-2 text-xs font-mono text-slate-500">Inv #{d.billNo}</span>
                            </div>
                            <div className="text-xs font-bold text-cyan-700">₹{d.balanceDue.toFixed(2)} due</div>
                          </div>
                        ))}
                      </div>
                      {patientDues.length > 8 && (
                        <p className="text-xs text-slate-400 mt-1.5">+{patientDues.length - 8} more pending dues</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAlertsModal(false)
                  router.push('/inventory')
                }}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-650 hover:bg-slate-50 font-semibold cursor-pointer flex items-center gap-1"
              >
                Open Inventory <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowAlertsModal(false)}
                className="px-4 py-2 bg-[#0B132B] hover:bg-[#162244] text-cyan-500 font-bold rounded-xl text-sm transition cursor-pointer shadow-xs border border-cyan-500/40"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
