# AI Service Phase 1 — Context for New Conversations

**Created:** 2026-03-27
**Purpose:** Reference doc to onboard a new Claude session for Phase 1 work. Read this first.

---

## What This Project Is

Smart grocery assistant helping new immigrants navigate Costco. Polyglot microservices: Next.js frontend, Fastify gateway, Go user/list services, **Python/FastAPI AI service** (Person C owns this).

## What Phase 1 Delivers

**User story:** User asks "what aisle is chicken in?" and gets an answer from the KB in <100ms. If KB doesn't know, LLM answers in 3-5s.

**Endpoints (sync only):**
- `POST /api/v1/ai/translate` — translate product names between languages
- `POST /api/v1/ai/item-info` — product details, aisle location, typical quantity
- `POST /api/v1/ai/alternatives` — substitutions for a given product

**NOT in Phase 1:** Redis caching (Phase 2), async suggest/inspire (Phase 3), RabbitMQ (Phase 4), RAG (future).

## Architecture Decisions (Settled)

| Decision | Choice | Key reasoning |
|----------|--------|---------------|
| Tier routing | Hybrid: explicit request-type routing + confidence scoring in KB fuzzy search only | Deterministic for most requests, smart where it matters |
| KB storage | SQLite + FTS5 (deployed as file) | Read-only reference data, zero ops, ~0.01ms reads |
| LLM output | Structured JSON mode | Uniform interface across all tiers |
| LLM gateway | OpenRouter (using `openai` Python SDK with OpenRouter base URL) | NOT Anthropic API directly |
| Async pipeline | Celery + Redis broker (Phase 3) | Not relevant for Phase 1 |
| Deployment | AWS ECS Fargate | Not relevant for Phase 1 |

## Tier Routing (Phase 1 = Tier 2 + Tier 3 only, no cache)

```
Request → KB (SQLite + FTS5) → LLM (OpenRouter)
          fast/free             slow/costs tokens
```

- Explicit routing decides which tiers are attempted per endpoint
- KB tier has two modes: structured query (exact match, confidence 1.0 or 0.0) and FTS5 fuzzy search (confidence = relevance score)
- If KB confidence < threshold → fall through to LLM
- LLM returns structured JSON, same schema as KB responses

## KB Schema (Proposed, needs finalization)

```sql
products        — id, name_en, name_zh, name_ko, name_es, category, component_role, aisle_hint, store, unit, typical_quantity
                  component_role: 'protein' | 'carb' | 'vegetable' | 'sauce' | 'dairy' | 'pantry'
products_fts    — FTS5 virtual table on products (name_en, name_zh, name_ko, name_es, category)
recipes         — id, name, cuisine, flavor_profile, serves, description
                  flavor_profile: e.g. 'spicy-savory', 'sweet-umami', 'sour-fresh'
recipe_ingredients — recipe_id, product_id, quantity, optional
substitutions   — original_id, substitute_id, notes
flavor_tags     — product_id (FK products), tag TEXT
                  tag: 'spicy' | 'umami' | 'sweet' | 'savory' | 'sour' | 'smoky' | 'creamy'
```

> **Why these extra columns?** They don't affect MVP endpoints but are tagged during seed to avoid costly re-seeding later. They enable the future `/restock` endpoint (OQ-7) which reasons about component balance and flavor preferences. See OQ-7 in open_questions.md for full context.

## Open Questions Blocking Phase 1

### OQ-1: LLM Model Selection
- **Status:** Unresolved
- **Need:** Pick 1-2 models on OpenRouter. Evaluate: cost/token, multilingual (Chinese/Korean/Spanish), structured JSON support, latency
- **Candidates:** GPT-4o-mini, Claude 3.5 Haiku, Qwen, Gemini Flash, Llama 3
- **Next:** Benchmark script with 10 test prompts per model

### OQ-2: Costco Product Data Sourcing
- **Status:** Unresolved
- **Need:** ~50 products for MVP seed data. How to source, what fields, regional variation
- **Next:** Manual curation of 50 high-frequency staples first, research automated sourcing later

### OQ-3: KB Seed Data — Cuisines and Recipes
- **Status:** Unresolved
- **Need:** Which 2-3 cuisines, how many recipes per cuisine, recipe-to-Costco-product mapping
- **Candidates:** Chinese, Korean, Mexican
- **Next:** Pick cuisines, generate 10 recipes per cuisine via LLM, manually validate

### OQ-4: FTS5 Confidence Threshold
- **Status:** Resolve during build
- **Next:** Log FTS5 scores on test queries, pick threshold empirically

## Pre-Coding Steps (In Order)

1. ~~Solve OQ-2: Costco data sourcing~~ — DONE. 396 unique products in `services/ai-service/data/costco_raw/`
2. Solve OQ-3: Cuisines and recipes — determines KB content
3. Design KB schema (finalize from proposed above)
4. Design API contracts (request/response JSON schemas for 3 endpoints)
5. Design internal interfaces (tier router, KB query, LLM service)
6. Design project structure (FastAPI directory layout)
7. Solve OQ-1: LLM model selection (benchmark with real prompts)
8. Start coding (TDD)

## Existing Code Structure

```
services/ai-service/
  app/
    main.py              # FastAPI entry point
    config.py            # Configuration
    middleware/auth.py    # JWT verification
    routes/health.py     # Health check
    routes/ai.py         # AI endpoint handlers
    services/cache.py    # Redis cache (Phase 2)
    services/claude.py   # LLM integration (OpenRouter)
    services/queue.py    # Job queue (Phase 3)
  worker.py              # Celery worker (Phase 3)
  tests/                 # pytest + pytest-asyncio + httpx
  pyproject.toml         # uv for dependency management
```

## Build Commands

```bash
cd services/ai-service
uv sync                                              # Install deps (not pip/poetry)
uv run uvicorn app.main:app --reload --port 4003     # Dev server
uv run pytest                                        # All tests
uv run ruff check . && uv run ruff format --check .  # Lint + format
```

## Key Files to Read

| File | What it contains |
|------|-----------------|
| `docs/MVP-PRD.md` | Gold standard architecture doc |
| `private_docs/AI_service/phased_plan.md` | All 4 phases with architecture diagrams |
| `private_docs/AI_service/design_decisions.md` | Every decision with reasoning and "why not X" |
| `private_docs/AI_service/open_questions.md` | OQ-1 through OQ-6 with next actions |
| `services/ai-service/CLAUDE.md` | Service-scoped guidance |
| `CLAUDE.md` | Project-wide guidance |

## Person C's Background

- Python experience mainly from LeetCode, new to async Python and FastAPI
- First time using message queues, Redis, SQLite FTS5
- Goal: solid portfolio project, learning the stack as building
- Each phase introduces 1-2 new concepts on a working foundation
