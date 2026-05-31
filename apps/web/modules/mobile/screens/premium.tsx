"use client";

import { useMobileNav } from "../nav-context";
import { Icon } from "../icons";

const FEATS: [string, string][] = [
  ["Tactical AI reports", "Full pressing maps, attack zones & momentum"],
  ["Fatigue & lineup impact", "Squad-load modelling and projected XIs"],
  ["Hidden-trend detection", "Cross-season patterns the model surfaces"],
  ["Cross-competition board", "Every league, all confidence picks unlocked"],
  ["Priority live intel", "Real-time alerts the moment edges appear"],
];

export function PremiumScreen() {
  const nav = useMobileNav();

  return (
    <>
      <div className="block" style={{ paddingTop: 14 }}>
        <div className="prem-hero">
          <span className="badge gold" style={{ marginBottom: 12 }}>
            <Icon name="premium" /> Premium Intelligence
          </span>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 26,
              letterSpacing: "-.03em",
              lineHeight: 1.06,
            }}
          >
            Unlock the elite analytics layer
          </div>
          <div className="muted" style={{ fontSize: 13, marginTop: 10, lineHeight: 1.5 }}>
            The tools the pros use — tactical AI reports, fatigue analysis, lineup-impact modelling and hidden-trend
            detection.
          </div>
          <div className="flex gap-16" style={{ marginTop: 18 }}>
            <div>
              <div className="mono" style={{ fontSize: 22, fontWeight: 800, color: "var(--gold)" }}>
                73%
              </div>
              <div className="dim" style={{ fontSize: 11 }}>
                model accuracy
              </div>
            </div>
            <div>
              <div className="mono" style={{ fontSize: 22, fontWeight: 800 }}>
                120+
              </div>
              <div className="dim" style={{ fontSize: 11 }}>
                competitions
              </div>
            </div>
            <div>
              <div className="mono" style={{ fontSize: 22, fontWeight: 800, color: "var(--green)" }}>
                2.4M
              </div>
              <div className="dim" style={{ fontSize: 11 }}>
                matches modelled
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="block">
        <div className="block-hd">
          <h2>Choose your plan</h2>
        </div>
        <div className="flex col gap-12">
          <div className="plan-card featured tappable" onClick={() => nav.toast("Annual plan — checkout (demo)")}>
            <div className="flex aic jcb">
              <div className="flex aic gap-8">
                <b style={{ fontSize: 15 }}>Annual</b>
                <span className="badge gold">Save 34%</span>
              </div>
              <div className="flex aic gap-6" style={{ color: "var(--gold)" }}>
                <Icon name="star" />
              </div>
            </div>
            <div className="flex aic gap-6" style={{ margin: "10px 0 4px" }}>
              <span className="mono" style={{ fontSize: 28, fontWeight: 800 }}>
                £79
              </span>
              <span className="muted" style={{ fontSize: 12 }}>
                / year
              </span>
            </div>
            <div className="dim" style={{ fontSize: 11.5 }}>
              £6.58 / month · billed annually
            </div>
            <button className="btn btn-gold" style={{ width: "100%", marginTop: 13 }}>
              Start Annual
            </button>
          </div>
          <div className="plan-card tappable" onClick={() => nav.toast("Monthly plan — checkout (demo)")}>
            <div className="flex aic jcb">
              <b style={{ fontSize: 15 }}>Monthly</b>
              <span className="badge">Flexible</span>
            </div>
            <div className="flex aic gap-6" style={{ margin: "10px 0 4px" }}>
              <span className="mono" style={{ fontSize: 28, fontWeight: 800 }}>
                £9.99
              </span>
              <span className="muted" style={{ fontSize: 12 }}>
                / month
              </span>
            </div>
            <div className="dim" style={{ fontSize: 11.5 }}>
              Cancel anytime
            </div>
            <button className="btn" style={{ width: "100%", marginTop: 13, background: "var(--surface-3)", borderColor: "var(--line-2)" }}>
              Start Monthly
            </button>
          </div>
        </div>
      </div>

      <div className="block">
        <div className="block-hd">
          <h2>Everything in Premium</h2>
        </div>
        <div className="m-card pad">
          {FEATS.map((f) => (
            <div className="prem-feat" key={f[0]}>
              <span className="pf-ic">✓</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{f[0]}</div>
                <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>
                  {f[1]}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="block">
        <div className="center muted" style={{ fontSize: 11, lineHeight: 1.5, fontFamily: "var(--font-mono)" }}>
          Cancel anytime · For analytical use only
          <br />
          Not a betting service
        </div>
      </div>
    </>
  );
}
