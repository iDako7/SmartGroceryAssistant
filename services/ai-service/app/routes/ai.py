import json

from fastapi import APIRouter, Depends

from app.middleware.auth import verify_token
from app.models import (
    AlternativesRequest,
    AlternativesResponse,
    ClarifyRequest,
    ClarifyResponse,
    InspireItemRequest,
    InspireItemResponse,
    ItemInfoRequest,
    ItemInfoResponse,
    TranslateRequest,
    TranslateResponse,
)
from app.services import cache, domains
from app.services.llm_client import get_llm_client

router = APIRouter(prefix="/api/v1/ai", tags=["ai"])


# ── Sync endpoints ────────────────────────────────────────


@router.post("/translate", response_model=TranslateResponse)
async def translate(req: TranslateRequest, _: str = Depends(verify_token)) -> TranslateResponse:
    """Translate an item name into the requested language."""
    client = get_llm_client()
    return await domains.translate_item(client, req.name_en, req.target_language, profile=req.profile)


@router.post("/item-info", response_model=ItemInfoResponse)
async def item_info(req: ItemInfoRequest, _: str = Depends(verify_token)) -> ItemInfoResponse:
    """Return concise info for a grocery item."""
    client = get_llm_client()
    return await domains.item_info(client, req.name_en, profile=req.profile)


@router.post("/alternatives", response_model=AlternativesResponse)
async def alternatives(req: AlternativesRequest, _: str = Depends(verify_token)) -> AlternativesResponse:
    """Suggest alternatives for an item based on a reason."""
    client = get_llm_client()
    return await domains.alternatives(client, req.name_en, req.reason, profile=req.profile)


@router.post("/inspire/item", response_model=InspireItemResponse)
async def inspire_item(req: InspireItemRequest, _: str = Depends(verify_token)) -> InspireItemResponse:
    """Generate meal ideas centered on one item."""
    client = get_llm_client()
    return await domains.inspire_item(client, req.name_en, req.other_items, profile=req.profile)


@router.post("/clarify", response_model=ClarifyResponse)
async def clarify(req: ClarifyRequest, _: str = Depends(verify_token)) -> ClarifyResponse:
    """Generate 1-3 clarification questions for better suggestions."""
    client = get_llm_client()
    return await domains.clarify(client, req.sections, profile=req.profile)


# ── Async job status ─────────────────────────────────────


@router.get("/jobs/{job_id}")
async def get_job(job_id: str, _: str = Depends(verify_token)):
    """Return async job status and result payload when available."""
    # Worker writes completed output to this cache key.
    raw = await cache.cache_get(f"ai:result:{job_id}")
    if raw is None:
        return {"job_id": job_id, "status": "pending"}
    try:
        # Current worker behavior stores JSON strings.
        return {"job_id": job_id, "status": "done", "result": json.loads(raw)}
    except json.JSONDecodeError:
        # Backward compatibility for legacy/non-JSON cache values.
        return {"job_id": job_id, "status": "done", "result": raw}
