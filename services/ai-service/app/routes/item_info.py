from fastapi import APIRouter, Depends
from app.schemas.item_info import ItemInfoRequest, ItemInfoResponse
from app.dependencies import get_item_info_service
from app.services.item_info_service import ItemInfoService
from app.auth import verify_token

router = APIRouter()


@router.post("/item-info", response_model=ItemInfoResponse)
async def item_info(
    request: ItemInfoRequest,
    _user_id: str = Depends(verify_token),
    service: ItemInfoService = Depends(get_item_info_service),
):
    return await service.get_info(
        name_en=request.name_en,
        name_zh=request.name_zh,
        language_preference=request.language_preference,
    )
