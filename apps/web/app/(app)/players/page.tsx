"use client";

import Link from "next/link";
import { PageHead } from "../../../components/ui/page-head";
import { Icon } from "../../../components/ui/icon";

const ROADMAP = [
  { t: "Player ratings", d: "Per-90 contribution scores blending goals, assists, xG and xA into a single rating.", cls: "blue" },
  { t: "Lineup impact", d: "How each starter shifts a team's win probability and expected-goals swing.", cls: "green" },
  { t: "Fatigue & load", d: "Minutes, travel and congestion modelled into a per-player load index.", cls: "amber" },
  { t: "Scouting & similarity", d: "Find players with comparable statistical profiles across competitions.", cls: "violet" },
];

export default function PlayersPage() {
  return (
    <>
      <PageHead
        eyebrow="Player Intelligence"
        title="Players"
        sub="Player-level intelligence arrives with the live data provider integration."
      />

      <section className="card reveal" style={{ marginBottom: 18 }}>
        <div className="card-bd flex aic gap-16 wrap">
          <div className="em-ic" style={{ width: 60, height: 60 }}>
            <Icon name="players" size={28} />
          </div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <h3 style={{ fontSize: 18 }}>Coming with live data</h3>
            <p className="muted" style={{ fontSize: 13.5, marginTop: 6, maxWidth: 560 }}>
              The current dataset powers team- and match-level intelligence. Squad and player feeds land alongside the
              API-Football integration — until then, explore the team strength profiles.
            </p>
          </div>
          <Link href="/teams" className="btn btn-primary">Browse Teams</Link>
        </div>
      </section>

      <div className="grid" style={{ gridTemplateColumns: "repeat(2,1fr)" }}>
        {ROADMAP.map((c) => (
          <div key={c.t} className="card card-hover reveal">
            <div className="card-bd">
              <span className={`badge ${c.cls}`}>Planned</span>
              <div style={{ fontWeight: 700, fontSize: 15, margin: "10px 0 6px" }}>{c.t}</div>
              <div className="muted" style={{ fontSize: 13, lineHeight: 1.5 }}>{c.d}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
