/**
 * Pure, framework-free PWA helpers. Kept side-effect free so platform
 * detection is unit-testable without a browser.
 */

export type Platform = "ios" | "android" | "desktop";

/** Classify a user-agent string into the platform families we care about. */
export function detectPlatform(userAgent: string): Platform {
  const ua = userAgent.toLowerCase();
  // iPadOS 13+ reports as "Macintosh" but is touch-capable; callers can refine
  // with a touch check. Here we match the common mobile UA tokens.
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  return "desktop";
}

/** True for phone/tablet platforms (where install matters). */
export function isMobilePlatform(platform: Platform): boolean {
  return platform === "ios" || platform === "android";
}

/**
 * Whether the app is already running as an installed PWA. Checks the standalone
 * display mode (all platforms) and the iOS Safari `navigator.standalone` flag.
 */
export function isStandaloneDisplay(
  matchMedia?: (q: string) => { matches: boolean },
  navigatorStandalone?: boolean,
): boolean {
  const mql = matchMedia?.("(display-mode: standalone)");
  return Boolean(mql?.matches) || navigatorStandalone === true;
}
