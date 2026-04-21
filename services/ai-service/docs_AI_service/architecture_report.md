# AI Service — Technical Architecture Report

Last updated: 2026-04-02 | Phase 3 complete

## Layered Architecture

```
Routes (app/routes/ai.py)          ← HTTP validation, auth, dispatch
  ↓
Domain Functions (app/services/domains.py)  ← prompt composition, fallback shaping
  ↓
LLMClient (app/services/llm_client.py)     ← cache-first, model routing, JSON parsing
  ↓
Redis Cache (slot 0)  +  OpenRouter API
```

Each layer has a single responsibility. Routes never touch prompts. Domain functions never touch HTTP. LLMClient never knows what endpoint it serves.

---

## LLMClient Internals

### Call Flow

```
call(prompt, system, cache_key, tier, max_tokens, ttl)
  │
  ├─ cache_key provided? → cache_get(key)
  │    └─ HIT → return cached string
  │
  ├─ tier="fast" → model_fast
  │  tier="full" → model_full
  │
  ├─ AsyncOpenAI.chat.completions.create(model, messages, max_tokens)
  │
  └─ cache_key provided? → cache_set(key, result, ttl)
       └─ return result string
```

### JSON Parsing

`parse_json(raw, fallback)` handles LLM output quirks:
1. Strip whitespace
2. If starts with ` ``` `, split off first line (e.g. ` ```json `), take content before closing ` ``` `
3. `json.loads()` — on `JSONDecodeError` or `IndexError`, return `fallback`

No retry. Domain functions provide schema-shaped fallback dicts so responses always match the Pydantic model.

### Cache Key Generation

```python
cache_key(prefix, data) → f"ai:{prefix}:{sha256(data)[:16]}"
```

`data` includes the semantic input AND profile hash when personalized, preventing cross-user cache pollution.

---

## Domain Function Pattern

Every domain function (`translate_item`, `item_info`, `alternatives`, `inspire_item`, `clarify`, `suggest`) follows the same template:

```
1. Build profile context string → _profile_context(profile)
2. Build cache key with profile hash → client.cache_key(prefix, f"{input}{_profile_hash(profile)}")
3. Call LLM → await client.call(prompt, system, key, tier=..., max_tokens=..., ttl=...)
4. Parse JSON → client.parse_json(raw, None)
5. Validate → try ResponseModel(**parsed) except ValidationError → fallback
```

### Profile Handling

- `_profile_context(profile)` → prompt suffix like `"\nUser profile (MUST respect): Dietary: vegan. Preferences: spicy."`
- `_profile_hash(profile)` → `"|p:{sha256[:16]}"` appended to cache key data before hashing

### Tier and Token Allocation

| Function | Tier | Max Tokens | Cache TTL |
|----------|------|------------|-----------|
| translate_item | fast | 512 | 86400s (24h) |
| item_info | fast | 512 | 86400s (24h) |
| alternatives | full | 800 | 3600s (1h) |
| inspire_item | fast | 800 | 3600s (1h) |
| clarify | full | 600 | 1800s (30m) |
| suggest | full | 2000 | no cache (async) |

**Rationale:** `fast` tier for simple lookups/generation, `full` tier for multi-step reasoning (alternatives need comparison, clarify/suggest need list analysis).

---

## Async Pipeline (Celery)

### Job State Machine

```
POST /suggest
  │
  ├─ Generate UUID job_id
  ├─ Redis: ai:status:{job_id} = {"status": "pending"}
  ├─ Celery: suggest_task.delay(job_id, sections, answers, profile)
  └─ Return 202 {job_id, status: "pending"}

Celery Worker picks up task
  │
  ├─ Redis: status → "processing"
  ├─ Create fresh LLMClient (not singleton — worker is separate process)
  ├─ await suggest(client, sections, answers, profile)
  │    ├─ success → Redis: ai:result:{job_id} = result dict
  │    │            Redis: status → "done"
  │    └─ exception → Redis: status → "failed", error = str(exc)
  │
  └─ Never propagates exceptions (prevents Celery retry loops)

GET /jobs/{job_id}
  │
  ├─ Redis: get ai:status:{job_id}
  │    └─ None → 404
  ├─ status == "done" → get ai:result:{job_id}, return with result
  ├─ status == "failed" → return with error string
  └─ else → return {status: "pending" | "processing"}
```

### Celery Config

| Setting | Value | Why |
|---------|-------|-----|
| serializer | json | No pickle (security) |
| task_acks_late | true | Ack after completion, not before |
| worker_prefetch_multiplier | 1 | Fair queuing, one task at a time |
| task_track_started | true | Enables "processing" state |

### Worker Entry Point

`worker.py` at project root imports `celery_app` — run with `uv run celery -A worker worker --loglevel=info`. The worker creates its own `LLMClient` instance (not the FastAPI singleton) since it runs in a separate process.

---

## Redis Dual-Slot Usage

| Slot | Purpose | Key Pattern | TTL |
|------|---------|-------------|-----|
| 0 | LLM response cache | `ai:{prefix}:{hash}` | varies per endpoint (1800–86400s) |
| 0 | Job status | `ai:status:{uuid}` | CELERY_RESULT_TTL (default 3600s) |
| 0 | Job results | `ai:result:{uuid}` | CELERY_RESULT_TTL (default 3600s) |
| 1 | Celery broker | managed by Celery | managed by Celery |

Note: Cache and job storage share slot 0 with different key prefixes. Celery broker uses slot 1.

---

## Error Handling by Layer

| Layer | Error Type | Behavior |
|-------|-----------|----------|
| **Routes** | Missing/invalid JWT | 401/403 HTTPException |
| **Routes** | Invalid request body | 422 (Pydantic auto-validation) |
| **Routes** | Job not found | 404 HTTPException |
| **Domains** | LLM returns empty/garbage | Return fallback ResponseModel (never raise) |
| **Domains** | Pydantic ValidationError on parsed JSON | Return fallback ResponseModel |
| **LLMClient** | Cache miss | Continue to OpenRouter (transparent) |
| **LLMClient** | JSON parse failure | Return `fallback` parameter |
| **Celery Task** | Any exception | Log + set status="failed" with error string |

**Invariant:** Sync endpoints always return a valid response shape. Async jobs surface errors through the `failed` status, never through HTTP errors on the poll endpoint.

---

## File Responsibilities

| File | Role | Stateful? |
|------|------|-----------|
| `app/main.py` | FastAPI app, CORS, lifespan (Redis cleanup) | No |
| `app/config.py` | Pydantic Settings from env vars | Singleton |
| `app/models.py` | All request/response Pydantic models | No |
| `app/middleware/auth.py` | JWT verification dependency | No |
| `app/routes/ai.py` | 7 endpoint handlers (5 sync + 2 async) | No |
| `app/services/domains.py` | 6 domain functions + profile helpers | No |
| `app/services/llm_client.py` | LLMClient class + singleton factory | Singleton |
| `app/services/cache.py` | Async Redis wrapper (get/set/close) | Singleton |
| `app/services/job_store.py` | Job status/result storage functions | No |
| `app/worker/celery_app.py` | Celery app + broker config | Singleton |
| `app/worker/tasks.py` | `suggest_task` definition + async runner | No |
| `worker.py` | Worker entry point (imports celery_app) | No |

---

## Phase Status

| Phase | Scope | Status |
|-------|-------|--------|
| 1 | LLMClient + translate endpoint (TDD foundation) | Done |
| 2 | All sync endpoints (item-info, alternatives, inspire, clarify) | Done |
| 3 | Async suggest pipeline (Celery + Redis broker + job polling) | Done |
| 4 | Knowledge Base tier (SQLite + FTS5, read-only) | Not started |
| 5 | Cache optimization, RabbitMQ broker experiment, rate limiting | Not started |

### What Phase 4 Changes

A KB lookup layer inserts between cache and LLM:
```
Cache HIT → return
Cache MISS → KB lookup (translate, item-info) → return if found
KB MISS → LLM call → cache result → return
```

Domain functions will gain a `kb` parameter. `alternatives`, `inspire`, `clarify`, and `suggest` skip KB (need reasoning, not lookups).

### What Phase 5 Changes

- Redis cache hit-rate monitoring
- Possible broker switch from Redis to RabbitMQ (Celery abstraction makes this a config change)
- Per-endpoint rate limiting
- Cache warming for common items
