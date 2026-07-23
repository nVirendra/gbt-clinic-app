import { create } from 'zustand';
import { Patient } from '../../types';

interface PatientsState {
  patients: Patient[];
  selectedPatient: Patient | null;
  loading: boolean;
  detailLoading: boolean;
  error: string | null;
  fetchPatients: (query?: string) => Promise<void>;
  selectPatient: (id: string) => Promise<void>;
  createPatient: (data: Partial<Patient>, userId: string) => Promise<Patient>;
  updatePatient: (id: string, data: Partial<Patient>, userId: string) => Promise<Patient>;
  deletePatient: (id: string, userId: string) => Promise<Patient>;
  checkDuplicate: (phone: string, fullName: string) => Promise<{ duplicate: boolean; patient?: Patient }>;
}

export const usePatientsStore = create<PatientsState>((set, get) => ({
  patients: [],
  selectedPatient: null,
  loading: false,
  detailLoading: false,
  error: null,
  fetchPatients: async (query) => {
    set({ loading: true, error: null });
    try {
      const data = await window.api.getPatients(query);
      set({ patients: data, loading: false });

      // Automatically select the first patient if none is selected and patients exist
      const { selectedPatient } = get();
      if (data.length > 0 && !selectedPatient) {
        get().selectPatient(data[0].id);
      }
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch patients', loading: false });
    }
  },
  selectPatient: async (id) => {
    set({ detailLoading: true });
    try {
      const details = await window.api.getPatientById(id);
      set({ selectedPatient: details, detailLoading: false });
    } catch (err: any) {
      console.error('Failed to select patient:', err);
      set({ detailLoading: false });
    }
  },
  createPatient: async (data, userId) => {
    set({ loading: true });
    try {
      const newPatient = await window.api.createPatient({ data, userId });
      set((state) => ({
        patients: [newPatient, ...state.patients],
        loading: false,
      }));
      // Automatically select the new patient
      get().selectPatient(newPatient.id);
      return newPatient;
    } catch (err: any) {
      set({ loading: false });
      throw err;
    }
  },
  updatePatient: async (id, data, userId) => {
    set({ loading: true });
    try {
      const updated = await window.api.updatePatient({ id, data, userId });
      set((state) => ({
        patients: state.patients.map((p) => (p.id === id ? updated : p)),
        selectedPatient: state.selectedPatient?.id === id ? updated : state.selectedPatient,
        loading: false,
      }));
      // Reload details to capture the latest bills structure etc.
      get().selectPatient(id);
      return updated;
    } catch (err: any) {
      set({ loading: false });
      throw err;
    }
  },
  deletePatient: async (id, userId) => {
    set({ loading: true });
    try {
      const deleted = await window.api.deletePatient({ id, userId });
      set((state) => {
        const nextPatients = state.patients.filter((p) => p.id !== id);
        return {
          patients: nextPatients,
          selectedPatient: state.selectedPatient?.id === id ? (nextPatients[0] || null) : state.selectedPatient,
          loading: false,
        };
      });
      // If the selected patient was deleted, fetch details for the new selection
      const { selectedPatient } = get();
      if (selectedPatient) {
        get().selectPatient(selectedPatient.id);
      }
      return deleted;
    } catch (err: any) {
      set({ loading: false });
      throw err;
    }
  },
  checkDuplicate: async (phone, fullName) => {
    return window.api.checkDuplicatePatient({ phone, fullName });
  },
}));
export default usePatientsStore;
