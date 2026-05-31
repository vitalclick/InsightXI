"use client";

import Link from "next/link";
import { usePwaInstall } from "../../../hooks/use-pwa-install";

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-insight/20 text-xs font-bold text-insight">
        {n}
      </span>
      <span className="text-sm text-white/70">{children}</span>
    </li>
  );
}

function IosInstructions() {
  return (
    <ol className="flex flex-col gap-3">
      <Step n={1}>
        Open InsightXI in <span className="text-white">Safari</span> (iOS only
        supports installing from Safari).
      </Step>
      <Step n={2}>
        Tap the <span className="text-white">Share</span> button (the square with
        an upward arrow) in the toolbar.
      </Step>
      <Step n={3}>
        Scroll down and tap{" "}
        <span className="text-white">Add to Home Screen</span>.
      </Step>
      <Step n={4}>
        Tap <span className="text-white">Add</span> — InsightXI now launches
        full-screen from your home screen.
      </Step>
    </ol>
  );
}

function AndroidInstructions({
  canPrompt,
  onInstall,
}: {
  canPrompt: boolean;
  onInstall: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {canPrompt && (
        <button
          onClick={onInstall}
          className="self-start rounded-lg bg-insight px-5 py-2.5 text-sm font-semibold text-white"
        >
          Install InsightXI
        </button>
      )}
      <ol className="flex flex-col gap-3">
        <Step n={1}>
          {canPrompt ? (
            <>
              Tap <span className="text-white">Install InsightXI</span> above, or
              use the browser menu.
            </>
          ) : (
            <>
              Open the browser menu (the{" "}
              <span className="text-white">⋮</span> in the top-right of Chrome).
            </>
          )}
        </Step>
        <Step n={2}>
          Tap <span className="text-white">Install app</span> (or{" "}
          <span className="text-white">Add to Home screen</span>).
        </Step>
        <Step n={3}>
          Confirm — InsightXI installs and launches full-screen.
        </Step>
      </ol>
    </div>
  );
}

export default function InstallPage() {
  const { platform, isMobile, installed, canPrompt, promptInstall } =
    usePwaInstall();

  // Pre-detection (SSR / first paint): render neutral copy.
  if (platform === null) {
    return (
      <main className="flex flex-col gap-3">
        <h1 className="text-2xl font-bold">Install InsightXI</h1>
        <p className="text-white/40">Detecting your device…</p>
      </main>
    );
  }

  if (installed) {
    return (
      <main className="flex flex-col gap-3">
        <h1 className="text-2xl font-bold">Install InsightXI</h1>
        <div className="rounded-xl border border-signal/30 bg-signal/10 p-6 text-sm text-white/70">
          You&apos;re already running the installed app. Enjoy the full-screen
          experience.
        </div>
      </main>
    );
  }

  // Desktop: installing-on-mobile is the requested flow; nudge to a phone.
  if (!isMobile) {
    return (
      <main className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Install InsightXI</h1>
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-white/70">
            The install experience is designed for mobile. Open{" "}
            <span className="text-white">insightxi</span> on your phone (iOS
            Safari or Android Chrome) and visit this page to add it to your home
            screen.
          </p>
          <p className="mt-3 text-sm text-white/50">
            On desktop you can still install via your browser&apos;s address-bar
            install icon, where supported.
          </p>
        </div>
        <Link href="/" className="text-sm text-insight hover:underline">
          ← Back to dashboard
        </Link>
      </main>
    );
  }

  return (
    <main className="flex max-w-xl flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold">Install InsightXI</h1>
        <p className="mt-1 text-sm text-white/50">
          Add InsightXI to your home screen for a fast, full-screen, app-like
          experience that works offline.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="mb-4 text-xs font-semibold uppercase tracking-wide text-insight">
          {platform === "ios" ? "iPhone / iPad" : "Android"}
        </div>
        {platform === "ios" ? (
          <IosInstructions />
        ) : (
          <AndroidInstructions
            canPrompt={canPrompt}
            onInstall={() => void promptInstall()}
          />
        )}
      </div>

      <p className="text-[11px] text-white/30">
        Installing adds an icon to your home screen — no app store required.
      </p>
    </main>
  );
}
