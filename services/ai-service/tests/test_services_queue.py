"""Tests for app.services.queue."""

import json
from unittest.mock import AsyncMock, patch

import pytest

from app.services import queue


@pytest.mark.asyncio
async def test_publish_job_raises_when_not_connected() -> None:
    """publish_job should raise RuntimeError when exchange is None."""
    with patch.object(queue, "_exchange", None):
        with pytest.raises(RuntimeError, match="queue not connected"):
            await queue.publish_job("suggest", {"sections": []})


@pytest.mark.asyncio
async def test_publish_job_sends_to_exchange() -> None:
    """publish_job should publish a persistent message with routing_key='jobs'."""
    mock_exchange = AsyncMock()
    with patch.object(queue, "_exchange", mock_exchange):
        job_id = await queue.publish_job("suggest", {"sections": []})

    assert isinstance(job_id, str)
    assert len(job_id) == 36  # UUID format

    mock_exchange.publish.assert_awaited_once()
    call_args = mock_exchange.publish.call_args
    # Verify routing key
    assert call_args.kwargs.get("routing_key") == "jobs" or call_args[1].get("routing_key") == "jobs"
    # Verify message body
    msg = call_args[0][0]
    body = json.loads(msg.body)
    assert body["job_id"] == job_id
    assert body["type"] == "suggest"
    assert body["payload"] == {"sections": []}
