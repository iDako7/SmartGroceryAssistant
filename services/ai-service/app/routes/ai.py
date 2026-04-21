import uuid

from fastapi import APIRouter, Depends, HTTPException

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
    SuggestRequest,
    TranslateRequest,
    TranslateResponse,
)
from app.services import domains, job_store
from app.services.llm_client import get_llm_client
from app.worker.tasks import suggest_task

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


# ── Async suggest ────────────────────────────────────────


@router.post("/suggest", status_code=202)
async def suggest_endpoint(req: SuggestRequest, _: str = Depends(verify_token)):
    """Submit grocery list for async AI analysis. Returns job_id for polling."""
    job_id = str(uuid.uuid4())

    await job_store.set_job_status(job_id, "pending")

    suggest_task.delay(
        job_id=job_id,
        sections=req.sections,
        answers=[a.model_dump() for a in req.answers],
        profile=req.profile.model_dump() if req.profile else None,
    )

    return {"job_id": job_id, "status": "pending"}


# ── Async job status ─────────────────────────────────────


@router.get("/jobs/{job_id}")
async def get_job(job_id: str, _: str = Depends(verify_token)):
    """Return async job status and result payload when available."""
    status_data = await job_store.get_job_status(job_id)
    if status_data is None:
        raise HTTPException(status_code=404, detail="Job not found")

    status = status_data["status"]

    if status == "done":
        result = await job_store.get_job_result(job_id)
        if result is None:
            return {"job_id": job_id, "status": "processing"}
        return {"job_id": job_id, "status": "done", "result": result}

    if status == "failed":
        return {"job_id": job_id, "status": "failed", "error": status_data.get("error", "")}

    return {"job_id": job_id, "status": status}
