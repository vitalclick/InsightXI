"use client";

/**
 * InsightXI Mobile — shared presentational atoms used across screens.
 * These lean on the design-system / mobile.css class system (crest, badge,
 * tribar, form dots, …) so they stay visually identical to the prototype.
 */
import { useEffect, useState } from "react";
import { CLUBS, type ClubCode, type FormResult } from "./data";

export type CrestSize = "xs" | "sm" | "md" | "lg" | "xl";

/** Coloured club crest chip with the 3-letter short code. */
export function Crest({ code, size = "sm" }: { code: ClubCode; size?: CrestSize }) {
  const c = CLUBS[code];
  if (!c) return null;
  return (
    <div className={`crest ${size}`} style={{ background: `linear-gradient(150deg,${c.c1},${c.c2})` }}>
      {c.short}
    </div>
  );
}

/** Home / draw / away probability bar plus the H/D/A legend. */
export function Tribar({ hp, dp, ap, legend = true }: { hp: number; dp: number; ap: number; legend?: boolean }) {
  return (
    <>
      <div className="tribar">
        <i style={{ width: `${hp}%`, background: "var(--blue)" }} />
        <i style={{ width: `${dp}%`, background: "#54607a" }} />
        <i style={{ width: `${ap}%`, background: "var(--green)" }} />
      </div>
      {legend && (
        <div className="tri-legend">
          <span>H {hp}%</span>
          <span>D {dp}%</span>
          <span>A {ap}%</span>
        </div>
      )}
    </>
  );
}

/** Recent-form W/D/L dots. */
export function FormDots({ form }: { form: FormResult[] }) {
  return (
    <div className="form-row">
      {form.map((f, i) => (
        <span key={i} className={`fdot ${f.toLowerCase()}`}>
          {f}
        </span>
      ))}
    </div>
  );
}

/** Small labelled stat cell (Over 1.5 / BTTS …). */
export function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        flex: 1,
        textAlign: "center",
        padding: "10px 4px",
        borderRadius: 11,
        background: "var(--surface-1)",
        border: "1px solid var(--line)",
      }}
    >
      <div className="mono" style={{ fontWeight: 700, fontSize: 16 }}>
        {value}
      </div>
      <div className="dim" style={{ fontSize: 9.5, marginTop: 2 }}>
        {label}
      </div>
    </div>
  );
}

/** Colour for a confidence value, matching the prototype thresholds. */
export function confColor(c: number): string {
  return c >= 70 ? "var(--green-2)" : c >= 60 ? "var(--blue-2)" : "var(--gold)";
}

export function ordinal(p: number): string {
  return p === 1 ? "st" : p === 2 ? "nd" : p === 3 ? "rd" : "th";
}

/** Thin progress meter that animates its fill from 0 → `value`% on mount. */
export function Meter({ value, green, height = 5 }: { value: number; green?: boolean; height?: number }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setW(value));
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return (
    <div className={`meter${green ? " green" : ""}`} style={{ height }}>
      <i style={{ width: `${w}%`, transition: "width 1s cubic-bezier(.3,1,.4,1)" }} />
    </div>
  );
}
