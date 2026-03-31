from functools import lru_cache

from fastapi import Depends

from app.config import Settings
from app.llm.client import LLMClient
from app.services.translate_service import TranslateService
from app.services.item_info_service import ItemInfoService


@lru_cache
def get_settings() -> Settings:
    return Settings()


def get_llm_client(settings: Settings = Depends(get_settings)) -> LLMClient:
    return LLMClient(
        api_key=settings.openrouter_api_key,
        base_url=settings.openrouter_base_url,
        model=settings.model_name,
    )


def get_translate_service(llm_client: LLMClient = Depends(get_llm_client)) -> TranslateService:
    return TranslateService(llm_client)


def get_item_info_service(llm_client: LLMClient = Depends(get_llm_client)) -> ItemInfoService:
    return ItemInfoService(llm_client)
