"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../services/api-client";
import { clubCode } from "../../../lib/club";
import { distinctMatchdays, filterByMatchday } from "../../../lib/fixtures";
import { usePredictions } from "../../../hooks/use-predictions";
import { useMobileNav } from "../nav-context";
import { Crest, Tribar } from "../ui";
import { outcomePct, pickClass, pickOf } from "../view";

export function FixturesScreen() {
  const nav = useMobileNav();
  const [matchday, setMatchday] = useState<number | null>(null);
  const { data: allFixtures = [], isLoading } = useQuery({
    queryKey: ["fixtures", ""],
    queryFn: () => api.fixtures(),
  });

  const matchdays = useMemo(() => distinctMatchdays(allFixtures), [allFixtures]);
  useEffect(() => {
    if (matchday !== null && !matchdays.includes(matchday)) setMatchday(null);
  }, [matchdays, matchday]);

  const fixtures = useMemo(() => filterByMatchday(allFixtures, matchday), [allFixtures, matchday]);
  const preds = usePredictions(fixtures.map((m) => m.id));

  return (
    <>
      <div className="lg-head">
        <div className="lg-eyebrow">Schedule &amp; model reads</div>
        <div className="lg-title">Fixtures</div>
        <div className="lg-sub">Every fixture with win probability, confidence and the model&apos;s pick.</div>
      </div>

      {matchdays.length > 1 && (
        <div className="seg-row" style={{ marginTop: 14 }}>
          <button className={`seg${matchday === null ? " active" : ""}`} onClick={() => setMatchday(null)}>
            All
          </button>
          {matchdays.map((md) => (
            <button key={md} className={`seg${matchday === md ? " active" : ""}`} onClick={() => setMatchday(md)}>
              MD {md}
            </button>
          ))}
        </div>
      )}

      <div>
        <div className="list-sec">
          <span className="badge blue" style={{ fontSize: 9 }}>
            ALL
          </span>{" "}
          {matchday === null ? "Upcoming fixtures" : `Matchday ${matchday}`}
          <span className="badge" style={{ marginLeft: "auto" }}>
            {fixtures.length}
          </span>
        </div>
        <div className="block" style={{ paddingTop: 2 }}>
          <div className="m-card">
            {fixtures.map((m) => {
              const p = preds[m.id];
              const split = outcomePct(p);
              const pick = pickOf(p);
              return (
                <div className="match-row tappable" key={m.id} onClick={() => nav.pushScreen("match", m)}>
                  <div className="match-time">
                    <div className="t">{new Date(m.utcDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                    <div className="d">{new Date(m.utcDate).toLocaleDateString([], { weekday: "short" })}</div>
                  </div>
                  <div className="mr-teams">
                    <div className="mr-team">
                      <Crest name={m.homeTeamName} seed={m.homeTeamId} size="xs" />
                      <span className="nm">{clubCode(m.homeTeamName)}</span>
                    </div>
                    <div className="mr-team">
                      <Crest name={m.awayTeamName} seed={m.awayTeamId} size="xs" />
                      <span className="nm">{clubCode(m.awayTeamName)}</span>
                    </div>
                  </div>
                  <div className="grow" style={{ maxWidth: 104 }}>
                    {split ? <Tribar hp={split.hp} dp={split.dp} ap={split.ap} legend={false} /> : <div style={{ height: 7 }} />}
                  </div>
                  {pick ? (
                    <div className={`pickb ${pickClass(pick)}`}>{pick}</div>
                  ) : (
                    <div className="pickb d">–</div>
                  )}
                </div>
              );
            })}
            {!isLoading && fixtures.length === 0 && (
              <div className="dim" style={{ padding: 16, fontSize: 13 }}>
                No scheduled matches for this competition right now.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
