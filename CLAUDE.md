# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Documentation

- **[MVP Blueprint](docs/MVP-PRD.md)** — gold standard for architecture, scope, and decisions
- **AI Service detailed docs** in `services/ai-service/docs_AI_service/` — phased plan, design decisions, open questions, prototype
- Historical docs archived in `docs/archive/`

## Team Ownership

| Owner | GitHub | Services |
|-------|--------|----------|
| William | @William-g7 | Frontend (`web/`) + API Gateway (`services/api-gateway/`) |
| Kaiyue | @KaiyueWei | User Service (`services/user-service/`) + List Service (`services/list-service/`) |
| Dako | @iDako7 | AI Service (`services/ai-service/`) + AI Worker + KB module |

- **Same-service PR:** owner can self-merge after CI passes
- **Cross-service PR:** both affected owners must review

## Build & Test Commands

### Web (Next.js 16 / React 19) — `cd web`
```bash
npm run dev              # Dev server :3000
npm run build            # Production build
npm run lint             # ESLint
npm run format:check     # Prettier check
npm test                 # Vitest unit tests
npm run test:coverage    # Unit tests with 70% coverage threshold
npm run test:e2e         # Playwright E2E (needs full stack running)
npx vitest run src/lib/api.test.ts        # Single test file
npx vitest run -t "test name pattern"     # Single test by name
```

### API Gateway (Fastify 5) — `cd services/api-gateway`
```bash
npm run dev              # tsx watch :3001
npm run build            # TypeScript compile to dist/
npm test                 # Vitest
npx vitest run src/__tests__/gateway.test.ts   # Single test file
```

### User Service (Go/Gin) — `cd services/user-service`
```bash
go run ./cmd/main.go             # Run :4001
go test ./...                    # All tests
go test ./internal/handler/...   # Single package
go test -v -run TestName ./...   # Single test by name
```

### List Service (Go/Gin) — `cd services/list-service`
```bash
go run ./cmd/main.go             # Run :4002
go test ./...                    # All tests
go test ./internal/handler/...   # Single package
```

### AI Service (Python/FastAPI) — `cd services/ai-service`
```bash
uv sync                          # Install deps (not pip/poetry)
uv run uvicorn app.main:app --reload --port 4003   # Dev server
uv run python worker.py          # Async job worker
uv run pytest                    # All tests
uv run pytest tests/test_ai.py   # Single test file
uv run pytest -k "test_name"     # Single test by name
uv run ruff check .              # Lint
uv run ruff format --check .     # Format check
```

### Infrastructure
```bash
docker compose up -d             # Start postgres, redis, rabbitmq only
docker compose up                # Full stack (all services + infra)
tilt up                          # K8s dev with hot reload (requires minikube)
```

## Architecture

Polyglot microservices behind a single API Gateway:

```
Web (:3000) → API Gateway (:3001) → User Service (:4001) → user_db (PostgreSQL)
                                   → List Service (:4002) → list_db (PostgreSQL) + RabbitMQ publisher
                                   → AI Service (:4003)   → SQLite KB + Redis cache + Celery worker
                                                             ↓
                                                          AI Worker (Celery) → OpenRouter API
```

- **Gateway** proxies all requests and enforces JWT auth, CORS, rate limiting (100/min)
- **Sync AI features**: translate (bidirectional), item-info, alternatives, per-item inspire, clarifying questions — all served directly by the AI Service
- **Async AI flow**: client calls `/api/v1/ai/clarify` for optional clarifying questions (sync) → POSTs to `/api/v1/ai/suggest` or `/api/v1/ai/inspire` with user context → job queued via Celery → worker processes via OpenRouter → result stored in Redis → client polls `/api/v1/ai/jobs/:id`
- **Two separate PostgreSQL databases**: `user_db` (users, profiles) and `list_db` (sections, items). Schemas in `infra/postgres/init.sql`
- **RabbitMQ exchanges/queues**: defined in `infra/rabbitmq/definitions.json` (used by List Service for event publishing)
- **AI async pipeline** uses Celery for task queuing (broker is an implementation detail — see `services/ai-service/docs_AI_service/` for details)
- **Knowledge Base module** inside AI Service — SQLite with curated recipe/product data for 3-5 cuisines. Tier routing: cache → KB → LLM (see Blueprint for details)

## Key Design Decisions

- **JWT defense in depth** — tokens verified at the Gateway AND again in each downstream service
- **Soft deletes** in list_db — items and sections use `deleted_at` column, never hard-deleted
- **User ownership enforcement** — item operations JOIN through sections to verify `user_id`
- **OpenRouter as LLM gateway** — AI service calls OpenRouter (not Anthropic API directly); uses the `openai` Python SDK with OpenRouter base URL
- **Go services layering** — `internal/handler` → `internal/service` → `internal/repository` + `internal/middleware` for auth
- **Web path alias** — `@/*` maps to `src/*` in imports
- **Tailwind v4** — CSS-first configuration via `@import "tailwindcss"` in globals.css, no `tailwind.config.js`
- **API Gateway is CommonJS** (`module: commonjs` in tsconfig), Web is ESM

## Code Style

- **Web**: Prettier — single quotes, trailing commas (es5), 100 char width, semicolons. ESLint flat config extending `next/core-web-vitals` + `next/typescript`
- **Go**: `gofmt` + `golangci-lint` in CI
- **Python**: Ruff — line-length 120, target py312
- **Pre-commit hook**: husky + lint-staged runs `eslint --fix` + `prettier --write` on staged `.ts/.tsx/.js/.jsx` files

## Testing

- **Web unit**: Vitest + jsdom + @testing-library/react. Setup file at `web/src/test/setup.ts`. Coverage thresholds: 70% across lines/functions/branches/statements
- **Web E2E**: Playwright (chromium only). Config at `web/playwright.config.ts`, tests in `web/e2e/`. Retries: 2 in CI, 0 locally. Auto-starts dev server
- **API Gateway**: Vitest with hardcoded test env (`JWT_SECRET='test-secret'`, service URLs on ports 49001-49003). Config at `services/api-gateway/vitest.config.ts`
- **Go services**: `testing` + `testify` assertions. CI runs with `-race` flag
- **AI Service**: pytest + pytest-asyncio + httpx for async HTTP testing

## Git Workflow

- **Branches:** `feat/<service>/<description>`, `fix/<service>/<description>`, `docs/<topic>`, `chore/<topic>`
- **Commits:** Conventional commits — `feat:`, `fix:`, `docs:`, `chore:`
- **PRs:** Use template at `.github/pull_request_template.md`
- **Pre-commit:** husky + lint-staged. Run `npm install` at repo root to activate hooks

## CI/CD

- GitHub Actions at `.github/workflows/ci.yml`
- **Path-based change detection** — only services with file changes run their CI jobs
- Gate job `ci-pass` aggregates all service results for branch protection
- E2E tests are defined but currently commented out in CI
- Concurrency: one workflow per branch, new pushes cancel in-progress runs
