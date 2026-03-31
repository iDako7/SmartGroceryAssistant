# Phase 2 Architecture Walkthrough

**Last updated:** 2026-03-31
**Purpose:** Reference for understanding Phase 2's layered architecture, how data flows through the system, and why each layer exists.

---

## High-Level Architecture

Phase 2 splits the old monolithic `claude.py` into three layers:

```
Routes (ai.py)
  │  receives HTTP request, validates with Pydantic models
  │
  ▼
Domain Functions (domains.py)
  │  builds prompts, chooses tier/TTL, parses response
  │  receives LLMClient as a parameter (not imported globally)
  │
  ▼
LLMClient (llm_client.py)
  │  cache check → model selection → OpenRouter API call → cache store
  │
  ▼
Redis Cache + OpenRouter API
```

### Why this separation matters

**Before (Phase 1):** Everything in `claude.py` — the OpenAI client, cache logic, JSON parsing, prompt text, and response shaping were all mixed together. To test a prompt change, you had to mock Redis and the OpenAI client.

**After (Phase 2):** Three concerns are isolated:

1. **`llm_client.py`** — "how to talk to an LLM." Owns the OpenAI client, cache-first logic, model selection, JSON parsing. Knows nothing about groceries.

2. **`domains.py`** — "what to say to the LLM." Each function builds a prompt, picks a tier (`fast`/`full`), sets TTL, and parses the result with a fallback. Knows nothing about HTTP or Redis.

3. **`models.py`** — "what the API accepts and returns." Pydantic validation at the boundary. Routes just wire models → domain functions → responses.

### The key design choice: dependency injection

Domain functions receive `LLMClient` as their first parameter:

```python
async def alternatives(client: LLMClient, name_en: str, reason: str = "", *, profile=None) -> dict:
```

Not `from app.services.llm_client import get_llm_client`. This means:
- **Tests pass a mock** — no Redis, no OpenAI, no network
- **Routes call `get_llm_client()`** — the singleton lives only at the route layer
- **Phase 4 upgrade path** — when KB tier is added, `LLMClient` becomes one option behind a router; domain functions don't change

---

## End-to-End Example: `/alternatives` request

### 1. Request arrives at the route (`app/routes/ai.py`)

```python
@router.post("/alternatives")
async def alternatives(req: AlternativesRequest, _: str = Depends(verify_token)):
    client = get_llm_client()
    return await domains.alternatives(client, req.name_en, req.reason, profile=req.profile)
```

The route does three things: JWT auth, Pydantic validation, then delegates. It grabs the singleton `LLMClient` and passes it to the domain function.

### 2. Pydantic validates the request body (`app/models.py`)

```python
class AlternativesRequest(BaseModel):
    name_en: str                          # required
    reason: str = ""                      # optional
    profile: UserProfile | None = None    # optional

class UserProfile(BaseModel):
    dietary: list[str] = Field(default_factory=list)
    household_size: int = 0
    taste: str = ""
```

If the client sends `{"name_en": "Milk", "reason": "lactose intolerant", "profile": {"dietary": ["vegan"]}}`, Pydantic parses it into typed objects. Missing `profile`? It's `None`. Bad field type? 422 before your code runs.

### 3. Domain function builds prompt and calls LLM (`app/services/domains.py`)

```python
async def alternatives(client: LLMClient, name_en: str, reason: str = "", *, profile=None) -> dict:
    ctx = _profile_context(profile)          # → "\nProfile: Dietary: vegan." or ""
    reason_text = f" User reason: {reason}." if reason else ""

    key = client.cache_key("alt", f"{name_en}:{reason}{_profile_hash(profile)}")
    #                       ↑ prefix          ↑ unique per input + profile combo

    raw = await client.call(
        prompt=f'Find 3-4 alternatives for "{name_en}"...{reason_text}{ctx}\nONLY JSON: ...',
        system="You are a grocery expert. Respond with JSON only.",
        cache_key=key,
        tier="full",        # ← complex task → uses OPENROUTER_MODEL_FULL
        max_tokens=800,
        ttl=3600,           # ← 1 hour cache
    )
    return client.parse_json(raw, {"note": "", "alts": []})
    #                              ↑ fallback if LLM returns garbage
```

This is the core pattern every domain function follows:
- Build profile context string (if profile exists)
- Generate cache key (includes profile hash so personalized results are cached separately)
- Call LLM with the right tier, token limit, and TTL
- Parse JSON with a safe fallback

### 4. LLMClient handles infrastructure (`app/services/llm_client.py`)

```python
async def call(self, prompt, system, cache_key, *, tier="fast", max_tokens=512, ttl=3600) -> str:
    # Step A: check cache first
    cached = await cache_get(cache_key)
    if cached:
        return cached                    # free, instant

    # Step B: pick model by tier
    model = self._model_full if tier == "full" else self._model_fast

    # Step C: call OpenRouter
    response = await self._client.chat.completions.create(
        model=model, max_tokens=max_tokens,
        messages=[{"role": "system", "content": system},
                  {"role": "user", "content": prompt}],
    )
    result = response.choices[0].message.content or ""

    # Step D: cache for next time
    await cache_set(cache_key, result, ttl)
    return result
```

### The full flow visualized

```
Client POST /alternatives {"name_en": "Milk", "reason": "lactose intolerant"}
  │
  ▼ Route: JWT check → Pydantic validates AlternativesRequest
  │
  ▼ Domain: builds prompt with reason + profile context
  │          generates cache key "ai:alt:a3b8f2..."
  │
  ▼ LLMClient.call(tier="full")
  │   ├─ cache hit?  → return cached string
  │   └─ cache miss? → OpenRouter (OPENROUTER_MODEL_FULL) → cache result → return
  │
  ▼ Domain: parse_json(raw, fallback={"note": "", "alts": []})
  │
  ▼ Route: returns dict as JSON response
```

---

## Two-Tier Model Config

Different endpoints have different complexity needs:

| Tier | Env var | Endpoints | Why |
|------|---------|-----------|-----|
| `fast` | `OPENROUTER_MODEL_FAST` | translate, item-info | Simple lookups — cheaper model works fine |
| `full` | `OPENROUTER_MODEL_FULL` | alternatives, inspire, clarify | Multi-step reasoning, recipe knowledge |

Both default to the same model. The point is flexibility: you can test a cheaper model on simple tasks without degrading complex task quality.

---

## Redis in This Architecture

Redis was already implemented in Phase 1. Two separate uses:

### LLM response cache (active now)

Every LLM call goes through cache-first logic in `LLMClient.call()`. Different TTLs per endpoint type:
- translate/item-info: 86400s (24h) — stable data
- alternatives/inspire: 3600s (1h) — context-dependent
- clarify: 1800s (30min) — session-specific

### Async job results (stub for Phase 3)

The `GET /jobs/{job_id}` endpoint polls Redis for async job results. The Celery worker (Phase 3) will write results to `ai:result:{job_id}`. The route works now but nothing writes job results yet.

---

## How Testing Works at Each Layer

- **Domain tests**: pass a `MagicMock()` as `client` — verify the prompt contains expected text, tier is correct, fallback works on garbage. Zero I/O.
- **Route tests**: mock `domains.alternatives` — verify HTTP status codes, validation errors, auth. Never touches LLMClient.
- **LLMClient tests**: mock `cache_get`/`cache_set` and `AsyncOpenAI` — verify cache-first logic, model selection by tier.

Each layer is testable in isolation because of the dependency injection pattern.

---

## File Map

| File | Layer | Responsibility |
|------|-------|---------------|
| `app/models.py` | Validation | Pydantic request/response models, `UserProfile` |
| `app/routes/ai.py` | HTTP | Auth, validation, wiring routes to domain functions |
| `app/services/domains.py` | Business logic | Prompt construction, tier/TTL selection, response parsing |
| `app/services/llm_client.py` | Infrastructure | OpenAI client, cache-first logic, model selection, JSON parsing |
| `app/services/cache.py` | Infrastructure | Redis `cache_get`/`cache_set` (unchanged from Phase 1) |
| `app/config.py` | Config | `OPENROUTER_MODEL_FAST`, `OPENROUTER_MODEL_FULL`, Redis, JWT settings |
