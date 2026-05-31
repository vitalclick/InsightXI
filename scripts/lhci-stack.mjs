// Boots the InsightXI stack (API + web) for a Lighthouse CI run, then prints
// "STACK READY" once both health checks pass. LHCI watches stdout for that
// marker (startServerReadyPattern) before auditing, and SIGINTs this process
// when done — we forward the signal so both children exit cleanly.
//
// The web app is served with `next start` (production build), so the audit
// reflects shipped bundles. The API runs the deterministic memory backend, so
// pages render real data without any external dependency.
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const API_PORT = 4000;
const WEB_PORT = 3000;

const children = [];

function start(name, command, args, env) {
  const child = spawn(command, args, {
    env: { ...process.env, ...env },
    stdio: "inherit",
  });
  child.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(`[lhci-stack] ${name} exited with code ${code}`);
      shutdown(1);
    }
  });
  children.push(child);
  return child;
}

async function waitForHealth(url, label, attempts = 60) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      /* not up yet */
    }
    await sleep(1000);
  }
  throw new Error(`[lhci-stack] ${label} did not become healthy at ${url}`);
}

function shutdown(code) {
  for (const c of children) {
    try {
      c.kill("SIGTERM");
    } catch {
      /* already gone */
    }
  }
  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

async function main() {
  start("api", "node", ["apps/api/dist/main.js"], {
    API_PORT: String(API_PORT),
    // Keep the audit hermetic and quiet.
    RATE_LIMIT_ENABLED: "false",
    NODE_ENV: "production",
    DATA_BACKEND: "memory",
    // A throwaway secret so production-mode boot checks pass for the audit.
    JWT_SECRET: "lhci-ephemeral-secret",
    CORS_ORIGINS: `http://localhost:${WEB_PORT}`,
  });
  await waitForHealth(`http://localhost:${API_PORT}/health`, "api");

  start(
    "web",
    "pnpm",
    ["--filter", "@insightxi/web", "exec", "next", "start", "-p", String(WEB_PORT)],
    {},
  );
  await waitForHealth(`http://localhost:${WEB_PORT}/`, "web");

  console.log("STACK READY");
}

main().catch((err) => {
  console.error(err);
  shutdown(1);
});
