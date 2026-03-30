import pytest
from datetime import datetime, timedelta, timezone
from jose import jwt
from app.main import app
from app.dependencies import get_settings
from app.config import Settings


@pytest.fixture(autouse=True)
def override_settings():
    """Provide fake settings for all unit tests. No .env file needed."""
    test_settings = Settings(
        openrouter_api_key="test-key-not-real",
        jwt_secret="test-secret",
    )
    app.dependency_overrides[get_settings] = lambda: test_settings
    yield
    app.dependency_overrides.clear()


@pytest.fixture
def auth_headers():
    """Create a valid JWT token for testing protected endpoints."""
    payload = {
        "sub": "test-user-123",
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
    }
    token = jwt.encode(payload, "test-secret", algorithm="HS256")
    return {"Authorization": f"Bearer {token}"}
