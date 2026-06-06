"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../services/api-client";
import { PageHead } from "../../../components/ui/page-head";
import { Crest } from "../../../components/ui/crest";
import { Icon } from "../../../components/ui/icon";
import { SkeletonRows } from "../../../components/ui/skeleton";
import type {
  BracketTeam,
  BracketTie,
  ProjectedGroup,
  ProjectedStanding,
} from "../../../lib/types";

const pct = (n: number) => `${Math.round(n * 100)}%`;

/** Date range across a round's ties, e.g. "Jun 28 – Jul 3". */
function roundDate(ties: BracketTie[]): string {
  const dates = ties
    .map((t) => t.utcDate)
    .filter((d): d is string => Boolean(d))
    .sort();
  if (dates.length === 0) return "";
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString([], { month: "short", day: "numeric" });
  const first = fmt(dates[0]);
  const last = fmt(dates[dates.length - 1]);
  return first === last ? first : `${first} – ${last}`;
}

export default function BracketPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["tournament-bracket"],
    queryFn: api.tournamentBracket,
  });

  return (
    <>
      <PageHead
        eyebrow="FIFA World Cup 2026 · True Football Intelligence"
        title="Projected Bracket"
        sub="A transparent, probabilistic read of how the 48-team tournament could unfold — group tables, qualifiers and a path to the final, all model-projected."
      />

      {isLoading || !data ? (
        <div className="card reveal">
          <div className="card-bd">
            <SkeletonRows rows={8} />
          </div>
        </div>
      ) : (
        <>
          {/* Projected champion */}
          {data.champion && (
            <section
              className="card reveal"
              style={{
                marginBottom: 22,
                background:
                  "linear-gradient(120deg, color-mix(in srgb, var(--blue) 16%, transparent), transparent 70%)",
              }}
            >
              <div
                className="card-bd flex aic gap-16 wrap"
                style={{ padding: "18px 20px" }}
              >
                <div className="flex aic gap-12" style={{ flex: 1, minWidth: 200 }}>
                  <Crest name={data.champion.name} seed={data.champion.teamId} size="lg" />
                  <div>
                    <div className="label-xs flex aic gap-6">
                      <Icon name="trophy" size={13} /> Projected champion
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text)" }}>
                      {data.champion.name}
                    </div>
                    <div className="dim" style={{ fontSize: 12 }}>
                      Group {data.champion.group} · model strength seed #{data.champion.seed}
                    </div>
                  </div>
                </div>
                <p
                  className="muted"
                  style={{ flex: 1, minWidth: 240, fontSize: 12.5, lineHeight: 1.5, margin: 0 }}
                >
                  {data.disclaimer}
                </p>
              </div>
            </section>
          )}

          {/* Knockout bracket */}
          <section className="card reveal" style={{ marginBottom: 22 }}>
            <div className="card-hd">
              <h3>Path to the final</h3>
              <span className="badge">Single-elimination · 32 qualifiers</span>
            </div>
            <div className="card-bd" style={{ overflowX: "auto", paddingBottom: 8 }}>
              <div className="flex" style={{ gap: 16, minWidth: "min-content", alignItems: "flex-start" }}>
                {data.rounds.map((round) => (
                  <div key={round.name} style={{ minWidth: 196, flexShrink: 0 }}>
                    <div className="label-xs" style={{ marginBottom: 10, textAlign: "center" }}>
                      {round.name}
                      <span className="dim"> · {round.ties.length}</span>
                      <div className="dim" style={{ fontWeight: 400, marginTop: 2 }}>
                        {roundDate(round.ties)}
                      </div>
                    </div>
                    <div className="flex col" style={{ gap: 10 }}>
                      {round.ties.map((tie) => (
                        <TieCard key={tie.id} tie={tie} />
                      ))}
                    </div>
                  </div>
                ))}

                {/* Third-place play-off */}
                {data.thirdPlacePlayoff && (
                  <div style={{ minWidth: 196, flexShrink: 0 }}>
                    <div className="label-xs" style={{ marginBottom: 10, textAlign: "center" }}>
                      Third place
                      <div className="dim" style={{ fontWeight: 400, marginTop: 2 }}>
                        {roundDate([data.thirdPlacePlayoff])}
                      </div>
                    </div>
                    <TieCard tie={data.thirdPlacePlayoff} />
                  </div>
                )}
              </div>
            </div>
            <div className="board-ft" style={{ justifyContent: "flex-start" }}>
              <span className="muted" style={{ fontSize: 11.5 }}>
                <Icon name="bolt" size={12} /> {data.model}
              </span>
            </div>
          </section>

          {/* Projected group tables */}
          <section className="reveal">
            <div className="flex aic jcb wrap" style={{ marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>Projected group stage</h3>
              <span className="flex aic gap-12 dim" style={{ fontSize: 11.5 }}>
                <LegendDot color="var(--green)" label="Advance (top 2)" />
                <LegendDot color="var(--blue)" label="Best-3rd qualifier" />
              </span>
            </div>
            <div
              className="grid"
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: 16,
              }}
            >
              {data.groups.map((group) => (
                <GroupCard
                  key={group.code}
                  group={group}
                  qualifiedThirds={new Set(
                    data.thirdPlaceRanking.filter((t) => t.qualified).map((t) => t.teamId),
                  )}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </>
  );
}

function TieCard({ tie }: { tie: BracketTie }) {
  const card = (
    <div
      className="card"
      style={{ padding: 0, overflow: "hidden", boxShadow: "none", border: "1px solid var(--line)" }}
    >
      <TeamRow team={tie.home} advance={tie.homeAdvance} won={tie.winnerId === tie.home?.teamId} />
      <div style={{ height: 1, background: "var(--line)" }} />
      <TeamRow team={tie.away} advance={tie.awayAdvance} won={tie.winnerId === tie.away?.teamId} />
    </div>
  );

  // A resolved tie deep-links into full match intelligence for the matchup.
  if (tie.home && tie.away) {
    return (
      <Link
        href={`/matches/${tie.id}`}
        title={`Match intel — ${tie.home.name} vs ${tie.away.name}`}
        style={{ display: "block", color: "inherit", textDecoration: "none" }}
      >
        {card}
      </Link>
    );
  }
  return card;
}

function TeamRow({
  team,
  advance,
  won,
}: {
  team: BracketTeam | null;
  advance: number;
  won: boolean;
}) {
  return (
    <div
      className="flex aic gap-8"
      style={{
        padding: "8px 10px",
        background: won ? "color-mix(in srgb, var(--green) 12%, transparent)" : "transparent",
      }}
    >
      {team ? (
        <>
          <Crest name={team.name} seed={team.teamId} size="xs" />
          <span
            style={{
              flex: 1,
              fontSize: 12.5,
              fontWeight: won ? 700 : 500,
              color: won ? "var(--text)" : "var(--dim)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            title={`${team.name} — ${team.source}`}
          >
            {team.shortName}
          </span>
          <span
            className="mono"
            style={{ fontSize: 11, color: won ? "var(--green-2)" : "var(--dim)" }}
          >
            {pct(advance)}
          </span>
          {won && (
            <span style={{ color: "var(--green-2)", display: "inline-flex" }}>
              <Icon name="check" size={12} />
            </span>
          )}
        </>
      ) : (
        <span className="dim" style={{ fontSize: 12 }}>TBD</span>
      )}
    </div>
  );
}

function GroupCard({
  group,
  qualifiedThirds,
}: {
  group: ProjectedGroup;
  qualifiedThirds: Set<string>;
}) {
  return (
    <div className="card">
      <div className="card-hd" style={{ padding: "10px 14px" }}>
        <h3 style={{ fontSize: 13 }}>Group {group.code}</h3>
        <span className="badge" style={{ fontSize: 9 }}>xPts</span>
      </div>
      <div className="card-bd" style={{ padding: 0 }}>
        <table className="tbl">
          <tbody>
            {group.table.map((row) => {
              const advances =
                row.position <= 2 || qualifiedThirds.has(row.teamId);
              const accent = qualifiedAccent(row, qualifiedThirds);
              return (
                <tr key={row.teamId}>
                  <td style={{ width: 26, textAlign: "center" }}>
                    <span
                      style={{
                        display: "inline-block",
                        width: 3,
                        height: 14,
                        borderRadius: 2,
                        background: accent,
                        marginRight: 4,
                        verticalAlign: "middle",
                      }}
                    />
                    <span className="mono dim" style={{ fontSize: 11 }}>{row.position}</span>
                  </td>
                  <td>
                    <span className="flex aic gap-7">
                      <Crest name={row.name} seed={row.teamId} size="xs" />
                      <span
                        style={{
                          fontSize: 12.5,
                          fontWeight: advances ? 600 : 400,
                          color: advances ? "var(--text)" : "var(--dim)",
                        }}
                      >
                        {row.name}
                      </span>
                    </span>
                  </td>
                  <td className="num mono" style={{ fontSize: 12 }}>
                    {row.expectedPoints.toFixed(1)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function qualifiedAccent(row: ProjectedStanding, qualifiedThirds: Set<string>): string {
  if (row.position <= 2) return "var(--green)";
  if (qualifiedThirds.has(row.teamId)) return "var(--blue)";
  return "transparent";
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex aic gap-5">
      <span style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
      {label}
    </span>
  );
}
