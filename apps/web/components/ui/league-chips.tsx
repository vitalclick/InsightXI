"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "../../services/api-client";

/** League filter as design `.chip` row. */
export function LeagueChips({
  value,
  onChange,
  includeAll = true,
}: {
  value: string;
  onChange: (id: string) => void;
  includeAll?: boolean;
}) {
  const { data: leagues = [] } = useQuery({ queryKey: ["leagues"], queryFn: api.leagues });
  const tabs = includeAll ? [{ id: "", name: "All competitions" }, ...leagues] : leagues;

  return (
    <div className="chip-row">
      {tabs.map((l) => (
        <button
          key={l.id || "all"}
          type="button"
          className={`chip${value === l.id ? " active" : ""}`}
          onClick={() => onChange(l.id)}
        >
          {l.name}
        </button>
      ))}
    </div>
  );
}
