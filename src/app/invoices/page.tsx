"use client"
import AppShell from '../../components/AppShell'
import { Invoices } from '../../modules/billing'

export default function InvoicesPage() {
  return (
    <AppShell activeTab="invoices">
      <Invoices />
    </AppShell>
  )
}
