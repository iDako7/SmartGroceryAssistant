from fastapi import APIRouter, Depends
from app.schemas.translate import TranslateRequest, TranslateResponse
from app.dependencies import get_translate_service
from app.services.translate_service import TranslateService
from app.auth import verify_token

router = APIRouter()


@router.post("/translate", response_model=TranslateResponse)
async def translate(
    request: TranslateRequest,
    service: TranslateService = Depends(get_translate_service),
    _user_id: str = Depends(verify_token),
):
    return await service.translate(request.text)
