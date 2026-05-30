# InsightXI Web (Next.js) — multi-stage build from the pnpm workspace root.
# Build context must be the repo root:  docker build -f apps/web/Dockerfile .
# Uses Next.js standalone output. Primary deploy target is Vercel; this image
# is for self-hosting / docker-compose / non-Vercel hosts.
FROM node:20-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /repo

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --filter @insightxi/web... --frozen-lockfile

FROM deps AS build
COPY apps/web apps/web
# NEXT_PUBLIC_* must be present at build time (baked into the client bundle).
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN pnpm --filter @insightxi/web build

FROM node:20-alpine AS runtime
ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app
# Standalone output bundles a minimal server + only the deps it needs.
COPY --from=build /repo/apps/web/.next/standalone ./
COPY --from=build /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /repo/apps/web/public ./apps/web/public
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
