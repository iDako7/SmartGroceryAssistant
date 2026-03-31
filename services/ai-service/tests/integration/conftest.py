import pytest

from app.config import Settings
from app.llm.client import LLMClient


@pytest.fixture
def real_llm_client():
    """Create a real LLM client using app Settings (.env-aware)."""
    try:
        settings = Settings()
    except Exception:
        pytest.skip("Settings not configured -- add required values to .env for integration tests")

    api_key = settings.openrouter_api_key
    if not api_key:
        pytest.skip("OPENROUTER_API_KEY not set -- add to .env for integration tests")
    return LLMClient(
        api_key=api_key,
        base_url=settings.openrouter_base_url,
        model=settings.model_name,
    )
