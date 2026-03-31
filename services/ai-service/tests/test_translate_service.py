from unittest.mock import AsyncMock
from app.services.translate_service import TranslateService
from app.schemas.translate import TranslateResponse


# Service-layer unit tests: LLM is mocked, so these tests verify TranslateService logic only (not real model/API behavior).
# Verifies Chinese input path by returning mocked LLM JSON and asserting TranslateResponse mapping.
async def test_translate_chinese_input():
    mock_llm = AsyncMock()
    mock_llm.chat.return_value = {"name_en": "Chicken breast", "name_zh": "鸡胸肉"}

    service = TranslateService(mock_llm)
    result = await service.translate("鸡胸肉")

    assert isinstance(result, TranslateResponse)
    assert result.name_en == "Chicken breast"
    assert result.name_zh == "鸡胸肉"


# Verifies English input path by mocking LLM output and checking response fields are mapped correctly.
async def test_translate_english_input():
    mock_llm = AsyncMock()
    mock_llm.chat.return_value = {"name_en": "Salmon", "name_zh": "三文鱼"}

    service = TranslateService(mock_llm)
    result = await service.translate("Salmon")

    assert result.name_en == "Salmon"
    assert result.name_zh == "三文鱼"


# Verifies prompt construction by inspecting mocked LLM call args and asserting input text is included.
async def test_translate_passes_text_in_prompt():
    mock_llm = AsyncMock()
    mock_llm.chat.return_value = {"name_en": "Milk", "name_zh": "牛奶"}

    service = TranslateService(mock_llm)
    await service.translate("Milk")

    # Verify the LLM was called and "Milk" appears in the prompt
    mock_llm.chat.assert_called_once()
    messages = mock_llm.chat.call_args[0][0]
    user_msg = next(m["content"] for m in messages if m["role"] == "user")
    assert "Milk" in user_msg
