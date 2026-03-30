"""Tests the translate API route with dependency override for a successful translation,
plus request validation coverage for empty text and missing body (both expect 422)."""

from unittest.mock import AsyncMock
from httpx import ASGITransport, AsyncClient
from app.main import app
from app.dependencies import get_translate_service
from app.schemas.translate import TranslateResponse


async def test_translate_success(auth_headers):
    # Verifies a valid translate request returns 200 with expected bilingual fields.
    mock_service = AsyncMock()
    mock_service.translate.return_value = TranslateResponse(name_en="Chicken breast", name_zh="鸡胸肉")
    app.dependency_overrides[get_translate_service] = lambda: mock_service

    try:
        # Send a real test JWT so the route exercises auth the same way production does.
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post("/api/v1/ai/translate", json={"text": "鸡胸肉"}, headers=auth_headers)
    finally:
        app.dependency_overrides.pop(get_translate_service, None)

    assert response.status_code == 200
    data = response.json()
    assert data["name_en"] == "Chicken breast"
    assert data["name_zh"] == "鸡胸肉"


async def test_translate_empty_text_returns_422(auth_headers):
    # Verifies request validation rejects an empty text payload.
    mock_service = AsyncMock()
    # Stub the translate service so validation tests do not depend on real app settings.
    app.dependency_overrides[get_translate_service] = lambda: mock_service
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post("/api/v1/ai/translate", json={"text": ""}, headers=auth_headers)
    finally:
        app.dependency_overrides.pop(get_translate_service, None)
    assert response.status_code == 422


async def test_translate_missing_body_returns_422(auth_headers):
    # Verifies request validation rejects a missing request body.
    mock_service = AsyncMock()
    # Keep dependency resolution isolated so this test only checks body validation behavior.
    app.dependency_overrides[get_translate_service] = lambda: mock_service
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post("/api/v1/ai/translate", headers=auth_headers)
    finally:
        app.dependency_overrides.pop(get_translate_service, None)
    assert response.status_code == 422


async def test_translate_no_auth_returns_401():
    # Confirms the protected route returns unauthorized when no bearer token is provided.
    mock_service = AsyncMock()
    # Stub the service here too, so the failure comes from missing auth instead of app config.
    app.dependency_overrides[get_translate_service] = lambda: mock_service
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post("/api/v1/ai/translate", json={"text": "chicken"})
    finally:
        app.dependency_overrides.pop(get_translate_service, None)
    assert response.status_code == 401
