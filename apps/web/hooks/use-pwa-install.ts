"use client";

import { useEffect, useState } from "react";
import {
  detectPlatform,
  isMobilePlatform,
  isStandaloneDisplay,
  type Platform,
} from "../lib/pwa";

/** The non-standard beforeinstallprompt event (Chromium). */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export interface PwaInstallState {
  /** null until detected on the client (avoids SSR hydration mismatch). */
  platform: Platform | null;
  isMobile: boolean;
  /** Already running as an installed app. */
  installed: boolean;
  /** A native install prompt is available (Android/desktop Chromium). */
  canPrompt: boolean;
  /** Trigger the native install prompt; resolves true if accepted. */
  promptInstall: () => Promise<boolean>;
}

export function usePwaInstall(): PwaInstallState {
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [installed, setInstalled] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    setPlatform(detectPlatform(navigator.userAgent));
    setInstalled(
      isStandaloneDisplay(
        window.matchMedia.bind(window),
        (navigator as Navigator & { standalone?: boolean }).standalone,
      ),
    );

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = async (): Promise<boolean> => {
    if (!deferred) return false;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    return outcome === "accepted";
  };

  return {
    platform,
    isMobile: platform !== null && isMobilePlatform(platform),
    installed,
    canPrompt: deferred !== null,
    promptInstall,
  };
}
