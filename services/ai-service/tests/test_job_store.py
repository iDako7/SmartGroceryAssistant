"""Tests for job store helpers — status and result CRUD via Redis cache."""

from unittest.mock import AsyncMock, patch

import pytest


class TestSetGetJobStatus:
    @pytest.mark.asyncio
    async def test_round_trip(self):
        from app.services.job_store import get_job_status, set_job_status

        with (
            patch("app.services.job_store.cache_set", new=AsyncMock()),
            patch("app.services.job_store.cache_get", new=AsyncMock()) as mock_get,
        ):
            await set_job_status("job-1", "pending")
            # Simulate reading back what was written
            mock_get.return_value = '{"status": "pending", "error": ""}'
            result = await get_job_status("job-1")

        assert result["status"] == "pending"
        assert result["error"] == ""

    @pytest.mark.asyncio
    async def test_returns_none_for_unknown_job(self):
        from app.services.job_store import get_job_status

        with patch("app.services.job_store.cache_get", new=AsyncMock(return_value=None)):
            result = await get_job_status("nonexistent")

        assert result is None

    @pytest.mark.asyncio
    async def test_status_transitions(self):
        from app.services.job_store import get_job_status, set_job_status

        stored = {}

        async def fake_set(key, value, ttl=3600):
            stored[key] = value

        async def fake_get(key):
            return stored.get(key)

        with (
            patch("app.services.job_store.cache_set", side_effect=fake_set),
            patch("app.services.job_store.cache_get", side_effect=fake_get),
        ):
            await set_job_status("job-2", "pending")
            s1 = await get_job_status("job-2")
            assert s1["status"] == "pending"

            await set_job_status("job-2", "processing")
            s2 = await get_job_status("job-2")
            assert s2["status"] == "processing"

            await set_job_status("job-2", "done")
            s3 = await get_job_status("job-2")
            assert s3["status"] == "done"

    @pytest.mark.asyncio
    async def test_failed_status_includes_error(self):
        from app.services.job_store import get_job_status, set_job_status

        stored = {}

        async def fake_set(key, value, ttl=3600):
            stored[key] = value

        async def fake_get(key):
            return stored.get(key)

        with (
            patch("app.services.job_store.cache_set", side_effect=fake_set),
            patch("app.services.job_store.cache_get", side_effect=fake_get),
        ):
            await set_job_status("job-3", "failed", error="LLM timeout")
            result = await get_job_status("job-3")

        assert result["status"] == "failed"
        assert result["error"] == "LLM timeout"


class TestSetGetJobResult:
    @pytest.mark.asyncio
    async def test_round_trip(self):
        from app.services.job_store import get_job_result, set_job_result

        stored = {}

        async def fake_set(key, value, ttl=3600):
            stored[key] = value

        async def fake_get(key):
            return stored.get(key)

        result_data = {"reason": "test", "clusters": [], "ungrouped": [], "storeLayout": []}

        with (
            patch("app.services.job_store.cache_set", side_effect=fake_set),
            patch("app.services.job_store.cache_get", side_effect=fake_get),
        ):
            await set_job_result("job-4", result_data)
            result = await get_job_result("job-4")

        assert result == result_data

    @pytest.mark.asyncio
    async def test_returns_none_when_not_available(self):
        from app.services.job_store import get_job_result

        with patch("app.services.job_store.cache_get", new=AsyncMock(return_value=None)):
            result = await get_job_result("nonexistent")

        assert result is None

    @pytest.mark.asyncio
    async def test_uses_correct_key_prefix(self):
        from app.services.job_store import set_job_result, set_job_status

        with patch("app.services.job_store.cache_set", new=AsyncMock()) as mock_set:
            await set_job_status("job-5", "done")
            status_key = mock_set.call_args_list[0][0][0]
            assert status_key == "ai:status:job-5"

            await set_job_result("job-5", {"data": "test"})
            result_key = mock_set.call_args_list[1][0][0]
            assert result_key == "ai:result:job-5"
