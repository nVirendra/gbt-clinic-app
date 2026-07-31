import { create } from 'zustand'
import { Bill, CollectionSummary, Medicine, Patient, Purchase } from '../../types'

export type DateRangeOption = 'today' | 'week' | 'month' | 'all'

export interface ExpiringBatchItem {
  id: string
  medicineName: string
  batchNo: string
  expiryDate: string
  daysLeft: number
  qtyAvailable: number
}

export interface LowStockItem {
  id: string
  name: string
  currentStock: number
  reorderLevel: number
}

export interface ChartPoint {
  date: string
  revenue: number
  invoices: number
}

export interface CategoryChartPoint {
  name: string
  value: number
}

interface DashboardState {
  dateRange: DateRangeOption
  stats: CollectionSummary | null
  outstandingBills: Bill[]
  recentBills: Bill[]
  recentPatients: Patient[]
  recentPurchases: Purchase[]
  expiringBatches: ExpiringBatchItem[]
  lowStockList: LowStockItem[]
  patientCount: number
  lowStockCount: number
  expiringCount: number
  revenueTrendData: ChartPoint[]
  categoryData: CategoryChartPoint[]
  loading: boolean
  error: string | null
  setDateRange: (range: DateRangeOption) => void
  loadDashboardData: (range?: DateRangeOption) => Promise<void>
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  dateRange: 'today',
  stats: null,
  outstandingBills: [],
  recentBills: [],
  recentPatients: [],
  recentPurchases: [],
  expiringBatches: [],
  lowStockList: [],
  patientCount: 0,
  lowStockCount: 0,
  expiringCount: 0,
  revenueTrendData: [],
  categoryData: [],
  loading: false,
  error: null,

  setDateRange: (range: DateRangeOption) => {
    set({ dateRange: range })
    get().loadDashboardData(range)
  },

  loadDashboardData: async (overrideRange?: DateRangeOption) => {
    const range = overrideRange || get().dateRange
    set({ loading: true, error: null })
    try {
      const now = new Date()
      let startDateStr = now.toISOString().split('T')[0]
      const endDateStr = now.toISOString().split('T')[0]

      if (range === 'week') {
        const d = new Date()
        d.setDate(d.getDate() - 7)
        startDateStr = d.toISOString().split('T')[0]
      } else if (range === 'month') {
        const d = new Date()
        d.setDate(d.getDate() - 30)
        startDateStr = d.toISOString().split('T')[0]
      } else if (range === 'all') {
        startDateStr = '2020-01-01'
      }

      const [collectionStats, dues, bills, patients, meds, purchases] = await Promise.all([
        window.api.getCollectionSummary({ startDate: startDateStr, endDate: endDateStr }),
        window.api.getOutstandingDues(),
        window.api.getBills(),
        window.api.getPatients(),
        window.api.getMedicines(),
        window.api.getPurchases().catch(() => [])
      ])

      // Low Stock items calculation
      const lowStock: LowStockItem[] = []
      meds.forEach((m) => {
        const total = m.batches?.reduce((sum, b) => sum + b.qty_available, 0) || 0
        if (total < m.reorder_level) {
          lowStock.push({
            id: m.id,
            name: m.name,
            currentStock: total,
            reorderLevel: m.reorder_level
          })
        }
      })

      // Expiring / Expired Batches calculation (<= 60 days)
      const expiring: ExpiringBatchItem[] = []
      const todayMs = new Date().getTime()

      meds.forEach((m) => {
        m.batches?.forEach((b) => {
          if (b.qty_available > 0 && b.expiry_date) {
            const expMs = new Date(b.expiry_date).getTime()
            const diffDays = Math.ceil((expMs - todayMs) / (1000 * 60 * 60 * 24))
            if (diffDays <= 60) {
              expiring.push({
                id: b.id,
                medicineName: m.name,
                batchNo: b.batch_no,
                expiryDate: b.expiry_date,
                daysLeft: diffDays,
                qtyAvailable: b.qty_available
              })
            }
          }
        })
      })

      // Sort expiring by urgency (closest/past expiry first)
      expiring.sort((a, b) => a.daysLeft - b.daysLeft)

      // Timeline trend data generation (last 7 or 14 days)
      const trendMap: Record<string, { revenue: number; invoices: number }> = {}
      const daysCount = range === 'month' ? 14 : 7
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const dateKey = d.toISOString().split('T')[0]
        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        trendMap[dateKey] = { revenue: 0, invoices: 0 }
      }

      bills.forEach((b) => {
        const bDate = b.created_at ? b.created_at.split('T')[0] : ''
        if (trendMap[bDate]) {
          trendMap[bDate].revenue += b.grand_total || 0
          trendMap[bDate].invoices += 1
        }
      })

      const revenueTrendData: ChartPoint[] = Object.keys(trendMap).map((dateKey) => {
        const d = new Date(dateKey)
        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        return {
          date: label,
          revenue: Math.round(trendMap[dateKey].revenue),
          invoices: trendMap[dateKey].invoices
        }
      })

      // Category breakdown
      const categoryMap: Record<string, number> = {}
      bills.forEach((b) => {
        b.items?.forEach((item) => {
          const cat = item.item_type || 'General Services'
          categoryMap[cat] = (categoryMap[cat] || 0) + (item.line_total || 0)
        })
      })

      const categoryData: CategoryChartPoint[] = Object.keys(categoryMap).map((cat) => ({
        name: cat,
        value: Math.round(categoryMap[cat])
      }))

      if (categoryData.length === 0) {
        categoryData.push(
          { name: 'Services', value: 65 },
          { name: 'Medicines', value: 35 }
        )
      }

      set({
        stats: collectionStats,
        outstandingBills: dues.slice(0, 6),
        recentBills: bills.slice(0, 6),
        recentPatients: patients.slice(0, 5),
        recentPurchases: purchases.slice(0, 5),
        expiringBatches: expiring.slice(0, 6),
        lowStockList: lowStock.slice(0, 6),
        patientCount: patients.length,
        lowStockCount: lowStock.length,
        expiringCount: expiring.length,
        revenueTrendData,
        categoryData,
        loading: false
      })
    } catch (err: any) {
      set({ error: err.message || 'Failed to load dashboard statistics', loading: false })
    }
  }
}))

export default useDashboardStore
