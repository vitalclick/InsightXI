import { create } from "zustand";

/**
 * Global UI state (Zustand — chosen over Redux Toolkit for the platform).
 * Keep server/cache state in TanStack Query; keep ephemeral UI state here.
 */
interface UiState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));
