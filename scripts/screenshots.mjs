/**
 * Capture the mobile app (/m) screen-by-screen with Playwright.
 *
 * The Playwright browser CDN is not in the remote environment's network
 * allowlist, so `npx playwright install` is blocked. This script instead uses
 * the Chromium that ships preinstalled in the base image (under
 * /opt/pw-browsers), falling back to PLAYWRIGHT_EXECUTABLE_PATH or Playwright's
 * own managed browser when available.
 *
 * Prereqs: the web app (and ideally the API + AI service) must be running.
 *   pnpm --filter @insightxi/api dev                 # :4000  (seed data)
 *   (cd apps/ai-service && ./.venv/bin/uvicorn app.main:app --port 8000)
 *   (cd apps/web && pnpm build && pnpm start -p 3200)
 *   node scripts/screenshots.mjs
 *
 * Env: BASE_URL (default http://localhost:3200/m), OUT (default .shots),
 *      PLAYWRIGHT_EXECUTABLE_PATH (override the browser binary).
 */
import { chromium } from "@playwright/test";
import { existsSync, mkdirSync, readdirSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3200/m";
const OUT = process.env.OUT ?? ".shots";

function findChrome() {
  if (process.env.PLAYWRIGHT_EXECUTABLE_PATH) return process.env.PLAYWRIGHT_EXECUTABLE_PATH;
  const base = "/opt/pw-browsers";
  if (existsSync(base)) {
    const entries = readdirSync(base);
    const full = entries
      .filter((d) => d.startsWith("chromium-") && !d.includes("headless"))
      .sort()
      .pop();
    if (full && existsSync(`${base}/${full}/chrome-linux/chrome`)) {
      return `${base}/${full}/chrome-linux/chrome`;
    }
    const shell = entries.filter((d) => d.startsWith("chromium_headless_shell")).sort().pop();
    if (shell && existsSync(`${base}/${shell}/chrome-linux/headless_shell`)) {
      return `${base}/${shell}/chrome-linux/headless_shell`;
    }
  }
  return undefined; // fall back to Playwright's managed browser
}

const SHOTS = [
  { name: "01-home" },
  { name: "02-predictions", tab: "Predict", wait: ".m-card" },
  { name: "03-match", click: ".screen.active .m-card.tappable", wait: ".prob-pill, .xai" },
  { name: "04-live", tab: "Live" },
  { name: "05-fixtures", tab: "Fixtures", wait: ".match-row" },
  { name: "06-more", tab: "More", wait: ".menu-grid" },
  { name: "07-premium", click: ".menu-item:has-text('Premium')", wait: ".plan-card" },
];

async function main() {
  mkdirSync(OUT, { recursive: true });
  const executablePath = findChrome();
  console.log(`browser: ${executablePath ?? "playwright-managed"}`);

  const browser = await chromium.launch({ executablePath, headless: true, args: ["--no-sandbox"] });
  const ctx = await browser.newContext({
    viewport: { width: 414, height: 896 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));

  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForSelector(".match-row, .kpi-tile", { timeout: 15000 }).catch(() => {});

  for (const shot of SHOTS) {
    if (shot.tab) await page.locator(".nav-tab", { hasText: shot.tab }).click().catch(() => {});
    if (shot.click) {
      const el = page.locator(shot.click).first();
      if (await el.count()) await el.click().catch(() => {});
    }
    if (shot.wait) await page.waitForSelector(shot.wait, { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(1600); // let charts animate/settle
    await page.screenshot({ path: `${OUT}/${shot.name}.png` });
    console.log("shot:", shot.name);
  }

  await browser.close();
  console.log(`done → ${OUT}/`);
}

main().catch((e) => {
  console.error("screenshots failed:", e);
  process.exit(1);
});
