import json

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.middleware.auth import verify_token
from app.services import cache, claude

router = APIRouter(prefix="/api/v1/ai", tags=["ai"])


# ── Request models ────────────────────────────────────────


class TranslateRequest(BaseModel):
    name_en: str
    target_language: str


class ItemInfoRequest(BaseModel):
    name_en: str


class AlternativesRequest(BaseModel):
    name_en: str
    reason: str = ""


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


@router.get("/jobs/{job_id}")
async def get_job(job_id: str, _: str = Depends(verify_token)):
    raw = await cache.cache_get(f"ai:result:{job_id}")
    if raw is None:
        return {"job_id": job_id, "status": "pending"}
    try:
        return {"job_id": job_id, "status": "done", "result": json.loads(raw)}
    except json.JSONDecodeError:
        return {"job_id": job_id, "status": "done", "result": raw}
