"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../services/api-client";
import { Icon } from "../ui/icon";
import { Crest } from "../ui/crest";

interface SearchResult {
  type: "team" | "match";
  id: string;
  label: string;
  sub: string;
  href: string;
  seed: string;
  seed2?: string;
}

/** Topbar search wired to real team + match lookup with keyboard navigation. */
export function SearchBox() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: teams = [] } = useQuery({ queryKey: ["teams", "all"], queryFn: () => api.teams() });
  const { data: fixtures = [] } = useQuery({ queryKey: ["fixtures", ""], queryFn: () => api.fixtures() });
  const { data: results = [] } = useQuery({ queryKey: ["results", ""], queryFn: () => api.results() });

  const items = useMemo<SearchResult[]>(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    const out: SearchResult[] = [];
    teams
      .filter((t) => t.name.toLowerCase().includes(term) || t.shortName.toLowerCase().includes(term))
      .slice(0, 5)
      .forEach((t) => out.push({ type: "team", id: t.id, label: t.name, sub: "Team", href: `/teams/${t.id}`, seed: t.id }));
    [...fixtures, ...results]
      .filter((m) => m.homeTeamName.toLowerCase().includes(term) || m.awayTeamName.toLowerCase().includes(term))
      .slice(0, 5)
      .forEach((m) =>
        out.push({
          type: "match",
          id: m.id,
          label: `${m.homeTeamName} v ${m.awayTeamName}`,
          sub: m.status === "FINISHED" ? "Result" : "Fixture",
          href: `/matches/${m.id}`,
          seed: m.homeTeamId,
          seed2: m.awayTeamId,
        }),
      );
    return out.slice(0, 8);
  }, [q, teams, fixtures, results]);

  // ⌘K / Ctrl-K focuses the search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Close on outside click.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function go(r: SearchResult) {
    setOpen(false);
    setQ("");
    router.push(r.href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && items[active]) {
      e.preventDefault();
      go(items[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showList = open && items.length > 0;

  return (
    <div
      ref={wrapRef}
      style={{ position: "relative", marginLeft: "auto" }}
      role="combobox"
      aria-expanded={showList}
      aria-haspopup="listbox"
      aria-controls="search-listbox"
    >
      <div className="tb-search" style={{ margin: 0 }}>
        <Icon name="search" size={15} />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search teams, players, matches…"
          aria-label="Search teams and matches"
          aria-controls="search-listbox"
          aria-autocomplete="list"
        />
        <kbd>⌘K</kbd>
      </div>
      {showList && (
        <ul
          id="search-listbox"
          role="listbox"
          aria-label="Search results"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            left: 0,
            zIndex: 60,
            background: "var(--surface-1)",
            border: "1px solid var(--line-2)",
            borderRadius: 12,
            boxShadow: "var(--shadow-2)",
            padding: 6,
            margin: 0,
            listStyle: "none",
            maxHeight: 360,
            overflowY: "auto",
          }}
        >
          {items.map((r, i) => (
            <li
              key={`${r.type}-${r.id}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                go(r);
              }}
              className="flex aic gap-10"
              style={{
                padding: "9px 10px",
                borderRadius: 9,
                cursor: "pointer",
                background: i === active ? "var(--surface-3)" : "transparent",
              }}
            >
              {r.type === "team" ? (
                <Crest name={r.label} seed={r.seed} size="xs" />
              ) : (
                <span className="tb-icon" style={{ width: 26, height: 26, borderRadius: 7 }} aria-hidden>
                  <Icon name="match" size={14} />
                </span>
              )}
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</span>
              </span>
              <span className="badge" style={{ fontSize: 9 }}>{r.sub}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
