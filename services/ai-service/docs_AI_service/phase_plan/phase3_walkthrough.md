# Phase 3 Walkthrough — Async Suggest Pipeline

## High-Level Architecture

Phase 3 adds an **async suggest pipeline** on top of the existing Phase 2 sync layer. The new pieces are Celery, a job store, and the suggest domain function:

```
Client
  │
  ├── POST /suggest  (async — returns 202 immediately)
  │     │
  │     ▼
  │   Routes (ai.py)
  │     │  generates job_id, writes "pending" to job_store, fires Celery task
  │     │
  │     ▼
  │   Celery Worker (tasks.py)
  │     │  picks up job from Redis broker
  │     │  creates its own LLMClient (not the singleton)
  │     │  calls domains.suggest()
  │     │  writes result + status back to job_store
  │     │
  │     ▼
  │   Domain Function (domains.py → suggest)
  │     │  builds prompt, calls LLMClient.call(), parses JSON
  │     │
  │     ▼
  │   LLMClient → OpenRouter API
  │
  │
  ├── GET /jobs/{job_id}  (polling — returns status + result when done)
  │     │
  │     ▼
  │   Routes (ai.py) → job_store.get_job_status() / get_job_result()
  │     │
  │     ▼
  │   Redis (ai:status:{id}, ai:result:{id})
  │
  │
  └── POST /clarify, /translate, /item-info, etc.  (sync — unchanged from Phase 2)
        │
        ▼
      Routes → domains → LLMClient (singleton) → Redis Cache + OpenRouter
```

## What Phase 3 added (4 new files, 2 modified)

### New files

**`app/worker/celery_app.py`** — Celery application configuration. Connects to Redis as broker (db 1), sets JSON serialization, `task_acks_late=True` so jobs survive worker crashes.

**`app/worker/tasks.py`** — The actual Celery task. Contains two functions:
- `_run_suggest()` — the async core logic (testable without a running broker)
- `suggest_task()` — the `@celery_app.task` decorator wrapper that calls `asyncio.run(_run_suggest())`

**`app/services/job_store.py`** — Job lifecycle storage via Redis. Four functions: `set_job_status`, `get_job_status`, `set_job_result`, `get_job_result`. Stores two Redis keys per job: `ai:status:{id}` and `ai:result:{id}`.

**`worker.py`** (root) — Entry point for `celery -A worker worker`. Just imports the tasks module to register them with Celery.

### Modified files

**`app/routes/ai.py`** — Added two new endpoints: `POST /suggest` (accepts the request, queues job, returns 202) and `GET /jobs/{job_id}` (polls status/result).

**`app/services/domains.py`** — Added `suggest()` domain function plus `_format_answers()` helper.

**`app/models.py`** — Added all the suggest-related Pydantic models: `ClarifyAnswer`, `SuggestRequest`, `SuggestResponse`, `SuggestCluster`, `StoreLayoutCategory`, etc.

**`app/config.py`** — Added `celery_result_ttl` and `celery_broker_url` settings.

## Why this separation matters

### The async problem

Suggest is the heaviest AI call — it analyzes an entire grocery list, generates meal clusters, gap analysis, and a store layout. It takes 5-15 seconds. A sync endpoint would block the FastAPI worker and risk timeouts.

### The solution: fire-and-forget with polling

```
Client                    FastAPI                  Celery Worker         Redis
  │                         │                         │                   │
  │── POST /suggest ──────► │                         │                   │
  │                         │── set_job_status("pending") ──────────────► │
  │                         │── suggest_task.delay() ──────────────────►  │
  │◄── 202 {job_id} ────── │                         │                   │
  │                         │                    picks up job             │
  │                         │                         │── set("processing")►│
  │                         │                         │── LLM call ──►    │
  │── GET /jobs/{id} ─────► │                         │                   │
  │◄── {"status":"processing"}                        │                   │
  │                         │                    LLM responds             │
  │                         │                         │── set_result ───► │
  │                         │                         │── set("done") ──► │
  │── GET /jobs/{id} ─────► │                         │                   │
  │                         │── get_status + result ◄──────────────────── │
  │◄── {"status":"done", "result": {...}} ─────────── │                   │
```

The FastAPI process never blocks. The Celery worker does the slow LLM call in a separate process.

## Key design choices

### The worker creates its own LLMClient

In sync endpoints (Phase 2), routes call `get_llm_client()` — the singleton — and pass it to domain functions:

```python
# ai.py — sync endpoint
client = get_llm_client()       # singleton from the FastAPI process
return await domains.translate_item(client, ...)
```

But the Celery worker runs in a **separate process**. It can't share the FastAPI singleton. So `tasks.py` creates a fresh `LLMClient` directly:

```python
# tasks.py — Celery worker
client = LLMClient(
    api_key=settings.openrouter_api_key,
    model_fast=settings.openrouter_model_fast,
    model_full=settings.openrouter_model_full,
)
result = await suggest(client, sections, answer_objs, profile=profile_obj)
```

The domain function `suggest()` doesn't care where its `LLMClient` came from — same dependency injection pattern from Phase 2. Tests can pass a mock, the FastAPI route can pass the singleton, the Celery worker can pass a fresh instance.

### `_run_suggest` separated from the Celery decorator

```python
async def _run_suggest(job_id, sections, answers, profile):
    """Core async logic — testable without Celery broker."""
    ...

@celery_app.task
def suggest_task(job_id, sections, answers, profile):
    """Celery wrapper — just calls asyncio.run()."""
    asyncio.run(_run_suggest(job_id, sections, answers, profile))
```

Why? Celery tasks are synchronous functions that are hard to test (they need a running broker). By pulling the real logic into `_run_suggest`, tests can call it directly with `await` — no broker, no Celery worker, just mock the LLM and Redis.

### Redis as job store (not Celery result backend)

Jobs are stored in Redis via `job_store.py` using the same `cache_get`/`cache_set` functions that the LLM cache uses. Phase 3 does **not** use Celery's built-in result backend. Why:

1. **Uniform interface** — the same Redis + same helper functions for both caching and job storage
2. **Custom status lifecycle** — `pending → processing → done/failed` with error messages, richer than Celery's built-in states
3. **TTL control** — jobs expire after `celery_result_ttl` seconds (default 3600), configured in one place

## The two-step suggest flow (clarify → suggest)

Phase 3 completes the user-facing flow that was designed in the blueprint:

1. **Client calls `POST /clarify`** (sync) — sends grocery list sections, gets back 1-3 clarifying questions with tappable chip options
2. **User answers** the questions in the UI
3. **Client calls `POST /suggest`** (async) — sends sections + answers → gets back `job_id`
4. **Client polls `GET /jobs/{job_id}`** until status is `"done"` → gets clustered meal suggestions, gap analysis, store layout

The `answers` field on `SuggestRequest` carries the user's clarify responses into the suggest prompt, so the LLM has context about what the user actually wants.
