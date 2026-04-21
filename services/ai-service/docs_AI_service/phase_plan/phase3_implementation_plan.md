# Phase 3 Implementation Plan: Async Pipeline (Suggest)

**Last updated:** 2026-04-01
**Owner:** Dako (@iDako7)
**Status:** Ready to implement

## Context

Phase 2 built all sync endpoints (translate, item-info, alternatives, inspire/item, clarify) with the LLMClient + domain functions architecture. The GET /jobs/{job_id} route exists as a stub that reads `ai:result:{job_id}` from Redis.

Phase 3 adds the async suggest pipeline: the user's full grocery list is submitted, a Celery worker processes it in the background via LLM, and the client polls for the result. The two-step flow is: client calls `/clarify` (sync, already done) → submits answers + list to `/suggest` (async).

## Architecture Decisions (confirmed in discussion)

- **Celery + Redis broker** — Celery handles task queuing, retry, and worker lifecycle. Redis is the broker (same Redis instance, different DB or key prefix).
- **Manual job status in Redis** — Worker writes `ai:status:{job_id}` and `ai:result:{job_id}` directly. The route reads these keys. No coupling to Celery's result backend in the API layer.
- **Status lifecycle** — `pending → processing → done | failed`. Failed includes an error message so the client can stop polling.
- **Structured clarify answers** — `SuggestRequest.answers` is `list[ClarifyAnswer]` (question + answer pairs). The domain function serializes them into the prompt. Client doesn't need to know prompt format.
- **Whole-list scope** — Suggest takes all sections (same shape as clarify), not a target section.
- **asyncio.run() in worker** — Celery tasks are sync. The worker creates its own LLMClient and uses `asyncio.run()` to call the async domain function.
- **No caching for suggest** — Each suggest request is unique (user context + full list). No cache key.

---

## Step 1: Add Celery Dependency + Celery App Config

**Modify:** `pyproject.toml`
**Create:** `app/worker/celery_app.py`, `app/worker/__init__.py`
**Test first:** `tests/test_celery_app.py` (new)

Add to `pyproject.toml` dependencies:
```python
"celery[redis]>=5.4.0",
```

Add to `app/config.py`:
```python
celery_broker_url: str = "redis://localhost:6379/1"    # DB 1, separate from cache (DB 0)
celery_result_ttl: int = 3600                           # job result TTL in seconds
```

Create `app/worker/celery_app.py`:
```python
from celery import Celery
from app.config import settings

celery_app = Celery("ai_worker", broker=settings.celery_broker_url)
celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    task_track_started=True,
    task_acks_late=True,                # re-deliver if worker crashes mid-task
    worker_prefetch_multiplier=1,       # one task at a time (LLM calls are slow)
)
```

Tests: celery app instantiates, config values load from env vars.

---

## Step 2: Job Store Helpers

**Create:** `app/services/job_store.py`
**Test first:** `tests/test_job_store.py` (new)

```python
import json
from app.services.cache import cache_get, cache_set

JOB_TTL = 3600  # 1 hour

async def set_job_status(job_id: str, status: str, error: str = "") -> None:
    """Write job status. Status: pending | processing | done | failed."""
    payload = json.dumps({"status": status, "error": error})
    await cache_set(f"ai:status:{job_id}", payload, JOB_TTL)

async def get_job_status(job_id: str) -> dict | None:
    """Read job status. Returns None if job doesn't exist."""
    raw = await cache_get(f"ai:status:{job_id}")
    if raw is None:
        return None
    return json.loads(raw)

async def set_job_result(job_id: str, result: dict) -> None:
    """Write completed job result."""
    await cache_set(f"ai:result:{job_id}", json.dumps(result), JOB_TTL)

async def get_job_result(job_id: str) -> dict | None:
    """Read job result. Returns None if not yet available."""
    raw = await cache_get(f"ai:result:{job_id}")
    if raw is None:
        return None
    return json.loads(raw)
```

Tests:
- `set_job_status` → `get_job_status` round-trips correctly
- `set_job_result` → `get_job_result` round-trips correctly
- `get_job_status` returns None for unknown job_id
- Status transitions: pending → processing → done (all readable)
- Failed status includes error message

---

## Step 3: Pydantic Models for Suggest

**Modify:** `app/models.py`
**Test first:** `tests/test_models.py` (update existing)

New models:
```python
# ── Suggest (async) ─────────────────────────────────────

class ClarifyAnswer(BaseModel):
    question: str
    answer: str

class SuggestRequest(BaseModel):
    sections: dict[str, list[str]]         # full grocery list
    answers: list[ClarifyAnswer] = Field(default_factory=list)
    profile: UserProfile | None = None

class SuggestClusterItem(BaseModel):
    name_en: str
    existing: bool
    why: str = ""

class SuggestCluster(BaseModel):
    name: str
    emoji: str
    desc: str
    items: list[SuggestClusterItem]

class SuggestUngroupedItem(BaseModel):
    name_en: str
    existing: bool = True

class StoreLayoutItem(BaseModel):
    name_en: str
    existing: bool

class StoreLayoutCategory(BaseModel):
    category: str
    emoji: str
    items: list[StoreLayoutItem]

class SuggestResponse(BaseModel):
    reason: str
    clusters: list[SuggestCluster]
    ungrouped: list[SuggestUngroupedItem]
    store_layout: list[StoreLayoutCategory] = Field(alias="storeLayout", default_factory=list)

    model_config = {"populate_by_name": True}

# ── Job Status ──────────────────────────────────────────

class JobStatusResponse(BaseModel):
    job_id: str
    status: str                            # pending | processing | done | failed
    result: SuggestResponse | None = None
    error: str = ""
```

Tests: validation with complete data, optional fields default correctly, ClarifyAnswer validation, SuggestResponse alias works for both `storeLayout` and `store_layout`.

Steps 1, 2, and 3 are independent — can be done in parallel.

---

## Step 4: Suggest Domain Function

**Modify:** `app/services/domains.py`
**Test first:** `tests/test_domains.py` (update existing)

New function following the existing pattern:

```python
async def suggest(
    client: LLMClient,
    sections: dict[str, list[str]],
    answers: list | None = None,
    *,
    profile: UserProfile | None = None,
) -> SuggestResponse:
    """Analyze a full grocery list and return clustered meal suggestions."""
```

Prompt construction (adapted from prototype lines 584-596):
- System: "Smart grocery assistant. Analyze list, suggest items."
- Profile context via `_profile_context(profile)`
- All items with section labels: `"Produce: apples, bananas. Meat: chicken, beef."`
- User context from answers: `"Q: What's the occasion? A: Weeknight dinner\nQ: How many people? A: Family of 4"`
- Steps: gap analysis → cultural match → recipe bridge
- JSON schema template matching `SuggestResponse`
- Rules: 2-4 clusters, 3-6 NEW items total, every existing item in one cluster or ungrouped, storeLayout has ALL items

Helper:
```python
def _format_answers(answers: list) -> str:
    """Serialize ClarifyAnswer pairs into a prompt-friendly string."""
    if not answers:
        return ""
    lines = [f"Q: {a.question}\nA: {a.answer}" for a in answers]
    return "\nUser context (from their answers):\n" + "\n".join(lines)
```

Config: tier=`"full"`, max_tokens=`2000`, no caching (each suggest is unique).

Tests:
- Correct tier (`"full"`) passed to `client.call()`
- max_tokens is 2000
- Profile context appears in prompt when provided
- Answers appear in prompt when provided, absent when empty
- All section items appear in prompt
- Valid JSON → correct `SuggestResponse` shape
- Garbage JSON → fallback `SuggestResponse(reason="", clusters=[], ungrouped=[], store_layout=[])`
- No cache key passed (or cache_key is None/empty)

Depends on: Steps 2 (models import) + existing LLMClient.

---

## Step 5: Celery Task

**Create:** `app/worker/tasks.py`
**Test first:** `tests/test_worker_tasks.py` (new)

```python
import asyncio
import json
import logging

from app.worker.celery_app import celery_app
from app.services.job_store import set_job_status, set_job_result
from app.services.domains import suggest
from app.services.llm_client import LLMClient
from app.config import settings

logger = logging.getLogger(__name__)

@celery_app.task(bind=True, max_retries=3, default_retry_delay=5)
def suggest_task(self, job_id: str, sections: dict, answers: list, profile: dict | None):
    """Process a suggest request asynchronously."""
    async def _run():
        # Update status to processing
        await set_job_status(job_id, "processing")

        # Create a worker-local LLMClient (not the FastAPI singleton)
        client = LLMClient(
            api_key=settings.openrouter_api_key,
            model_fast=settings.openrouter_model_fast,
            model_full=settings.openrouter_model_full,
        )

        try:
            # Convert raw dicts back to Pydantic models
            from app.models import ClarifyAnswer, UserProfile
            answer_objs = [ClarifyAnswer(**a) for a in answers] if answers else []
            profile_obj = UserProfile(**profile) if profile else None

            result = await suggest(client, sections, answer_objs, profile=profile_obj)
            await set_job_result(job_id, result.model_dump(by_alias=True))
            await set_job_status(job_id, "done")
        except Exception as exc:
            logger.exception("suggest_task failed for job %s", job_id)
            # Retry on transient failures
            if self.request.retries < self.max_retries:
                raise self.retry(exc=exc, countdown=5 * (2 ** self.request.retries))
            # Max retries exceeded — mark as failed
            await set_job_status(job_id, "failed", error=str(exc))

    asyncio.run(_run())
```

Tests (mock LLMClient + Redis):
- Happy path: status transitions pending → processing → done, result stored
- LLM failure: retries with exponential backoff (5s, 10s, 20s)
- Max retries exceeded: status becomes "failed" with error message
- Sections and answers are correctly deserialized from JSON dicts
- Profile=None works (no profile)

Depends on: Steps 1 (celery_app), 2 (job_store), 4 (domain function).

---

## Step 6: POST /suggest Route

**Modify:** `app/routes/ai.py`
**Test first:** Update `tests/test_routes_ai.py`

```python
import uuid

@router.post("/suggest", status_code=202)
async def suggest_endpoint(req: SuggestRequest, _: str = Depends(verify_token)):
    """Submit grocery list for async AI analysis. Returns job_id for polling."""
    job_id = str(uuid.uuid4())

    # Mark job as pending before enqueuing
    await job_store.set_job_status(job_id, "pending")

    # Enqueue Celery task — serialize Pydantic models to dicts
    suggest_task.delay(
        job_id=job_id,
        sections=req.sections,
        answers=[a.model_dump() for a in req.answers],
        profile=req.profile.model_dump() if req.profile else None,
    )

    return {"job_id": job_id, "status": "pending"}
```

Tests:
- Returns 202 with `{"job_id": "...", "status": "pending"}`
- job_id is a valid UUID
- Job status set to "pending" in Redis
- Celery task enqueued with correct args (mock `suggest_task.delay`)
- Validation: missing `sections` → 422
- Auth: missing/bad token → 401/403
- Empty answers list is valid (skipped clarify flow)

Depends on: Steps 3 (models), 5 (task import for `.delay()`).

---

## Step 7: Update GET /jobs/{job_id}

**Modify:** `app/routes/ai.py`
**Test first:** Update `tests/test_routes_ai.py`

Replace the current stub with:
```python
@router.get("/jobs/{job_id}")
async def get_job(job_id: str, _: str = Depends(verify_token)):
    """Return async job status and result payload when available."""
    status_data = await job_store.get_job_status(job_id)
    if status_data is None:
        raise HTTPException(status_code=404, detail="Job not found")

    status = status_data["status"]

    if status == "done":
        result = await job_store.get_job_result(job_id)
        return {"job_id": job_id, "status": "done", "result": result}

    if status == "failed":
        return {"job_id": job_id, "status": "failed", "error": status_data.get("error", "")}

    # pending or processing
    return {"job_id": job_id, "status": status}
```

Tests:
- Unknown job_id → 404
- Pending job → `{"status": "pending"}`
- Processing job → `{"status": "processing"}`
- Done job → `{"status": "done", "result": {...}}`
- Failed job → `{"status": "failed", "error": "..."}`
- Auth required

Depends on: Step 2 (job_store).

---

## Step 8: Worker Entry Point

**Create:** `worker.py` (at `services/ai-service/worker.py`)

```python
"""Celery worker entry point. Run with: celery -A worker worker --loglevel=info"""
from app.worker.celery_app import celery_app
import app.worker.tasks  # noqa: F401 — register tasks with celery

__all__ = ["celery_app"]
```

No separate test — verified by integration test in Step 9.

Depends on: Steps 1 and 5.

---

## Step 9: Integration Test + Cleanup

**Create:** `tests/test_integration_suggest.py` (new)

Full round-trip test (mocked LLM, real Redis or mocked Redis):
1. POST /suggest with sections + answers → 202, get job_id
2. Simulate worker: call `suggest_task` directly (not via Celery broker)
3. GET /jobs/{job_id} → status: done, result matches SuggestResponse schema
4. Verify status transitions happened: pending → processing → done

Also test the failure path:
1. POST /suggest → 202
2. Simulate worker failure (mock LLM raises exception, retries exhausted)
3. GET /jobs/{job_id} → status: failed, error message present

**Docs update:**
- Update `services/ai-service/CLAUDE.md` — status to Phase 3, add worker command, add celery config notes
- Update `phased_plan.md` — mark Phase 3 as complete

Depends on: All previous steps.

---

## Dependency Graph

```
Step 1 (celery dep + config) ──────────────────┐
                                                ├── Step 5 (celery task) ──┐
Step 2 (job store) ──────┬── Step 7 (GET route) │                         ├── Step 6 (POST route) ── Step 9 (integration + docs)
                         │                      │                         │
Step 3 (models) ─────────┼──────────────────────┤                         │
                         │                      │                         │
                         └── Step 4 (domain) ───┘── Step 8 (worker.py) ───┘
```

Steps 1, 2, and 3 are parallel. Step 4 needs Step 3. Step 5 needs Steps 1+2+4. Steps 6-7 need Step 5. Step 8 needs Step 5. Step 9 is last.

---

## File Changes Summary

| Action | File |
|--------|------|
| Modify | `pyproject.toml` |
| Modify | `app/config.py` |
| Create | `app/worker/__init__.py` |
| Create | `app/worker/celery_app.py` |
| Create | `app/services/job_store.py` |
| Modify | `app/models.py` |
| Modify | `app/services/domains.py` |
| Create | `app/worker/tasks.py` |
| Modify | `app/routes/ai.py` |
| Create | `worker.py` |
| Create | `tests/test_celery_app.py` |
| Create | `tests/test_job_store.py` |
| Modify | `tests/test_models.py` |
| Modify | `tests/test_domains.py` |
| Create | `tests/test_worker_tasks.py` |
| Modify | `tests/test_routes_ai.py` |
| Create | `tests/test_integration_suggest.py` |

**Unchanged:** `app/main.py`, `app/services/cache.py`, `app/services/llm_client.py`, `app/middleware/auth.py`, `app/routes/health.py`, `tests/test_services_cache.py`, `tests/test_llm_client.py`

---

## Risks

1. **asyncio.run() in Celery** — Celery workers are sync. Using `asyncio.run()` inside a task works but creates a new event loop per task invocation. This is fine for our throughput (LLM calls take seconds, not milliseconds). If it causes issues, we can switch to a sync OpenAI client in the worker.

2. **Redis as both cache and broker** — Using separate Redis DBs (DB 0 for cache, DB 1 for Celery broker) avoids key collisions. If Redis memory becomes an issue, Celery broker can move to a dedicated instance (config change only).

3. **Suggest prompt complexity** — The suggest prompt is the most complex (2000 tokens output, full list context, user answers). Prompt quality needs manual testing with real grocery lists. Start from the prototype's proven prompt, iterate.

4. **Worker crashes mid-task** — `task_acks_late=True` means Celery re-delivers the task if the worker dies. Combined with `max_retries=3`, transient failures are handled. Permanent failures (bad prompt, invalid list) are marked as "failed."

5. **Job TTL** — Results expire after 1 hour. If the client doesn't poll within that window, the job is gone. This is fine for the use case (user submits list, waits ~10-15s, polls result). If needed, TTL can be extended via config.

---

## TDD Workflow Per Step

Each step follows this cycle:

1. **Write the test file first** (it will fail because production code doesn't exist yet)
2. **Run `uv run pytest tests/test_<name>.py`** — confirm tests fail
3. **Write the minimum production code** to make tests pass
4. **Run `uv run pytest tests/test_<name>.py`** — confirm all green
5. **Run `uv run pytest`** — confirm no regressions
6. **Run `uv run ruff check . && uv run ruff format --check .`** — lint clean
7. **Commit** with `feat(ai): step N — <description>`

---

## Verification

After each step:
```bash
uv run pytest tests/test_<step>.py    # Step-specific tests pass
uv run pytest                          # Full suite, no regressions
uv run ruff check . && uv run ruff format --check .  # Lint clean
```

Final verification:
```bash
# 1. Start Redis
docker compose up -d redis

# 2. Start FastAPI
uv run uvicorn app.main:app --reload --port 4003

# 3. Start Celery worker (separate terminal)
cd services/ai-service && uv run celery -A worker worker --loglevel=info

# 4. Call clarify first (sync)
curl -X POST localhost:4003/api/v1/ai/clarify \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"sections": {"Produce": ["apples", "bananas", "garlic"], "Meat": ["chicken thighs", "ground beef"]}}'

# 5. Submit suggest with clarify answers (async)
curl -X POST localhost:4003/api/v1/ai/suggest \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "sections": {"Produce": ["apples", "bananas", "garlic"], "Meat": ["chicken thighs", "ground beef"]},
    "answers": [
      {"question": "What is the occasion?", "answer": "Weeknight dinner for family of 4"},
      {"question": "Any cuisine preference?", "answer": "Asian"}
    ]
  }'
# → {"job_id": "abc-123", "status": "pending"}

# 6. Poll for result
curl localhost:4003/api/v1/ai/jobs/abc-123 \
  -H "Authorization: Bearer <token>"
# → {"job_id": "abc-123", "status": "done", "result": {"reason": "...", "clusters": [...], ...}}
```
