"use client"
import AppShell from '../components/AppShell'
import { Dashboard } from '../modules/dashboard'

export default function Home() {
  return (
    <AppShell activeTab="dashboard">
      <Dashboard />
    </AppShell>
  )
}
