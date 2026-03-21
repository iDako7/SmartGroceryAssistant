# CI/CD + GitHub Projects Setup Plan

> Implemented on 2026-03-20. This document serves as a reference for the team.

## Overview

5 parallel CI jobs run on every PR to `main` and push to `main`. GitHub Projects v2 board tracks work across the team.

---

## CI/CD Workflow (`.github/workflows/ci.yml`)

| Job | Service | Stack | Lint | Build | Test |
|-----|---------|-------|------|-------|------|
| **Web** | `web/` | Next.js 16, Node 22 | `npm run lint` + `npm run format:check` | `npm run build` | `npm run test` |
| **API Gateway** | `services/api-gateway/` | Fastify 5, Node 22 | `npm run lint` | `npm run build` | `npm run test` |
| **User Service** | `services/user-service/` | Go 1.25, Gin | golangci-lint | `go build ./...` | `go test -v -race ./...` |
| **List Service** | `services/list-service/` | Go 1.25, Gin | golangci-lint | `go build ./...` | `go test -v -race ./...` |
| **AI Service** | `services/ai-service/` | Python 3.12, FastAPI | `ruff check` + `ruff format --check` | — | `uv run pytest -v` |

### Key design decisions
- **No path filters** — all jobs run every time (~2-3 min total). Add path filters later if CI minutes become a concern.
- **No external services** — all tests use mocks. No PostgreSQL/Redis/RabbitMQ needed in CI.
- **E2E placeholder** — Playwright step is commented out in the web job, ready to enable.
- **Concurrency control** — in-progress runs are cancelled when a new push arrives on the same branch.

---

## Branch Protection on `main`

- All 5 CI jobs must pass before merge
- At least 1 approving review required
- Stale reviews are dismissed on new pushes
- Branch must be up-to-date before merging (`strict: true`)

---

## GitHub Labels

| Label | Color | Purpose |
|-------|-------|---------|
| `area/frontend` | Blue | Web frontend (Next.js) |
| `area/ai-service` | Green | AI service (Python/FastAPI) |
| `area/backend` | Purple | Backend Go services + API gateway |
| `area/infra` | Red | Infrastructure, CI/CD, Docker, K8s |
| `bug` | Red (default) | Something isn't working |
| `feature` | Teal | New feature or request |
| `chore` | Yellow | Maintenance, refactoring, deps |
| `docs` | Blue | Documentation only |

---

## Milestones

- **Phase 1** — Core MVP: auth, grocery lists, basic AI
- **Phase 2** — Enhanced AI, real-time sync, notifications
- **Phase 3** — Multi-user, sharing, advanced features

---

## GitHub Project Board

Board view with columns: **Backlog → Todo → In Progress → In Review → Done**

### Team assignment convention

| Person | Areas | Default labels |
|--------|-------|----------------|
| Person 1 | ai-service | `area/ai-service` |
| Person 2 | web | `area/frontend` |
| Person 3 | api-gateway, user-service, list-service, infra | `area/backend`, `area/infra` |

---

## Future improvements (deferred)
- CLAUDE.md (root + per-service)
- Claude Code hooks and skills
- Path filters for CI optimization
- E2E tests in CI
- Docker image builds and deployment pipeline
