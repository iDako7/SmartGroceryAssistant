"""Tests for the async worker (worker.py)."""

import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from worker import process


def _make_message(body: dict) -> MagicMock:
    """Create a mock aio_pika.IncomingMessage."""
    msg = MagicMock()
    msg.body = json.dumps(body).encode()
    # make process() context manager work
    ctx = MagicMock()
    ctx.__aenter__ = AsyncMock(return_value=None)
    ctx.__aexit__ = AsyncMock(return_value=False)
    msg.process.return_value = ctx
    return msg


@pytest.mark.asyncio
@patch("worker.cache_set", new_callable=AsyncMock)
@patch("worker.suggest_items", new_callable=AsyncMock, return_value='["Milk","Eggs"]')
async def test_process_suggest(mock_suggest: AsyncMock, mock_cache: AsyncMock) -> None:
    msg = _make_message(
        {
            "job_id": "j1",
            "type": "suggest",
            "payload": {"sections": [{"name": "Dairy", "items": ["Butter"]}]},
        }
    )

    await process(msg)

    mock_suggest.assert_awaited_once_with([{"name": "Dairy", "items": ["Butter"]}])
    mock_cache.assert_awaited_once_with("ai:result:j1", '["Milk","Eggs"]', ttl=3600)


@pytest.mark.asyncio
@patch("worker.cache_set", new_callable=AsyncMock)
@patch("worker.inspire_meals", new_callable=AsyncMock, return_value='["Pasta"]')
async def test_process_inspire(mock_inspire: AsyncMock, mock_cache: AsyncMock) -> None:
    msg = _make_message(
        {
            "job_id": "j2",
            "type": "inspire",
            "payload": {"sections": [], "preferences": "vegetarian"},
        }
    )

    await process(msg)

    mock_inspire.assert_awaited_once_with([], "vegetarian")
    mock_cache.assert_awaited_once_with("ai:result:j2", '["Pasta"]', ttl=3600)


@pytest.mark.asyncio
@patch("worker.cache_set", new_callable=AsyncMock)
async def test_process_unknown_type_skips(mock_cache: AsyncMock) -> None:
    msg = _make_message(
        {
            "job_id": "j3",
            "type": "unknown_job",
            "payload": {},
        }
    )

    await process(msg)

    mock_cache.assert_not_awaited()


@pytest.mark.asyncio
@patch("worker.cache_set", new_callable=AsyncMock)
@patch("worker.suggest_items", new_callable=AsyncMock, side_effect=RuntimeError("LLM down"))
async def test_process_exception_is_caught(mock_suggest: AsyncMock, mock_cache: AsyncMock) -> None:
    msg = _make_message(
        {
            "job_id": "j4",
            "type": "suggest",
            "payload": {"sections": []},
        }
    )

    # Should not raise — worker catches exceptions
    await process(msg)

    mock_cache.assert_not_awaited()
