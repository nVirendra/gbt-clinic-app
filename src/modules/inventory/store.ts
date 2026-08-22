import { create } from 'zustand';
import { Medicine, Vendor, InventoryBatch, Purchase } from '../../types';

interface InventoryState {
  medicines: Medicine[];
  vendors: Vendor[];
  batches: InventoryBatch[];
  purchases: Purchase[];
  loading: boolean;
  error: string | null;

  loadAllData: () => Promise<void>;
  fetchMedicines: () => Promise<void>;
  fetchVendors: () => Promise<void>;
  fetchBatches: () => Promise<void>;
  fetchPurchases: () => Promise<void>;

  createMedicine: (args: { data: any; userId: string }) => Promise<Medicine>;
  updateMedicine: (args: { id: string; data: any; userId: string }) => Promise<Medicine>;
  deleteMedicine: (args: { id: string; userId: string }) => Promise<Medicine>;

  createVendor: (args: { data: any; userId: string }) => Promise<Vendor>;
  updateVendor: (args: { id: string; data: any; userId: string }) => Promise<Vendor>;
  deleteVendor: (args: { id: string; userId: string }) => Promise<Vendor>;

  createPurchase: (args: { data: any; userId: string }) => Promise<Purchase>;
  updatePurchase: (args: { id: string; data: any; userId: string }) => Promise<Purchase>;
  adjustStock: (args: { id: string; qtyChange: number; reason: string; userId: string }) => Promise<InventoryBatch>;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  medicines: [],
  vendors: [],
  batches: [],
  purchases: [],
  loading: false,
  error: null,

  loadAllData: async () => {
    set({ loading: true, error: null });
    try {
      const [medData, vendorData, batchData, purchaseData] = await Promise.all([
        window.api.getMedicines(),
        window.api.getVendors(),
        window.api.getInventoryBatches(),
        window.api.getPurchases()
      ]);
      set({
        medicines: medData,
        vendors: vendorData,
        batches: batchData,
        purchases: purchaseData,
        loading: false
      });
    } catch (err: any) {
      set({ error: err.message || 'Failed to load inventory data', loading: false });
    }
  },

  fetchMedicines: async () => {
    const list = await window.api.getMedicines();
    set({ medicines: list });
  },

  fetchVendors: async () => {
    const list = await window.api.getVendors();
    set({ vendors: list });
  },

  fetchBatches: async () => {
    const list = await window.api.getInventoryBatches();
    set({ batches: list });
  },

  fetchPurchases: async () => {
    const list = await window.api.getPurchases();
    set({ purchases: list });
  },

  createMedicine: async (args) => {
    const res = await window.api.createMedicine(args);
    await get().loadAllData();
    return res;
  },

  updateMedicine: async (args) => {
    const res = await window.api.updateMedicine(args);
    await get().loadAllData();
    return res;
  },

  deleteMedicine: async (args) => {
    const res = await window.api.deleteMedicine(args);
    await get().loadAllData();
    return res;
  },

  createVendor: async (args) => {
    const res = await window.api.createVendor(args);
    await get().loadAllData();
    return res;
  },

  updateVendor: async (args) => {
    const res = await window.api.updateVendor(args);
    await get().loadAllData();
    return res;
  },

  deleteVendor: async (args) => {
    const res = await window.api.deleteVendor(args);
    await get().loadAllData();
    return res;
  },

  createPurchase: async (args) => {
    const res = await window.api.createPurchase(args);
    await get().loadAllData();
    return res;
  },

  updatePurchase: async (args) => {
    const res = await window.api.updatePurchase(args);
    await get().loadAllData();
    return res;
  },

  adjustStock: async (args) => {
    const res = await window.api.adjustStock({
      batchId: args.id,
      qty: args.qtyChange,
      reason: args.reason,
      userId: args.userId
    });
    await get().loadAllData();
    return res;
  },
}));
export default useInventoryStore;
