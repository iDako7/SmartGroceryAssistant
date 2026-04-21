"""Shared LLM infrastructure for OpenRouter calls and response parsing.

Domain modules build prompts; this module handles transport, model tier
selection, cache reads/writes, and resilient JSON parsing.
"""

import hashlib
import json

from openai import AsyncOpenAI

from app.config import settings
from app.services.cache import cache_get, cache_set

_OPENROUTER_BASE = "https://openrouter.ai/api/v1"


class LLMClient:
    def __init__(self, api_key: str, model_fast: str, model_full: str, base_url: str = _OPENROUTER_BASE):
        """Create a reusable async OpenRouter client with fast/full model IDs."""
        self._client = AsyncOpenAI(api_key=api_key, base_url=base_url)
        self._model_fast = model_fast
        self._model_full = model_full

    async def call(
        self, prompt: str, system: str, cache_key: str, *, tier: str = "fast", max_tokens: int = 512, ttl: int = 3600
    ) -> str:
        """Call the LLM with cache-first behavior and tier-based model routing."""
        # Step A: check cache first (skip if no cache key)
        if cache_key:
            cached = await cache_get(cache_key)
            if cached:
                return cached

        # Step B: pick model by tier
        model = self._model_full if tier == "full" else self._model_fast

        # Step C: call OpenRouter
        response = await self._client.chat.completions.create(
            model=model,
            max_tokens=max_tokens,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
        )
        result = response.choices[0].message.content or ""

        # Step D: cache for next time
        if cache_key:
            await cache_set(cache_key, result, ttl)
        return result

    @staticmethod
    def cache_key(prefix: str, data: str) -> str:
        """Build a short stable cache key from semantic input data."""
        digest = hashlib.sha256(data.encode()).hexdigest()[:16]
        return f"ai:{prefix}:{digest}"

    @staticmethod
    def parse_json(raw: str, fallback: dict | None = None) -> dict | None:
        """Parse JSON responses, tolerating fenced-code wrappers from models."""
        try:
            text = raw.strip()
            if text.startswith("```"):
                text = text.split("\n", 1)[1].rsplit("```", 1)[0]
            return json.loads(text)
        except (json.JSONDecodeError, IndexError):
            # Return schema-shaped fallback to keep API responses predictable.
            return fallback


# ── Singleton ────────────────────────────────────────────

_instance: LLMClient | None = None


def get_llm_client() -> LLMClient:
    """Return the process-wide LLMClient singleton, creating it lazily."""
    global _instance
    if _instance is None:
        _instance = LLMClient(
            api_key=settings.openrouter_api_key,
            model_fast=settings.openrouter_model_fast,
            model_full=settings.openrouter_model_full,
        )
    return _instance


def reset_llm_client() -> None:
    """Reset singleton state (used mainly by tests)."""
    global _instance
    _instance = None
