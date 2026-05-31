import { create } from "zustand";

export type Theme = "dark" | "light";

interface ThemeState {
  theme: Theme;
  /** Bumped on every theme change so chart components can re-run their draw. */
  version: number;
  setTheme: (t: Theme) => void;
  toggle: () => void;
  /** Sync the store from the <html data-theme> attribute set by the early script. */
  hydrate: () => void;
}

function applyTheme(t: Theme): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", t);
  // Force a synchronous restyle so every custom-property-dependent colour
  // recomputes (works around an attribute-change invalidation quirk).
  root.style.display = "none";
  void root.offsetHeight;
  root.style.display = "";
  try {
    localStorage.setItem("ix-theme", t);
  } catch {
    /* ignore */
  }
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "dark",
  version: 0,
  setTheme: (t) => {
    applyTheme(t);
    set((s) => ({ theme: t, version: s.version + 1 }));
  },
  toggle: () => get().setTheme(get().theme === "dark" ? "light" : "dark"),
  hydrate: () => {
    if (typeof document === "undefined") return;
    const current = (document.documentElement.getAttribute("data-theme") as Theme) || "dark";
    set({ theme: current });
  },
}));
