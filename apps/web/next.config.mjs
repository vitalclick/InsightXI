import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Emit a self-contained server bundle for Docker/self-hosting.
  // Vercel ignores this and uses its own build pipeline.
  output: "standalone",
  // App lives in a pnpm workspace; point tracing at the repo root so the
  // standalone bundle resolves correctly and the lockfile warning is silenced.
  // (In Next 14 this lives under `experimental`; it is top-level in Next 15.)
  experimental: {
    outputFileTracingRoot: workspaceRoot,
  },
};

export default nextConfig;
