"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../services/api-client";

function ago(ms: number): string {
  if (!ms) return "—";
  const s = Math.max(0, Math.round((Date.now() - ms) / 1000));
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.round(m / 60)}h ago`;
}

/**
 * Live data-freshness pill. Reflects when the fixtures cache last refreshed
 * (TanStack Query's real dataUpdatedAt) and whether the API is reachable, so
 * the label is honest rather than decorative.
 */
export function Freshness() {
  const { dataUpdatedAt, isError, isFetching } = useQuery({
    queryKey: ["fixtures", ""],
    queryFn: () => api.fixtures(),
  });

  // Re-render every 15s so the relative time stays current.
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 15_000);
    return () => clearInterval(id);
  }, []);

  const ok = !isError && dataUpdatedAt > 0;
  const color = isError ? "var(--red)" : isFetching ? "var(--amber)" : "var(--green)";
  const label = isError ? "data offline" : isFetching ? "syncing…" : `data ${ago(dataUpdatedAt)}`;

  return (
    <span
      className="badge"
      title="Football data freshness"
      style={{ borderColor: "var(--line)" }}
      aria-label={`Data status: ${label}`}
    >
      <span className="badge-dot" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
      {label}
    </span>
  );
}
