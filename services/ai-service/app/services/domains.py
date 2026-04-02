"""Endpoint domain functions for prompt composition and JSON fallback shaping.

This module keeps endpoint-specific prompt logic separate from `LLMClient`
transport, retry, and parsing infrastructure.
"""

import hashlib
import json

from pydantic import ValidationError

from app.models import (
    AlternativesResponse,
    ClarifyAnswer,
    ClarifyResponse,
    InspireItemResponse,
    ItemInfoResponse,
    SuggestResponse,
    TranslateResponse,
    UserProfile,
)
from app.services.llm_client import LLMClient


def _profile_context(profile: UserProfile | None) -> str:
    """Render optional profile data into a compact prompt suffix."""
    if not profile:
        return ""
    parts = []
    if profile.dietary:
        parts.append(f"Dietary: {', '.join(profile.dietary)}")
    if profile.household_size:
        parts.append(f"Household: {profile.household_size}")
    if profile.taste:
        parts.append(f"Preferences: {profile.taste}")
    return f"\nProfile: {'. '.join(parts)}." if parts else ""


def _profile_hash(profile: UserProfile | None) -> str:
    """Return a short deterministic profile hash for cache-key partitioning."""
    if not profile:
        return ""
    data = profile.model_dump_json()
    digest = hashlib.sha256(data.encode()).hexdigest()[:16]
    return f"|p:{digest}"


# ── translate_item ───────────────────────────────────────


async def translate_item(
    client: LLMClient, name_en: str, target_language: str, *, profile: UserProfile | None = None
) -> TranslateResponse:
    """Translate an English grocery item name into the target language."""
    ctx = _profile_context(profile)
    # Include profile hash so personalized prompts do not share cache entries.
    key = client.cache_key("translate", f"{name_en}:{target_language}{_profile_hash(profile)}")
    raw = await client.call(
        prompt=(
            f'Translate the grocery item "{name_en}" to {target_language}.{ctx}\n'
            f'Return JSON: {{"name_translated": "...", "notes": "..."}}'
        ),
        system="You are a grocery item translator. Respond with JSON only.",
        cache_key=key,
        tier="fast",
        max_tokens=512,
        ttl=86400,
    )
    parsed = client.parse_json(raw, None)
    if parsed is None:
        return TranslateResponse(name_translated=name_en, notes="")
    try:
        return TranslateResponse(**parsed)
    except ValidationError:
        return TranslateResponse(name_translated=name_en, notes="")


# ── item_info ────────────────────────────────────────────


async def item_info(client: LLMClient, name_en: str, *, profile: UserProfile | None = None) -> ItemInfoResponse:
    """Return quick grocery metadata for an item (category, unit, storage, nutrition)."""
    ctx = _profile_context(profile)
    key = client.cache_key("info", f"{name_en}{_profile_hash(profile)}")
    raw = await client.call(
        prompt=(
            f'Grocery expert helping someone understand "{name_en}".{ctx}\n'
            f"ONLY JSON: "
            f'{{"category": "...", "typical_unit": "...", "storage_tip": "...", "nutrition_note": "..."}}'
        ),
        system="You are a grocery expert. Respond with JSON only.",
        cache_key=key,
        tier="fast",
        max_tokens=512,
        ttl=86400,
    )
    parsed = client.parse_json(raw, None)
    if parsed is None:
        return ItemInfoResponse()
    try:
        return ItemInfoResponse(**parsed)
    except ValidationError:
        return ItemInfoResponse()


# ── alternatives ─────────────────────────────────────────


async def alternatives(
    client: LLMClient, name_en: str, reason: str = "", *, profile: UserProfile | None = None
) -> AlternativesResponse:
    """Suggest 3-4 grocery alternatives with match quality and store hints."""
    ctx = _profile_context(profile)
    reason_text = f" User reason: {reason}." if reason else ""
    taste_text = f" User taste: {profile.taste}." if profile and profile.taste else ""
    key = client.cache_key("alt", f"{name_en}:{reason}{_profile_hash(profile)}")
    raw = await client.call(
        prompt=(
            f'Find 3-4 alternatives for "{name_en}" available in North American stores.{reason_text}{taste_text}{ctx}\n'
            f"ONLY JSON: "
            f'{{"note": "1 sentence why needed", '
            f'"alts": [{{"name_en": "Name", "match": "Very close|Similar|Different but works", '
            f'"desc": "1 sentence", "where": "Where in store"}}]}}'
        ),
        system="You are a grocery expert. Respond with JSON only.",
        cache_key=key,
        tier="full",
        max_tokens=800,
        ttl=3600,
    )
    parsed = client.parse_json(raw, None)
    if parsed is None:
        return AlternativesResponse(note="", alts=[])
    try:
        return AlternativesResponse(**parsed)
    except ValidationError:
        return AlternativesResponse(note="", alts=[])


# ── inspire_item ─────────────────────────────────────────


async def inspire_item(
    client: LLMClient, name_en: str, other_items: list[str] | None = None, *, profile: UserProfile | None = None
) -> InspireItemResponse:
    """Generate recipe ideas around one focal item plus optional pantry context."""
    ctx = _profile_context(profile)
    others = ", ".join(other_items) if other_items else "none"
    taste_text = f" Prefs: {profile.taste}." if profile and profile.taste else ""
    key = client.cache_key("inspire", f"{name_en}:{others}{_profile_hash(profile)}")
    raw = await client.call(
        prompt=(
            f'Cooking assistant. User has "{name_en}".{taste_text}\n'
            f"Other items: {others}{ctx}\n"
            f"3 recipe ideas, each with 2-3 extra ingredients NOT in list.\n"
            f"ONLY JSON: "
            f'{{"recipes": [{{"name": "Name", "emoji": "🍳", "desc": "Max 8 words", '
            f'"add": [{{"name_en": "Item"}}]}}]}}'
        ),
        system="You are a creative cooking assistant. Respond with JSON only.",
        cache_key=key,
        tier="fast",
        max_tokens=800,
        ttl=3600,
    )
    parsed = client.parse_json(raw, None)
    if parsed is None:
        return InspireItemResponse(recipes=[])
    try:
        return InspireItemResponse(**parsed)
    except ValidationError:
        return InspireItemResponse(recipes=[])


# ── clarify ──────────────────────────────────────────────


async def clarify(
    client: LLMClient, sections: dict[str, list[str]], *, profile: UserProfile | None = None
) -> ClarifyResponse:
    """Generate 1-3 clarifying questions before async suggestion generation."""
    ctx = _profile_context(profile)
    sections_text = json.dumps(sections, indent=2)
    key = client.cache_key("clarify", f"{sections_text}{_profile_hash(profile)}")
    raw = await client.call(
        prompt=(
            f"You are a smart grocery assistant. Before making suggestions, understand the user's intent.{ctx}\n\n"
            f"Grocery list sections:\n{sections_text}\n\n"
            f"Analyze the list and generate 1-3 quick clarifying questions. Consider:\n"
            f"- Is the purpose obvious or ambiguous? (party vs weekly restock vs specific recipe)\n"
            f"- Are there mixed cuisine patterns that need clarification?\n"
            f"- Is the quantity/scale unclear?\n"
            f"- Would knowing a theme, occasion, or cooking method change recommendations?\n\n"
            f"If straightforward, generate just 1 question. If ambiguous or complex, generate 2-3.\n"
            f"Each question should have 3-4 tappable chip options.\n\n"
            f"ONLY JSON: "
            f'{{"questions": [{{"q": "Question text", "options": ["Option 1", "Option 2", "Option 3"], '
            f'"allowOther": true}}]}}\n\n'
            f"Rules:\n"
            f"- 1-3 questions maximum\n"
            f"- Options should be short (2-5 words each)\n"
            f'- Questions should feel conversational, like a friend asking "what are we cooking?"\n'
            f"- 3-4 options per question"
        ),
        system="You are a smart grocery assistant. Respond with JSON only.",
        cache_key=key,
        tier="full",
        max_tokens=600,
        ttl=1800,
    )
    parsed = client.parse_json(raw, None)
    if parsed is None:
        return ClarifyResponse(questions=[])
    try:
        return ClarifyResponse(**parsed)
    except ValidationError:
        return ClarifyResponse(questions=[])


# ── suggest ─────────────────────────────────────────────


def _format_answers(answers: list[ClarifyAnswer]) -> str:
    """Serialize ClarifyAnswer pairs into a prompt-friendly string."""
    if not answers:
        return ""
    lines = [f"Q: {a.question}\nA: {a.answer}" for a in answers]
    return "\nUser context (from their answers):\n" + "\n".join(lines)


async def suggest(
    client: LLMClient,
    sections: dict[str, list[str]],
    answers: list | None = None,
    *,
    profile: UserProfile | None = None,
) -> SuggestResponse:
    """Analyze a full grocery list and return clustered meal suggestions."""
    ctx = _profile_context(profile)
    answers_text = _format_answers(answers or [])

    # Format sections as readable text
    sections_text = ". ".join(f"{sec}: {', '.join(items)}" for sec, items in sections.items())

    raw = await client.call(
        prompt=(
            f"Smart grocery assistant. Analyze this grocery list and suggest meal ideas.{ctx}\n\n"
            f"Grocery list: {sections_text}\n"
            f"{answers_text}\n\n"
            f"Steps: 1) Gap analysis — what's missing for complete meals. "
            f"2) Cultural match — respect the cuisine patterns. "
            f"3) Recipe bridge — connect existing items into meal clusters.\n\n"
            f"Return JSON:\n"
            f'{{"reason": "1-sentence summary of analysis",'
            f' "clusters": [{{"name": "Meal Name", "emoji": "🍳", "desc": "1-sentence",'
            f' "items": [{{"name_en": "item", "existing": true/false, "why": "if new, why needed"}}]}}],'
            f' "ungrouped": [{{"name_en": "item", "existing": true}}],'
            f' "storeLayout": [{{"category": "Aisle", "emoji": "🛒",'
            f' "items": [{{"name_en": "item", "existing": true/false}}]}}]}}\n\n'
            f"Rules:\n"
            f"- 2-4 clusters, 3-6 NEW items total across all clusters\n"
            f"- Every existing item must appear in exactly one cluster or ungrouped\n"
            f"- storeLayout must include ALL items (existing + new)"
        ),
        system="You are a smart grocery assistant. Respond with JSON only.",
        cache_key="",
        tier="full",
        max_tokens=2000,
    )
    parsed = client.parse_json(raw, None)
    if parsed is None:
        return SuggestResponse(reason="", clusters=[], ungrouped=[], storeLayout=[])
    try:
        return SuggestResponse(**parsed)
    except ValidationError:
        return SuggestResponse(reason="", clusters=[], ungrouped=[], storeLayout=[])
