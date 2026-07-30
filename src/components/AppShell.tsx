"use client"
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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

import { useSettingsStore } from '../modules/settings'
import { Login, useAuthStore } from '../modules/auth'
import { useShellStore } from '../modules/shell'
import { api, checkBackendHealth } from '../lib/api'

interface AppShellProps {
  children: React.ReactNode
  activeTab: string
}

export default function AppShell({ children, activeTab }: AppShellProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isApiConnected, setIsApiConnected] = useState<boolean>(false)

  const user = useAuthStore((state) => state.user)
  const initializing = useAuthStore((state) => state.initializing)
  const checkAuth = useAuthStore((state) => state.checkAuth)
  const logout = useAuthStore((state) => state.logout)

  const profile = useSettingsStore((state) => state.profile)
  const fetchProfile = useSettingsStore((state) => state.fetchProfile)
  const setActiveTab = useShellStore((state) => state.setActiveTab)

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
    { id: 'dashboard', href: '/dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'patients', href: '/patients', name: 'Patients', icon: Users },
    { id: 'inventory', href: '/inventory', name: 'Inventory', icon: Package },
    { id: 'billing', href: '/billing', name: 'New Invoice', icon: Receipt },
    { id: 'invoices', href: '/invoices', name: 'Bills & Payments', icon: FileSpreadsheet },
    { id: 'services', href: '/services', name: 'Price List', icon: Layers },
    { id: 'reports', href: '/reports', name: 'Reports', icon: TrendingUp },
    ...(user.role === 'ADMIN' ? [{ id: 'audit-log', href: '/audit-log', name: 'Audit Log', icon: History }] : []),
    { id: 'settings', href: '/settings', name: 'Settings', icon: SettingsIcon }
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
            const isActive = pathname === item.href || activeTab === item.id
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-teal-500 text-white shadow-md shadow-teal-500/10'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                {item.name}
              </Link>
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
              <p className="text-xs text-slate-500 capitalize truncate">{user.role.toLowerCase()}</p>
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
            {menuItems.find((item) => item.id === activeTab || item.href === pathname)?.name || activeTab}
          </h1>
          <div className="flex items-center space-x-4">
            <div className={`text-xs px-3 py-1.5 rounded-full font-medium flex items-center space-x-1.5 ${
              isApiConnected ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              <span className={`h-2 w-2 rounded-full ${isApiConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span>{isApiConnected ? 'Backend API Connected (v1)' : 'Backend Offline / Disconnected'}</span>
            </div>
          </div>
        </header>

        {/* View container */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
          {children}
        </div>
      </main>
    </div>
  )
}
