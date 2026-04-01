"""Tests for app.services.cache."""

from unittest.mock import AsyncMock, patch

import pytest

from app.services import cache


@pytest.mark.asyncio
async def test_cache_set_stores_with_ttl() -> None:
    mock_redis = AsyncMock()
    with patch.object(cache, "get_redis", return_value=mock_redis):
        await cache.cache_set("key1", "value1", ttl=600)

    mock_redis.set.assert_awaited_once_with("key1", "value1", ex=600)


@pytest.mark.asyncio
async def test_cache_get_returns_value() -> None:
    mock_redis = AsyncMock()
    mock_redis.get.return_value = "cached_value"
    with patch.object(cache, "get_redis", return_value=mock_redis):
        result = await cache.cache_get("key1")

    assert result == "cached_value"
    mock_redis.get.assert_awaited_once_with("key1")


@pytest.mark.asyncio
async def test_cache_get_returns_none_for_missing() -> None:
    mock_redis = AsyncMock()
    mock_redis.get.return_value = None
    with patch.object(cache, "get_redis", return_value=mock_redis):
        result = await cache.cache_get("nonexistent")

    assert result is None
