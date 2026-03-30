from functools import lru_cache

from app.config import Settings
from app.llm.client import LLMClient
from app.services.translate_service import TranslateService


@lru_cache
def get_settings() -> Settings:
    return Settings()


def get_llm_client() -> LLMClient:
    settings = get_settings()
    return LLMClient(
        api_key=settings.openrouter_api_key,
        base_url=settings.openrouter_base_url,
        model=settings.model_name,
    )


def get_translate_service() -> TranslateService:
    return TranslateService(get_llm_client())
