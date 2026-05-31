/**
 * Best-effort viewer region from the browser, used only as a client-side hint
 * for currency localization. The server prefers the trusted Cloudflare
 * `cf-ipcountry` header; this fills the gap in local/dev environments.
 */
export function detectCountry(): string | undefined {
  if (typeof navigator === "undefined") return undefined;
  const locales = [navigator.language, ...(navigator.languages ?? [])];
  for (const loc of locales) {
    // e.g. "en-NG" → "NG"; "en-US" → "US".
    const region = loc?.split("-")[1];
    if (region && region.length === 2) return region.toUpperCase();
  }
  return undefined;
}
