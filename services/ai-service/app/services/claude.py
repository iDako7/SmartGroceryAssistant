import hashlib
import json

from openai import AsyncOpenAI

from app.config import settings
from app.services.cache import cache_get, cache_set

_client: AsyncOpenAI | None = None

_OPENROUTER_BASE = "https://openrouter.ai/api/v1"


def get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(
            api_key=settings.openrouter_api_key,
            base_url=_OPENROUTER_BASE,
        )
    return _client


def _cache_key(prefix: str, data: str) -> str:
    digest = hashlib.sha256(data.encode()).hexdigest()[:16]
    return f"ai:{prefix}:{digest}"


async def _call(prompt: str, system: str, cache_key: str, ttl: int = 3600) -> str:
    cached = await cache_get(cache_key)
    if cached:
        return cached
    response = await get_client().chat.completions.create(
        model=settings.openrouter_model,
        max_tokens=512,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ],
    )
    result = response.choices[0].message.content or ""
    await cache_set(cache_key, result, ttl)
    return result


def _parse_json(raw: str, fallback: dict) -> dict:
    try:
        text = raw.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0]
        return json.loads(text)
    except (json.JSONDecodeError, IndexError):
        return fallback


# ── Sync endpoints ────────────────────────────────────────

async def translate_item(name_en: str, target_language: str) -> dict:
    key = _cache_key("translate", f"{name_en}:{target_language}")
    raw = await _call(
        prompt=f'Translate the grocery item "{name_en}" to {target_language}. '
               f'Return JSON: {{"name_translated": "...", "notes": "..."}}',
        system="You are a grocery item translator. Respond with JSON only.",
        cache_key=key,
        ttl=86400,
    )
    return _parse_json(raw, {"name_translated": name_en, "notes": ""})


async def item_info(name_en: str) -> dict:
    key = _cache_key("info", name_en)
    raw = await _call(
        prompt=f'Provide information about the grocery item "{name_en}". '
               f'Return JSON: {{"category": "...", "typical_unit": "...", '
               f'"storage_tip": "...", "nutrition_note": "..."}}',
        system="You are a grocery expert. Respond with JSON only.",
        cache_key=key,
        ttl=86400,
    )
    return _parse_json(raw, {"category": "", "typical_unit": "", "storage_tip": "", "nutrition_note": ""})


async def alternatives(name_en: str, reason: str = "") -> dict:
    key = _cache_key("alt", f"{name_en}:{reason}")
    ctx = f" Reason: {reason}" if reason else ""
    raw = await _call(
        prompt=f'Suggest alternatives for the grocery item "{name_en}".{ctx} '
               f'Return JSON: {{"alternatives": [{{"name": "...", "reason": "..."}}]}}',
        system="You are a grocery expert. Respond with JSON only.",
        cache_key=key,
        ttl=3600,
    )
    return _parse_json(raw, {"alternatives": []})


# ── Async worker helpers ───────────────────────────────────

async def _long_call(prompt: str, system: str) -> str:
    response = await get_client().chat.completions.create(
        model=settings.openrouter_model,
        max_tokens=1024,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ],
    )
    return response.choices[0].message.content or ""


async def suggest_items(sections: dict) -> str:
    list_summary = json.dumps(sections, indent=2)
    return await _long_call(
        system="You are a smart grocery assistant. Be concise and practical.",
        prompt=(
            f"Based on this grocery list, suggest 5-10 additional items the user might need.\n"
            f"Current list:\n{list_summary}\n\n"
            f'Return JSON: {{"suggestions": [{{"name_en": "...", "category": "...", "reason": "..."}}]}}'
        ),
    )


async def inspire_meals(sections: dict, preferences: str = "") -> str:
    list_summary = json.dumps(sections, indent=2)
    pref_text = f"\nDietary preferences: {preferences}" if preferences else ""
    return await _long_call(
        system="You are a creative meal planning assistant.",
        prompt=(
            f"Based on these groceries, suggest 3 meal ideas.{pref_text}\n\n"
            f"Current groceries:\n{list_summary}\n\n"
            f'Return JSON: {{"meals": [{{"name": "...", "description": "...", '
            f'"ingredients_used": [...], "missing_ingredients": [...]}}]}}'
        ),
    )
