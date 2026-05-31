"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api-client";
import { detectCountry } from "../lib/locale";

/**
 * Fetches the Premium plan localized to the viewer's currency. A `currency`
 * override (manual selector) takes precedence; otherwise the server geolocates
 * via Cloudflare, with the browser region as a dev/local fallback hint.
 */
export function usePlan(currency?: string) {
  return useQuery({
    queryKey: ["plan", currency ?? "auto"],
    queryFn: () => api.plan({ currency, country: currency ? undefined : detectCountry() }),
    staleTime: 5 * 60_000,
  });
}
