import pytest

from app.services.translate_service import TranslateService

pytestmark = pytest.mark.slow


async def test_translate_chinese_to_english(real_llm_client):
    service = TranslateService(real_llm_client)
    result = await service.translate("鸡胸肉")

    assert result.name_en, "name_en should not be empty"
    assert "chicken" in result.name_en.lower()
    assert result.name_zh, "name_zh should not be empty"


async def test_translate_english_to_chinese(real_llm_client):
    service = TranslateService(real_llm_client)
    result = await service.translate("Salmon")

    assert result.name_en, "name_en should not be empty"
    assert result.name_zh, "name_zh should not be empty"
