"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * On phone-sized viewports (<=520px), send the desktop app routes to the
 * dedicated mobile experience at `/m`. Larger screens keep the sidebar app.
 * No-op during SSR / in environments without `matchMedia` (e.g. jsdom).
 */
export function PhoneRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(max-width: 520px)");
    const apply = () => {
      if (mq.matches) router.replace("/m");
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [router]);

  return null;
}
