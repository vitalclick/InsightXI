import { create } from "zustand";

/**
 * Global UI state (Zustand — chosen over Redux Toolkit for the platform).
 * Keep server/cache state in TanStack Query; keep ephemeral UI state here.
 */
interface UiState {
  /** Desktop sidebar collapsed to icon rail. */
  collapsed: boolean;
  /** Mobile sidebar drawer open. */
  mobileOpen: boolean;
  toggleCollapsed: () => void;
  toggleMobile: () => void;
  closeMobile: () => void;
  hydrate: () => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  collapsed: false,
  mobileOpen: false,
  toggleCollapsed: () => {
    const next = !get().collapsed;
    try {
      localStorage.setItem("ix-sb-collapsed", next ? "1" : "0");
    } catch {
      /* ignore */
    }
    set({ collapsed: next });
  },
  toggleMobile: () => set((s) => ({ mobileOpen: !s.mobileOpen })),
  closeMobile: () => set({ mobileOpen: false }),
  hydrate: () => {
    try {
      set({ collapsed: localStorage.getItem("ix-sb-collapsed") === "1" });
    } catch {
      /* ignore */
    }
  },
}));
