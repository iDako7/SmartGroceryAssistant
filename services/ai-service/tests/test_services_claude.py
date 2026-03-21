"""Unit tests for claude service helpers (pure functions — no I/O)."""


class TestParseJson:
    """Tests for the _parse_json private helper via public functions' fallback behaviour."""

    def test_translate_fallback_on_invalid_json(self):
        """translate_item falls back to name_en when Claude returns garbage."""
        import asyncio
        from unittest.mock import AsyncMock, patch

        with (
            patch("app.services.claude.cache_get", new=AsyncMock(return_value=None)),
            patch("app.services.claude.cache_set", new=AsyncMock()),
            patch(
                "app.services.claude.get_client",
                return_value=_make_client("NOT JSON AT ALL"),
            ),
        ):
            result = asyncio.get_event_loop().run_until_complete(
                _import_and_call("translate_item", "Milk", "Chinese")
            )
        assert result["name_translated"] == "Milk"
        assert result["notes"] == ""

    def test_item_info_fallback_on_invalid_json(self):
        import asyncio
        from unittest.mock import AsyncMock, patch

        with (
            patch("app.services.claude.cache_get", new=AsyncMock(return_value=None)),
            patch("app.services.claude.cache_set", new=AsyncMock()),
            patch(
                "app.services.claude.get_client",
                return_value=_make_client("garbage"),
            ),
        ):
            result = asyncio.get_event_loop().run_until_complete(
                _import_and_call("item_info", "Milk")
            )
        assert result["category"] == ""

    def test_alternatives_fallback_on_invalid_json(self):
        import asyncio
        from unittest.mock import AsyncMock, patch

        with (
            patch("app.services.claude.cache_get", new=AsyncMock(return_value=None)),
            patch("app.services.claude.cache_set", new=AsyncMock()),
            patch(
                "app.services.claude.get_client",
                return_value=_make_client("broken"),
            ),
        ):
            result = asyncio.get_event_loop().run_until_complete(
                _import_and_call("alternatives", "Milk")
            )
        assert result["alternatives"] == []

    def test_translate_uses_cache_hit(self):
        """translate_item returns cached result without calling Claude."""
        import asyncio
        import json
        from unittest.mock import AsyncMock, patch

        cached = json.dumps({"name_translated": "牛奶", "notes": "fresh"})
        with (
            patch("app.services.claude.cache_get", new=AsyncMock(return_value=cached)),
            patch("app.services.claude.get_client") as mock_client,
        ):
            result = asyncio.get_event_loop().run_until_complete(
                _import_and_call("translate_item", "Milk", "Chinese")
            )
        mock_client.assert_not_called()
        assert result["name_translated"] == "牛奶"

    def test_parse_json_strips_markdown_fence(self):
        """_parse_json strips ```json...``` code fences."""
        import asyncio
        from unittest.mock import AsyncMock, patch

        raw = '```json\n{"name_translated": "Lait", "notes": ""}\n```'
        with (
            patch("app.services.claude.cache_get", new=AsyncMock(return_value=None)),
            patch("app.services.claude.cache_set", new=AsyncMock()),
            patch(
                "app.services.claude.get_client",
                return_value=_make_client(raw),
            ),
        ):
            result = asyncio.get_event_loop().run_until_complete(
                _import_and_call("translate_item", "Milk", "French")
            )
        assert result["name_translated"] == "Lait"


# ── Helpers ───────────────────────────────────────────────


def _make_client(content: str):
    """Returns a mock AsyncOpenAI client that returns `content` as message text."""
    from unittest.mock import AsyncMock, MagicMock

    choice = MagicMock()
    choice.message.content = content
    response = MagicMock()
    response.choices = [choice]

    client = MagicMock()
    client.chat.completions.create = AsyncMock(return_value=response)
    return client


async def _import_and_call(fn_name: str, *args):
    import importlib

    mod = importlib.import_module("app.services.claude")
    return await getattr(mod, fn_name)(*args)
