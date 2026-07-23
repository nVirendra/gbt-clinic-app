import { create } from 'zustand';
import { Bill } from '../../types';

interface BillingState {
  bills: Bill[];
  selectedBill: Bill | null;
  loading: boolean;
  error: string | null;
  fetchBills: (filters?: { status?: string; patientId?: string; startDate?: string; endDate?: string }) => Promise<void>;
  selectBill: (id: string) => Promise<void>;
  createBill: (args: { data: any; userId: string }) => Promise<Bill>;
  finalizeBill: (args: {
    billId: string;
    paidAmount: number;
    paymentMode: string;
    transactionId?: string;
    userId: string;
  }) => Promise<Bill>;
  cancelBill: (args: {
    billId: string;
    reason: string;
    adminUsername?: string;
    adminPassword?: string;
    userId: string;
  }) => Promise<Bill>;
  recordPayment: (args: {
    billId: string;
    amount: number;
    mode: string;
    referenceNo?: string;
    userId: string;
  }) => Promise<Bill>;
  printInvoice: (billId: string) => Promise<boolean>;
}

export const useBillingStore = create<BillingState>((set, get) => ({
  bills: [],
  selectedBill: null,
  loading: false,
  error: null,
  fetchBills: async (filters) => {
    set({ loading: true, error: null });
    try {
      const list = await window.api.getBills(filters);
      set({ bills: list, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch bills', loading: false });
    }
  },
  selectBill: async (id) => {
    set({ loading: true });
    try {
      const details = await window.api.getBillById(id);
      set({ selectedBill: details, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to select bill', loading: false });
    }
  },
  createBill: async (args) => {
    set({ loading: true });
    try {
      const b = await window.api.createBill(args);
      await get().fetchBills();
      set({ loading: false });
      return b;
    } catch (err: any) {
      set({ loading: false });
      throw err;
    }
  },
  finalizeBill: async (args) => {
    set({ loading: true });
    try {
      const b = await window.api.finalizeBill(args);
      await get().fetchBills();
      if (get().selectedBill?.id === args.billId) {
        await get().selectBill(args.billId);
      }
      set({ loading: false });
      return b;
    } catch (err: any) {
      set({ loading: false });
      throw err;
    }
  },
  cancelBill: async (args) => {
    set({ loading: true });
    try {
      const b = await window.api.cancelBill(args);
      await get().fetchBills();
      if (get().selectedBill?.id === args.billId) {
        await get().selectBill(args.billId);
      }
      set({ loading: false });
      return b;
    } catch (err: any) {
      set({ loading: false });
      throw err;
    }
  },
  recordPayment: async (args) => {
    set({ loading: true });
    try {
      const b = await window.api.recordPayment(args);
      await get().fetchBills();
      if (get().selectedBill?.id === args.billId) {
        await get().selectBill(args.billId);
      }
      set({ loading: false });
      return b;
    } catch (err: any) {
      set({ loading: false });
      throw err;
    }
  },
  printInvoice: async (billId) => {
    return window.api.printInvoice(billId);
  },
}));
export default useBillingStore;
