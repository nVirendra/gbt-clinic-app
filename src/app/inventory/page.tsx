"use client"
import AppShell from '../../components/AppShell'
import { Inventory } from '../../modules/inventory'

export default function InventoryPage() {
  return (
    <AppShell activeTab="inventory">
      <Inventory />
    </AppShell>
  )
}
