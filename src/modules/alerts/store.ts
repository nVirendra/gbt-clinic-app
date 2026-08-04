import { create } from 'zustand'

export interface ExpiryAlertItem {
  id: string
  medicineName: string
  batchNo: string
  expiryDate: string
  qtyAvailable: number
  daysLeft: number
}

export interface LowStockAlertItem {
  id: string
  name: string
  currentStock: number
  reorderLevel: number
}

export interface PatientDueAlertItem {
  id: string
  billNo: string
  patientName: string
  balanceDue: number
  billDate: string
}

interface AlertsState {
  expiredBatches: ExpiryAlertItem[]
  nearExpiryBatches: ExpiryAlertItem[]
  lowStockItems: LowStockAlertItem[]
  patientDues: PatientDueAlertItem[]
  loading: boolean
  fetchAlerts: () => Promise<void>
}

export const useAlertsStore = create<AlertsState>((set) => ({
  expiredBatches: [],
  nearExpiryBatches: [],
  lowStockItems: [],
  patientDues: [],
  loading: false,

  fetchAlerts: async () => {
    set({ loading: true })
    try {
      const [meds, dues] = await Promise.all([
        window.api.getMedicines(),
        window.api.getOutstandingDues()
      ])

      const todayMs = new Date().setHours(0, 0, 0, 0)
      const expired: ExpiryAlertItem[] = []
      const nearExpiry: ExpiryAlertItem[] = []
      const lowStock: LowStockAlertItem[] = []

      meds.forEach((m) => {
        const currentStock = m.batches?.reduce((sum, b) => sum + b.qty_available, 0) || 0
        if (currentStock < m.reorder_level) {
          lowStock.push({ id: m.id, name: m.name, currentStock, reorderLevel: m.reorder_level })
        }

        m.batches?.forEach((b) => {
          if (b.qty_available > 0 && b.expiry_date) {
            const daysLeft = Math.ceil((new Date(b.expiry_date).getTime() - todayMs) / (1000 * 60 * 60 * 24))
            const item: ExpiryAlertItem = {
              id: b.id,
              medicineName: m.name,
              batchNo: b.batch_no,
              expiryDate: b.expiry_date,
              qtyAvailable: b.qty_available,
              daysLeft
            }
            if (daysLeft <= 0) expired.push(item)
            else if (daysLeft <= 30) nearExpiry.push(item)
          }
        })
      })

      expired.sort((a, b) => a.daysLeft - b.daysLeft)
      nearExpiry.sort((a, b) => a.daysLeft - b.daysLeft)
      lowStock.sort((a, b) => a.currentStock - b.currentStock)

      const patientDues: PatientDueAlertItem[] = dues
        .filter((b) => (b.balance_due || 0) > 0)
        .map((b) => ({
          id: b.id,
          billNo: b.bill_no,
          patientName: b.patient?.full_name || b.walkin_name || 'Walk-in',
          balanceDue: b.balance_due,
          billDate: b.bill_date
        }))
        .sort((a, b) => b.balanceDue - a.balanceDue)

      set({
        expiredBatches: expired,
        nearExpiryBatches: nearExpiry,
        lowStockItems: lowStock,
        patientDues,
        loading: false
      })
    } catch (err) {
      console.error('Failed to fetch critical alerts:', err)
      set({ loading: false })
    }
  }
}))

export default useAlertsStore
