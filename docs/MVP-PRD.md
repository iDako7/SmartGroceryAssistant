# MVP Blueprint -- Smart Grocery Assistant

**Last updated:** 2026-03-26
**Status:** Living document. Verified decisions only. Unknowns live in Open Questions.

---

## 1. Vision and Non-Negotiables

**What this is:** A smart grocery assistant that helps new immigrants plan grocery lists and navigate bulk stores like Costco.

**Why it beats general-purpose AI (ChatGPT, Claude):**

- **Speed.** Tiered inference: cache (Redis) then knowledge base (SQLite) then LLM (OpenRouter). Most requests never hit the LLM. Sub-second for KB-served requests.
- **Cost.** A curated knowledge base serves common queries for free. Target: 70%+ of requests handled without a cloud LLM call.
- **Precision.** Domain-specific data -- Costco products, recipe-ingredient mappings, bilingual names, aisle layouts -- curated and grounded, not hallucinated from general training data.

**Non-negotiables:**

1. Faster than asking ChatGPT for grocery advice. Sub-second for KB-served requests.
2. Cheaper to operate than per-query LLM costs. Target 70%+ requests served without cloud LLM.
3. Personalized to user's dietary preferences, household size, and cultural background.
4. AI suggestions grounded in curated knowledge, not hallucinated.
5. Scalable async pipeline. The system must hold under concurrent load.

---

## 2. User Journey

**One sentence:** User onboards with preferences, builds a grocery list with AI-powered suggestions, then shops at Costco with an aisle-grouped view.

### Onboard

- Sign up and create account (email + password)
- Set dietary restrictions and allergies
- Set household size and cultural food preferences
- Set language preference
- Preferences feed into all AI suggestions as context

### Plan

- Create sections (produce, dairy, etc.) and add items with quantities
- Request AI suggestions -- system analyzes gaps in the list and suggests items grounded in KB recipes
- Request AI inspiration -- system suggests 3 meal ideas with missing ingredients
- Accept, dismiss, or modify suggestions before adding to list
- Per-item AI features (translate, item info, alternatives) available on demand

### Shop

- Switch to in-store view -- items automatically grouped by aisle/category
- Check off items as you shop (strikethrough)

---

## 3. Architecture

### System Diagram

```
Web (:3000) --> API Gateway (:3001) --> User Service (:4001) --> user_db (PostgreSQL)
                                      --> List Service (:4002) --> list_db (PostgreSQL)
                                      --> AI Service (:4003)  --> SQLite KB (Knowledge Base)
                                           |                  --> Redis (cache)
                                           |                  --> RabbitMQ (job queue)
                                      AI Worker               --> OpenRouter LLM
```

### Services

- **Web** (Next.js 16 / React 19 / Tailwind v4): SPA frontend. Talks only to the Gateway. Path alias `@/*` maps to `src/*`. ESM.
- **API Gateway** (Fastify 5 / TypeScript): JWT auth, CORS, rate limiting (100/min), HTTP proxying to downstream services. JWT verified here AND in each downstream service (defense in depth). CommonJS.
- **User Service** (Go / Gin): Registration, login, JWT issuance, profiles, dietary preferences, onboarding data. Owns `user_db`.
- **List Service** (Go / Gin): Sections and items CRUD. Soft deletes (`deleted_at`, never hard-delete). User ownership enforcement via section JOIN on `user_id`. Owns `list_db`. Publishes events to RabbitMQ.
- **AI Service** (Python / FastAPI): The brain. Contains the Knowledge Base module (SQLite), tier routing logic, sync AI features (translate, item-info, alternatives), async job submission (suggest, inspire). AI Worker is a separate process consuming from RabbitMQ, calling OpenRouter LLM, storing results in Redis. Client polls for async results.

### Tier Routing Strategy

Inside the AI Service, every request passes through three tiers in order. Each tier either serves the response or falls through to the next.

```
Request --> Cache (Redis) --> KB (SQLite) --> LLM (OpenRouter)
            instant, free    fast, free      slow, costs tokens
```

Goal: 70%+ of requests served without an LLM call.

### Verified Data Model

Two separate PostgreSQL databases on the same server:

**user_db:**

- `users` -- id (UUID), email, password_hash, created_at, updated_at
- `profiles` -- id (UUID), user_id (FK), language_preference, dietary_restrictions, household_size, taste_preferences, created_at, updated_at

**list_db:**

- `sections` -- id (UUID), user_id (no FK, cross-db), name, position, deleted_at, created_at, updated_at
- `items` -- id (UUID), section_id (FK), name_en, name_secondary, quantity, checked, deleted_at, created_at, updated_at

Key constraints:

- Soft deletes in list_db -- items and sections use `deleted_at` column, never hard-deleted
- User ownership enforcement -- item operations JOIN through sections to verify `user_id`
- Cross-db boundary -- `sections.user_id` references a user in `user_db` but has no FK constraint (PostgreSQL does not support cross-database FKs)
- JWT defense in depth -- verified at Gateway AND each downstream service

### Async Pipeline (Suggest / Inspire)

```
Client POST --> AI Service enqueues --> RabbitMQ --> AI Worker consumes --> OpenRouter LLM --> Redis --> Client polls
```

- RabbitMQ exchange: `ai` (direct), routing key: `jobs`
- Queue: `ai.jobs` (durable, TTL 5 min, prefetch 4)
- Worker calls OpenRouter (model: `qwen/qwen3-235b-a22b-2507`, max_tokens: 1024)
- Results stored in Redis with key `ai:result:{job_id}`, TTL 3600s
- Client polls `GET /api/v1/ai/jobs/:id` every 2s

### Knowledge Base Module (Inside AI Service)

- SQLite database with curated recipe-ingredient mappings, product data, substitutions
- Starting scope: 3-5 cuisines (Chinese, Korean, Mexican, etc.)
- Populated offline via script + LLM generation + human review
- Serves as the grounding layer for AI suggestions -- LLM reasons over KB data, not from scratch
- Initial target: 50 common Costco products for Tier 1

---

## 4. Quality Boundaries

### Always Do

- TDD -- write tests first, maintain 70%+ coverage across lines/functions/branches/statements
- Load test the async pipeline (RabbitMQ --> Worker --> Redis --> poll)
- JWT auth verification at both Gateway and downstream services
- Soft deletes only -- never hard-delete user data
- Integration tests proving services work together end-to-end
- Run Go tests with `-race` flag
- Lint before commit (husky + lint-staged on staged `.ts/.tsx/.js/.jsx` files)

### Ask First

- Database schema changes
- New LLM provider or model switch
- Adding a new service
- Changing the async pipeline pattern
- Modifying CI/CD pipeline
- Changing JWT secret or auth flow

### Never Do

- Hard-delete user data
- Skip auth verification at any layer
- Store secrets in code or commit `.env` files
- Deploy without passing tests
- Call LLM for queries the KB can answer (cost/speed violation)
- Skip pre-commit hooks (`--no-verify`)
