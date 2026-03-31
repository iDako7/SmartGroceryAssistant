import pytest
from app.services.item_info_service import ItemInfoService

pytestmark = pytest.mark.slow


async def test_item_info_returns_all_fields(real_llm_client):
    service = ItemInfoService(real_llm_client)
    result = await service.get_info("Chicken breast")

    assert result.taste, "taste should not be empty"
    assert result.usage, "usage should not be empty"
    assert result.picking, "picking should not be empty"
    assert result.storage, "storage should not be empty"
    assert result.funFact, "funFact should not be empty"


async def test_item_info_bilingual(real_llm_client):
    service = ItemInfoService(real_llm_client)
    result = await service.get_info("Chicken breast", name_zh="鸡胸肉", language_preference="en-zh")

    assert result.taste, "taste should not be empty"
