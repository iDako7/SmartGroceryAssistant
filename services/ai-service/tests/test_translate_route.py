"""Tests the translate API route with dependency override for a successful translation,
plus request validation coverage for empty text and missing body (both expect 422)."""

from unittest.mock import AsyncMock
from httpx import ASGITransport, AsyncClient
from app.main import app
from app.dependencies import get_translate_service
from app.schemas.translate import TranslateResponse


async def test_translate_success():
    # Verifies a valid translate request returns 200 with expected bilingual fields.
    mock_service = AsyncMock()
    mock_service.translate.return_value = TranslateResponse(name_en="Chicken breast", name_zh="鸡胸肉")
    app.dependency_overrides[get_translate_service] = lambda: mock_service

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/ai/translate", json={"text": "鸡胸肉"})

    assert response.status_code == 200
    data = response.json()
    assert data["name_en"] == "Chicken breast"
    assert data["name_zh"] == "鸡胸肉"


async def test_translate_empty_text_returns_422():
    # Verifies request validation rejects an empty text payload.
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/ai/translate", json={"text": ""})
    assert response.status_code == 422


async def test_translate_missing_body_returns_422():
    # Verifies request validation rejects a missing request body.
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/ai/translate")
    assert response.status_code == 422
