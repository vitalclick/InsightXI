"use client";

import { useEffect, useState } from "react";
import { useThemeStore } from "../../store/theme-store";
import { Icon } from "../ui/icon";

/** Topbar/landing theme switch. Reflects the current theme once mounted. */
export function ThemeToggle({ className = "tb-icon" }: { className?: string }) {
  const { theme, toggle, hydrate } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    hydrate();
    setMounted(true);
  }, [hydrate]);

  const isLight = mounted && theme === "light";
  return (
    <button
      type="button"
      className={className}
      onClick={toggle}
      aria-label="Toggle theme"
      title={isLight ? "Switch to dark" : "Switch to light"}
    >
      <Icon name={isLight ? "moon" : "sun"} size={17} />
    </button>
  );
}
