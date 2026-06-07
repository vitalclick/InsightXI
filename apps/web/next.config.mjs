import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { existsSync, readFileSync } from "node:fs";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

// Load the repo-root .env so a single workspace-root env file feeds the web app
// too (Next only reads apps/web/.env* natively). NEXT_PUBLIC_* values must be in
// process.env before the build; next.config runs first, so this is in time.
// Real env vars and apps/web/.env.local always win (we never overwrite).
for (const file of [".env.local", ".env"]) {
  const path = resolve(workspaceRoot, file);
  if (!existsSync(path)) continue;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (!match) continue;
    const key = match[1];
    if (process.env[key] !== undefined) continue;
    let value = (match[2] ?? "").trim();
    if (/^(["']).*\1$/.test(value)) value = value.slice(1, -1);
    process.env[key] = value;
  }
}

// Where the web server forwards browser API traffic. Browser REST calls hit the
// same-origin `/_api/*` path (see services/api-client.ts) so they never need to
// reach the API host directly (no CORS, works behind a single public origin);
// the web server rewrites them to this target server-side. Override with
// API_PROXY_TARGET (e.g. the Railway API URL on Vercel); falls back to the
// public API URL, then local dev.
const apiProxyTarget =
  process.env.API_PROXY_TARGET ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Proxy browser → API through this origin so a single public URL serves both.
  async rewrites() {
    return [{ source: "/_api/:path*", destination: `${apiProxyTarget}/:path*` }];
  },
  // Emit a self-contained server bundle for Docker/self-hosting.
  // Vercel ignores this and uses its own build pipeline. Disable with
  // NEXT_DISABLE_STANDALONE=true (e.g. the Lighthouse CI build, which serves
  // the standard build via `next start`).
  output:
    process.env.NEXT_DISABLE_STANDALONE === "true" ? undefined : "standalone",
  // App lives in a pnpm workspace; point tracing at the repo root so the
  // standalone bundle resolves correctly and the lockfile warning is silenced.
  // (In Next 14 this lives under `experimental`; it is top-level in Next 15.)
  experimental: {
    outputFileTracingRoot: workspaceRoot,
  },
};

export default nextConfig;
