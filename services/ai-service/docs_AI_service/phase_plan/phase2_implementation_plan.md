# Phase 2 Implementation Plan: Remaining Sync Endpoints

**Last updated:** 2026-03-30
**Owner:** Dako (@iDako7)
**Status:** Ready to implement

## Context

Phase 1 built the AI service foundation: FastAPI skeleton, 3 sync endpoints (translate, item-info, alternatives), JWT auth, Redis caching, and LLM integration via OpenRouter. All logic lives as module-level functions in `claude.py`.

Phase 2 adds two new endpoints (per-item inspire, clarify), upgrades alternatives to a richer schema, refactors the service layer to `LLMClient` class + domain functions, and introduces two-tier model config and optional user profile support. This sets up clean architecture for Phase 3 (async) and Phase 4 (KB).

## Architecture Decisions (confirmed in discussion)

- **LLMClient class + domain functions** — infrastructure separated from prompt logic
- **Two-tier model config** — `OPENROUTER_MODEL_FAST` (translate, item-info) / `OPENROUTER_MODEL_FULL` (alternatives, inspire, clarify)
- **Profile in request body** — optional `profile` field, temporary until User Service integration
- **Two inspire paths** — `POST /inspire/item` (sync, Phase 2) / `POST /inspire/list` (async, Phase 3)
- **Alternatives upgrade** — breaking change to richer prototype schema
- **English-only** — bilingual deferred to later phase
- **Update existing endpoints** — translate/item-info get optional profile + two-tier model

---

## Step 1: Two-Tier Model Config

**Modify:** `app/config.py`
**Test first:** `tests/test_config.py` (new)

Add to `Settings`:
```python
openrouter_model_fast: str = "qwen/qwen3-235b-a22b-2507"
openrouter_model_full: str = "qwen/qwen3-235b-a22b-2507"
```
Remove old `openrouter_model` field.

Tests: verify env var override works for both, verify defaults.

---

## Step 2: Pydantic Request/Response Models

**Create:** `app/models.py`
**Test first:** `tests/test_models.py` (new)

Models:
- `UserProfile` — `dietary: list[str]`, `household_size: int`, `taste: str` (all optional/defaulted)
- `TranslateRequest` / `ItemInfoRequest` — add optional `profile: UserProfile | None = None`
- `AlternativesRequest` — add optional `profile`
- `AlternativesResponse` — `{note, alts: [{name_en, match, desc, where}]}` (upgraded schema)
- `InspireItemRequest` — `{name_en, other_items: list[str], profile?}`
- `InspireItemResponse` — `{recipes: [{name, emoji, desc, add: [{name_en}]}]}`
- `ClarifyRequest` — `{sections: dict, profile?}`
- `ClarifyResponse` — `{questions: [{q, options: list[str], allowOther: bool}]}`

Steps 1 and 2 are independent — can be done in parallel.

---

## Step 3: LLMClient Class

**Create:** `app/services/llm_client.py`
**Test first:** `tests/test_llm_client.py` (new)

```python
class LLMClient:
    def __init__(self, api_key, model_fast, model_full, base_url=OPENROUTER_BASE):
        self._client = AsyncOpenAI(api_key=api_key, base_url=base_url)
        self._model_fast = model_fast
        self._model_full = model_full

    async def call(self, prompt, system, cache_key, *, tier="fast", max_tokens=512, ttl=3600) -> str:
        # cache-first, selects model by tier

    @staticmethod
    def cache_key(prefix, data) -> str:  # SHA256-based

    @staticmethod
    def parse_json(raw, fallback) -> dict:  # strips markdown fences

def get_llm_client() -> LLMClient:  # lazy singleton
```

Tests: parse_json (valid, markdown-wrapped, garbage→fallback), cache_key determinism, call() tier routing (fast→model_fast, full→model_full), cache hit skips LLM.

Depends on: Step 1 (config).

---

## Step 4: Domain Functions

**Create:** `app/services/domains.py`
**Test first:** `tests/test_domains.py` (new)

Each function: `(client: LLMClient, <fields>, profile?) → dict`

| Function | Tier | max_tokens | TTL | Fallback |
|----------|------|------------|-----|----------|
| `translate_item` | fast | 512 | 86400 | `{name_translated: name_en, notes: ""}` |
| `item_info` | fast | 512 | 86400 | `{category: "", typical_unit: "", ...}` |
| `alternatives` | full | 800 | 3600 | `{note: "", alts: []}` |
| `inspire_item` | full | 800 | 3600 | `{recipes: []}` |
| `clarify` | full | 600 | 1800 | `{questions: []}` |

Helper: `_profile_context(profile) → str` — builds prompt snippet from profile fields.

Cache key: includes profile hash when present (personalized results cached separately).

Prompts modeled after prototype (`docs/smart-grocery-prototype.jsx` lines 540-628).

Tests per function:
- Correct tier passed to `client.call()`
- Profile context appears in prompt when provided, absent when not
- Valid JSON → correct response shape
- Garbage JSON → fallback dict
- Cache key changes when profile changes

Depends on: Steps 2 + 3.

---

## Step 5: Rewire Routes

**Modify:** `app/routes/ai.py`
**Test first:** Update `tests/test_routes_ai.py`

- Import models from `app/models` (remove inline Pydantic classes)
- Import `get_llm_client` + `domains` (remove `claude` import)
- Each route: `client = get_llm_client()` → `domains.<function>(client, ...)`
- Add `POST /inspire/item` and `POST /clarify`
- Keep `GET /jobs/{job_id}` unchanged

New test classes: `TestInspireItem`, `TestClarify` — success, validation (422), auth (403/401).
Update existing tests: change mock targets from `claude.*` to `domains.*`, add profile-acceptance tests.

Depends on: Step 4.

---

## Step 6: Cleanup

- **Delete** `app/services/claude.py`
- **Delete** `tests/test_services_claude.py` (covered by test_llm_client + test_domains)
- **Update** `tests/conftest.py` — add `mock_llm_client` and `sample_profile` fixtures
- Run full test suite, confirm zero references to old `claude` module

Depends on: Step 5.

---

## Step 7: Documentation

After all code is green:
- Update `services/ai-service/CLAUDE.md` — update status to Phase 2, update architecture description

Note: `phased_plan.md` and `design_decisions.md` were already updated during the planning session.

---

## Dependency Graph

```
Step 1 (config) ──┐
                  ├── Step 3 (LLMClient) ──┐
Step 2 (models) ──┤                        ├── Step 4 (domains) → Step 5 (routes) → Step 6 (cleanup) → Step 7 (docs)
                  └────────────────────────┘
```

Steps 1 & 2 are parallel. Step 3 needs Step 1. Step 4 needs Steps 2 & 3. Rest is sequential.

---

## File Changes Summary

| Action | File |
|--------|------|
| Modify | `app/config.py` |
| Create | `app/models.py` |
| Create | `app/services/llm_client.py` |
| Create | `app/services/domains.py` |
| Modify | `app/routes/ai.py` |
| Delete | `app/services/claude.py` |
| Create | `tests/test_config.py` |
| Create | `tests/test_models.py` |
| Create | `tests/test_llm_client.py` |
| Create | `tests/test_domains.py` |
| Modify | `tests/test_routes_ai.py` |
| Delete | `tests/test_services_claude.py` |
| Modify | `tests/conftest.py` |

**Unchanged:** `app/main.py`, `app/services/cache.py`, `app/middleware/auth.py`, `app/routes/health.py`, `tests/test_services_cache.py`

---

## Risks

1. **Alternatives breaking change** — frontend expects old schema. Coordinate with William on timing.
2. **Clarify prompt quality** — hardest prompt to get right (adaptive question count). Start from prototype's proven prompt, iterate manually.
3. **Profile in cache key → fragmentation** — intentional for personalization. Non-profiled requests keep existing hit rate.
4. **Singleton in tests** — domain tests pass mock `LLMClient` directly, never use singleton. Route tests mock at `domains.*` level.

---

## TDD Workflow Per Step

Each step follows this cycle:

1. **Write the test file first** (it will fail because production code doesn't exist yet)
2. **Run `uv run pytest tests/test_<name>.py`** — confirm tests fail
3. **Write the minimum production code** to make tests pass
4. **Run `uv run pytest tests/test_<name>.py`** — confirm all green
5. **Run `uv run pytest`** — confirm no regressions
6. **Run `uv run ruff check . && uv run ruff format --check .`** — lint clean
7. **Commit** with `feat(ai): step N — add <component>`

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
# Start service and test manually
uv run uvicorn app.main:app --reload --port 4003

# Test upgraded alternatives
curl -X POST localhost:4003/api/v1/ai/alternatives \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name_en": "Milk", "reason": "lactose intolerant"}'

# Test new inspire/item
curl -X POST localhost:4003/api/v1/ai/inspire/item \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name_en": "chicken breast", "other_items": ["rice", "soy sauce", "garlic"]}'

# Test new clarify
curl -X POST localhost:4003/api/v1/ai/clarify \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"sections": {"Produce": ["apples", "bananas"], "Meat": ["chicken", "beef"]}}'
```
