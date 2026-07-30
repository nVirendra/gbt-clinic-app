"use client"
import AppShell from '../../components/AppShell'
import { Settings } from '../../modules/settings'

export default function SettingsPage() {
  return (
    <AppShell activeTab="settings">
      <Settings />
    </AppShell>
  )
}
