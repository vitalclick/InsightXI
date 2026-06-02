"use client";

import { usePlan } from "../../../hooks/use-plan";
import { useAuthStore } from "../../../store/auth-store";
import { SocialAuth } from "../../../components/auth/social-auth";
import type { AuthResponse } from "../../../lib/types";
import { useMobileNav } from "../nav-context";
import { CheckoutSheet } from "../checkout-sheet";
import { Icon } from "../icons";

const FALLBACK_FEATURES = [
  "Tactical AI reports — pressing maps, attack zones & momentum",
  "Fatigue & lineup-impact modelling",
  "Hidden-trend detection across seasons",
  "Cross-competition confidence board",
  "Priority live intelligence alerts",
];

export function PremiumScreen() {
  const nav = useMobileNav();
  const { user, token, setAuth } = useAuthStore();
  const isPremium = user?.tier === "PREMIUM";
  const { data, isLoading } = usePlan();
  const plan = data?.plan;
  const features = plan?.features?.length ? plan.features : FALLBACK_FEATURES;
  const price = plan?.local.display ?? plan?.base.display ?? "£9.99";
  const interval = plan?.interval ?? "month";

  function onActivated(auth: AuthResponse) {
    setAuth(auth.accessToken, auth.user);
    nav.toast("Premium unlocked");
  }

  return (
    <>
      <div className="block" style={{ paddingTop: 14 }}>
        <div className="prem-hero">
          <span className="badge gold" style={{ marginBottom: 12 }}>
            <Icon name="premium" /> {plan?.badge ?? "Premium Intelligence"}
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
            {plan?.tagline ?? "Unlock the elite analytics layer"}
          </div>
          <div className="muted" style={{ fontSize: 13, marginTop: 10, lineHeight: 1.5 }}>
            The tools the pros use — tactical AI reports, fatigue analysis, lineup-impact modelling and hidden-trend
            detection.
          </div>
          <div className="flex gap-16" style={{ marginTop: 18 }}>
            <div>
              <div className="mono" style={{ fontSize: 22, fontWeight: 800, color: "var(--gold)" }}>73%</div>
              <div className="dim" style={{ fontSize: 11 }}>model accuracy</div>
            </div>
            <div>
              <div className="mono" style={{ fontSize: 22, fontWeight: 800 }}>120+</div>
              <div className="dim" style={{ fontSize: 11 }}>competitions</div>
            </div>
            <div>
              <div className="mono" style={{ fontSize: 22, fontWeight: 800, color: "var(--green)" }}>2.4M</div>
              <div className="dim" style={{ fontSize: 11 }}>matches modelled</div>
            </div>
          </div>
        </div>
      </div>

      <div className="block">
        <div className="block-hd">
          <h2>{plan?.name ?? "Premium"} plan</h2>
        </div>
        <div className="plan-card featured">
          <div className="flex aic jcb">
            <div className="flex aic gap-8">
              <b style={{ fontSize: 15 }}>{plan?.name ?? "Premium"}</b>
              {plan?.local.estimated && <span className="badge">est.</span>}
            </div>
            <div className="flex aic gap-6" style={{ color: "var(--gold)" }}>
              <Icon name="star" />
            </div>
          </div>
          <div className="flex aic gap-6" style={{ margin: "10px 0 4px" }}>
            <span className="mono" style={{ fontSize: 28, fontWeight: 800 }}>{price}</span>
            <span className="muted" style={{ fontSize: 12 }}>/ {interval}</span>
          </div>
          <div className="dim" style={{ fontSize: 11.5, marginBottom: 14 }}>
            {isLoading ? "Loading localized pricing…" : "Cancel anytime · billed securely"}
          </div>

          {isPremium ? (
            <div>
              <span className="badge green" style={{ display: "inline-flex" }}>
                Premium active
              </span>
              {user?.currentPeriodEnd && (
                <div className="dim" style={{ fontSize: 11.5, marginTop: 10 }}>
                  Access through {new Date(user.currentPeriodEnd).toLocaleDateString()}
                </div>
              )}
            </div>
          ) : token && data ? (
            <CheckoutSheet token={token} plan={data} onActivated={onActivated} />
          ) : (
            <div>
              <div className="muted" style={{ fontSize: 12, marginBottom: 12, lineHeight: 1.5 }}>
                Sign in to upgrade — your account unlocks Premium across web and mobile.
              </div>
              <SocialAuth onSuccess={onActivated} demoEmail="premium.user@insightxi.dev" />
            </div>
          )}
        </div>
      </div>

      <div className="block">
        <div className="block-hd">
          <h2>Everything in Premium</h2>
        </div>
        <div className="m-card pad">
          {features.map((f, i) => {
            const [head, ...rest] = f.split(/ — | - /);
            return (
              <div className="prem-feat" key={i}>
                <span className="pf-ic">✓</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{head}</div>
                  {rest.length > 0 && (
                    <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>
                      {rest.join(" — ")}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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
