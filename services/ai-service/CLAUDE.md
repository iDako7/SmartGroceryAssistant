# CLAUDE.md — AI Service

This file provides AI-service-specific guidance. See root `CLAUDE.md` for project-wide context.

## Owner

Person C — AI Service + AI Worker + KB module

## Documentation

- **[Phased Plan](docs_AI_service/phased_plan.md)** — implementation phases with architecture diagrams
- **[Design Decisions](docs_AI_service/design_decisions.md)** — all architecture decisions with reasoning
- **[Open Questions](docs_AI_service/open_questions.md)** — unresolved decisions indexed OQ-1 through OQ-7
- **[Prototype](../../docs/smart-grocery-prototype.jsx)** — original prototype with reference prompts and UI flow
- **[MVP Blueprint](../../docs/MVP-PRD.md)** — project-wide architecture and scope

## Status

**Being rewritten from scratch** with OOP architecture and TDD methodology. The previous functional-style code had significant gaps from the original prototype. New phased plan to be defined separately.

## Architecture

Tiered inference with hybrid routing:

```
Request → Cache (Redis) → KB (SQLite + FTS5) → LLM (OpenRouter)
          instant/free     fast/free             slow/costs tokens
```

- **Sync endpoints** (translate, item-info, alternatives, per-item inspire, clarify): tier routing Cache → KB → LLM, respond directly
- **Async endpoints** (suggest, per-list inspire): Celery + Redis broker, async job lifecycle
- **Two-step suggest flow**: clarify endpoint (sync, 1-3 questions with chip options) → suggest endpoint (async, user context from answers fed into suggestion call)
- **Two inspire modes**: per-item (sync — "recipes using this item") and per-list (async — "meal ideas from full grocery list")
- **Tier routing**: explicit request-type routing as backbone, confidence-based scoring only inside KB tier for fuzzy search
- **LLM output**: structured JSON mode across all tiers (uniform interface)
- **KB**: read-only SQLite deployed as file alongside code, populated offline

## Project Structure

> **Note:** Being redesigned as part of the rewrite. Structure below is the previous layout and will change.

```
app/
  main.py              # FastAPI app entry point
  config.py            # Configuration
  middleware/
    auth.py            # JWT verification middleware
  routes/
    health.py          # Health check endpoint
    ai.py              # AI endpoint handlers
  services/
    cache.py           # Redis cache layer
    claude.py          # LLM integration (OpenRouter)
tests/                 # pytest + pytest-asyncio + httpx
```

## Build & Test

```bash
uv sync                                              # Install deps (not pip/poetry)
uv run uvicorn app.main:app --reload --port 4003     # Dev server
uv run pytest                                        # All tests
uv run pytest tests/test_routes_ai.py                # Single test file
uv run pytest -k "test_name"                         # Single test by name
uv run ruff check .                                  # Lint
uv run ruff format --check .                         # Format check
```

## Code Style

- Python 3.12+, Ruff for lint + format (line-length 120)
- `uv` for dependency management (not pip, not poetry)
- pytest-asyncio for async test functions, httpx for async HTTP testing

## Key Design Notes

- **OpenRouter, not Anthropic API** — uses `openai` Python SDK with OpenRouter base URL
- **JWT defense in depth** — tokens verified at Gateway AND in `app/middleware/auth.py`
- **Celery broker is an implementation detail** — MVP uses Redis, Phase 4 experiments with RabbitMQ
- **KB is read-only in production** — seeded offline, deployed as `.db` file, no write path in service code
