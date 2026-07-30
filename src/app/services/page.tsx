"use client"
import AppShell from '../../components/AppShell'
import { Services } from '../../modules/services'

export default function ServicesPage() {
  return (
    <AppShell activeTab="services">
      <Services />
    </AppShell>
  )
}
