"use client";

import { useState } from "react";
import { useThemeStore } from "../../../store/theme-store";
import { useAuthStore } from "../../../store/auth-store";
import { useMobileNav } from "../nav-context";
import { Icon, type IconName } from "../icons";

export function MoreScreen() {
  const nav = useMobileNav();
  const theme = useThemeStore((s) => s.theme);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [alerts, setAlerts] = useState(true);

  const displayName = user?.name ?? (user ? user.email.split("@")[0] : "Guest");
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "IX";
  const isPremium = user?.tier === "PREMIUM";

  const intelligence: { title: string; sub: string; icon: IconName; go: () => void }[] = [
    { title: "Confidence Board", sub: "AI picks by day", icon: "grid", go: () => nav.pushScreen("board") },
    { title: "Fixtures", sub: "Schedule & reads", icon: "fixtures", go: () => nav.showTab("fixtures") },
    { title: "Predictions", sub: "Sure-win board", icon: "target", go: () => nav.showTab("predictions") },
    { title: "Premium", sub: "Elite analytics", icon: "premium", go: () => nav.pushScreen("premium") },
  ];
  const explore: [string, IconName][] = [
    ["Results", "results"],
    ["Leagues", "leagues"],
    ["Teams", "teams"],
    ["Players", "players"],
    ["Historical", "history"],
    ["Blog", "doc"],
  ];

  return (
    <>
      <div className="lg-head" style={{ paddingBottom: 0 }}>
        <div className="lg-title">More</div>
      </div>

      <div className="block" style={{ paddingTop: 14 }}>
        <div className="profile-hd">
          <div className="profile-av">{initials}</div>
          <div className="grow">
            <div style={{ fontWeight: 700, fontSize: 17 }}>{displayName}</div>
            <div className="muted" style={{ fontSize: 12.5 }}>
              {user?.email ?? "Sign in on the web app"}
            </div>
          </div>
          <span className={`badge ${isPremium ? "green" : "gold"}`}>{isPremium ? "Premium" : "Free plan"}</span>
        </div>
      </div>

      {!isPremium && (
        <div className="block">
          <div className="prem-hero tappable" onClick={() => nav.pushScreen("premium")}>
            <div className="flex aic gap-8" style={{ marginBottom: 8 }}>
              <span className="badge gold">
                <Icon name="premium" /> Premium
              </span>
            </div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: 18,
                letterSpacing: "-.02em",
                lineHeight: 1.15,
              }}
            >
              Unlock the elite analytics layer
            </div>
            <div className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>
              Tactical AI reports, fatigue modelling &amp; hidden-trend detection.
            </div>
            <button className="btn btn-gold" style={{ marginTop: 13 }}>
              Upgrade Premium →
            </button>
          </div>
        </div>
      )}

      <div className="block">
        <div className="block-hd">
          <h2>Intelligence</h2>
        </div>
        <div className="menu-grid">
          {intelligence.map((g) => (
            <div className="menu-item tappable" key={g.title} onClick={g.go}>
              <div className="mi-ic">
                <Icon name={g.icon} />
              </div>
              <div>
                <div className="mi-t">{g.title}</div>
                <div className="mi-d">{g.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="block">
        <div className="block-hd">
          <h2>Explore</h2>
        </div>
        <div className="menu-list">
          {explore.map((e) => (
            <div className="menu-row tappable" key={e[0]} onClick={() => nav.toast(`${e[0]} · full view on web`)}>
              <div className="mr-ic">
                <Icon name={e[1]} />
              </div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{e[0]}</div>
              <span className="chev">
                <Icon name="chev" />
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="block">
        <div className="block-hd">
          <h2>Settings</h2>
        </div>
        <div className="menu-list">
          <div className="menu-row" onClick={() => nav.toggleTheme()}>
            <div className="mr-ic">
              <Icon name="moon" />
            </div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Dark appearance</div>
            <div
              className={`switch${theme === "dark" ? " on" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                nav.toggleTheme();
              }}
            >
              <i />
            </div>
          </div>
          <div className="menu-row">
            <div className="mr-ic">
              <Icon name="bell" />
            </div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Match alerts</div>
            <div
              className={`switch${alerts ? " on" : ""}`}
              onClick={() => {
                setAlerts((a) => !a);
                nav.haptic(8);
              }}
            >
              <i />
            </div>
          </div>
          <div className="menu-row tappable" onClick={() => nav.toast("Use your browser menu → Add to Home Screen")}>
            <div className="mr-ic">
              <Icon name="refresh" />
            </div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Add to Home Screen</div>
            <span className="chev">
              <Icon name="chev" />
            </span>
          </div>
          <div className="menu-row">
            <div className="mr-ic">
              <Icon name="info" />
            </div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Version</div>
            <span className="mono dim" style={{ marginLeft: "auto", fontSize: 12 }}>
              4.2.0
            </span>
          </div>
        </div>
      </div>

      <div className="block">
        <div className="menu-list">
          <div
            className="menu-row tappable"
            style={{ borderRadius: "var(--r-md)" }}
            onClick={() => {
              if (user) {
                logout();
                nav.toast("Signed out");
              } else {
                nav.toast("Sign in on the web app");
              }
            }}
          >
            <div className="mr-ic" style={{ color: "#ff8a95" }}>
              <Icon name="logout" />
            </div>
            <div style={{ fontWeight: 600, fontSize: 14, color: "#ff8a95" }}>{user ? "Sign out" : "Sign in"}</div>
          </div>
        </div>
        <div className="center muted" style={{ fontSize: 11, marginTop: 16, fontFamily: "var(--font-mono)" }}>
          InsightXI · True Football Intelligence · 18+ · bet responsibly
        </div>
      </div>
    </>
  );
}
