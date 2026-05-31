"use client";

import { useEffect, useRef } from "react";

/** Animated number that counts up to `value` on mount. */
export function CountUp({
  value,
  suffix = "",
  duration = 1200,
  className,
}: {
  value: number;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const dec = value % 1 !== 0 ? 1 : 0;
    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      node.textContent = value.toFixed(dec) + suffix;
      return;
    }
    let raf = 0;
    const start = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const e = 1 - Math.pow(1 - p, 3);
      node.textContent = (value * e).toFixed(dec) + suffix;
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, suffix, duration]);

  return (
    <span ref={ref} className={className}>
      0{suffix}
    </span>
  );
}
