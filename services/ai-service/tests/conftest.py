"""Shared fixtures for ai-service tests."""

import os
import time
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient
from jose import jwt

os.environ.setdefault("JWT_SECRET", "test-secret")
os.environ.setdefault("SGA_REDIS_PORT", "6379")
os.environ.setdefault("OPENROUTER_API_KEY", "test-key")


def make_token(user_id: str = "user-test-123", secret: str = "test-secret") -> str:
    payload = {"sub": user_id, "exp": int(time.time()) + 3600}
    return jwt.encode(payload, secret, algorithm="HS256")


@pytest.fixture(scope="session")
def client():
    """TestClient with mocked external services (RabbitMQ, Redis)."""
    from app.main import app

    with (
        patch("app.services.queue.connect", new=AsyncMock()),
        patch("app.services.queue.close_queue", new=AsyncMock()),
        patch("app.services.cache.close_redis", new=AsyncMock()),
    ):
        with TestClient(app) as c:
            yield c


@pytest.fixture
def auth_headers() -> dict:
    return {"Authorization": f"Bearer {make_token()}"}


@pytest.fixture
def bad_auth_headers() -> dict:
    return {"Authorization": "Bearer invalid.token.here"}
