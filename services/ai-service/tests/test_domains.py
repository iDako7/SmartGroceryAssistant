"""Tests for domain functions — prompt logic separated from LLM infrastructure."""

import json
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.models import UserProfile


def _make_mock_client(raw_response: str = "{}") -> MagicMock:
    """Create a mock LLMClient that returns raw_response from call()."""
    client = MagicMock()
    client.call = AsyncMock(return_value=raw_response)
    client.cache_key = MagicMock(side_effect=lambda prefix, data: f"ai:{prefix}:{data[:8]}")
    client.parse_json = MagicMock(side_effect=lambda raw, fallback: _real_parse_json(raw, fallback))
    return client


def _real_parse_json(raw: str, fallback: dict) -> dict:
    """Use the real parse_json logic for test assertions."""
    try:
        text = raw.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1].rsplit("```", 1)[0]
        return json.loads(text)
    except (json.JSONDecodeError, IndexError):
        return fallback


# ── translate_item ───────────────────────────────────────


class TestTranslateItem:
    @pytest.mark.asyncio
    async def test_uses_fast_tier(self):
        from app.services.domains import translate_item

        client = _make_mock_client('{"name_translated": "牛奶", "notes": ""}')
        await translate_item(client, "Milk", "Chinese")
        kwargs = client.call.call_args.kwargs
        assert kwargs["tier"] == "fast"

    @pytest.mark.asyncio
    async def test_returns_parsed_response(self):
        from app.services.domains import translate_item

        client = _make_mock_client('{"name_translated": "牛奶", "notes": "fresh milk"}')
        result = await translate_item(client, "Milk", "Chinese")
        assert result.name_translated == "牛奶"

    @pytest.mark.asyncio
    async def test_fallback_on_garbage(self):
        from app.services.domains import translate_item

        client = _make_mock_client("NOT JSON")
        result = await translate_item(client, "Milk", "Chinese")
        assert result.name_translated == "Milk"
        assert result.notes == ""

    @pytest.mark.asyncio
    async def test_profile_in_prompt_when_provided(self):
        from app.services.domains import translate_item

        client = _make_mock_client('{"name_translated": "牛奶", "notes": ""}')
        profile = UserProfile(dietary=["vegan"])
        await translate_item(client, "Milk", "Chinese", profile=profile)
        prompt_arg = client.call.call_args.kwargs["prompt"]
        assert "vegan" in prompt_arg

    @pytest.mark.asyncio
    async def test_no_profile_context_when_none(self):
        from app.services.domains import translate_item

        client = _make_mock_client('{"name_translated": "牛奶", "notes": ""}')
        await translate_item(client, "Milk", "Chinese")
        prompt_arg = client.call.call_args.kwargs["prompt"]
        assert "Dietary" not in prompt_arg


# ── item_info ────────────────────────────────────────────


class TestItemInfo:
    @pytest.mark.asyncio
    async def test_uses_fast_tier(self):
        from app.services.domains import item_info

        raw = '{"category": "Dairy", "typical_unit": "L", "storage_tip": "", "nutrition_note": ""}'
        client = _make_mock_client(raw)
        await item_info(client, "Milk")
        kwargs = client.call.call_args.kwargs
        assert kwargs["tier"] == "fast"

    @pytest.mark.asyncio
    async def test_fallback_on_garbage(self):
        from app.services.domains import item_info

        client = _make_mock_client("garbage")
        result = await item_info(client, "Milk")
        assert result.category == ""


# ── alternatives ─────────────────────────────────────────


class TestAlternatives:
    @pytest.mark.asyncio
    async def test_uses_full_tier(self):
        from app.services.domains import alternatives

        client = _make_mock_client('{"note": "", "alts": []}')
        await alternatives(client, "Milk")
        kwargs = client.call.call_args.kwargs
        assert kwargs["tier"] == "full"

    @pytest.mark.asyncio
    async def test_reason_in_prompt(self):
        from app.services.domains import alternatives

        client = _make_mock_client('{"note": "", "alts": []}')
        await alternatives(client, "Milk", reason="lactose intolerant")
        prompt_arg = client.call.call_args.kwargs["prompt"]
        assert "lactose intolerant" in prompt_arg

    @pytest.mark.asyncio
    async def test_fallback_on_garbage(self):
        from app.services.domains import alternatives

        client = _make_mock_client("broken")
        result = await alternatives(client, "Milk")
        assert result.note == ""
        assert result.alts == []

    @pytest.mark.asyncio
    async def test_profile_changes_cache_key(self):
        from app.services.domains import alternatives

        client = _make_mock_client('{"note": "", "alts": []}')

        await alternatives(client, "Milk")
        key1_data = client.cache_key.call_args[0][1]

        profile = UserProfile(dietary=["vegan"])
        await alternatives(client, "Milk", profile=profile)
        key2_data = client.cache_key.call_args[0][1]

        assert key1_data != key2_data

    @pytest.mark.asyncio
    async def test_profile_hash_uses_json_for_safety(self):
        """Profile hash uses JSON serialization to avoid delimiter collisions."""
        from app.services.domains import _profile_hash

        profile = UserProfile(dietary=["vegan"], household_size=2, taste="spicy")
        h = _profile_hash(profile)
        # Should be a fixed-length hex hash, not raw field concatenation
        assert h.startswith("|p:")
        hex_part = h[3:]
        assert len(hex_part) == 16
        int(hex_part, 16)  # validates it's valid hex


# ── inspire_item ─────────────────────────────────────────


class TestInspireItem:
    @pytest.mark.asyncio
    async def test_uses_fast_tier(self):
        from app.services.domains import inspire_item

        client = _make_mock_client('{"recipes": []}')
        await inspire_item(client, "chicken", other_items=["rice"])
        kwargs = client.call.call_args.kwargs
        assert kwargs["tier"] == "fast"

    @pytest.mark.asyncio
    async def test_other_items_in_prompt(self):
        from app.services.domains import inspire_item

        client = _make_mock_client('{"recipes": []}')
        await inspire_item(client, "chicken", other_items=["rice", "garlic"])
        prompt_arg = client.call.call_args.kwargs["prompt"]
        assert "rice" in prompt_arg
        assert "garlic" in prompt_arg

    @pytest.mark.asyncio
    async def test_fallback_on_garbage(self):
        from app.services.domains import inspire_item

        client = _make_mock_client("not json")
        result = await inspire_item(client, "chicken")
        assert result.recipes == []

    @pytest.mark.asyncio
    async def test_max_tokens_800(self):
        from app.services.domains import inspire_item

        client = _make_mock_client('{"recipes": []}')
        await inspire_item(client, "chicken")
        kwargs = client.call.call_args.kwargs
        assert kwargs["max_tokens"] == 800


# ── clarify ──────────────────────────────────────────────


class TestClarify:
    @pytest.mark.asyncio
    async def test_uses_full_tier(self):
        from app.services.domains import clarify

        client = _make_mock_client('{"questions": []}')
        await clarify(client, {"Produce": ["apples"]})
        kwargs = client.call.call_args.kwargs
        assert kwargs["tier"] == "full"

    @pytest.mark.asyncio
    async def test_sections_in_prompt(self):
        from app.services.domains import clarify

        client = _make_mock_client('{"questions": []}')
        await clarify(client, {"Produce": ["apples", "bananas"], "Meat": ["chicken"]})
        prompt_arg = client.call.call_args.kwargs["prompt"]
        assert "apples" in prompt_arg
        assert "chicken" in prompt_arg

    @pytest.mark.asyncio
    async def test_fallback_on_garbage(self):
        from app.services.domains import clarify

        client = _make_mock_client("broken")
        result = await clarify(client, {"Produce": ["apples"]})
        assert result.questions == []

    @pytest.mark.asyncio
    async def test_ttl_1800(self):
        from app.services.domains import clarify

        client = _make_mock_client('{"questions": []}')
        await clarify(client, {"Produce": ["apples"]})
        kwargs = client.call.call_args.kwargs
        assert kwargs["ttl"] == 1800

    @pytest.mark.asyncio
    async def test_max_tokens_600(self):
        from app.services.domains import clarify

        client = _make_mock_client('{"questions": []}')
        await clarify(client, {"Produce": ["apples"]})
        kwargs = client.call.call_args.kwargs
        assert kwargs["max_tokens"] == 600


# ── suggest ─────────────────────────────────────────────


class TestSuggest:
    @pytest.mark.asyncio
    async def test_uses_full_tier(self):
        from app.services.domains import suggest

        raw = '{"reason": "", "clusters": [], "ungrouped": [], "storeLayout": []}'
        client = _make_mock_client(raw)
        await suggest(client, {"Produce": ["apples"]})
        kwargs = client.call.call_args.kwargs
        assert kwargs["tier"] == "full"

    @pytest.mark.asyncio
    async def test_max_tokens_2000(self):
        from app.services.domains import suggest

        raw = '{"reason": "", "clusters": [], "ungrouped": [], "storeLayout": []}'
        client = _make_mock_client(raw)
        await suggest(client, {"Produce": ["apples"]})
        kwargs = client.call.call_args.kwargs
        assert kwargs["max_tokens"] == 2000

    @pytest.mark.asyncio
    async def test_profile_in_prompt(self):
        from app.services.domains import suggest

        raw = '{"reason": "", "clusters": [], "ungrouped": [], "storeLayout": []}'
        client = _make_mock_client(raw)
        profile = UserProfile(dietary=["vegan"], household_size=4)
        await suggest(client, {"Produce": ["apples"]}, profile=profile)
        prompt_arg = client.call.call_args.kwargs["prompt"]
        assert "vegan" in prompt_arg

    @pytest.mark.asyncio
    async def test_answers_in_prompt(self):
        from app.models import ClarifyAnswer
        from app.services.domains import suggest

        raw = '{"reason": "", "clusters": [], "ungrouped": [], "storeLayout": []}'
        client = _make_mock_client(raw)
        answers = [ClarifyAnswer(question="Occasion?", answer="Weeknight dinner")]
        await suggest(client, {"Produce": ["apples"]}, answers=answers)
        prompt_arg = client.call.call_args.kwargs["prompt"]
        assert "Weeknight dinner" in prompt_arg
        assert "Occasion?" in prompt_arg

    @pytest.mark.asyncio
    async def test_answers_absent_when_empty(self):
        from app.services.domains import suggest

        raw = '{"reason": "", "clusters": [], "ungrouped": [], "storeLayout": []}'
        client = _make_mock_client(raw)
        await suggest(client, {"Produce": ["apples"]}, answers=[])
        prompt_arg = client.call.call_args.kwargs["prompt"]
        assert "User context" not in prompt_arg

    @pytest.mark.asyncio
    async def test_sections_in_prompt(self):
        from app.services.domains import suggest

        raw = '{"reason": "", "clusters": [], "ungrouped": [], "storeLayout": []}'
        client = _make_mock_client(raw)
        await suggest(client, {"Produce": ["apples", "bananas"], "Meat": ["chicken"]})
        prompt_arg = client.call.call_args.kwargs["prompt"]
        assert "apples" in prompt_arg
        assert "chicken" in prompt_arg

    @pytest.mark.asyncio
    async def test_valid_json_returns_suggest_response(self):
        from app.services.domains import suggest

        raw = json.dumps(
            {
                "reason": "Asian dinner",
                "clusters": [
                    {
                        "name": "Stir Fry",
                        "emoji": "🍜",
                        "desc": "Quick stir fry",
                        "items": [
                            {"name_en": "chicken", "existing": True},
                            {"name_en": "soy sauce", "existing": False, "why": "Essential"},
                        ],
                    }
                ],
                "ungrouped": [{"name_en": "apples", "existing": True}],
                "storeLayout": [
                    {
                        "category": "Produce",
                        "emoji": "🥬",
                        "items": [{"name_en": "apples", "existing": True}],
                    }
                ],
            }
        )
        client = _make_mock_client(raw)
        result = await suggest(client, {"Produce": ["apples"], "Meat": ["chicken"]})
        assert result.reason == "Asian dinner"
        assert len(result.clusters) == 1
        assert result.clusters[0].items[1].existing is False

    @pytest.mark.asyncio
    async def test_fallback_on_garbage(self):
        from app.services.domains import suggest

        client = _make_mock_client("not json at all")
        result = await suggest(client, {"Produce": ["apples"]})
        assert result.reason == ""
        assert result.clusters == []
        assert result.ungrouped == []
        assert result.store_layout == []

    @pytest.mark.asyncio
    async def test_no_cache_key(self):
        from app.services.domains import suggest

        raw = '{"reason": "", "clusters": [], "ungrouped": [], "storeLayout": []}'
        client = _make_mock_client(raw)
        await suggest(client, {"Produce": ["apples"]})
        kwargs = client.call.call_args.kwargs
        assert kwargs.get("cache_key") in (None, "")
