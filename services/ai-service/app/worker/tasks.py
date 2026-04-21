"""Celery tasks for async AI processing."""

import asyncio
import logging

from app.config import settings
from app.models import ClarifyAnswer, UserProfile
from app.services.domains import suggest
from app.services.job_store import set_job_result, set_job_status
from app.services.llm_client import LLMClient
from app.worker.celery_app import celery_app

logger = logging.getLogger(__name__)


async def _run_suggest(job_id: str, sections: dict, answers: list, profile: dict | None) -> None:
    """Core async logic for suggest task, testable without Celery broker."""
    await set_job_status(job_id, "processing")

    client = LLMClient(
        api_key=settings.openrouter_api_key,
        model_fast=settings.openrouter_model_fast,
        model_full=settings.openrouter_model_full,
    )

    try:
        answer_objs = [ClarifyAnswer(**a) for a in answers] if answers else []
        profile_obj = UserProfile(**profile) if profile else None

        result = await suggest(client, sections, answer_objs, profile=profile_obj)
        await set_job_result(job_id, result.model_dump(by_alias=True))
        await set_job_status(job_id, "done")
    except Exception as exc:
        logger.exception("suggest_task failed for job %s", job_id)
        await set_job_status(job_id, "failed", error=str(exc))


@celery_app.task
def suggest_task(job_id: str, sections: dict, answers: list, profile: dict | None) -> None:
    """Process a suggest request asynchronously via Celery."""
    asyncio.run(_run_suggest(job_id, sections, answers, profile))
