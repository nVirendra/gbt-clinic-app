"use client"
import { useRouter } from 'next/navigation'
import AppShell from '../../components/AppShell'
import { Billing } from '../../modules/billing'

export default function BillingPage() {
  const router = useRouter()
  return (
    <AppShell activeTab="billing">
      <Billing onSuccess={() => router.push('/invoices')} />
    </AppShell>
  )
}
