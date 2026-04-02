"""Tests for Celery suggest_task — mock LLM + Redis."""

from unittest.mock import AsyncMock, patch

import pytest

from app.models import SuggestResponse


def _make_suggest_result() -> dict:
    """A minimal valid SuggestResponse dict."""
    return {
        "reason": "Test analysis",
        "clusters": [],
        "ungrouped": [],
        "storeLayout": [],
    }


class TestSuggestTask:
    @pytest.mark.asyncio
    async def test_happy_path_status_transitions(self):
        """pending -> processing -> done, result stored."""
        from app.worker.tasks import _run_suggest

        statuses = []
        stored = {}

        async def fake_set_status(job_id, status, error=""):
            statuses.append(status)

        async def fake_set_result(job_id, result):
            stored["result"] = result

        mock_suggest = AsyncMock(return_value=SuggestResponse(reason="Test", clusters=[], ungrouped=[], storeLayout=[]))

        with (
            patch("app.worker.tasks.set_job_status", side_effect=fake_set_status),
            patch("app.worker.tasks.set_job_result", side_effect=fake_set_result),
            patch("app.worker.tasks.suggest", mock_suggest),
            patch("app.worker.tasks.LLMClient"),
        ):
            # Call the inner async function directly (avoid Celery broker)
            await _run_suggest(
                job_id="job-1",
                sections={"Produce": ["apples"]},
                answers=[],
                profile=None,
            )

        assert statuses == ["processing", "done"]
        assert "result" in stored

    @pytest.mark.asyncio
    async def test_failure_marks_failed(self):
        """When suggest raises, status becomes 'failed' with error."""
        from app.worker.tasks import _run_suggest

        statuses = []
        errors = []

        async def fake_set_status(job_id, status, error=""):
            statuses.append(status)
            if error:
                errors.append(error)

        mock_suggest = AsyncMock(side_effect=RuntimeError("LLM timeout"))

        with (
            patch("app.worker.tasks.set_job_status", side_effect=fake_set_status),
            patch("app.worker.tasks.set_job_result", new=AsyncMock()),
            patch("app.worker.tasks.suggest", mock_suggest),
            patch("app.worker.tasks.LLMClient"),
        ):
            await _run_suggest(
                job_id="job-2",
                sections={"Produce": ["apples"]},
                answers=[],
                profile=None,
            )

        assert "failed" in statuses
        assert any("LLM timeout" in e for e in errors)

    @pytest.mark.asyncio
    async def test_answers_deserialized(self):
        """Raw answer dicts are converted to ClarifyAnswer objects."""
        from app.worker.tasks import _run_suggest

        mock_suggest = AsyncMock(return_value=SuggestResponse(reason="", clusters=[], ungrouped=[], storeLayout=[]))

        with (
            patch("app.worker.tasks.set_job_status", new=AsyncMock()),
            patch("app.worker.tasks.set_job_result", new=AsyncMock()),
            patch("app.worker.tasks.suggest", mock_suggest),
            patch("app.worker.tasks.LLMClient"),
        ):
            await _run_suggest(
                job_id="job-3",
                sections={"Produce": ["apples"]},
                answers=[{"question": "Occasion?", "answer": "Party"}],
                profile=None,
            )

        call_args = mock_suggest.call_args
        answer_objs = call_args[0][2] if len(call_args[0]) > 2 else call_args.kwargs.get("answers")
        assert len(answer_objs) == 1
        assert answer_objs[0].question == "Occasion?"

    @pytest.mark.asyncio
    async def test_profile_none_works(self):
        """No profile passed — profile=None in domain call."""
        from app.worker.tasks import _run_suggest

        mock_suggest = AsyncMock(return_value=SuggestResponse(reason="", clusters=[], ungrouped=[], storeLayout=[]))

        with (
            patch("app.worker.tasks.set_job_status", new=AsyncMock()),
            patch("app.worker.tasks.set_job_result", new=AsyncMock()),
            patch("app.worker.tasks.suggest", mock_suggest),
            patch("app.worker.tasks.LLMClient"),
        ):
            await _run_suggest(
                job_id="job-4",
                sections={"Produce": ["apples"]},
                answers=[],
                profile=None,
            )

        call_kwargs = mock_suggest.call_args.kwargs
        assert call_kwargs.get("profile") is None

    @pytest.mark.asyncio
    async def test_profile_deserialized(self):
        """Profile dict is converted to UserProfile object."""
        from app.worker.tasks import _run_suggest

        mock_suggest = AsyncMock(return_value=SuggestResponse(reason="", clusters=[], ungrouped=[], storeLayout=[]))

        with (
            patch("app.worker.tasks.set_job_status", new=AsyncMock()),
            patch("app.worker.tasks.set_job_result", new=AsyncMock()),
            patch("app.worker.tasks.suggest", mock_suggest),
            patch("app.worker.tasks.LLMClient"),
        ):
            await _run_suggest(
                job_id="job-5",
                sections={"Produce": ["apples"]},
                answers=[],
                profile={"dietary": ["vegan"], "household_size": 4, "taste": "spicy"},
            )

        call_kwargs = mock_suggest.call_args.kwargs
        assert call_kwargs["profile"].dietary == ["vegan"]
