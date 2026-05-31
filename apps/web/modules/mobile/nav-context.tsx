"use client";

import { createContext, useContext } from "react";
import type { AnyMatch } from "./data";

export type TabId = "home" | "live" | "predictions" | "fixtures" | "more";
export type DetailId = "match" | "board" | "premium";
export type ScreenId = TabId | DetailId;

export const TABS: TabId[] = ["home", "live", "predictions", "fixtures", "more"];

export const SCREEN_TITLES: Record<ScreenId, string> = {
  home: "InsightXI",
  live: "Live Center",
  predictions: "Sure Win",
  fixtures: "Fixtures",
  more: "More",
  match: "Match Intel",
  board: "Confidence Board",
  premium: "Premium",
};

export interface MobileNav {
  showTab: (t: TabId) => void;
  pushScreen: (id: DetailId, arg?: AnyMatch) => void;
  pop: () => void;
  toast: (msg: string) => void;
  haptic: (ms?: number) => void;
  toggleTheme: () => void;
}

const Ctx = createContext<MobileNav | null>(null);

export const MobileNavProvider = Ctx.Provider;

export function useMobileNav(): MobileNav {
  const v = useContext(Ctx);
  if (!v) throw new Error("useMobileNav must be used within <MobileApp>");
  return v;
}
