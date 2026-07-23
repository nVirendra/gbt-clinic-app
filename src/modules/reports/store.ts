import { create } from 'zustand';
import { Bill, CollectionSummary, GstSummaryRow, InventoryBatch, Medicine } from '../../types';

interface ReportsState {
  startDate: string;
  endDate: string;
  stats: CollectionSummary | null;
  dues: Bill[];
  gstSummary: GstSummaryRow[];
  inventoryValuation: { purchaseValuation: number; sellingValuation: number };
  batches: InventoryBatch[];
  medicines: Medicine[];
  selectedBatchId: string;
  ledgerLogs: any[];
  vendorPurchases: any[];

  statsLoading: boolean;
  duesLoading: boolean;
  gstLoading: boolean;
  inventoryLoading: boolean;
  ledgerLoading: boolean;
  vendorsLoading: boolean;

  setDates: (start: string, end: string) => void;
  setSelectedBatchId: (id: string) => void;
  loadFinancials: () => Promise<void>;
  loadGst: () => Promise<void>;
  loadInventory: () => Promise<void>;
  loadLedger: () => Promise<void>;
  loadVendors: () => Promise<void>;
}

const getFirstDayOfMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
};
const getToday = () => new Date().toISOString().split('T')[0];

export const useReportsStore = create<ReportsState>((set, get) => ({
  startDate: getFirstDayOfMonth(),
  endDate: getToday(),
  stats: null,
  dues: [],
  gstSummary: [],
  inventoryValuation: { purchaseValuation: 0, sellingValuation: 0 },
  batches: [],
  medicines: [],
  selectedBatchId: '',
  ledgerLogs: [],
  vendorPurchases: [],

  statsLoading: false,
  duesLoading: false,
  gstLoading: false,
  inventoryLoading: false,
  ledgerLoading: false,
  vendorsLoading: false,

  setDates: (start, end) => {
    set({ startDate: start, endDate: end });
  },

  setSelectedBatchId: (id) => {
    set({ selectedBatchId: id });
  },

  loadFinancials: async () => {
    set({ statsLoading: true, duesLoading: true });
    try {
      const { startDate, endDate } = get();
      const [collectionStats, outstanding] = await Promise.all([
        window.api.getCollectionSummary({ startDate, endDate }),
        window.api.getOutstandingDues()
      ]);
      set({ stats: collectionStats, dues: outstanding, statsLoading: false, duesLoading: false });
    } catch (e) {
      console.error(e);
      set({ statsLoading: false, duesLoading: false });
    }
  },

  loadGst: async () => {
    set({ gstLoading: true });
    try {
      const { startDate, endDate } = get();
      const summary = await window.api.getGstSummary({ startDate, endDate });
      set({ gstSummary: summary, gstLoading: false });
    } catch (e) {
      console.error(e);
      set({ gstLoading: false });
    }
  },

  loadInventory: async () => {
    set({ inventoryLoading: true });
    try {
      const [valuation, allBatches, allMeds] = await Promise.all([
        window.api.getInventoryValuation(),
        window.api.getInventoryBatches(),
        window.api.getMedicines()
      ]);
      set({
        inventoryValuation: valuation,
        batches: allBatches,
        medicines: allMeds,
        inventoryLoading: false
      });
    } catch (e) {
      console.error(e);
      set({ inventoryLoading: false });
    }
  },

  loadLedger: async () => {
    const { selectedBatchId } = get();
    if (!selectedBatchId) return;
    set({ ledgerLoading: true });
    try {
      const logs = await window.api.getBatchLedger(selectedBatchId);
      set({ ledgerLogs: logs, ledgerLoading: false });
    } catch (e) {
      console.error(e);
      set({ ledgerLoading: false });
    }
  },

  loadVendors: async () => {
    set({ vendorsLoading: true });
    try {
      const summary = await window.api.getVendorPurchases();
      set({ vendorPurchases: summary, vendorsLoading: false });
    } catch (e) {
      console.error(e);
      set({ vendorsLoading: false });
    }
  },
}));
export default useReportsStore;
