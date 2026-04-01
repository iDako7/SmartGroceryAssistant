# CLAUDE.md -- AI Service

This file provides AI-service-specific guidance. See root `CLAUDE.md` for project-wide context.

## Owner

Dako (@iDako7) -- AI Service + AI Worker + KB module

## Documentation

- **[AI Service Docs](docs_AI_service/INDEX.md)** -- phased plan, design decisions, open questions, dev log
- **[Prototype](../../docs/smart-grocery-prototype.jsx)** -- original prototype with reference prompts and UI flow
- **[MVP Blueprint](../../docs/MVP-PRD.md)** -- project-wide architecture and scope

## Status

**Being rewritten from scratch** with hybrid code style (OOP where needed, functions for pure logic) and TDD methodology. LLM-first approach: all endpoints work with LLM before adding KB and cache layers.

Current phase: **Phase 2** -- All sync endpoints (translate, item-info, alternatives, per-item inspire, clarify) with LLMClient + domain functions architecture, two-tier model config, and optional user profile support.

## Architecture

Tiered inference with hybrid routing (built incrementally across phases):

```
Request --> Cache (Redis) --> KB (SQLite + FTS5) --> LLM (OpenRouter)
            Phase 5           Phase 4                Phase 1
            instant/free      fast/free              slow/costs tokens
```

- **Sync endpoints** (translate, item-info, alternatives, per-item inspire, clarify): direct response, tier routing added in Phase 4-5
- **Async endpoints** (suggest, per-list inspire): Celery + Redis broker (Phase 3), async job lifecycle
- **Two-step suggest flow**: clarify endpoint (sync, 1-3 questions with chip options) --> suggest endpoint (async, user context from answers)
- **Two inspire modes**: per-item (sync -- "recipes using this item") and per-list (async -- "meal ideas from full grocery list")
- **LLM output**: structured JSON mode across all tiers (uniform interface)
- **KB**: read-only SQLite deployed as file alongside code, populated offline (Phase 4)

## Build & Test

```bash
uv sync                                              # Install deps (not pip/poetry)
uv run uvicorn app.main:app --reload --port 4003     # Dev server
uv run pytest                                        # All tests
uv run pytest tests/test_file.py                     # Single test file
uv run pytest -k "test_name"                         # Single test by name
uv run ruff check .                                  # Lint
uv run ruff format --check .                         # Format check
```

## Eval

- **Use `/promptfoo-evals` skill** when creating or updating promptfoo evaluation configs -- it enforces correct patterns (file-based tests, deterministic assertions first, `promptfoo validate`)

## Code Style

- Python 3.12+, Ruff for lint + format (line-length 120)
- `uv` for dependency management (not pip, not poetry)
- pytest-asyncio for async test functions, httpx for async HTTP testing
- Hybrid: classes for stateful things (LLM client, services), functions for pure logic (routes, parsers)

## Key Design Notes

- **OpenRouter, not Anthropic API** -- uses `openai` Python SDK with OpenRouter base URL
- **JWT defense in depth** -- tokens verified at Gateway AND locally in auth middleware
- **Celery broker is an implementation detail** -- MVP uses Redis, Phase 5 experiments with RabbitMQ
- **KB is read-only in production** -- seeded offline, deployed as `.db` file, no write path in service code
- **LLMClient class + domain functions** -- infrastructure (client, cache, JSON parsing) in `llm_client.py`, prompt logic in `domains.py`
- **Two-tier model config** -- `OPENROUTER_MODEL_FAST` for simple tasks, `OPENROUTER_MODEL_FULL` for complex tasks
- **User profile in request body** -- optional `profile` field on all endpoints, temporary until User Service integration
