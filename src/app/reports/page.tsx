"use client"
import AppShell from '../../components/AppShell'
import { Reports } from '../../modules/reports'

export default function ReportsPage() {
  return (
    <AppShell activeTab="reports">
      <Reports />
    </AppShell>
  )
}
