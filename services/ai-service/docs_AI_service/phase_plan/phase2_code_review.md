# Phase 2 Code Review

**Date:** 2026-03-30
**Reviewer:** Claude (AI-assisted)
**Scope:** All uncommitted changes on `AI_service` branch vs `phase2_implementation_plan.md`

---

## Compliance with Phase 2 Plan

| Plan Step | Status | Notes |
|-----------|--------|-------|
| Step 1: Two-tier config | Done | `openrouter_model_fast`/`_full` added, old field removed |
| Step 2: Pydantic models | Done | All models present, `ClarifyQuestion` alias works |
| Step 3: LLMClient class | Done | `call()`, `cache_key()`, `parse_json()`, singleton |
| Step 4: Domain functions | Done | All 5 functions, profile context, correct tiers/TTLs |
| Step 5: Rewire routes | Done | New endpoints added, imports updated |
| Step 6: Cleanup | Done | `claude.py` + `test_services_claude.py` deleted |
| Step 7: Docs | **Partial** | CLAUDE.md updated to "Phase 2" but no architecture description update visible |

---

## Issues Found

### MEDIUM: conftest.py missing planned fixtures

The plan says Step 6 should add `mock_llm_client` and `sample_profile` fixtures to `conftest.py`. These weren't added. Not blocking — domain tests use a local `_make_mock_client()` helper, which works fine. But if you plan to keep growing tests, shared fixtures reduce duplication.

### LOW: `ClarifyRequest.sections` is `dict` with no value type

`sections: dict` at `models.py:78` accepts anything. Consider `dict[str, list[str]]` to match the expected structure and get better validation errors.

### LOW: Singleton `_instance` in `llm_client.py` has no reset mechanism

`llm_client.py:58-69` — the global `_instance` persists across tests if any test imports it. Currently route tests mock at the `domains.*` level (correct per plan), so this doesn't bite you. But if you ever need to test routes with a different client config, you'll need a reset. Worth noting for Phase 3.

### LOW: `_profile_hash` doesn't escape delimiters

`domains.py:22-25` — if a user's `taste` contains `|p:` or `:`, it could theoretically collide with another profile's hash. Extremely unlikely for grocery profiles, but worth knowing.

---

## Code Quality — Looks Good

- Clean separation: LLMClient (infrastructure) vs domains (prompt logic) vs models (validation)
- Consistent pattern: every domain function takes `client` as first arg, uses `profile` keyword
- Tier assignments match the plan table exactly
- Fallback dicts are sensible
- Tests are well-structured — each domain function has tier, prompt content, fallback, and cache key tests

---

## Security — No Issues

- No hardcoded credentials
- JWT auth on all new endpoints
- No SQL/injection risks (pure LLM prompt construction)
- Profile data is typed via Pydantic (not raw dict)

---

## Test Warnings (15 warnings)

The warnings are **not from project code**. They come from the `python-jose` library:

```
jose/jwt.py:311: DeprecationWarning: datetime.datetime.utcnow() is deprecated
```

`python-jose` internally uses `datetime.utcnow()` which is deprecated in Python 3.12+. This happens every time `verify_token` runs in route tests (15 route test cases = 15 warnings).

**Resolution:** Added a pytest warning filter in `pyproject.toml` to suppress `DeprecationWarning` from `jose` specifically, while still showing warnings from project code.

---

## Test Results

```
77 passed, 0 warnings
```

All tests pass. Lint and format checks clean.

---

## Verdict

Implementation is solid and follows the plan closely. No CRITICAL or HIGH issues. The MEDIUM item (missing conftest fixtures) and LOW items are worth addressing but not blocking.
