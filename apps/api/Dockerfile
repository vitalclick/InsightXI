# InsightXI API (NestJS) — multi-stage build from the pnpm workspace root.
# Build context must be the repo root:  docker build -f apps/api/Dockerfile .
FROM node:20-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /repo

# --- deps: install workspace deps with the lockfile ---
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/package.json
RUN pnpm install --filter @insightxi/api... --frozen-lockfile

# --- build: compile TypeScript -> dist ---
FROM deps AS build
COPY apps/api apps/api
RUN pnpm --filter @insightxi/api build
# Prune to production dependencies only.
RUN pnpm --filter @insightxi/api --prod deploy /app

# --- runtime: minimal image ---
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /repo/apps/api/dist ./dist
EXPOSE 4000
CMD ["node", "dist/main.js"]
