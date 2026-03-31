"""Tests for LLMClient infrastructure class."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest


class TestParseJson:
    def test_valid_json(self):
        from app.services.llm_client import LLMClient

        result = LLMClient.parse_json('{"key": "value"}', {"key": ""})
        assert result == {"key": "value"}

    def test_markdown_fenced_json(self):
        from app.services.llm_client import LLMClient

        raw = '```json\n{"name": "test"}\n```'
        result = LLMClient.parse_json(raw, {"name": ""})
        assert result == {"name": "test"}

    def test_garbage_returns_fallback(self):
        from app.services.llm_client import LLMClient

        fallback = {"default": True}
        result = LLMClient.parse_json("NOT JSON AT ALL", fallback)
        assert result == fallback

    def test_empty_string_returns_fallback(self):
        from app.services.llm_client import LLMClient

        result = LLMClient.parse_json("", {"empty": True})
        assert result == {"empty": True}


class TestCacheKey:
    def test_deterministic(self):
        from app.services.llm_client import LLMClient

        k1 = LLMClient.cache_key("translate", "Milk:Chinese")
        k2 = LLMClient.cache_key("translate", "Milk:Chinese")
        assert k1 == k2

    def test_different_data_different_key(self):
        from app.services.llm_client import LLMClient

        k1 = LLMClient.cache_key("translate", "Milk:Chinese")
        k2 = LLMClient.cache_key("translate", "Milk:French")
        assert k1 != k2

    def test_prefix_in_key(self):
        from app.services.llm_client import LLMClient

        key = LLMClient.cache_key("translate", "Milk")
        assert key.startswith("ai:translate:")


class TestCall:
    @pytest.mark.asyncio
    async def test_cache_hit_skips_llm(self):
        from app.services.llm_client import LLMClient

        client = LLMClient(api_key="test", model_fast="fast-m", model_full="full-m")

        with patch("app.services.llm_client.cache_get", new=AsyncMock(return_value='{"cached": true}')):
            result = await client.call("prompt", "system", "test-key")

        assert result == '{"cached": true}'

    @pytest.mark.asyncio
    async def test_fast_tier_uses_fast_model(self):
        from app.services.llm_client import LLMClient

        client = LLMClient(api_key="test", model_fast="fast-m", model_full="full-m")

        choice = MagicMock()
        choice.message.content = "response"
        response = MagicMock()
        response.choices = [choice]
        client._client.chat.completions.create = AsyncMock(return_value=response)

        with (
            patch("app.services.llm_client.cache_get", new=AsyncMock(return_value=None)),
            patch("app.services.llm_client.cache_set", new=AsyncMock()),
        ):
            await client.call("prompt", "system", "key", tier="fast")

        call_kwargs = client._client.chat.completions.create.call_args
        assert call_kwargs.kwargs["model"] == "fast-m"

    @pytest.mark.asyncio
    async def test_full_tier_uses_full_model(self):
        from app.services.llm_client import LLMClient

        client = LLMClient(api_key="test", model_fast="fast-m", model_full="full-m")

        choice = MagicMock()
        choice.message.content = "response"
        response = MagicMock()
        response.choices = [choice]
        client._client.chat.completions.create = AsyncMock(return_value=response)

        with (
            patch("app.services.llm_client.cache_get", new=AsyncMock(return_value=None)),
            patch("app.services.llm_client.cache_set", new=AsyncMock()),
        ):
            await client.call("prompt", "system", "key", tier="full")

        call_kwargs = client._client.chat.completions.create.call_args
        assert call_kwargs.kwargs["model"] == "full-m"

    @pytest.mark.asyncio
    async def test_result_cached_after_llm_call(self):
        from app.services.llm_client import LLMClient

        client = LLMClient(api_key="test", model_fast="fast-m", model_full="full-m")

        choice = MagicMock()
        choice.message.content = "llm-result"
        response = MagicMock()
        response.choices = [choice]
        client._client.chat.completions.create = AsyncMock(return_value=response)

        mock_cache_set = AsyncMock()
        with (
            patch("app.services.llm_client.cache_get", new=AsyncMock(return_value=None)),
            patch("app.services.llm_client.cache_set", mock_cache_set),
        ):
            result = await client.call("prompt", "system", "my-key", ttl=7200)

        assert result == "llm-result"
        mock_cache_set.assert_called_once_with("my-key", "llm-result", 7200)

    @pytest.mark.asyncio
    async def test_empty_content_returns_empty_string(self):
        from app.services.llm_client import LLMClient

        client = LLMClient(api_key="test", model_fast="fast-m", model_full="full-m")

        choice = MagicMock()
        choice.message.content = None
        response = MagicMock()
        response.choices = [choice]
        client._client.chat.completions.create = AsyncMock(return_value=response)

        with (
            patch("app.services.llm_client.cache_get", new=AsyncMock(return_value=None)),
            patch("app.services.llm_client.cache_set", new=AsyncMock()),
        ):
            result = await client.call("prompt", "system", "key")

        assert result == ""


class TestSingleton:
    def test_reset_clears_instance(self):
        from app.services.llm_client import get_llm_client, reset_llm_client

        client1 = get_llm_client()
        reset_llm_client()
        client2 = get_llm_client()
        assert client1 is not client2
