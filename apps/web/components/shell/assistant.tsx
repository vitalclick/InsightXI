"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { useUiStore } from "../../store/ui-store";
import { Icon } from "../ui/icon";
import { answerQuery, SUGGESTIONS, type AssistantAnswer } from "../../lib/assistant";

interface Turn {
  q: string;
  a?: AssistantAnswer;
  error?: boolean;
}

/**
 * Insight — a grounded AI assistant drawer. It answers from real model output
 * (ratings, predictions, H2H) rather than free-form generation, so every
 * reply is explainable and tied to a fixture you can open.
 */
export function Assistant() {
  const open = useUiStore((s) => s.assistantOpen);
  const close = useUiStore((s) => s.closeAssistant);
  const [q, setQ] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const ask = useMutation({
    mutationFn: (query: string) => answerQuery(query),
    onMutate: (query) => setTurns((t) => [...t, { q: query }]),
    onSuccess: (a) => setTurns((t) => t.map((turn, i) => (i === t.length - 1 ? { ...turn, a } : turn))),
    onError: () => setTurns((t) => t.map((turn, i) => (i === t.length - 1 ? { ...turn, error: true } : turn))),
  });

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [turns]);

  function submit(query: string) {
    const text = query.trim();
    if (!text || ask.isPending) return;
    setQ("");
    ask.mutate(text);
  }

  if (!open) return null;

  return (
    <>
      <button
        aria-label="Close assistant"
        onClick={close}
        style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(0,0,0,.45)", border: "none" }}
      />
      <aside
        role="dialog"
        aria-label="Insight AI assistant"
        aria-modal="true"
        className="ix-assistant"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(420px, 100vw)",
          zIndex: 71,
          background: "linear-gradient(180deg, var(--surface-1), var(--card-grad-2))",
          borderLeft: "1px solid var(--line-2)",
          boxShadow: "var(--shadow-3)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <header className="flex jcb aic" style={{ padding: "16px 18px", borderBottom: "1px solid var(--line)" }}>
          <div className="flex aic gap-10">
            <span className="tb-icon" aria-hidden style={{ width: 34, height: 34, color: "var(--blue-2)", borderColor: "rgba(46,125,255,.3)", background: "rgba(46,125,255,.1)" }}>
              <Icon name="bolt" size={17} />
            </span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Insight</div>
              <div className="dim" style={{ fontSize: 11 }}>Grounded in live model output</div>
            </div>
          </div>
          <button className="tb-icon" onClick={close} aria-label="Close assistant" title="Close">
            <Icon name="menu" size={16} />
          </button>
        </header>

        <div ref={logRef} style={{ flex: 1, overflowY: "auto", padding: "16px 18px" }}>
          {turns.length === 0 && (
            <div className="dim" style={{ fontSize: 13, lineHeight: 1.6 }}>
              Ask about a team, an upcoming fixture, or today&apos;s picks. Answers are derived from the model&apos;s real
              ratings and predictions — probabilities, not guarantees.
            </div>
          )}
          {turns.map((t, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <div className="flex" style={{ justifyContent: "flex-end", marginBottom: 8 }}>
                <span style={{ background: "var(--surface-3)", borderRadius: "12px 12px 4px 12px", padding: "8px 12px", fontSize: 13, maxWidth: "85%" }}>{t.q}</span>
              </div>
              {t.a ? (
                <div style={{ background: "var(--surface-1)", border: "1px solid var(--line)", borderRadius: "12px 12px 12px 4px", padding: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: t.a.lines.length ? 8 : 0 }}>{t.a.title}</div>
                  {t.a.lines.map((l, j) => (
                    <div key={j} className="flex aic gap-8" style={{ fontSize: 12.5, color: "var(--text-2)", padding: "3px 0" }}>
                      <span style={{ color: "var(--blue-2)" }}>›</span>
                      <span>{l}</span>
                    </div>
                  ))}
                  {t.a.note && <div className="dim" style={{ fontSize: 12, marginTop: 6 }}>{t.a.note}</div>}
                  {t.a.href && (
                    <Link href={t.a.href} onClick={close} className="btn btn-sm btn-primary" style={{ marginTop: 10 }}>
                      {t.a.hrefLabel ?? "Open →"}
                    </Link>
                  )}
                </div>
              ) : t.error ? (
                <div style={{ fontSize: 12.5, color: "var(--red)" }}>Something went wrong — is the API reachable?</div>
              ) : (
                <div className="dim" style={{ fontSize: 12.5 }}>Analysing…</div>
              )}
            </div>
          ))}
        </div>

        {turns.length === 0 && (
          <div className="flex gap-8 wrap" style={{ padding: "0 18px 12px" }}>
            {SUGGESTIONS.map((s) => (
              <button key={s.query} className="chip" onClick={() => submit(s.query)}>
                {s.label}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(q);
          }}
          style={{ padding: "12px 18px 16px", borderTop: "1px solid var(--line)" }}
        >
          <div className="tb-search" style={{ width: "100%", margin: 0, height: 44 }}>
            <Icon name="search" size={15} />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ask Insight…"
              aria-label="Ask the Insight assistant"
            />
            <button
              type="submit"
              className="tb-icon"
              disabled={ask.isPending || !q.trim()}
              aria-label="Send"
              style={{ width: 30, height: 30, opacity: ask.isPending || !q.trim() ? 0.5 : 1 }}
            >
              <Icon name="up" size={15} />
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}
