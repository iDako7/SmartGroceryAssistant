import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from app.llm.client import LLMClient, LLMError


async def test_chat_returns_parsed_json():
    """LLMClient should call the OpenAI SDK and parse the JSON response."""
    # Set up a fake response that mimics the OpenAI SDK's structure
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = '{"name_en": "Chicken breast", "name_zh": "鸡胸肉"}'

    # AsyncMock makes awaitable methods automatically
    mock_openai = AsyncMock()
    mock_openai.chat.completions.create.return_value = mock_response

    # Patch AsyncOpenAI so LLMClient uses our mock instead of the real SDK
    with patch("app.llm.client.AsyncOpenAI", return_value=mock_openai):
        llm = LLMClient(api_key="fake-key")
        result = await llm.chat([{"role": "user", "content": "translate chicken"}])

    assert result == {"name_en": "Chicken breast", "name_zh": "鸡胸肉"}


async def test_chat_uses_json_mode():
    """LLMClient should request JSON output format from the model."""
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = '{"key": "value"}'

    mock_openai = AsyncMock()
    mock_openai.chat.completions.create.return_value = mock_response

    with patch("app.llm.client.AsyncOpenAI", return_value=mock_openai):
        llm = LLMClient(api_key="fake-key")
        await llm.chat([{"role": "user", "content": "test"}])

    # Verify that response_format was set to JSON
    call_kwargs = mock_openai.chat.completions.create.call_args.kwargs
    assert call_kwargs["response_format"] == {"type": "json_object"}


async def test_chat_raises_llm_error_on_api_failure():
    """LLMClient should wrap API errors in our custom LLMError."""
    mock_openai = AsyncMock()
    mock_openai.chat.completions.create.side_effect = Exception("Connection failed")

    with patch("app.llm.client.AsyncOpenAI", return_value=mock_openai):
        llm = LLMClient(api_key="fake-key")
        with pytest.raises(LLMError, match="LLM API call failed"):
            await llm.chat([{"role": "user", "content": "test"}])


async def test_chat_raises_llm_error_on_invalid_json():
    """LLMClient should raise LLMError if the model returns non-JSON."""
    mock_response = MagicMock()
    mock_response.choices = [MagicMock()]
    mock_response.choices[0].message.content = "not valid json"

    mock_openai = AsyncMock()
    mock_openai.chat.completions.create.return_value = mock_response

    with patch("app.llm.client.AsyncOpenAI", return_value=mock_openai):
        llm = LLMClient(api_key="fake-key")
        with pytest.raises(LLMError, match="Failed to parse"):
            await llm.chat([{"role": "user", "content": "test"}])
