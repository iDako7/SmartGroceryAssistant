"""Integration tests for the full suggest pipeline (POST -> worker -> GET)."""

import asyncio
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

from app.models import SuggestResponse


class TestSuggestPipelineHappyPath:
    """POST /suggest -> simulate worker -> GET /jobs/{job_id} -> done."""

    def test_full_round_trip(self, client, auth_headers):
        stored = {}

        async def fake_cache_set(key, value, ttl=3600):
            stored[key] = value

        async def fake_cache_get(key):
            return stored.get(key)

        # Phase 1: POST /suggest — get job_id
        with (
            patch("app.services.job_store.cache_set", side_effect=fake_cache_set),
            patch("app.services.job_store.cache_get", side_effect=fake_cache_get),
            patch("app.routes.ai.suggest_task") as mock_task,
        ):
            mock_task.delay = MagicMock()
            post_resp = client.post(
                "/api/v1/ai/suggest",
                json={
                    "sections": {"Produce": ["apples", "garlic"], "Meat": ["chicken thighs"]},
                    "answers": [{"question": "Occasion?", "answer": "Weeknight dinner"}],
                },
                headers=auth_headers,
            )

        assert post_resp.status_code == 202
        job_id = post_resp.json()["job_id"]
        uuid.UUID(job_id)  # valid UUID

        # Verify job is pending in store
        assert f"ai:status:{job_id}" in stored

        # Phase 2: Simulate worker execution (call _run_async directly)
        suggest_result = SuggestResponse(
            reason="Asian-inspired weeknight dinner",
            clusters=[],
            ungrouped=[],
            storeLayout=[],
        )

        mock_suggest = AsyncMock(return_value=suggest_result)

        with (
            patch("app.services.job_store.cache_set", side_effect=fake_cache_set),
            patch("app.services.job_store.cache_get", side_effect=fake_cache_get),
            patch("app.worker.tasks.suggest", mock_suggest),
            patch("app.worker.tasks.LLMClient"),
        ):
            from app.worker.tasks import _run_suggest

            asyncio.run(
                _run_suggest(
                    job_id=job_id,
                    sections={"Produce": ["apples", "garlic"], "Meat": ["chicken thighs"]},
                    answers=[{"question": "Occasion?", "answer": "Weeknight dinner"}],
                    profile=None,
                )
            )

        # Phase 3: GET /jobs/{job_id} — should be done
        with (
            patch("app.services.job_store.cache_set", side_effect=fake_cache_set),
            patch("app.services.job_store.cache_get", side_effect=fake_cache_get),
        ):
            get_resp = client.get(f"/api/v1/ai/jobs/{job_id}", headers=auth_headers)

        assert get_resp.status_code == 200
        data = get_resp.json()
        assert data["status"] == "done"
        assert data["result"]["reason"] == "Asian-inspired weeknight dinner"


class TestSuggestPipelineFailure:
    """POST /suggest -> worker fails -> GET /jobs/{job_id} -> failed."""

    def test_failure_round_trip(self, client, auth_headers):
        stored = {}

        async def fake_cache_set(key, value, ttl=3600):
            stored[key] = value

        async def fake_cache_get(key):
            return stored.get(key)

        # Phase 1: POST /suggest
        with (
            patch("app.services.job_store.cache_set", side_effect=fake_cache_set),
            patch("app.services.job_store.cache_get", side_effect=fake_cache_get),
            patch("app.routes.ai.suggest_task") as mock_task,
        ):
            mock_task.delay = MagicMock()
            post_resp = client.post(
                "/api/v1/ai/suggest",
                json={"sections": {"Produce": ["apples"]}},
                headers=auth_headers,
            )

        job_id = post_resp.json()["job_id"]

        # Phase 2: Simulate worker failure
        mock_suggest = AsyncMock(side_effect=RuntimeError("API rate limited"))

        with (
            patch("app.services.job_store.cache_set", side_effect=fake_cache_set),
            patch("app.services.job_store.cache_get", side_effect=fake_cache_get),
            patch("app.worker.tasks.suggest", mock_suggest),
            patch("app.worker.tasks.LLMClient"),
        ):
            from app.worker.tasks import _run_suggest

            asyncio.run(
                _run_suggest(
                    job_id=job_id,
                    sections={"Produce": ["apples"]},
                    answers=[],
                    profile=None,
                )
            )

        # Phase 3: GET /jobs/{job_id} — should be failed
        with (
            patch("app.services.job_store.cache_set", side_effect=fake_cache_set),
            patch("app.services.job_store.cache_get", side_effect=fake_cache_get),
        ):
            get_resp = client.get(f"/api/v1/ai/jobs/{job_id}", headers=auth_headers)

        assert get_resp.status_code == 200
        data = get_resp.json()
        assert data["status"] == "failed"
        assert "API rate limited" in data["error"]
