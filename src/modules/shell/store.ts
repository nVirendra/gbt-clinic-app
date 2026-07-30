import { create } from 'zustand';

interface ShellState {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const useShellStore = create<ShellState>((set) => ({
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),
}));

export default useShellStore;
