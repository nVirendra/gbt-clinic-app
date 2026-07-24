"use client"
import React, { useEffect } from 'react'
import { 
  Users, 
  Receipt, 
  Settings as SettingsIcon, 
  TrendingUp, 
  LayoutDashboard, 
  Layers, 
  LogOut, 
  Building2,
  FileSpreadsheet,
  Package,
  History
} from 'lucide-react'

// Import Modular Monolith views and stores
import { Dashboard } from '../modules/dashboard'
import { Patients } from '../modules/patients'
import { Inventory } from '../modules/inventory'
import { Billing, Invoices } from '../modules/billing'
import { Services } from '../modules/services'
import { Reports } from '../modules/reports'
import { Settings, AuditLog, useSettingsStore } from '../modules/settings'
import { Login, useAuthStore } from '../modules/auth'
import { useShellStore } from '../modules/shell'
import PrintInvoice from '../components/PrintInvoice'

import { useState } from 'react'
import { api, checkBackendHealth, isUsingRealApi } from '../lib/api'

export default function Home() {
  const [isApiConnected, setIsApiConnected] = useState<boolean>(false)

  const user = useAuthStore((state) => state.user)
  const initializing = useAuthStore((state) => state.initializing)
  const checkAuth = useAuthStore((state) => state.checkAuth)
  const setUser = useAuthStore((state) => state.setUser)
  const logout = useAuthStore((state) => state.logout)

  const profile = useSettingsStore((state) => state.profile)
  const fetchProfile = useSettingsStore((state) => state.fetchProfile)

  const activeTab = useShellStore((state) => state.activeTab)
  const setActiveTab = useShellStore((state) => state.setActiveTab)
  const currentHash = useShellStore((state) => state.currentHash)
  const setCurrentHash = useShellStore((state) => state.setCurrentHash)

  // Bind api manager to window.api client-side & check health & restore auth session
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.api = api
      setCurrentHash(window.location.hash)

      checkBackendHealth().then((connected) => {
        setIsApiConnected(connected)
        fetchProfile()
      })
      checkAuth()
    }
  }, [])

  // Listen to hash changes for print views
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash)
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // Load profile on start
  useEffect(() => {
    fetchProfile()
  }, [])

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
    
    resetTimer() // Initialize timer

    return () => {
      clearTimeout(timeoutId)
      events.forEach((event) => window.removeEventListener(event, resetTimer))
    }
  }, [user, profile])

  // If the hash is a print path (e.g. #/print/INV-10001), render ONLY the print invoice view
  if (currentHash.startsWith('#/print/')) {
    const billId = currentHash.replace('#/print/', '')
    return <PrintInvoice billId={billId} />
  }

  // If session is restoring on page refresh, show loading indicator
  if (initializing) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-slate-100">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-9 w-9 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-400">Verifying session...</p>
        </div>
      </div>
    )
  }

  // If user is not logged in, render the login page
  if (!user) {
    return <Login />
  }

  // Sidebar navigation items
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'patients', name: 'Patients', icon: Users },
    { id: 'inventory', name: 'Inventory', icon: Package },
    { id: 'billing', name: 'New Invoice', icon: Receipt },
    { id: 'invoices', name: 'Bills & Payments', icon: FileSpreadsheet },
    { id: 'services', name: 'Price List', icon: Layers },
    { id: 'reports', name: 'Reports', icon: TrendingUp },
    ...(user.role === 'ADMIN' ? [{ id: 'audit-log', name: 'Audit Log', icon: History }] : []),
    { id: 'settings', name: 'Settings', icon: SettingsIcon }
  ]

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-800">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col flex-shrink-0">
        {/* Clinic Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800 space-x-3">
          <Building2 className="h-6 w-6 text-teal-400" />
          <div className="truncate font-semibold text-lg text-slate-50 tracking-tight">
            {profile?.name || 'Clinic Manager'}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-teal-500 text-white shadow-md shadow-teal-500/10'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                {item.name}
              </button>
            )
          })}
        </nav>

        {/* User profile footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="h-8 w-8 rounded-full bg-teal-500 flex items-center justify-center text-sm font-bold text-white uppercase flex-shrink-0">
              {user.username.slice(0, 2)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-slate-200 truncate">{user.username}</p>
              <p className="text-xs text-slate-505 capitalize truncate">{user.role.toLowerCase()}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Logout"
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 flex-shrink-0">
          <h1 className="text-xl font-semibold text-slate-900 capitalize">
            {menuItems.find((item) => item.id === activeTab)?.name || activeTab}
          </h1>
          <div className="flex items-center space-x-4">
            <div className={`text-xs px-3 py-1.5 rounded-full font-medium flex items-center space-x-1.5 ${
              isApiConnected ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              <span className={`h-2 w-2 rounded-full ${isApiConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span>{isApiConnected ? 'Backend API Connected (v1)' : 'Offline / Mock API Mode'}</span>
            </div>
          </div>
        </header>

        {/* View container */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'patients' && <Patients />}
          {activeTab === 'inventory' && <Inventory />}
          {activeTab === 'billing' && (
            <Billing 
              onSuccess={() => setActiveTab('invoices')} 
            />
          )}
          {activeTab === 'invoices' && <Invoices />}
          {activeTab === 'services' && <Services />}
          {activeTab === 'reports' && <Reports />}
          {activeTab === 'audit-log' && <AuditLog />}
          {activeTab === 'settings' && <Settings />}
        </div>
      </main>
    </div>
  )
}
