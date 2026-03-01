# Smart Grocery — Phase 1

A grocery shopping assistant with AI-powered suggestions, built on a microservices architecture running on Kubernetes. **Phase 1 is web-first** — a Vite + React SPA that talks to the backend through the API Gateway.

## Phase 1 Scope

| Service | Language | Purpose |
|---------|----------|---------|
| **Web Client** | React / Vite / Tailwind | SPA frontend — list management, AI features, real-time sync |
| **API Gateway** | Node.js / Fastify | REST routing, JWT auth, rate limiting, WebSocket proxy |
| **User Service** | Go / Gin | Accounts, profiles, preferences (PostgreSQL) |
| **List Service** | Go / Gin | Sections, items, event publishing (PostgreSQL + RabbitMQ) |
| **AI Service** | Python / FastAPI | Tiered inference router, async workers, Claude API (Redis cache) |
| **RabbitMQ** | — | Async AI job queue + list change events |
| **PostgreSQL** | — | Primary data store (user_db + list_db) |
| **Redis** | — | AI response cache |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Web Client (React + Vite + Tailwind)         │
│                http://localhost:5173                       │
└────────────────────────┬────────────────────────────────┘
                         │ REST + WebSocket (via Vite proxy)
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  API Gateway (Fastify)                    │
│            JWT auth · rate limiting · routing             │
│                http://localhost:3000                       │
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

## API Endpoints

### Auth (via Gateway)
- `POST /api/v1/auth/register` — Create account
- `POST /api/v1/auth/login` — Login, receive JWT

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
- `ws://localhost:3000/ws` — Real-time sync + AI result delivery

## Quick Start

### Prerequisites

- Docker Desktop
- minikube
- Tilt (`brew install tilt-dev/tap/tilt`)
- kubectl
- Node.js 20+
- Python 3.11+

### Run

```bash
minikube start --cpus=4 --memory=8192
tilt up
# Dashboard at http://localhost:10350
```

### Service Ports (via Tilt port-forward)

| Service | Port |
|---------|------|
| **Web Client** | **5173** |
| API Gateway | 3000 |
| User Service | 4001 |
| List Service | 4002 |
| AI Service | 4003 |
| RabbitMQ Management | 15672 |
| PostgreSQL | 5432 |
| Redis | 6379 |