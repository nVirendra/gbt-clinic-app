import { create } from 'zustand';
import { ClinicProfile, AuditLogEntry } from '../../types';

interface SettingsState {
  profile: ClinicProfile | null;
  auditLogs: AuditLogEntry[];
  loading: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<ClinicProfile>, userId: string) => Promise<{ success: boolean }>;
  fetchAuditLogs: () => Promise<void>;
  backupDatabase: (customPath?: string) => Promise<{ success: boolean; message: string }>;
  restoreDatabase: (userId: string) => Promise<{ success: boolean; message: string }>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  profile: null,
  auditLogs: [],
  loading: false,
  error: null,
  fetchProfile: async () => {
    set({ loading: true, error: null });
    try {
      const p = await window.api.getClinicProfile();
      set({ profile: p, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch clinic profile', loading: false });
    }
  },
  updateProfile: async (data, userId) => {
    set({ loading: true, error: null });
    try {
      const res = await window.api.updateClinicProfile({ data, userId });
      if (res.success) {
        const p = await window.api.getClinicProfile();
        set({ profile: p, loading: false });
      } else {
        set({ loading: false });
      }
      return res;
    } catch (err: any) {
      set({ error: err.message || 'Failed to update clinic profile', loading: false });
      throw err;
    }
  },
  fetchAuditLogs: async () => {
    set({ loading: true });
    try {
      const logs = await window.api.getAuditLogs();
      set({ auditLogs: logs, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch audit logs', loading: false });
    }
  },
  backupDatabase: async (customPath) => {
    return window.api.backupDatabase(customPath);
  },
  restoreDatabase: async (userId) => {
    return window.api.restoreDatabase(userId);
  },
}));
export default useSettingsStore;
