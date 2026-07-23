import { create } from 'zustand';
import { Bill, CollectionSummary } from '../../types';

interface DashboardState {
  stats: CollectionSummary | null;
  outstandingBills: Bill[];
  recentBills: Bill[];
  patientCount: number;
  lowStockCount: number;
  loading: boolean;
  error: string | null;
  loadDashboardData: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: null,
  outstandingBills: [],
  recentBills: [],
  patientCount: 0,
  lowStockCount: 0,
  loading: false,
  error: null,
  loadDashboardData: async () => {
    set({ loading: true, error: null });
    try {
      const today = new Date().toISOString().split('T')[0];

      const [collectionStats, dues, bills, patients, meds] = await Promise.all([
        window.api.getCollectionSummary({ startDate: today, endDate: today }),
        window.api.getOutstandingDues(),
        window.api.getBills(),
        window.api.getPatients(),
        window.api.getMedicines()
      ]);

      const lowStock = meds.filter(m => {
        const total = m.batches?.reduce((sum, b) => sum + b.qty_available, 0) || 0;
        return total < m.reorder_level;
      });

      set({
        stats: collectionStats,
        outstandingBills: dues.slice(0, 5),
        recentBills: bills.slice(0, 5),
        patientCount: patients.length,
        lowStockCount: lowStock.length,
        loading: false
      });
    } catch (err: any) {
      set({ error: err.message || 'Failed to load dashboard statistics', loading: false });
    }
  },
}));
export default useDashboardStore;
