import React from 'react'
import { useAuthStore } from '../../auth/store'
import { useSettingsStore } from '../../settings/store'
import { useBillingStore } from '../store'
import { POSBillingContainer } from './pos/POSBillingContainer'

interface BillingProps {
  onSuccess: () => void
}

export default function Billing({ onSuccess }: BillingProps) {
  const profile = useSettingsStore((state) => state.profile)
  const currentUser = useAuthStore((state) => state.user)
  const createBill = useBillingStore((state) => state.createBill)

  return (
    <POSBillingContainer
      onSuccess={onSuccess}
      currentUser={currentUser}
      profile={profile}
      createBill={createBill}
    />
  )
}
