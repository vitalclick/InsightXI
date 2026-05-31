"use client";

import { useState } from "react";
import { CLUBS, CLUB_CODES, FEATURE_MATCH, UPCOMING, type AnyMatch } from "../data";
import { useMobileNav } from "../nav-context";
import { Crest, confColor } from "../ui";
import { Icon } from "../icons";

const DAYS: [string, string][] = [
  ["Thu", "28 May"],
  ["Fri", "29 May"],
  ["Today", "30 May"],
  ["Sun", "1 Jun"],
  ["Mon", "2 Jun"],
];

interface BoardRow {
  h: string;
  a: string;
  conf: number;
  pk: "h" | "a" | "d";
  t: string;
}

const TODAY: BoardRow[] = [
  { h: "CLF", a: "FNL", conf: 73, pk: "h", t: "12:30" },
  { h: "MRD", a: "STG", conf: 61, pk: "h", t: "14:00" },
  { h: "NTH", a: "BRK", conf: 58, pk: "a", t: "15:00" },
  { h: "RVS", a: "KGT", conf: 74, pk: "h", t: "17:30" },
  { h: "HRT", a: "ASH", conf: 64, pk: "h", t: "19:45" },
  { h: "WLM", a: "PRT", conf: 60, pk: "h", t: "20:00" },
];

function makeDay(key: string): BoardRow[] {
  if (key === "Today") return TODAY;
  const seed = key.charCodeAt(0) + key.length;
  return [0, 1, 2, 3, 4].map((i) => {
    const h = CLUB_CODES[(seed * 3 + i * 5) % CLUB_CODES.length];
    let a = CLUB_CODES[(seed * 7 + i * 3 + 2) % CLUB_CODES.length];
    if (a === h) a = CLUB_CODES[(seed + i + 1) % CLUB_CODES.length];
    const conf = 54 + ((seed * 5 + i * 11) % 28);
    const pk: "h" | "a" | "d" = conf % 3 === 0 ? "a" : conf % 5 === 0 ? "d" : "h";
    return { h, a, conf, pk, t: ["12:30", "15:00", "17:30", "19:45", "20:00"][i] };
  });
}

export function BoardScreen() {
  const nav = useMobileNav();
  const [day, setDay] = useState("Today");
  const rows = makeDay(day);

  const openRow = (r: BoardRow) => {
    const up = UPCOMING.find((x) => x.home === r.h && x.away === r.a);
    nav.pushScreen(
      "match",
      (up ?? {
        home: r.h,
        away: r.a,
        comp: "Premier League",
        hp: 46,
        dp: 28,
        ap: 26,
        conf: 70,
        pick: CLUBS[r.h].short,
        time: "17:30",
        date: "Today",
      }) as AnyMatch,
    );
  };

  return (
    <>
      <div className="lg-head" style={{ paddingTop: 14 }}>
        <div className="lg-eyebrow">Today&apos;s intelligence board</div>
        <div className="lg-title">Confidence Board</div>
        <div className="lg-sub">Matches by date with AI picks, confidence-ranked.</div>
      </div>

      <div className="seg-row" style={{ marginTop: 14 }}>
        {DAYS.map((d) => (
          <button key={d[0]} className={`seg day${day === d[0] ? " active" : ""}`} onClick={() => setDay(d[0])}>
            {d[0]}
            <small>{d[1]}</small>
          </button>
        ))}
      </div>

      <div className="block">
        <div className="block-hd">
          <h2>
            <span className="ic">
              <Icon name="star" />
            </span>
            Match of the Day
          </h2>
        </div>
        <div className="m-card pad tappable" onClick={() => nav.pushScreen("match", FEATURE_MATCH)}>
          <div className="flex aic jcb" style={{ marginBottom: 14 }}>
            <div className="flex col aic gap-8" style={{ flex: 1 }}>
              <Crest code="RVS" size="lg" />
              <div style={{ fontWeight: 700, fontSize: 13 }}>Riverside FC</div>
            </div>
            <div className="flex col aic" style={{ padding: "0 8px" }}>
              <span className="mono dim" style={{ fontSize: 12, letterSpacing: ".12em" }}>
                VS
              </span>
              <span className="badge blue" style={{ marginTop: 8 }}>
                AI 74%
              </span>
            </div>
            <div className="flex col aic gap-8" style={{ flex: 1 }}>
              <Crest code="KGT" size="lg" />
              <div style={{ fontWeight: 700, fontSize: 13 }}>Kingsgate</div>
            </div>
          </div>
          <div className="flex gap-8">
            <div className="prob-pill fav" style={{ flexDirection: "column", gap: 3, padding: "11px 4px" }}>
              <Crest code="RVS" size="xs" />
              <b className="mono" style={{ fontSize: 15 }}>
                47%
              </b>
              <span className="dim" style={{ fontSize: 10 }}>
                Home
              </span>
            </div>
            <div className="prob-pill" style={{ flexDirection: "column", gap: 3, padding: "11px 4px" }}>
              <span className="pickb d" style={{ width: 24, height: 24, fontSize: 10 }}>
                X
              </span>
              <b className="mono" style={{ fontSize: 15 }}>
                27%
              </b>
              <span className="dim" style={{ fontSize: 10 }}>
                Draw
              </span>
            </div>
            <div className="prob-pill" style={{ flexDirection: "column", gap: 3, padding: "11px 4px" }}>
              <Crest code="KGT" size="xs" />
              <b className="mono" style={{ fontSize: 15 }}>
                26%
              </b>
              <span className="dim" style={{ fontSize: 10 }}>
                Away
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="block">
        <div className="block-hd">
          <h2>
            <span className="ic">
              <Icon name="grid" />
            </span>
            AI Picks
          </h2>
          <span className="badge">Premier League</span>
        </div>
        <div className="m-card">
          {rows.map((r, i) => (
            <div className="match-row tappable" key={`${r.h}-${r.a}-${i}`} onClick={() => openRow(r)}>
              <div className="match-time">
                <div className="t">{r.t}</div>
              </div>
              <div className="mr-teams">
                <div className="mr-team">
                  <Crest code={r.h} size="xs" />
                  <span className="nm">{CLUBS[r.h].short}</span>
                </div>
                <div className="mr-team">
                  <Crest code={r.a} size="xs" />
                  <span className="nm">{CLUBS[r.a].short}</span>
                </div>
              </div>
              <div className="mr-conf">
                <div className="pct" style={{ color: confColor(r.conf) }}>
                  {r.conf}%
                </div>
              </div>
              <div className={`pickb ${r.pk}`}>{r.pk === "h" ? "1" : r.pk === "a" ? "2" : "X"}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="block">
        <div className="list-sec" style={{ paddingLeft: 0 }}>
          <span className="badge gold" style={{ fontSize: 9 }}>
            CC
          </span>{" "}
          Continental Cup
          <span className="badge gold" style={{ marginLeft: "auto" }}>
            <Icon name="premium" /> Premium
          </span>
        </div>
        <div
          className="m-card pad"
          style={{
            textAlign: "center",
            background:
              "radial-gradient(360px 200px at 50% 0%,rgba(232,194,112,.1),transparent 62%),var(--surface-1)",
            borderColor: "rgba(232,194,112,.22)",
          }}
        >
          <div style={{ color: "var(--gold)", marginBottom: 8 }}>
            <Icon name="premium" />
          </div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>3 elite-confidence picks locked</div>
          <div className="muted" style={{ fontSize: 12, marginTop: 5, marginBottom: 14 }}>
            Unlock the full cross-competition board with Premium.
          </div>
          <button className="btn btn-gold tappable" onClick={() => nav.pushScreen("premium")}>
            Unlock Premium →
          </button>
        </div>
      </div>
    </>
  );
}
