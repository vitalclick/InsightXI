# API feature modules

Each domain is a self-contained NestJS module (controller + service +
DTOs + repository), following the repository pattern and DTO validation.

Planned modules (from the InsightXI backend structure):

- `auth` — JWT auth, RBAC
- `matches` — fixtures, results, live scores
- `teams` — team stats, form, ratings
- `players` — player stats, injuries, suspensions
- `analytics` — derived football intelligence
- `predictions` — explainable probabilistic predictions (calls AI service)
- `statistics` — aggregated statistical endpoints
- `subscriptions` — free vs premium tiers
- `notifications` — alerts / real-time pushes

Present: `health` (liveness/readiness probe).
