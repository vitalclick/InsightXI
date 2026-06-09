# InsightXI Web (Next.js) — multi-stage build from the pnpm workspace root.
# Build context must be the repo root:  docker build -f apps/web/Dockerfile .
# Uses Next.js standalone output. Deployable to Railway / any container host.
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
# Build-time target for the same-origin /_api proxy (next.config rewrites are
# baked at build). Leave NEXT_PUBLIC_API_URL unset and set API_PROXY_TARGET to
# the API's URL to serve the app behind one origin with no CORS; set
# NEXT_PUBLIC_API_URL instead to have the browser call the API host directly.
ARG API_PROXY_TARGET
ENV API_PROXY_TARGET=$API_PROXY_TARGET
RUN pnpm --filter @insightxi/web build

FROM node:20-alpine AS runtime
ENV NODE_ENV=production
# Next's standalone server reads PORT and HOSTNAME. HOSTNAME must be 0.0.0.0 in
# a container or it binds to localhost and the platform edge gets a 502.
# PORT defaults to 3000 but is overridden by the platform-assigned $PORT.
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build /repo/apps/web/.next/standalone ./
COPY --from=build /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /repo/apps/web/public ./apps/web/public
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
