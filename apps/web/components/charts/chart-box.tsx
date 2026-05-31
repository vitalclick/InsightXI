"use client";

import { useEffect, useRef } from "react";
import { useThemeStore } from "../../store/theme-store";

/**
 * Mounts an imperative IXChart renderer into a div and re-runs it whenever the
 * theme flips (structural chart colours come from CSS custom properties).
 */
export function ChartBox({
  draw,
  deps = [],
  className,
  style,
}: {
  draw: (el: HTMLElement) => void;
  deps?: unknown[];
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const version = useThemeStore((s) => s.version);

  useEffect(() => {
    if (ref.current) draw(ref.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, ...deps]);

  return <div ref={ref} className={className} style={style} />;
}
