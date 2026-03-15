# Smart Grocery Assistant

A grocery shopping assistant with AI-powered suggestions, built on a polyglot microservices architecture. Phase 1 is web-first — a Next.js SPA that talks to the backend through an API Gateway.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                        │
│                        ┌──────────────────┐                                 │
│                        │  Web Client (SPA) │                                │
│                        │  Next.js  :3000   │                                │
│                        └────────┬─────────┘                                 │
│                            HTTP │ WS                                        │
└────────────────────────────────┼────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          API Gateway (Fastify :3001)                        │
│              JWT auth · CORS · rate limiting (100/min) · proxy              │
│                                                                             │
│  /api/v1/users/*  → :4001    /api/v1/lists/*  → :4002                      │
│  /api/v1/ai/*     → :4003    /ws              → :4002                      │
└──────┬──────────────────────┬───────────────────────┬──────────────────────┘
       │                      │                       │
       ▼                      ▼                       ▼
┌──────────────┐  ┌───────────────────┐  ┌─────────────────────┐
│ User Service │  │  List Service     │  │   AI Service        │
│ Go/Gin :4001 │  │  Go/Gin :4002     │  │   FastAPI :4003     │
│              │  │                   │  │                     │
│ register     │  │ sections CRUD     │  │ translate (sync)    │
│ login        │  │ items CRUD        │  │ item-info (sync)    │
│ profile      │  │ full list         │  │ alternatives (sync) │
│              │  │ WebSocket         │  │ suggest (async)     │
│              │  │ event publishing  │  │ inspire (async)     │
└──────┬───────┘  └──┬─────────┬─────┘  └──┬──────────┬──────┘
       │             │         │            │          │
       ▼             ▼         │            │          ▼
┌──────────┐  ┌──────────┐    │            │   ┌─────────────┐
│ user_db  │  │ list_db  │    │            │   │   Redis     │
│ (PG)     │  │ (PG)     │    │            │   │   :6379     │
│          │  │          │    │            │   │             │
│ users    │  │ sections │    │            │   │ ai:result:* │
│ profiles │  │ items    │    │            │   │ TTL 3600s   │
│          │  │ (soft del)│   │            │   └─────────────┘
└──────────┘  └──────────┘    │            │
                               │            │
                               ▼            ▼
                      ┌──────────────────────────────┐
                      │        RabbitMQ :5672         │
                      │                              │
                      │  "list" exchange (fanout)    │
                      │    → list.events queue       │
                      │                              │
                      │  "ai" exchange (direct)      │
                      │    → ai.jobs   (TTL 5min)    │
                      │    → ai.results (TTL 5min)   │
                      └──────────────┬───────────────┘
                                     │
                                     ▼
                            ┌─────────────────┐
                            │   AI Worker      │
                            │   (Python)       │
                            │                  │
                            │ Consumes ai.jobs │
                            │ Calls OpenRouter │
                            │ Stores → Redis   │
                            └─────────────────┘
```

## Services

| Service | Language | Port | Purpose |
|---------|----------|------|---------|
| **Web Client** | Next.js 16 / React 19 / Tailwind v4 | 3000 | SPA — list management, AI panel, real-time sync |
| **API Gateway** | Node.js / Fastify 5 | 3001 | REST proxy, JWT auth, rate limiting, WebSocket relay |
| **User Service** | Go / Gin | 4001 | Accounts, profiles, preferences (PostgreSQL) |
| **List Service** | Go / Gin | 4002 | Sections, items, event publishing (PostgreSQL + RabbitMQ) |
| **AI Service** | Python / FastAPI | 4003 | Sync + async AI inference via OpenRouter (Redis cache) |
| **AI Worker** | Python | — | Standalone RabbitMQ consumer for async AI jobs |

**Infrastructure:** PostgreSQL :5432 (user_db, list_db) · Redis :6379 · RabbitMQ :5672

## Quick Start

### Prerequisites
- Docker Desktop
- Node.js 20+
- Go 1.22+
- Python 3.11+ with [uv](https://docs.astral.sh/uv/)

### Option 1: Docker Compose (infrastructure only)

```bash
cp .env.example .env              # fill in JWT_SECRET and OPENROUTER_API_KEY
docker compose up -d              # starts postgres, redis, rabbitmq

# Then start each service individually (see commands below)
```

### Option 2: Tilt + Kubernetes (full stack)

```bash
minikube start
tilt up                           # builds + deploys everything with hot reload
```

### Running Services Individually

```bash
# API Gateway
cd services/api-gateway && npm install && npm run dev     # :3001

# User Service
cd services/user-service && go run ./cmd/main.go          # :4001

# List Service
cd services/list-service && go run ./cmd/main.go          # :4002

# AI Service
cd services/ai-service && uv sync && uv run uvicorn app.main:app --reload --port 4003

# AI Worker
cd services/ai-service && uv run python worker.py

# Web Client
cd web && npm install && npm run dev                      # :3000
```

## API Endpoints

### Auth (no JWT required)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/users/register` | Create account |
| POST | `/api/v1/users/login` | Login, receive JWT |

### Users (JWT required)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/users/me` | Get profile |
| PUT | `/api/v1/users/me` | Update profile |

### Lists (JWT required)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/lists/full` | Full list (all sections + items) |
| GET | `/api/v1/lists/sections` | List sections |
| POST | `/api/v1/lists/sections` | Create section |
| PUT | `/api/v1/lists/sections/:id` | Update section |
| DELETE | `/api/v1/lists/sections/:id` | Soft-delete section |
| GET | `/api/v1/lists/sections/:id/items` | Get items in section |
| POST | `/api/v1/lists/sections/:id/items` | Add item |
| PUT | `/api/v1/lists/items/:id` | Update item |
| DELETE | `/api/v1/lists/items/:id` | Soft-delete item |

### AI (JWT required)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/ai/translate` | Translate item name (sync) |
| POST | `/api/v1/ai/item-info` | Get item info (sync) |
| POST | `/api/v1/ai/alternatives` | Get alternatives (sync) |
| POST | `/api/v1/ai/suggest` | Submit suggest job (async → poll) |
| POST | `/api/v1/ai/inspire` | Submit inspire job (async → poll) |
| GET | `/api/v1/ai/jobs/:id` | Poll async job result |

### WebSocket
- `ws://localhost:3001/ws?token=<jwt>` — real-time list sync

## Database Schemas

### user\_db
```sql
users    (id UUID, email, password_hash, created_at, updated_at)
profiles (id UUID, user_id FK, language_preference, dietary_restrictions[],
          household_size, taste_preferences, created_at, updated_at)
```

### list\_db
```sql
sections (id UUID, user_id, name, position, deleted_at, created_at, updated_at)
items    (id UUID, section_id FK, name_en, name_secondary, quantity,
          checked, deleted_at, created_at, updated_at)
```

## Testing

```bash
# Run all tests
cd web && npm test                                              # Vitest (unit)
cd services/api-gateway && npm test                             # Vitest (gateway)
cd services/user-service && go test ./...                       # Go
cd services/list-service && go test ./...                       # Go
cd services/ai-service && uv run pytest                         # pytest

# Coverage
cd web && npm run test:coverage                                 # 70% threshold

# E2E (requires full stack running)
cd web && npm run test:e2e                                      # Playwright
```

| Service | Framework | Tests |
|---------|-----------|-------|
| Web Client | Vitest + Playwright | Unit (components, API client) + E2E (auth, list, AI) |
| API Gateway | Vitest | JWT enforcement, CORS, health, invalid tokens |
| User Service | Go testing + testify | Handlers, service logic, auth middleware |
| List Service | Go testing + testify | Handlers, service logic, event publishing |
| AI Service | pytest | Routes, Claude service, worker, queue, cache |

## Repo Structure

```
SmartGroceryAssistant/
├── docker-compose.yml              # local infra + all services
├── Tiltfile                        # K8s dev with hot reload
├── k8s/                            # Kubernetes manifests
├── infra/
│   ├── postgres/init.sql           # user_db + list_db schemas
│   └── rabbitmq/definitions.json   # exchanges + queues
├── web/                            # Next.js 16 client
│   ├── src/app/                    # App Router pages
│   ├── src/components/             # list/, ai/ components
│   ├── src/lib/                    # api.ts, auth-context.tsx
│   ├── e2e/                        # Playwright specs
│   └── vitest.config.ts
└── services/
    ├── api-gateway/                # Fastify 5 proxy
    │   └── src/
    │       ├── plugins/            # jwt, cors, rateLimit
    │       ├── routes/             # auth, users, lists, ai, ws
    │       └── __tests__/          # gateway.test.ts
    ├── user-service/               # Go / Gin
    │   ├── cmd/main.go
    │   └── internal/               # handler, service, repository, middleware
    ├── list-service/               # Go / Gin
    │   ├── cmd/main.go
    │   └── internal/               # handler, service, repository, events
    └── ai-service/                 # Python / FastAPI
        ├── app/                    # main, routes, services, middleware
        ├── worker.py               # async RabbitMQ consumer
        └── tests/                  # pytest suite
```

## Key Design Decisions

- **JWT defense in depth** — verified at Gateway AND each downstream service
- **Soft deletes** in list_db (`deleted_at` column) — items and sections are never hard-deleted
- **User ownership enforcement** — all item operations JOIN through sections to verify `user_id`
- **Async AI jobs** — long-running AI calls go through RabbitMQ → worker → Redis, polled by client
- **Python deps via uv** — not pip/poetry; uses `pyproject.toml` + `uv.lock`
- **OpenRouter** as LLM gateway — not direct Anthropic API

## Environment Variables

See `.env.example` for the full list. Minimum required:

```bash
JWT_SECRET=<any strong secret>
OPENROUTER_API_KEY=<your key>
```

All service URLs default to `localhost` if not set.

## Ports

| Service | Port |
|---------|------|
| Web Client | 3000 |
| API Gateway | 3001 |
| User Service | 4001 |
| List Service | 4002 |
| AI Service | 4003 |
| PostgreSQL | 5432 |
| Redis | 6379 |
| RabbitMQ | 5672 |
| RabbitMQ Management | 15672 |
