# MVP Blueprint -- Smart Grocery Assistant

**Last updated:** 2026-03-28
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
- Request AI suggestions -- two-step flow:
  1. System asks 1-3 clarifying questions with tappable chip options (e.g., "Is this a BBQ party or weekly restock?"). Adaptive: 1 question for straightforward lists, 2-3 for ambiguous ones. User can skip.
  2. User answers feed as context into the suggestion call. System returns recipe clusters (Smart View), ungrouped items, and store aisle layout (List View) -- all from a single API call.
- Accept, dismiss, or modify suggestions before adding to list. Editable context block allows regeneration.
- Request AI inspiration (per-list) -- system suggests 3 meal ideas with missing ingredients based on full grocery list
- Per-item AI features available on demand:
  - **Translate** -- bidirectional translation (detects input language, returns both name_en and secondary language name)
  - **Inspire** (per-item) -- 3 recipe ideas using that specific item, each with missing ingredients and "Add All" button
  - **Item Info** -- taste profile, common uses, how to pick, storage tips, fun/cultural fact
  - **Alternatives** -- 3-4 substitutes with match level (Very close / Similar / Different but works), description, and aisle hint

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
                                           |                  --> Celery (Redis broker)
                                      AI Worker (Celery)      --> OpenRouter LLM
```

### Services

- **Web** (Next.js 16 / React 19 / Tailwind v4): SPA frontend. Talks only to the Gateway. Path alias `@/*` maps to `src/*`. ESM.
- **API Gateway** (Fastify 5 / TypeScript): JWT auth, CORS, rate limiting (100/min), HTTP proxying to downstream services. JWT verified here AND in each downstream service (defense in depth). CommonJS.
- **User Service** (Go / Gin): Registration, login, JWT issuance, profiles, dietary preferences, onboarding data. Owns `user_db`.
- **List Service** (Go / Gin): Sections and items CRUD. Soft deletes (`deleted_at`, never hard-delete). User ownership enforcement via section JOIN on `user_id`. Owns `list_db`. Publishes events to RabbitMQ.
- **AI Service** (Python / FastAPI): The brain. Contains the Knowledge Base module (SQLite), tier routing logic, sync AI features (translate, item-info, alternatives, per-item inspire, clarifying questions), async job submission (suggest, per-list inspire). AI Worker is a Celery worker process (Redis broker for MVP, RabbitMQ broker experiment in Phase 4), calling OpenRouter LLM, storing results in Redis. Client polls for async results.

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

### Async Pipeline (Suggest / Per-List Inspire)

```
Client POST --> AI Service (optional clarifying questions) --> enqueues --> Celery (Redis broker) --> AI Worker --> OpenRouter LLM --> Redis --> Client polls
```

- **Suggest flow is two-step:** Client first calls clarify endpoint (sync, returns 1-3 questions with chip options). Client submits answers, then suggest is enqueued as async job with user context.
- Celery abstracts the message broker. MVP uses Redis as broker (zero additional infrastructure). Phase 4 experiments with RabbitMQ broker for production features (dead letter queues, priority routing).
- Worker calls OpenRouter (model: `TBD (see Open Questions)`, max_tokens: 1024)
- Results stored in Redis with key `ai:result:{job_id}`, TTL 3600s
- Client polls `GET /api/v1/ai/jobs/:id` every 2s

**Suggest response schema** (powers both Smart View and List View from a single call):

```json
{
  "reason": "1-2 sentence context summary (editable by user for regeneration)",
  "clusters": [
    {
      "name": "Dish Name", "emoji": "🍜", "desc": "Short description",
      "items": [
        { "name_en": "...", "name_zh": "...", "existing": true, "why": "" },
        { "name_en": "...", "name_zh": "...", "existing": false, "why": "Reason (max 15 words)" }
      ]
    }
  ],
  "ungrouped": [{ "name_en": "...", "name_zh": "...", "existing": true }],
  "storeLayout": [
    {
      "category": "Aisle Name", "emoji": "🥩",
      "items": [{ "name_en": "...", "name_zh": "...", "existing": true }]
    }
  ]
}
```

- 2-4 recipe clusters, 3-6 new suggested items total
- Every existing item appears in one cluster or ungrouped
- `storeLayout` contains ALL items (existing + suggested) for List View
- Smart View / List View toggle is client-side (no additional API call)

### Knowledge Base Module (Inside AI Service)

- SQLite database with curated recipe-ingredient mappings, product data, substitutions
- Starting scope: 3-5 cuisines (Chinese, Korean, Mexican, etc.)
- Populated offline via script + LLM generation + human review
- Serves as the grounding layer for AI suggestions -- LLM reasons over KB data, not from scratch
- Initial target: 50 common Costco products for Tier 1

### Per-Item AI Feature Response Schemas

**Item Info:**
```json
{ "taste": "...", "usage": "...", "picking": "...", "storage": "...", "funFact": "..." }
```
All fields bilingual when user is in bilingual mode.

**Alternatives:**
```json
{
  "note": "Why alternatives are needed",
  "alts": [
    { "name_en": "...", "name_zh": "...", "match": "Very close|Similar|Different but works", "desc": "...", "where": "Aisle hint" }
  ]
}
```

**Per-Item Inspire:**
```json
{
  "recipes": [
    { "name": "...", "name_zh": "...", "emoji": "🍳", "desc": "Short description", "add": [{ "name_en": "...", "name_zh": "..." }] }
  ]
}
```
Each recipe includes 2-3 missing ingredients with "Add All" support.

---

## 4. Quality Boundaries

### Always Do

- TDD -- write tests first, maintain 70%+ coverage across lines/functions/branches/statements
- Load test the async pipeline (Celery --> Worker --> Redis --> poll)
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
