"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePwaInstall } from "../hooks/use-pwa-install";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/fixtures", label: "Fixtures" },
  { href: "/results", label: "Results" },
  { href: "/standings", label: "Standings" },
  { href: "/live", label: "Live" },
  { href: "/trends", label: "Trends" },
  { href: "/model-health", label: "Model" },
  { href: "/account", label: "Account" },
];

function Brand() {
  return (
    <Link href="/" className="font-bold tracking-tight">
      Insight<span className="text-insight">XI</span>
    </Link>
  );
}

export function Nav() {
  const [open, setOpen] = useState(false);
  const { isMobile, installed } = usePwaInstall();

  // Close the drawer whenever the viewport returns to desktop.
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    const onChange = () => mql.matches && setOpen(false);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  // "Install" only makes sense on mobile and when not already installed.
  const showInstall = isMobile && !installed;

  return (
    <header className="border-b border-white/10 bg-pitch/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Brand />

        {/* Desktop: inline links */}
        <ul className="hidden flex-wrap gap-5 text-sm text-white/70 md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="hover:text-white">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Mobile: hamburger toggle */}
        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/80 md:hidden"
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div className="border-t border-white/10 md:hidden">
          <ul className="mx-auto flex max-w-6xl flex-col px-6 py-2 text-sm text-white/80">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block py-2.5 hover:text-white"
                >
                  {l.label}
                </Link>
              </li>
            ))}
            {showInstall && (
              <li className="mt-1 border-t border-white/10 pt-1">
                <Link
                  href="/install"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 py-2.5 font-medium text-insight"
                >
                  <DownloadIcon />
                  Install app
                </Link>
              </li>
            )}
          </ul>
        </div>
      )}
    </header>
  );
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}
