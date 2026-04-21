"""Job status and result storage via Redis cache."""

import json

from app.config import settings
from app.services.cache import cache_get, cache_set

JOB_TTL = settings.celery_result_ttl


async def set_job_status(job_id: str, status: str, error: str = "") -> None:
    """Write job status. Status: pending | processing | done | failed."""
    payload = json.dumps({"status": status, "error": error})
    await cache_set(f"ai:status:{job_id}", payload, JOB_TTL)


async def get_job_status(job_id: str) -> dict | None:
    """Read job status. Returns None if job doesn't exist."""
    raw = await cache_get(f"ai:status:{job_id}")
    if raw is None:
        return None
    return json.loads(raw)


async def set_job_result(job_id: str, result: dict) -> None:
    """Write completed job result."""
    await cache_set(f"ai:result:{job_id}", json.dumps(result), JOB_TTL)


async def get_job_result(job_id: str) -> dict | None:
    """Read job result. Returns None if not yet available."""
    raw = await cache_get(f"ai:result:{job_id}")
    if raw is None:
        return None
    return json.loads(raw)
