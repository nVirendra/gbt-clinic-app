import { create } from 'zustand';
import { Service } from '../../types';

interface ServicesState {
  services: Service[];
  loading: boolean;
  error: string | null;
  fetchServices: () => Promise<void>;
  createService: (args: { data: any; userId: string }) => Promise<Service>;
  updateService: (args: { id: string; data: any; userId: string }) => Promise<Service>;
  deleteService: (args: { id: string; userId: string }) => Promise<Service>;
}

export const useServicesStore = create<ServicesState>((set) => ({
  services: [],
  loading: false,
  error: null,
  fetchServices: async () => {
    set({ loading: true, error: null });
    try {
      const list = await window.api.getServices();
      set({ services: list, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch services', loading: false });
    }
  },
  createService: async (args) => {
    set({ loading: true });
    try {
      const s = await window.api.createService(args);
      set({ loading: false });
      return s;
    } catch (err: any) {
      set({ loading: false });
      throw err;
    }
  },
  updateService: async (args) => {
    set({ loading: true });
    try {
      const s = await window.api.updateService(args);
      set({ loading: false });
      return s;
    } catch (err: any) {
      set({ loading: false });
      throw err;
    }
  },
  deleteService: async (args) => {
    set({ loading: true });
    try {
      const s = await window.api.deleteService(args);
      set({ loading: false });
      return s;
    } catch (err: any) {
      set({ loading: false });
      throw err;
    }
  },
}));
export default useServicesStore;
