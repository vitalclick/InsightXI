"use client";

import { type UIEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useThemeStore } from "../../store/theme-store";
import { useAuthStore } from "../../store/auth-store";
import { api } from "../../services/api-client";
import type { PaymentProvider } from "../../lib/types";
import type { MatchArg } from "./view";
import { ICONS } from "./icons";
import {
  MobileNavProvider,
  SCREEN_TITLES,
  TABS,
  type DetailId,
  type MobileNav,
  type ScreenId,
  type TabId,
} from "./nav-context";
import { HomeScreen } from "./screens/home";
import { LiveScreen } from "./screens/live";
import { PredictionsScreen } from "./screens/predictions";
import { FixturesScreen } from "./screens/fixtures";
import { MoreScreen } from "./screens/more";
import { MatchScreen } from "./screens/match";
import { BoardScreen } from "./screens/board";
import { PremiumScreen } from "./screens/premium";

interface Entry {
  id: ScreenId;
  arg?: MatchArg;
  key: number;
  anim: "tab-in" | "push-in" | null;
}

const NAV: { tab: TabId; icon: keyof typeof ICONS; label: string; badge?: boolean }[] = [
  { tab: "home", icon: "homeF", label: "Home" },
  { tab: "live", icon: "live", label: "Live", badge: true },
  { tab: "predictions", icon: "target", label: "Predict" },
  { tab: "fixtures", icon: "fixtures", label: "Fixtures" },
  { tab: "more", icon: "more", label: "More" },
];

function ScreenBody({ entry }: { entry: Entry }) {
  switch (entry.id) {
    case "home":
      return <HomeScreen />;
    case "live":
      return <LiveScreen />;
    case "predictions":
      return <PredictionsScreen />;
    case "fixtures":
      return <FixturesScreen />;
    case "more":
      return <MoreScreen />;
    case "match":
      return <MatchScreen match={entry.arg} />;
    case "board":
      return <BoardScreen />;
    case "premium":
      return <PremiumScreen />;
    default:
      return null;
  }
}

function haptic(ms = 8) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* ignore */
  }
}

export function MobileApp() {
  const toggleStoreTheme = useThemeStore((s) => s.toggle);
  const keyRef = useRef(1);
  const [stack, setStack] = useState<Entry[]>([{ id: "home", key: 0, anim: "tab-in" }]);
  const [exiting, setExiting] = useState<Entry | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stackRef = useRef(stack);
  stackRef.current = stack;

  const active = stack[stack.length - 1];
  const isDetail = !TABS.includes(active.id as TabId);
  const activeNav = useMemo(
    () => [...stack].reverse().find((e) => TABS.includes(e.id as TabId))?.id ?? null,
    [stack],
  );

  // Lock the page behind the phone frame while the mobile app is mounted.
  useEffect(() => {
    document.documentElement.classList.add("mx-mode");
    return () => document.documentElement.classList.remove("mx-mode");
  }, []);

  const showTab = useCallback((tab: TabId) => {
    const cur = stackRef.current;
    if (cur.length === 1 && cur[0].id === tab) {
      document.querySelector(".screen.active")?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setStack([{ id: tab, key: keyRef.current++, anim: "tab-in" }]);
    setExiting(null);
    setScrollY(0);
    haptic(8);
  }, []);

  const pushScreen = useCallback((id: DetailId, arg?: MatchArg) => {
    setStack((cur) => [...cur, { id, arg, key: keyRef.current++, anim: "push-in" }]);
    setScrollY(0);
    haptic(10);
  }, []);

  const pop = useCallback(() => {
    const cur = stackRef.current;
    if (cur.length <= 1) return;
    const top = cur[cur.length - 1];
    setExiting({ ...top, anim: null });
    window.setTimeout(() => setExiting((e) => (e && e.key === top.key ? null : e)), 320);
    setStack(cur.slice(0, -1));
    setScrollY(0);
    haptic(8);
  }, []);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 1700);
  }, []);

  const toggleTheme = useCallback(() => {
    toggleStoreTheme();
    haptic(8);
  }, [toggleStoreTheme]);

  const nav: MobileNav = useMemo(
    () => ({ showTab, pushScreen, pop, toast, haptic, toggleTheme }),
    [showTab, pushScreen, pop, toast, toggleTheme],
  );

  // Confirm a hosted-checkout return. Paystack/Flutterwave/PayPal redirect back
  // to /premium?provider=…&reference=…; on a phone the redirect-to-/m preserves
  // that query, and we verify + unlock Premium here regardless of the open tab.
  const checkoutHandled = useRef(false);
  useEffect(() => {
    if (checkoutHandled.current) return;
    checkoutHandled.current = true;
    const params = new URLSearchParams(window.location.search);
    const provider = params.get("provider") as PaymentProvider | null;
    const reference =
      params.get("reference") ?? params.get("trxref") ?? params.get("tx_ref") ?? params.get("token");
    if (!provider || !reference) return;
    window.history.replaceState({}, "", window.location.pathname);
    const { token, setAuth } = useAuthStore.getState();
    if (!token) {
      toast("Sign in to confirm your payment");
      pushScreen("premium");
      return;
    }
    void api
      .confirmPayment(provider, reference, token)
      .then((res) => {
        if (res.status === "active" && res.auth) {
          setAuth(res.auth.accessToken, res.auth.user);
          toast("Premium unlocked");
        } else {
          toast("Payment pending confirmation");
        }
        pushScreen("premium");
      })
      .catch(() => toast("We couldn't verify that payment"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pull-to-refresh on the active screen (touch only — mirrors the prototype).
  const screensRef = useRef<HTMLDivElement>(null);
  const ptrRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const area = screensRef.current;
    const ptr = ptrRef.current;
    if (!area || !ptr) return;
    const spin = ptr.querySelector<HTMLElement>(".ptr-spin");
    let startY = 0;
    let pulling = false;
    let dist = 0;
    let target: HTMLElement | null = null;
    let refreshing = false;
    const THRESH = 72;

    const onStart = (e: TouchEvent) => {
      target = document.querySelector<HTMLElement>(".screen.active");
      if (!target || refreshing) return;
      if (target.scrollTop <= 0) {
        startY = e.touches[0].clientY;
        pulling = true;
        dist = 0;
      }
    };
    const onMove = (e: TouchEvent) => {
      if (!pulling || !target || refreshing) return;
      dist = e.touches[0].clientY - startY;
      if (dist > 0 && target.scrollTop <= 0) {
        e.preventDefault();
        const d = Math.min(dist * 0.45, 96);
        target.style.transform = `translateY(${d}px)`;
        ptr.style.height = d + "px";
        if (spin) {
          spin.style.opacity = String(Math.min(1, d / THRESH));
          spin.style.transform = `rotate(${d * 3}deg)`;
        }
      }
    };
    const onEnd = () => {
      if (!pulling || !target) return;
      pulling = false;
      const el = target;
      const trigger = dist * 0.45 >= THRESH * 0.62;
      el.style.transition = "transform .3s cubic-bezier(.3,1,.4,1)";
      if (trigger && !refreshing) {
        refreshing = true;
        haptic(14);
        el.style.transform = "translateY(54px)";
        ptr.style.height = "54px";
        ptr.classList.add("spinning");
        setTimeout(() => {
          el.style.transform = "translateY(0)";
          ptr.style.height = "0";
          ptr.classList.remove("spinning");
          setTimeout(() => {
            refreshing = false;
            el.style.transition = "";
          }, 320);
        }, 900);
      } else {
        el.style.transform = "translateY(0)";
        ptr.style.height = "0";
        setTimeout(() => {
          el.style.transition = "";
        }, 320);
      }
    };

    area.addEventListener("touchstart", onStart, { passive: true });
    area.addEventListener("touchmove", onMove, { passive: false });
    area.addEventListener("touchend", onEnd, { passive: true });
    area.addEventListener("touchcancel", onEnd, { passive: true });
    return () => {
      area.removeEventListener("touchstart", onStart);
      area.removeEventListener("touchmove", onMove);
      area.removeEventListener("touchend", onEnd);
      area.removeEventListener("touchcancel", onEnd);
    };
  }, []);

  const headerSolid = isDetail || scrollY > 6;
  const titleShown = isDetail || scrollY > 58;
  const brandHidden = !isDetail && scrollY > 58;

  const onScreenScroll = (e: UIEvent<HTMLElement>) => {
    if (e.currentTarget.classList.contains("active")) setScrollY(e.currentTarget.scrollTop);
  };

  return (
    <MobileNavProvider value={nav}>
      <div className="app-frame">
        <div className="app">
          <header className={`app-header${headerSolid ? " solid" : ""}`}>
            <button
              className="icon-btn-m hdr-back"
              aria-label="Back"
              onClick={pop}
              style={{ display: isDetail ? "grid" : "none" }}
              dangerouslySetInnerHTML={{ __html: ICONS.back }}
            />
            <div className={`hdr-brand${brandHidden ? " hide" : ""}`} style={{ display: isDetail ? "none" : "flex" }}>
              <div className="m-logo" dangerouslySetInnerHTML={{ __html: ICONS.logo }} />
              <b>
                Insight<span>XI</span>
              </b>
            </div>
            <div className={`hdr-title${titleShown ? " show" : ""}`}>{SCREEN_TITLES[active.id]}</div>
            <div className="hdr-actions">
              <button
                className="icon-btn-m"
                aria-label="Search"
                onClick={() => toast("Search teams, players, matches…")}
                dangerouslySetInnerHTML={{ __html: ICONS.search }}
              />
              <button className="icon-btn-m" aria-label="Notifications" onClick={() => toast("3 new model alerts today")}>
                <span className="dot-n" />
                <span dangerouslySetInnerHTML={{ __html: ICONS.bell }} />
              </button>
            </div>
          </header>

          <div className="ptr" ref={ptrRef}>
            <div className="ptr-spin" />
          </div>

          <div className="screens" ref={screensRef}>
            {stack.map((entry, i) => {
              const top = i === stack.length - 1;
              const detail = !TABS.includes(entry.id as TabId);
              const cls = ["screen", detail ? "detail" : "", top ? "active" : "", top && entry.anim ? entry.anim : ""]
                .filter(Boolean)
                .join(" ");
              return (
                <section key={entry.key} className={cls} onScroll={onScreenScroll}>
                  <ScreenBody entry={entry} />
                </section>
              );
            })}
            {exiting && (
              <section key={`exit-${exiting.key}`} className="screen detail active push-out">
                <ScreenBody entry={exiting} />
              </section>
            )}
          </div>

          <nav className="bottom-nav">
            {NAV.map((n) => (
              <button
                key={n.tab}
                className={`nav-tab${activeNav === n.tab ? " active" : ""}`}
                onClick={() => showTab(n.tab)}
              >
                <span className="ic" dangerouslySetInnerHTML={{ __html: ICONS[n.icon] }} />
                {n.badge && <span className="nbadge" />}
                <span>{n.label}</span>
              </button>
            ))}
          </nav>

          {toastMsg && <Toast message={toastMsg} />}
        </div>
      </div>
    </MobileNavProvider>
  );
}

function Toast({ message }: { message: string }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        bottom: "calc(var(--m-nav-h) + var(--sa-bot) + 18px)",
        transform: `translateX(-50%) translateY(${shown ? 0 : 10}px)`,
        background: "var(--surface-4)",
        color: "var(--text)",
        border: "1px solid var(--line-2)",
        padding: "11px 18px",
        borderRadius: 13,
        fontSize: 13,
        fontWeight: 600,
        zIndex: 90,
        boxShadow: "var(--shadow-2)",
        opacity: shown ? 1 : 0,
        transition: ".22s",
        whiteSpace: "nowrap",
        maxWidth: "88%",
        textAlign: "center",
      }}
    >
      {message}
    </div>
  );
}
