import { create } from 'zustand';

interface ShellState {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentHash: string;
  setCurrentHash: (hash: string) => void;
}

export const useShellStore = create<ShellState>((set) => ({
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),
  currentHash: '',
  setCurrentHash: (hash) => set({ currentHash: hash }),
}));
export default useShellStore;
