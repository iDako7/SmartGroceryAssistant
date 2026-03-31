from unittest.mock import AsyncMock
from app.services.item_info_service import ItemInfoService
from app.schemas.item_info import ItemInfoResponse


# Tests the item-info service by mocking the LLM and checking output/prompt behavior.
async def test_get_info_returns_response():
    # Ensures mocked LLM JSON is converted into the response schema.
    mock_llm = AsyncMock()
    mock_llm.chat.return_value = {
        "taste": "Mild and tender",
        "usage": "Grill, bake, or stir-fry",
        "picking": "Look for pink color",
        "storage": "Refrigerate up to 3 days",
        "funFact": "Most popular protein worldwide",
    }

    service = ItemInfoService(mock_llm)
    result = await service.get_info("Chicken breast")

    assert isinstance(result, ItemInfoResponse)
    assert result.taste == "Mild and tender"


async def test_get_info_bilingual_prompt():
    # Ensures bilingual mode adds both English and Chinese instructions to the prompt.
    mock_llm = AsyncMock()
    mock_llm.chat.return_value = {
        "taste": "Mild 温和",
        "usage": "Grill 烧烤",
        "picking": "Pink 粉色",
        "storage": "Fridge 冰箱",
        "funFact": "Popular 受欢迎",
    }

    service = ItemInfoService(mock_llm)
    await service.get_info("Chicken breast", name_zh="鸡胸肉", language_preference="en-zh")

    messages = mock_llm.chat.call_args[0][0]
    user_msg = next(m["content"] for m in messages if m["role"] == "user")
    assert "English" in user_msg and "Chinese" in user_msg


async def test_get_info_includes_chinese_name():
    # Ensures the provided Chinese item name is included in the prompt sent to the LLM.
    mock_llm = AsyncMock()
    mock_llm.chat.return_value = {
        "taste": "t",
        "usage": "u",
        "picking": "p",
        "storage": "s",
        "funFact": "f",
    }

    service = ItemInfoService(mock_llm)
    await service.get_info("Chicken breast", name_zh="鸡胸肉")

    messages = mock_llm.chat.call_args[0][0]
    user_msg = next(m["content"] for m in messages if m["role"] == "user")
    assert "鸡胸肉" in user_msg
