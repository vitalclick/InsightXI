"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api-client";

export function LeagueTabs({
  value,
  onChange,
  includeAll = true,
}: {
  value: string;
  onChange: (id: string) => void;
  includeAll?: boolean;
}) {
  const { data: leagues = [] } = useQuery({
    queryKey: ["leagues"],
    queryFn: api.leagues,
  });

  const tabs = includeAll
    ? [{ id: "", name: "All" }, ...leagues]
    : leagues;

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((l) => (
        <button
          key={l.id || "all"}
          onClick={() => onChange(l.id)}
          className={`rounded-full border px-3 py-1 text-sm transition ${
            value === l.id
              ? "border-insight bg-insight/20 text-white"
              : "border-white/10 text-white/60 hover:text-white"
          }`}
        >
          {l.name}
        </button>
      ))}
    </div>
  );
}
