"use client";

import { type CSSProperties, useEffect, useRef } from "react";
import { useThemeStore } from "../../store/theme-store";

/**
 * Mounts an imperative `ix-charts` renderer into a div. Redraws on theme
 * change (structural colours come from CSS vars) and whenever `signature`
 * changes. Two RAFs mirror the prototype's `paint()` so the box is measured
 * after layout settles.
 */
export function Chart({
  render,
  className,
  style,
  signature,
}: {
  render: (el: HTMLElement) => void;
  className?: string;
  style?: CSSProperties;
  signature?: string | number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const renderRef = useRef(render);
  renderRef.current = render;
  const version = useThemeStore((s) => s.version);

  useEffect(() => {
    if (!ref.current) return;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        if (ref.current) renderRef.current(ref.current);
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [version, signature]);

  return <div ref={ref} className={className} style={style} aria-hidden />;
}
