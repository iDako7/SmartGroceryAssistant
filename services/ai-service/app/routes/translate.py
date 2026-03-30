from fastapi import APIRouter, Depends
from app.schemas.translate import TranslateRequest, TranslateResponse
from app.dependencies import get_translate_service
from app.services.translate_service import TranslateService

router = APIRouter()


@router.post("/translate", response_model=TranslateResponse)
async def translate(
    request: TranslateRequest,
    service: TranslateService = Depends(get_translate_service),
):
    """Translate user input text and return both English and Chinese names."""
    # Handles translate requests and delegates language conversion to the service layer.
    return await service.translate(request.text)
