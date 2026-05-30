import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests run the real web + API together against the deterministic
 * offline mock backend (no DATA_BACKEND/FOOTBALL_API_KEY set), so results are
 * reproducible. The AI service is optional — match-intelligence panels degrade
 * gracefully when it is absent, and the specs account for that.
 *
 * Playwright boots both servers via `webServer`. The API is built once and run
 * from dist; the web app runs `next dev`.
 */
const WEB_PORT = 3100;
const API_PORT = 4100;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: [
    {
      // Build then run the API from dist (faster + closer to prod than watch).
      command: `pnpm --filter @insightxi/api build && API_PORT=${API_PORT} node apps/api/dist/main.js`,
      port: API_PORT,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: `pnpm --filter @insightxi/web exec next dev -p ${WEB_PORT}`,
      port: WEB_PORT,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: { NEXT_PUBLIC_API_URL: `http://localhost:${API_PORT}` },
    },
  ],
});
