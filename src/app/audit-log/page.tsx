"use client"
import AppShell from '../../components/AppShell'
import { AuditLog } from '../../modules/settings'

export default function AuditLogPage() {
  return (
    <AppShell activeTab="audit-log">
      <AuditLog />
    </AppShell>
  )
}
