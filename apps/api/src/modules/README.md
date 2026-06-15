# API feature modules

Each domain is a self-contained NestJS module (controller + service +
DTOs + repository), following the repository pattern and DTO validation.

**Platform focus:** these modules ultimately serve one outcome — the **Pick of
the Day**, the single highest-confidence selection (see `predictions` →
`GET /predictions/daily-pick`). Quality over quantity, not a flood of tips.

Planned modules (from the InsightXI backend structure):

- `auth` — JWT auth, RBAC
- `matches` — fixtures, results, live scores
- `teams` — team stats, form, ratings
- `players` — player stats, injuries, suspensions
- `analytics` — derived football intelligence
- `predictions` — explainable probabilistic predictions (calls AI service) +
  the daily **Pick of the Day** (`/predictions/daily-pick`): one locked,
  highest-confidence selection, settled for an honest track record
- `statistics` — aggregated statistical endpoints
- `subscriptions` — free vs premium tiers
- `notifications` — alerts / real-time pushes

Present: `health` (liveness/readiness probe).
