"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { API_URL_PUBLIC } from "../../services/api-client";
import type { LiveSnapshot } from "../../lib/types";

export default function LivePage() {
  const [snap, setSnap] = useState<LiveSnapshot | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket: Socket = io(API_URL_PUBLIC, { transports: ["websocket"] });
    socket.on("connect", () => {
      setConnected(true);
      socket.emit("subscribe");
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("live:update", (s: LiveSnapshot) => setSnap(s));
    return () => {
      socket.close();
    };
  }, []);

  return (
    <main className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Live</h1>
        <span
          className={`flex items-center gap-2 text-xs ${
            connected ? "text-signal" : "text-white/40"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              connected ? "animate-pulse bg-signal" : "bg-white/30"
            }`}
          />
          {connected ? "Live feed connected" : "Connecting…"}
        </span>
      </div>

      {!snap ? (
        <p className="text-white/40">Waiting for live match…</p>
      ) : (
        <div className="flex flex-col gap-6">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-wide text-white/40">
              <span>
                {snap.status === "LIVE" ? `${snap.minute}'` : "Full time"}
              </span>
              {snap.status === "LIVE" && (
                <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-red-400">
                  ● LIVE
                </span>
              )}
            </div>
            <div className="flex items-center justify-between text-xl font-semibold">
              <span className="flex-1">{snap.homeTeamName}</span>
              <span className="px-6 text-3xl font-bold tabular-nums">
                {snap.homeGoals} – {snap.awayGoals}
              </span>
              <span className="flex-1 text-right">{snap.awayTeamName}</span>
            </div>

            <div className="mt-5">
              <div className="mb-1 flex justify-between text-[11px] text-white/40">
                <span>Momentum</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-insight/40">
                <div
                  className="h-full bg-signal transition-all duration-700"
                  style={{ width: `${snap.momentum}%` }}
                />
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold text-white/80">
              Event feed
            </h2>
            <ul className="flex flex-col gap-1 text-sm">
              {[...snap.events].reverse().map((e, i) => (
                <li
                  key={i}
                  className={`flex gap-3 rounded-lg px-3 py-2 ${
                    e.type === "GOAL"
                      ? "bg-signal/15 text-white"
                      : "bg-white/5 text-white/60"
                  }`}
                >
                  <span className="w-8 tabular-nums text-white/40">
                    {e.minute}&apos;
                  </span>
                  <span>{e.text}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </main>
  );
}
