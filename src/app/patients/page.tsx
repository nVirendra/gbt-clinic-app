"use client"
import AppShell from '../../components/AppShell'
import { Patients } from '../../modules/patients'

export default function PatientsPage() {
  return (
    <AppShell activeTab="patients">
      <Patients />
    </AppShell>
  )
}
