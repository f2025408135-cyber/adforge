/**
 * AdForge — UI Store (Zustand)
 *
 * Manages global UI state: sidebar visibility, search overlay, etc.
 */

import { create } from "zustand";

interface UIStore {
  sidebarOpen: boolean;
  searchOpen: boolean;
  searchQuery: string;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSearchOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  searchOpen: false,
  searchQuery: "",

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSearchOpen: (open) => set({ searchOpen: open }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
