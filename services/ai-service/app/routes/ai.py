import json

from typing import Self

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field, model_validator

from app.middleware.auth import verify_token
from app.services import cache, claude, queue

router = APIRouter(prefix="/api/v1/ai", tags=["ai"])


# ── Request models ────────────────────────────────────────


class TranslateRequest(BaseModel):
    name_en: str = Field(..., min_length=1, max_length=200)
    target_language: str = Field(..., min_length=1, max_length=50)


class ItemInfoRequest(BaseModel):
    name_en: str = Field(..., min_length=1, max_length=200)


class AlternativesRequest(BaseModel):
    name_en: str = Field(..., min_length=1, max_length=200)
    reason: str = Field(default="", max_length=500)


class _SectionsModel(BaseModel):
    """Shared validation for section-based requests."""

    sections: dict[str, list[str]] = Field(..., max_length=20)

    @model_validator(mode="after")
    def cap_total_items(self) -> Self:
        total = sum(len(items) for items in self.sections.values())
        if total > 200:
            msg = f"total items across sections must be ≤ 200, got {total}"
            raise ValueError(msg)
        return self


class SuggestRequest(_SectionsModel):
    pass


class InspireRequest(_SectionsModel):
    preferences: str = Field(default="", max_length=500)


# ── Sync endpoints ────────────────────────────────────────


@router.post("/translate")
async def translate(req: TranslateRequest, _: str = Depends(verify_token)):
    return await claude.translate_item(req.name_en, req.target_language)


@router.post("/item-info")
async def item_info(req: ItemInfoRequest, _: str = Depends(verify_token)):
    return await claude.item_info(req.name_en)


@router.post("/alternatives")
async def alternatives(req: AlternativesRequest, _: str = Depends(verify_token)):
    return await claude.alternatives(req.name_en, req.reason)


# ── Async endpoints ────────────────────────────────────────


@router.post("/suggest")
async def suggest(req: SuggestRequest, _: str = Depends(verify_token)):
    job_id = await queue.publish_job("suggest", {"sections": req.sections})
    return {"job_id": job_id, "status": "queued"}


@router.post("/inspire")
async def inspire(req: InspireRequest, _: str = Depends(verify_token)):
    job_id = await queue.publish_job(
        "inspire", {"sections": req.sections, "preferences": req.preferences}
    )
    return {"job_id": job_id, "status": "queued"}


@router.get("/jobs/{job_id}")
async def get_job(job_id: str, _: str = Depends(verify_token)):
    raw = await cache.cache_get(f"ai:result:{job_id}")
    if raw is None:
        return {"job_id": job_id, "status": "pending"}
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        return {"job_id": job_id, "status": "done", "result": raw}
    # Worker stores {"status": "failed", "error": "..."} on failure
    if isinstance(parsed, dict) and parsed.get("status") == "failed":
        return {
            "job_id": job_id,
            "status": "failed",
            "error": parsed.get("error", "unknown"),
        }
    return {"job_id": job_id, "status": "done", "result": parsed}
