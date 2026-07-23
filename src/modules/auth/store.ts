import { create } from 'zustand';
import { UserSummary } from '../../types';

interface AuthState {
  user: UserSummary | null;
  usersList: UserSummary[];
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  setUser: (user: UserSummary | null) => void;
  fetchUsers: () => Promise<void>;
  createUser: (username: string, password: string, role: string, userId: string) => Promise<{ success: boolean; message?: string }>;
  toggleUserActive: (id: string, is_active: boolean, userId: string) => Promise<{ success: boolean }>;
  resetPassword: (id: string, password: string, userId: string) => Promise<{ success: boolean }>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  usersList: [],
  loading: false,
  error: null,
  setUser: (user) => set({ user }),
  login: async (username, password) => {
    set({ loading: true, error: null });
    try {
      const res = await window.api.login({ username, password });
      if (res.success && res.user) {
        set({ user: res.user, loading: false });
        return { success: true };
      } else {
        set({ error: res.message || 'Login failed', loading: false });
        return { success: false, message: res.message };
      }
    } catch (err: any) {
      set({ error: err.message || 'An error occurred during login', loading: false });
      return { success: false, message: err.message };
    }
  },
  logout: () => {
    set({ user: null });
  },
  fetchUsers: async () => {
    set({ loading: true });
    try {
      const list = await window.api.getUsers();
      set({ usersList: list, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch users', loading: false });
    }
  },
  createUser: async (username, password, role, userId) => {
    const res = await window.api.createUser({ username, password, role, userId });
    if (res.success) {
      // Reload user list
      const list = await window.api.getUsers();
      set({ usersList: list });
    }
    return res;
  },
  toggleUserActive: async (id, is_active, userId) => {
    const res = await window.api.toggleUserActive({ id, is_active, userId });
    if (res.success) {
      // Reload user list
      const list = await window.api.getUsers();
      set({ usersList: list });
    }
    return res;
  },
  resetPassword: async (id, password, userId) => {
    return window.api.resetPassword({ id, password, userId });
  },
}));
export default useAuthStore;
