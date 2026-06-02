"use client";

import { useMemo, useState, type ReactNode } from "react";

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  align?: "left" | "right" | "center";
  width?: string;
  render?: (row: T) => ReactNode;
  /** Value used for sorting/searching when not a plain row[key]. */
  sortValue?: (row: T) => string | number;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  searchKeys?: (keyof T)[];
  searchPlaceholder?: string;
  pageSize?: number;
  initialSort?: { key: string; dir: "asc" | "desc" };
  /** Extra controls (filters) rendered in the toolbar. */
  toolbar?: ReactNode;
  emptyText?: string;
  getId?: (row: T) => string;
}

/** Sortable, searchable, paginated table — React port of the prototype engine. */
export function DataTable<T extends object>({
  columns,
  rows,
  searchKeys,
  searchPlaceholder = "Search…",
  pageSize = 10,
  initialSort,
  toolbar,
  emptyText = "No records match your filters.",
  getId = (r) => String((r as { id?: unknown }).id ?? JSON.stringify(r)),
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(initialSort?.key ?? null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(initialSort?.dir ?? "asc");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let out = rows;
    if (q && searchKeys?.length) {
      out = out.filter((r) =>
        searchKeys.some((k) => String(r[k] ?? "").toLowerCase().includes(q)),
      );
    }
    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey);
      const val = col?.sortValue ?? ((r: T) => r[sortKey as keyof T] as string | number);
      out = [...out].sort((a, b) => {
        const x = val(a);
        const y = val(b);
        const cmp = x < y ? -1 : x > y ? 1 : 0;
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return out;
  }, [rows, search, searchKeys, sortKey, sortDir, columns]);

  const total = filtered.length;
  const maxPage = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, maxPage);
  const start = (safePage - 1) * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function gotoPage(p: number) {
    setPage(Math.min(Math.max(1, p), maxPage));
  }

  const pages = pageList(safePage, maxPage);

  return (
    <div>
      {(searchKeys || toolbar) && (
        <div className="dt-toolbar">
          {searchKeys && (
            <div className="f-search">
              <SearchIcon />
              <input
                value={search}
                placeholder={searchPlaceholder}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                aria-label="Search table"
              />
            </div>
          )}
          {toolbar}
        </div>
      )}

      <div className="dt-wrap">
        <div className="dt-scroll">
          <table className="dt">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className={`${c.sortable ? "sortable " : ""}${
                      sortKey === c.key ? sortDir : ""
                    }`}
                    style={{
                      width: c.width,
                      textAlign: c.align ?? "left",
                    }}
                    onClick={c.sortable ? () => toggleSort(c.key) : undefined}
                  >
                    {c.label}
                    {c.sortable && <span className="arr">▾</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr className="empty-row">
                  <td colSpan={columns.length}>{emptyText}</td>
                </tr>
              ) : (
                pageRows.map((row) => (
                  <tr key={getId(row)}>
                    {columns.map((c) => (
                      <td key={c.key} style={{ textAlign: c.align ?? "left" }}>
                        {c.render ? c.render(row) : String(row[c.key as keyof T] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="dt-pag">
          <div className="info">
            Showing <b>{total ? start + 1 : 0}</b>–
            <b>{Math.min(start + pageSize, total)}</b> of <b>{total}</b>
          </div>
          <div className="pag-btns">
            <button onClick={() => gotoPage(safePage - 1)} disabled={safePage === 1}>
              ‹
            </button>
            {pages.map((p, i) =>
              p === "…" ? (
                <button key={`gap${i}`} disabled>
                  …
                </button>
              ) : (
                <button
                  key={p}
                  className={p === safePage ? "active" : ""}
                  onClick={() => gotoPage(p as number)}
                >
                  {p}
                </button>
              ),
            )}
            <button
              onClick={() => gotoPage(safePage + 1)}
              disabled={safePage === maxPage}
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function pageList(cur: number, max: number): (number | "…")[] {
  if (max <= 7) return Array.from({ length: max }, (_, i) => i + 1);
  const set = new Set([1, 2, max - 1, max, cur - 1, cur, cur + 1]);
  const arr = [...set].filter((p) => p >= 1 && p <= max).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  let prev = 0;
  for (const p of arr) {
    if (p - prev > 1) out.push("…");
    out.push(p);
    prev = p;
  }
  return out;
}

function SearchIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
