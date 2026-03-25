# Smart Grocery — Phase 1

A grocery shopping assistant with AI-powered suggestions, built on a microservices architecture. **Phase 1 is web-first** — a Next.js SPA that talks to the backend through the API Gateway.

## Build Status

| Step | Component | Status |
|------|-----------|--------|
| 1 | Infrastructure (PostgreSQL, Redis, RabbitMQ) | ✅ Done |
| 2 | API Gateway (Node.js / Fastify) | ✅ Done |
| 3 | User Service (Go / Gin) | ⬜ Next |
| 4 | List Service (Go / Gin) | ⬜ Pending |
| 5 | AI Service (Python / FastAPI) | ⬜ Pending |
| 6 | Web Client UI (Next.js) | ⬜ Pending |
| 7 | Tilt + Kubernetes | ⬜ Pending |

## Phase 1 Scope

| Service | Language | Purpose |
|---------|----------|---------|
| **Web Client** | Next.js 16 / React 19 / Tailwind v4 | SPA frontend — list management, AI features, real-time sync |
| **API Gateway** | Node.js / Fastify 5 | REST routing, JWT auth, rate limiting, WebSocket proxy |
| **User Service** | Go / Gin | Accounts, profiles, preferences (PostgreSQL) |
| **List Service** | Go / Gin | Sections, items, event publishing (PostgreSQL + RabbitMQ) |
| **AI Service** | Python / FastAPI | Tiered inference router, async workers, Claude API (Redis cache) |
| **RabbitMQ** | — | Async AI job queue + list change events |
| **PostgreSQL** | — | Primary data store (user\_db + list\_db) |
| **Redis** | — | AI response cache |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Web Client (Next.js + Tailwind)              │
│                http://localhost:3000 (web)                │
└────────────────────────┬────────────────────────────────┘
                         │ REST + WebSocket
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  API Gateway (Fastify)                    │
│            JWT auth · rate limiting · routing             │
│                http://localhost:3001                       │
└──────┬──────────────┬──────────────┬────────────────────┘
       │              │              │
       ▼              ▼              ▼
┌────────────┐ ┌────────────┐ ┌────────────┐
│   User     │ │   List     │ │    AI      │
│  Service   │ │  Service   │ │  Service   │
│  (Go)      │ │  (Go)      │ │ (FastAPI)  │
└─────┬──────┘ └──┬──────┬──┘ └──┬────┬───┘
      │           │      │       │    │
      ▼           ▼      ▼       ▼    ▼
  ┌────────┐  ┌────────┐     ┌─────┐ ┌──────────┐
  │Postgres│  │Postgres│     │Redis│ │ RabbitMQ │
  │(user_db)│ │(list_db)│    │cache│ │  queues  │
  └────────┘  └────────┘     └─────┘ └──────────┘
```

## Repo Structure

```
SmartGroceryAssistant/
├── docker-compose.yml          ← local infra (postgres, redis, rabbitmq)
├── .env.example                ← copy to .env, fill in secrets
├── package.json                ← root: husky git hooks only
├── infra/
│   ├── postgres/init.sql       ← user_db + list_db schemas
│   └── rabbitmq/definitions.json ← queues: ai.jobs, ai.results, list.events
├── web/                        ← Next.js 16 web client
│   ├── src/app/                ← App Router pages
│   ├── src/components/
│   ├── src/hooks/
│   ├── src/lib/
│   ├── src/types/
│   ├── src/test/setup.ts
│   ├── e2e/                    ← Playwright tests
│   ├── vitest.config.ts        ← unit tests, 70% coverage threshold
│   └── playwright.config.ts
└── services/
    ├── api-gateway/            ← ✅ Fastify 5, JWT, proxy, WebSocket
    │   └── src/
    │       ├── config.ts
    │       ├── app.ts
    │       ├── index.ts
    │       ├── plugins/        ← jwt, cors, rateLimit
    │       └── routes/         ← auth, users, lists, ai, ws
    ├── user-service/           ← ⬜ Go / Gin
    ├── list-service/           ← ⬜ Go / Gin
    └── ai-service/             ← ⬜ Python / FastAPI
```

## API Endpoints

### Auth (via Gateway, no JWT)
- `POST /api/v1/users/register` — Create account
- `POST /api/v1/users/login` — Login, receive JWT

### Users (JWT required)
- `GET /api/v1/users/profile` — Get user profile
- `PUT /api/v1/users/profile` — Update profile + dietary restrictions

### Lists (JWT required)
- `GET /api/v1/lists/full` — Full list (all sections + items)
- `GET /api/v1/lists/sections` — List sections
- `POST /api/v1/lists/sections` — Create section
- `PUT /api/v1/lists/sections/:id` — Update section
- `DELETE /api/v1/lists/sections/:id` — Delete section (soft)
- `GET /api/v1/lists/sections/:id/items` — Get items in section
- `POST /api/v1/lists/sections/:id/items` — Add item
- `PUT /api/v1/lists/items/:id` — Update item
- `DELETE /api/v1/lists/items/:id` — Delete item (soft)

### AI (JWT required)
- `POST /api/v1/ai/suggest` — Submit suggest job (async, returns jobId)
- `POST /api/v1/ai/inspire` — Submit inspire job (async)
- `POST /api/v1/ai/translate` — Translate item (sync)
- `POST /api/v1/ai/item-info` — Get item info (sync)
- `POST /api/v1/ai/alternatives` — Get alternatives (sync)

### WebSocket
- `ws://localhost:3001/ws?token=<jwt>` — Real-time sync + AI result delivery

## Database Schemas

### user\_db
```sql
users    (id, email, password_hash, created_at, updated_at)
profiles (id, user_id, language_preference, dietary_restrictions[], household_size, taste_preferences, created_at, updated_at)
```

### list\_db
```sql
sections (id, user_id, name, position, deleted_at, created_at, updated_at)
items    (id, section_id, name_en, name_secondary, quantity, checked, deleted_at, created_at, updated_at)
```

### RabbitMQ Queues
| Queue | Exchange | Purpose |
|-------|----------|---------|
| `ai.jobs` | `ai` (direct) | Inbound AI processing jobs |
| `ai.results` | `ai` (direct) | Outbound AI results → WebSocket push |
| `list.events` | `list` (fanout) | List mutation events |

## Quick Start

### Prerequisites
- Docker Desktop
- Node.js 20+
- Go 1.22+
- Python 3.11+

### 1. Start infrastructure
```bash
cp .env.example .env          # fill in JWT_SECRET and ANTHROPIC_API_KEY
docker compose up -d          # postgres + redis + rabbitmq
```

### 2. Run API Gateway
```bash
cd services/api-gateway
npm install
npm run dev                   # http://localhost:3001
```

### 3. Run web client
```bash
cd web
npm install
npm run dev                   # http://localhost:3000
```

### Service Ports

| Service | Port |
|---------|------|
| **Web Client** | **3000** |
| API Gateway | 3001 |
| User Service | 4001 |
| List Service | 4002 |
| AI Service | 4003 |
| RabbitMQ Management | 15672 |
| PostgreSQL | 5432 |
| Redis | 6379 |

### Web Client Scripts
```bash
cd web
npm run dev            # dev server
npm run test           # Vitest unit tests
npm run test:coverage  # with 70% coverage threshold
npm run test:e2e       # Playwright E2E
npm run lint           # ESLint
npm run format         # Prettier
```

### API Gateway Scripts
```bash
cd services/api-gateway
npm run dev            # tsx watch (hot reload)
npm run build          # compile TypeScript → dist/
npm run start          # run compiled build
npm run lint           # tsc --noEmit type check
```

## Environment Variables

See `.env.example` for the full list. Minimum required to run:

```bash
JWT_SECRET=<any strong secret>
ANTHROPIC_API_KEY=sk-ant-...
```

All service URLs default to `localhost` if not set.
