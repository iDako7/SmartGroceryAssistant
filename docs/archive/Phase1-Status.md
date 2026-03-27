# Phase 1 Status — Agent Quick Reference

**Last updated:** 2026-03-25
**Branch:** `main`
**Phase:** 1 (Web-first MVP) — core features functional, UI polish and advanced AI logic pending

---

## Tech Stack

| Component | Technology | Port | Status |
|---|---|---|---|
| Web Client | Next.js 16 / React 19 / Tailwind v4 | 3000 | Functional |
| API Gateway | Fastify 5 / TypeScript (CommonJS) | 3001 | Functional |
| User Service | Go / Gin | 4001 | Functional |
| List Service | Go / Gin | 4002 | Functional |
| AI Service | Python / FastAPI | 4003 | Functional |
| AI Worker | Python (standalone process) | — | Functional |
| PostgreSQL | Two databases: `user_db`, `list_db` | 5432 | Functional |
| Redis | AI response cache | 6379 | Functional |
| RabbitMQ | Async AI job queue | 5672 | Functional |

**Not built yet:** Knowledge Service (Go), Sync Service (Go), mobile app (React Native), on-device SQLite KB.

---

## Service File Map

```
web/src/
  app/           — pages: home, login, register, list
  components/    — ai/AiPanel.tsx, list/ItemRow.tsx, list/SectionCard.tsx
  lib/           — api.ts (HTTP client), auth-context.tsx
  types/         — index.ts (Section, Item, User types)

services/api-gateway/src/
  plugins/       — cors.ts, jwt.ts, rateLimit.ts
  routes/        — auth.ts, users.ts, lists.ts, ai.ts, ws.ts
  app.ts         — Fastify app setup
  config.ts      — env var config

services/user-service/
  cmd/main.go
  internal/      — handler/ service/ repository/ middleware/ model/

services/list-service/
  cmd/main.go
  internal/      — handler/ service/ repository/ middleware/ model/ events/

services/ai-service/
  app/           — main.py, config.py, routes/ai.py, routes/health.py
                   services/claude.py, services/cache.py, services/queue.py
                   middleware/auth.py
  worker.py      — RabbitMQ consumer (separate process)
  tests/         — test_routes_ai, test_services_cache, test_services_claude,
                   test_services_queue, test_worker

infra/
  postgres/      — init.sql (schema for user_db + list_db)
  rabbitmq/      — definitions.json (exchanges, queues, bindings)
```

---

## What Works End-to-End

1. **Auth flow** — Register → Login → JWT issued → Gateway verifies → downstream services verify again
2. **List CRUD** — Create/rename/delete sections; add/edit/delete items with quantity
3. **AI Suggest (async)** — POST `/api/v1/ai/suggest` → RabbitMQ → Worker → OpenRouter LLM → Redis → client polls `/api/v1/ai/jobs/:id`
4. **AI Inspire (async)** — Same pipeline as Suggest; returns 3 meal ideas with missing ingredients
5. **AI Item Info / Translate / Alternatives (sync)** — Direct LLM call with Redis caching
6. **CI/CD** — GitHub Actions with path-based change detection; per-service lint/test/build jobs
7. **Docker Compose** — Full stack or infra-only modes
8. **Tiltfile** — K8s dev with hot reload (requires minikube)

---

## What's Partially Done

| Feature | What works | What's missing |
|---|---|---|
| Suggest response | Returns flat list of items | No recipe clusters, no 3-step reasoning chain, no context block |
| Per-item AI features | Work in a separate AiPanel (tabbed UI) | Should be inline per-item buttons with expandable panels |
| Item checkbox | Click-to-select (emerald highlight) for AI panel | Should be checkbox with strikethrough |
| Profile | DB schema + CRUD endpoints | No onboarding UI |
| WebSocket relay | Gateway code exists | List Service has no WS endpoint |
| RabbitMQ list events | List Service publishes events | No consumer exists |

---

## What's Not Started

- Onboarding UI (FR-1 through FR-4)
- Collapsible sections (FR-15)
- Auto-translation on item add (FR-17)
- 3-step AI reasoning chain (FR-22)
- Recipe cluster response format + Smart View (FR-23 through FR-33)
- In-Store / List View with aisle grouping (FR-34 through FR-37)
- Keep / Dismiss / Keep All actions on suggestions (FR-30, FR-32)
- "Add All" for Inspire missing ingredients (FR-40)
- "Use This" for Alternatives (FR-44)
- Offline mode, tiered inference, local KB (FR-50 through FR-67)
- Data synchronization / CRDT (FR-68 through FR-77)
- Knowledge Service and Sync Service

---

## Testing Coverage

| Service | Framework | Test Files | Notes |
|---|---|---|---|
| Web | Vitest + jsdom + Testing Library | `api.test.ts`, `ItemRow.test.tsx`, `SectionCard.test.tsx` | 70% coverage threshold configured |
| Web E2E | Playwright (chromium) | `auth.spec.ts`, `home.spec.ts`, `list.spec.ts`, `ai.spec.ts` | Retries: 2 CI / 0 local |
| API Gateway | Vitest | `gateway.test.ts` | Hardcoded test env |
| User Service | Go testing + testify | `handler_test.go`, `user_service_test.go`, `auth_test.go` | CI runs with `-race` |
| List Service | Go testing + testify | `handler_test.go`, `list_service_test.go` | CI runs with `-race` |
| AI Service | pytest + pytest-asyncio | 5 test files covering routes, services, worker | Ruff for lint/format |

---

## Key Architecture Decisions (Quick Reference)

- **JWT defense in depth** — verified at Gateway AND each downstream service
- **Soft deletes** — `deleted_at` column in list_db; never hard-delete
- **User ownership** — item operations JOIN through sections to verify `user_id`
- **OpenRouter** — AI Service uses `openai` Python SDK with OpenRouter base URL (model: `qwen/qwen3-235b-a22b-2507`)
- **Go layering** — handler → service → repository + middleware
- **Tailwind v4** — CSS-first config (`@import "tailwindcss"` in globals.css), no tailwind.config.js
- **API Gateway is CommonJS**, Web is ESM

---

## Upcoming Work (from project-update-experiments.md)

| Week | Focus |
|---|---|
| Week 1 (Mar 22–28) | Tiered inference infrastructure, SQLite KB with 50 products |
| Week 2 (Mar 29–Apr 4) | 3-step reasoning chain, recipe cluster format, Experiment 1 |
| Week 3 (Apr 5–11) | Load testing async pipeline, tiered inference A/B |
| Week 4 (Apr 12–18) | Polish, final analysis, demo |
