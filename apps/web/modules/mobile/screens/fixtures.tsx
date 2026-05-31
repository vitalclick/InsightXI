"use client";

import { useState } from "react";
import { CLUBS, CLUB_CODES, UPCOMING, type AnyMatch } from "../data";
import { useMobileNav } from "../nav-context";
import { Crest, Tribar } from "../ui";

const DAYS: [string, string][] = [
  ["Today", "Today"],
  ["Tomorrow", "Tomorrow"],
  ["Sat", "Sat"],
  ["Sun", "1 Jun"],
  ["Mon", "2 Jun"],
];

interface FixtureRow {
  id: string;
  home: string;
  away: string;
  time: string;
  date: string;
  comp: string;
  conf: number;
  pick: string;
  hp: number;
  dp: number;
  ap: number;
}

/** Real upcoming rows for the next days, deterministically synthesised beyond. */
function group(dayKey: string): FixtureRow[] {
  const fromData = UPCOMING.filter(
    (m) =>
      (dayKey === "Today" && m.date === "Today") ||
      (dayKey === "Tomorrow" && m.date === "Tomorrow") ||
      (dayKey === "Sat" && m.date === "Sat"),
  );
  if (fromData.length) return fromData;

  const seed = dayKey.charCodeAt(0);
  return [0, 1, 2, 3].map((i) => {
    const h = CLUB_CODES[(seed + i * 3) % CLUB_CODES.length];
    const a = CLUB_CODES[(seed + i * 5 + 4) % CLUB_CODES.length];
    const hh = h === a ? CLUB_CODES[(seed + i + 7) % CLUB_CODES.length] : h;
    const conf = 52 + ((seed * 7 + i * 13) % 26);
    const hp = 30 + ((i * 6) % 22);
    const ap = 26 + ((i * 4) % 16);
    const dp = 100 - hp - ap;
    return {
      id: "syn" + dayKey + i,
      home: hh,
      away: a,
      time: ["12:30", "15:00", "17:30", "20:00"][i],
      date: dayKey,
      comp: "Premier League",
      conf,
      pick: hp > ap ? CLUBS[hh].short : CLUBS[a].short,
      hp,
      dp,
      ap,
    };
  });
}

export function FixturesScreen() {
  const nav = useMobileNav();
  const [day, setDay] = useState("Today");
  const rows = group(day);

  return (
    <>
      <div className="lg-head">
        <div className="lg-eyebrow">Schedule &amp; model reads</div>
        <div className="lg-title">Fixtures</div>
        <div className="lg-sub">Every fixture with win probability, confidence and the model&apos;s pick.</div>
      </div>

      <div className="seg-row" style={{ marginTop: 14 }}>
        {DAYS.map((d) => (
          <button key={d[0]} className={`seg day${day === d[0] ? " active" : ""}`} onClick={() => setDay(d[0])}>
            {d[0]}
            <small>{d[1]}</small>
          </button>
        ))}
      </div>

      <div>
        <div className="list-sec">
          <span className="badge blue" style={{ fontSize: 9 }}>
            PL
          </span>{" "}
          Premier League
        </div>
        <div className="block" style={{ paddingTop: 2 }}>
          <div className="m-card">
            {rows.map((m) => {
              const pick = m.hp >= m.dp && m.hp >= m.ap ? "1" : m.ap >= m.dp ? "2" : "X";
              const pickCls = m.hp >= m.dp && m.hp >= m.ap ? "h" : m.ap >= m.dp ? "a" : "d";
              return (
                <div
                  className="match-row tappable"
                  key={m.id}
                  onClick={() => nav.pushScreen("match", m as AnyMatch)}
                >
                  <div className="match-time">
                    <div className="t">{m.time}</div>
                  </div>
                  <div className="mr-teams">
                    <div className="mr-team">
                      <Crest code={m.home} size="xs" />
                      <span className="nm">{CLUBS[m.home].short}</span>
                    </div>
                    <div className="mr-team">
                      <Crest code={m.away} size="xs" />
                      <span className="nm">{CLUBS[m.away].short}</span>
                    </div>
                  </div>
                  <div className="grow" style={{ maxWidth: 104 }}>
                    <Tribar hp={m.hp} dp={m.dp} ap={m.ap} />
                  </div>
                  <div className={`pickb ${pickCls}`}>{pick}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
