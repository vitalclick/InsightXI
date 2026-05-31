"use client";

import { useEffect } from "react";
import { useThemeStore } from "../store/theme-store";
import { useUiStore } from "../store/ui-store";

/** Syncs Zustand stores with persisted state and arms entrance animations. */
export function ClientInit() {
  const hydrateTheme = useThemeStore((s) => s.hydrate);
  const hydrateUi = useUiStore((s) => s.hydrate);

  useEffect(() => {
    hydrateTheme();
    hydrateUi();
    if (typeof document !== "undefined" && document.visibilityState === "visible") {
      document.body.classList.add("anim-on");
    }
    const onVis = () => {
      if (document.visibilityState === "visible") document.body.classList.add("anim-on");
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [hydrateTheme, hydrateUi]);

  return null;
}
