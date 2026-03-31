from unittest.mock import AsyncMock
from httpx import ASGITransport, AsyncClient
from app.main import app
from app.dependencies import get_item_info_service
from app.schemas.item_info import ItemInfoResponse


async def test_item_info_success(auth_headers):
    """Returns the item-info payload from the service for an authenticated request."""
    mock_service = AsyncMock()
    mock_service.get_info.return_value = ItemInfoResponse(
        taste="Mild and tender",
        usage="Grill, bake, or stir-fry",
        picking="Look for pink color",
        storage="Refrigerate up to 3 days",
        funFact="Most popular protein worldwide",
    )
    app.dependency_overrides[get_item_info_service] = lambda: mock_service

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/v1/ai/item-info",
            json={"name_en": "Chicken breast"},
            headers=auth_headers,
        )

    assert response.status_code == 200
    data = response.json()
    assert data["taste"] == "Mild and tender"
    assert data["funFact"] == "Most popular protein worldwide"


async def test_item_info_passes_all_fields(auth_headers):
    """Forwards all request fields unchanged to the item-info service."""
    mock_service = AsyncMock()
    mock_service.get_info.return_value = ItemInfoResponse(
        taste="Creamy",
        usage="Dip",
        picking="Check date",
        storage="Fridge",
        funFact="Fun",
    )
    app.dependency_overrides[get_item_info_service] = lambda: mock_service

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/v1/ai/item-info",
            json={"name_en": "Ranch", "name_zh": "牧场酱", "language_preference": "en-zh"},
            headers=auth_headers,
        )

    assert response.status_code == 200
    mock_service.get_info.assert_called_once_with(name_en="Ranch", name_zh="牧场酱", language_preference="en-zh")


async def test_item_info_no_auth_returns_401():
    """Rejects unauthenticated requests to the protected item-info endpoint."""
    mock_service = AsyncMock()
    app.dependency_overrides[get_item_info_service] = lambda: mock_service
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post("/api/v1/ai/item-info", json={"name_en": "Chicken"})
    finally:
        app.dependency_overrides.pop(get_item_info_service, None)
    assert response.status_code == 401
