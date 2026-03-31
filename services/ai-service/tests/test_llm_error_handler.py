"""Tests that LLMError from any route is caught and returned as 502."""

from unittest.mock import AsyncMock

from httpx import ASGITransport, AsyncClient

from app.dependencies import get_translate_service
from app.llm.client import LLMError
from app.main import app


async def test_llm_error_returns_502(auth_headers):
    """When a service raises LLMError, the API returns 502 with detail."""
    mock_service = AsyncMock()
    mock_service.translate.side_effect = LLMError("LLM API call failed: connection timeout")
    app.dependency_overrides[get_translate_service] = lambda: mock_service

    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                "/api/v1/ai/translate",
                json={"text": "chicken"},
                headers=auth_headers,
            )
    finally:
        app.dependency_overrides.pop(get_translate_service, None)

    assert response.status_code == 502
    assert "LLM API call failed" in response.json()["detail"]
