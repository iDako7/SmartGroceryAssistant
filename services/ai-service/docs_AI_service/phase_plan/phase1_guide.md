# Phase 1: TDD Implementation Guide

A step-by-step guide to build the AI service foundation by typing every line yourself.
Follow top to bottom. Each step uses **Red-Green-Refactor**: write a failing test, make it pass, then improve.

## What You Will Build

```
GET  /health              → {"status": "ok"}
POST /api/v1/ai/translate  → {"name_en": "...", "name_zh": "..."}
POST /api/v1/ai/item-info  → {"taste", "usage", "picking", "storage", "funFact"}
```

Architecture per endpoint:

```
Route (function) → Service (class) → LLM Client (class) → OpenRouter API
```

## TDD: Red-Green-Refactor

1. **RED** -- Write a test. Run it. Watch it fail.
2. **GREEN** -- Write the minimum code to make it pass.
3. **REFACTOR** -- Improve the code while keeping tests green.

You will always write the test BEFORE the code it tests.

## Prerequisites

- Python 3.12+ installed
- `uv` installed (`curl -LsSf https://astral.sh/uv/install.sh | sh`)
- An OpenRouter API key (free tier works) -- only needed for Step 11
- A terminal open at `services/ai-service/`

## Final Project Structure

```
services/ai-service/
├── pyproject.toml
├── .env.example
├── .gitignore
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── config.py
│   ├── dependencies.py
│   ├── auth.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── health.py
│   │   ├── translate.py
│   │   └── item_info.py
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── health.py
│   │   ├── translate.py
│   │   └── item_info.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── translate_service.py
│   │   └── item_info_service.py
│   └── llm/
│       ├── __init__.py
│       ├── client.py
│       └── prompts.py
└── tests/
    ├── __init__.py
    ├── conftest.py
    ├── test_health.py
    ├── test_schemas.py
    ├── test_llm_client.py
    ├── test_translate_service.py
    ├── test_translate_route.py
    ├── test_item_info_service.py
    ├── test_item_info_route.py
    └── integration/
        ├── __init__.py
        ├── conftest.py
        ├── test_translate_live.py
        └── test_item_info_live.py
```

---

## Step 1: Project Setup

**Goal:** Go from empty directory to a working project with dependencies installed and pytest running.

**Why:** `uv` is a fast Python package manager. `pyproject.toml` is the standard way to define a Python project's dependencies and tools. pytest discovers and runs test files automatically.

### 1.1 Create `pyproject.toml`

This file tells `uv` what packages to install and how to configure tools.

```toml
[project]
name = "ai-service"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.34.0",
    "openai>=1.60.0",
    "pydantic>=2.10.0",
    "pydantic-settings>=2.7.0",
    "python-jose[cryptography]>=3.3.0",
]

[dependency-groups]
dev = [
    "pytest>=8.3.0",
    "pytest-asyncio>=0.25.0",
    "pytest-cov>=6.0.0",
    "httpx>=0.28.0",
    "ruff>=0.9.0",
]

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
markers = [
    "slow: marks tests that call real external APIs (deselect with '-m \"not slow\"')",
]

[tool.ruff]
line-length = 120
target-version = "py312"
```

### 1.2 Install dependencies

```bash
uv sync
```

This creates a virtual environment and installs everything. You should see output listing installed packages.

### 1.3 Create project directories

Run these commands to create all the directories and empty `__init__.py` files upfront:

```bash
mkdir -p app/schemas app/routes app/services app/llm
mkdir -p tests/integration

touch app/__init__.py app/schemas/__init__.py app/routes/__init__.py
touch app/services/__init__.py app/llm/__init__.py
touch tests/__init__.py tests/integration/__init__.py
```

### 1.4 Verify pytest works

Create `tests/test_health.py` with a placeholder:

```python
def test_placeholder():
    assert True
```

Run:

```bash
uv run pytest
```

Expected: `1 passed`. pytest found and ran your test. Delete the placeholder content -- we'll replace it in Step 2.

### Checkpoint

- `uv sync` succeeded
- `uv run pytest` shows 1 passed
- All directories and `__init__.py` files exist

---

## Step 2: Health Endpoint

**Goal:** Build `GET /health` returning `{"status": "ok"}`. Your first full TDD cycle.

**Why:** FastAPI is the web framework. It handles HTTP requests, validates data, and generates API docs automatically. We start with the simplest possible endpoint to learn the pattern.

### RED -- Write the failing test

Replace `tests/test_health.py` with:

```python
from httpx import ASGITransport, AsyncClient
from app.main import app


async def test_health_returns_ok():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
```

> **What's happening:** `httpx.AsyncClient` sends HTTP requests to our FastAPI app without starting a real server. `ASGITransport` connects httpx directly to FastAPI's ASGI interface. The test is `async` because FastAPI endpoints are async -- pytest-asyncio (with `asyncio_mode = "auto"` in pyproject.toml) handles this automatically.

Run:

```bash
uv run pytest
```

Expected: **FAIL** -- `ModuleNotFoundError: No module named 'app.main'`. The test can't import our app because we haven't created it yet. This is RED.

### GREEN -- Make it pass

Create `app/schemas/health.py`:

```python
from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
```

> **What's happening:** Pydantic models define the shape of data. `HealthResponse` says "a health response has a `status` field that must be a string." FastAPI uses this to validate responses and generate API documentation.

Create `app/routes/health.py`:

```python
from fastapi import APIRouter
from app.schemas.health import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(status="ok")
```

> **What's happening:** `APIRouter` groups related endpoints. The `@router.get` decorator registers this function to handle `GET /health`. `response_model=HealthResponse` tells FastAPI to validate and document the response shape.

Create `app/main.py`:

```python
from fastapi import FastAPI
from app.routes import health

app = FastAPI(title="AI Service", version="0.1.0")

app.include_router(health.router)
```

> **What's happening:** `FastAPI()` creates the application. `include_router` mounts the health router so its endpoints are part of the app. When a request comes in, FastAPI routes it to the matching handler.

Run:

```bash
uv run pytest
```

Expected: **1 passed**. The health endpoint works. GREEN.

### Checkpoint

- Tests passing: **1**
- `GET /health` returns `{"status": "ok"}`

---

## Step 3: Translate Schemas

**Goal:** Define the request/response data shapes for the translate endpoint using Pydantic.

**Why:** Schemas define the "contract" between layers. By defining them first, we know exactly what data goes in and comes out before writing any logic. Pydantic validates data automatically -- if someone sends invalid data, FastAPI returns a clear error.

### RED -- Write the failing tests

Create `tests/test_schemas.py`:

```python
import pytest
from pydantic import ValidationError
from app.schemas.translate import TranslateRequest, TranslateResponse


def test_translate_request_valid():
    req = TranslateRequest(text="chicken breast")
    assert req.text == "chicken breast"


def test_translate_request_empty_rejected():
    with pytest.raises(ValidationError):
        TranslateRequest(text="")


def test_translate_response_valid():
    resp = TranslateResponse(name_en="Chicken breast", name_zh="鸡胸肉")
    assert resp.name_en == "Chicken breast"
    assert resp.name_zh == "鸡胸肉"
```

> **What's happening:** These tests verify that valid data is accepted and invalid data (empty text) is rejected. `pytest.raises(ValidationError)` checks that creating a model with bad data raises an error. These are sync tests (no `async`) because Pydantic models are plain Python -- no I/O involved.

Run:

```bash
uv run pytest
```

Expected: **FAIL** -- `ModuleNotFoundError: No module named 'app.schemas.translate'`. RED.

### GREEN -- Create the schema

Create `app/schemas/translate.py`:

```python
from pydantic import BaseModel, Field


class TranslateRequest(BaseModel):
    text: str = Field(min_length=1)


class TranslateResponse(BaseModel):
    name_en: str
    name_zh: str
```

> **What's happening:** `Field(min_length=1)` tells Pydantic to reject empty strings. When FastAPI receives a POST with `{"text": ""}`, it automatically returns a 422 error with details about what's wrong.

Run:

```bash
uv run pytest
```

Expected: **4 passed** (1 health + 3 schema tests). GREEN.

### Checkpoint

- Tests passing: **4**
- Translate data shapes defined and validated

---

## Step 4: LLM Client

**Goal:** Build the `LLMClient` class that talks to OpenRouter using the `openai` Python SDK.

**Why:** We wrap the OpenAI SDK in our own class so we can: (1) configure it once with our API key and model, (2) enforce JSON output mode, (3) handle errors consistently, and (4) easily mock it in tests. This is a class (not a function) because it holds state: the configured SDK client.

### RED -- Write the failing tests

Create `tests/test_llm_client.py`:

```python
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
```

> **What's happening:** We use `unittest.mock` to replace the real OpenAI SDK with a fake. `MagicMock` creates fake objects with attributes we can set (like `choices[0].message.content`). `AsyncMock` makes methods that can be `await`ed. `patch` temporarily swaps a name in a module with our mock.
>
> The mock chain mirrors how the real SDK works:
> `client.chat.completions.create()` → returns a response → `response.choices[0].message.content` → is a JSON string.

Run:

```bash
uv run pytest
```

Expected: **FAIL** -- `ModuleNotFoundError: No module named 'app.llm.client'`. RED.

### GREEN -- Create the LLM client

Create `app/llm/client.py`:

```python
import json

from openai import AsyncOpenAI


class LLMError(Exception):
    """Raised when an LLM API call fails or returns unparseable output."""

    pass


class LLMClient:
    def __init__(
        self,
        api_key: str,
        base_url: str = "https://openrouter.ai/api/v1",
        model: str = "openai/gpt-4o-mini",
    ):
        self.client = AsyncOpenAI(api_key=api_key, base_url=base_url)
        self.model = model

    async def chat(self, messages: list[dict]) -> dict:
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                response_format={"type": "json_object"},
            )
        except Exception as e:
            raise LLMError(f"LLM API call failed: {e}") from e

        try:
            content = response.choices[0].message.content
            return json.loads(content)
        except (json.JSONDecodeError, IndexError, AttributeError) as e:
            raise LLMError(f"Failed to parse LLM response: {e}") from e
```

> **What's happening:**
>
> - `AsyncOpenAI` is the official SDK client. We point it at OpenRouter's URL instead of OpenAI's.
> - `response_format={"type": "json_object"}` tells the model to output valid JSON.
> - We separate API errors from parsing errors so error messages are clear.
> - `LLMError` is our custom exception. Other layers catch this instead of SDK-specific errors.

Run:

```bash
uv run pytest
```

Expected: **8 passed** (1 health + 3 schema + 4 LLM client). GREEN.

### Checkpoint

- Tests passing: **8**
- `LLMClient` wraps OpenRouter with JSON mode and error handling

---

## Step 5: Translate Service

**Goal:** Build `TranslateService` that uses `LLMClient` to translate grocery items, and extract the prompt into a pure function.

**Why:** The service layer sits between the route and the LLM client. It builds the prompt, calls the LLM, and converts the raw dict into a typed Pydantic response. This is a class because it holds a dependency (the LLM client). The prompt builder is a function because it's pure logic with no state.

### RED -- Write the failing tests

Create `tests/test_translate_service.py`:

```python
from unittest.mock import AsyncMock
from app.services.translate_service import TranslateService
from app.schemas.translate import TranslateResponse


async def test_translate_chinese_input():
    mock_llm = AsyncMock()
    mock_llm.chat.return_value = {"name_en": "Chicken breast", "name_zh": "鸡胸肉"}

    service = TranslateService(mock_llm)
    result = await service.translate("鸡胸肉")

    assert isinstance(result, TranslateResponse)
    assert result.name_en == "Chicken breast"
    assert result.name_zh == "鸡胸肉"


async def test_translate_english_input():
    mock_llm = AsyncMock()
    mock_llm.chat.return_value = {"name_en": "Salmon", "name_zh": "三文鱼"}

    service = TranslateService(mock_llm)
    result = await service.translate("Salmon")

    assert result.name_en == "Salmon"
    assert result.name_zh == "三文鱼"


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
```

> **What's happening:** We create a mock LLM client (`AsyncMock`) that returns a predetermined dict. Then we create a real `TranslateService` with that mock. This tests the service logic without any real API calls. The last test verifies that the input text actually appears in the prompt sent to the LLM.

Run:

```bash
uv run pytest
```

Expected: **FAIL** -- `ModuleNotFoundError`. RED.

### GREEN -- Create the service and prompt builder

Create `app/llm/prompts.py`:

```python
def build_translate_prompt(text: str) -> list[dict]:
    return [
        {
            "role": "system",
            "content": "You are a grocery item translator. Translate between English and Chinese Simplified.",
        },
        {
            "role": "user",
            "content": (
                f'Translate this grocery item. If the input is Chinese, provide the English name. '
                f'If the input is English, provide the Chinese Simplified name. '
                f'Always return both languages.\n'
                f'Input: "{text}"\n'
                f'Respond with ONLY valid JSON: {{"name_en": "...", "name_zh": "..."}}'
            ),
        },
    ]
```

> **What's happening:** This is a plain function (not a class) because it's pure logic -- same input always produces the same output, no state needed. The prompt instructs the LLM to detect the language and return both translations as JSON.

Create `app/services/translate_service.py`:

```python
from app.llm.client import LLMClient
from app.llm.prompts import build_translate_prompt
from app.schemas.translate import TranslateResponse


class TranslateService:
    def __init__(self, llm_client: LLMClient):
        self.llm_client = llm_client

    async def translate(self, text: str) -> TranslateResponse:
        messages = build_translate_prompt(text)
        result = await self.llm_client.chat(messages)
        return TranslateResponse(**result)
```

> **What's happening:** The service receives an `LLMClient` in its constructor (dependency injection -- the service doesn't create the client, it receives it). `translate()` builds the prompt, calls the LLM, and converts the raw dict into a typed `TranslateResponse`. The `**result` syntax unpacks the dict into keyword arguments.

Run:

```bash
uv run pytest
```

Expected: **11 passed** (1 + 3 + 4 + 3). GREEN.

### Checkpoint

- Tests passing: **11**
- `TranslateService` translates via LLM with a structured prompt
- Prompt builder is a separate, testable function

---

## Step 6: Config & Environment

**Goal:** Centralize configuration using environment variables.

**Why:** Secrets (API keys) and settings should never be hardcoded. `pydantic-settings` reads them from environment variables or a `.env` file. This step has no TDD cycle -- it's infrastructure setup.

### Create the Settings class

Create `app/config.py`:

```python
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    openrouter_api_key: str
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    model_name: str = "openai/gpt-4o-mini"
    debug: bool = False
```

> **What's happening:** `BaseSettings` automatically reads environment variables matching the field names (case-insensitive). `openrouter_api_key` reads from `OPENROUTER_API_KEY`. Fields with defaults are optional in the env. `extra="ignore"` means extra env vars won't cause errors. We include `jwt_secret` now because we'll need it for authentication in Step 8.

### Create `.env.example`

```
OPENROUTER_API_KEY=your-openrouter-api-key-here
JWT_SECRET=your-jwt-secret-change-this
```

### Create `.gitignore`

```
.env
__pycache__/
*.pyc
.pytest_cache/
.ruff_cache/
.venv/
```

### Verify existing tests still pass

Run:

```bash
uv run pytest
```

Expected: **11 passed**. Creating new files doesn't break existing tests.

### Checkpoint

- Tests passing: **11** (unchanged)
- Config class ready for use by dependencies and auth

---

## Step 7: Translate Route

**Goal:** Wire everything together: create the HTTP route, dependency injection, and test fixtures.

**Why:** FastAPI's `Depends()` system automatically creates and injects dependencies (like services) into route functions. This keeps routes thin -- they just receive a request, call a service, and return the result. We also create `conftest.py` with shared test fixtures.

### Setup -- Create infrastructure files

These files need to exist before we write the route test.

Create `app/dependencies.py`:

```python
from functools import lru_cache

from app.config import Settings
from app.llm.client import LLMClient
from app.services.translate_service import TranslateService


@lru_cache
def get_settings() -> Settings:
    return Settings()


def get_llm_client() -> LLMClient:
    settings = get_settings()
    return LLMClient(
        api_key=settings.openrouter_api_key,
        base_url=settings.openrouter_base_url,
        model=settings.model_name,
    )


def get_translate_service() -> TranslateService:
    return TranslateService(get_llm_client())
```

> **What's happening:** These functions are the "glue" that FastAPI calls to create dependencies. `@lru_cache` on `get_settings` means Settings is only loaded once (not on every request). `get_translate_service()` creates a service with a real LLM client. In tests, we'll override these with mocks.

Create `tests/conftest.py`:

```python
import pytest
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
```

> **What's happening:** `conftest.py` is a special pytest file -- fixtures defined here are available to ALL tests in the directory. `autouse=True` means this fixture runs automatically for every test. `app.dependency_overrides` is FastAPI's way to swap dependencies in tests. After each test, `clear()` resets everything so tests don't affect each other.

Verify existing tests still pass:

```bash
uv run pytest
```

Expected: **11 passed**. The new files don't break anything.

### RED -- Write the route test

Create `tests/test_translate_route.py`:

```python
from unittest.mock import AsyncMock
from httpx import ASGITransport, AsyncClient
from app.main import app
from app.dependencies import get_translate_service
from app.schemas.translate import TranslateResponse


async def test_translate_success():
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
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/ai/translate", json={"text": ""})
    assert response.status_code == 422


async def test_translate_missing_body_returns_422():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/ai/translate")
    assert response.status_code == 422
```

> **What's happening:** We override `get_translate_service` with a mock that returns a predetermined response. This tests the HTTP layer (routing, request parsing, response serialization) without calling any real service or LLM. The 422 tests verify that FastAPI's automatic validation works -- empty text and missing body are both rejected.

Run:

```bash
uv run pytest
```

Expected: **FAIL** -- The translate tests fail with `404 Not Found` because the route doesn't exist yet. Existing tests still pass. RED.

### GREEN -- Create the route and wire it up

Create `app/routes/translate.py`:

```python
from fastapi import APIRouter, Depends
from app.schemas.translate import TranslateRequest, TranslateResponse
from app.dependencies import get_translate_service
from app.services.translate_service import TranslateService

router = APIRouter()


@router.post("/translate", response_model=TranslateResponse)
async def translate(
    request: TranslateRequest,
    service: TranslateService = Depends(get_translate_service),
):
    return await service.translate(request.text)
```

> **What's happening:** `Depends(get_translate_service)` tells FastAPI to call `get_translate_service()` and pass the result as the `service` parameter. The route function is thin -- it just extracts `request.text`, passes it to the service, and returns the result. FastAPI handles JSON serialization automatically.

Update `app/main.py` -- replace the entire file:

```python
from fastapi import FastAPI
from app.routes import health, translate

app = FastAPI(title="AI Service", version="0.1.0")

app.include_router(health.router)
app.include_router(translate.router, prefix="/api/v1/ai")
```

> **What's happening:** `prefix="/api/v1/ai"` means the translate router's `/translate` endpoint becomes `/api/v1/ai/translate`. This follows the API versioning convention from the project architecture.

Run:

```bash
uv run pytest
```

Expected: **14 passed** (11 existing + 3 new route tests). GREEN.

### Checkpoint

- Tests passing: **14**
- `POST /api/v1/ai/translate` works end-to-end (with mocked LLM)
- Dependency injection and test overrides are set up

---

## Step 8: JWT Authentication

**Goal:** Add JWT token verification to protect endpoints. Health stays public.

**Why:** Defense in depth -- the API Gateway already verifies tokens, but each service also verifies locally. Our Go services (User Service and List Service) already follow this pattern -- see `services/user-service/internal/middleware/auth.go` and `services/list-service/internal/middleware/auth.go` for reference. We're replicating the same approach in Python/FastAPI, not inventing something new.

> **Note:** We skip the full RED/GREEN TDD cycle here. JWT edge cases (expired tokens, wrong secrets, missing claims) are already thoroughly tested in the Gateway and Go services. We only need to confirm the middleware is wired up correctly in the AI service.

### Implementation

Create `app/auth.py`:

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt

from app.config import Settings
from app.dependencies import get_settings

security = HTTPBearer()


async def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    settings: Settings = Depends(get_settings),
) -> str:
    """Verify JWT token and return user_id. Raises 401 on failure."""
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing sub",
            )
        return user_id
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
```

> **What's happening:** `HTTPBearer()` extracts the token from the `Authorization: Bearer <token>` header. If no header is present, FastAPI returns 403 automatically. `jwt.decode` verifies the signature and expiration -- same `JWT_SECRET` and HS256 algorithm used by all services. `Depends(get_settings)` injects our settings so we use the correct secret.

Update `app/routes/translate.py` -- replace the entire file:

```python
from fastapi import APIRouter, Depends
from app.schemas.translate import TranslateRequest, TranslateResponse
from app.dependencies import get_translate_service
from app.services.translate_service import TranslateService
from app.auth import verify_token

router = APIRouter()


@router.post("/translate", response_model=TranslateResponse)
async def translate(
    request: TranslateRequest,
    service: TranslateService = Depends(get_translate_service),
    _user_id: str = Depends(verify_token),
):
    return await service.translate(request.text)
```

> **What changed:** Added `_user_id: str = Depends(verify_token)`. The underscore prefix means we don't use the value yet (but FastAPI still runs the dependency). Now every request to `/translate` must include a valid JWT.

### Test fixtures for auth

Update `tests/conftest.py` -- replace the entire file (adding the `auth_headers` fixture):

```python
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
```

> **Key idea:** `auth_headers` generates a real JWT signed with `"test-secret"` (matching `override_settings`). Every protected test just passes `auth_headers` -- one line, no manual token crafting. The auth middleware runs fully end-to-end in tests.

Update `tests/test_translate_route.py` -- replace the entire file (adding auth headers):

```python
from unittest.mock import AsyncMock
from httpx import ASGITransport, AsyncClient
from app.main import app
from app.dependencies import get_translate_service
from app.schemas.translate import TranslateResponse


async def test_translate_success(auth_headers):
    mock_service = AsyncMock()
    mock_service.translate.return_value = TranslateResponse(name_en="Chicken breast", name_zh="鸡胸肉")
    app.dependency_overrides[get_translate_service] = lambda: mock_service

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/ai/translate", json={"text": "鸡胸肉"}, headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert data["name_en"] == "Chicken breast"
    assert data["name_zh"] == "鸡胸肉"


async def test_translate_empty_text_returns_422(auth_headers):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/ai/translate", json={"text": ""}, headers=auth_headers)
    assert response.status_code == 422


async def test_translate_missing_body_returns_422(auth_headers):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/ai/translate", headers=auth_headers)
    assert response.status_code == 422


async def test_translate_no_auth_returns_403():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/ai/translate", json={"text": "chicken"})
    assert response.status_code == 403
```

> **What changed:** Every test that expects a 200 now passes `auth_headers`. A new test (`test_translate_no_auth_returns_403`) confirms the middleware is wired up -- requests without a token get rejected. We don't need to separately test expired tokens, wrong secrets, etc. -- those are `python-jose` internals already covered by the Gateway and Go service tests.

Run:

```bash
uv run pytest
```

Expected: **15 passed** (1 health + 3 schema + 4 LLM + 3 service + 4 route). GREEN.

### Local dev convenience

<!-- ! important notice, how to test auth -->

For local development and manual testing (curl, Postman), set `JWT_SECRET=test-secret` in your `.env` file (matching the test fixture). Then generate a long-lived test token:

```bash
uv run python -c "
from jose import jwt
from datetime import datetime, timedelta, timezone
token = jwt.encode({'sub': 'dev-user-1', 'exp': datetime.now(timezone.utc) + timedelta(days=30)}, 'test-secret', algorithm='HS256')
print(token)
"
```

Use this token in requests:

```bash
curl -X POST http://localhost:4003/api/v1/ai/translate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <paste-token-here>" \
  -d '{"text": "chicken breast"}'
```

> **Why this works:** The auth middleware runs the same code path as production -- it verifies the JWT signature, checks expiration, and extracts the user ID. The only difference is the secret. In production, `JWT_SECRET` is set to the shared secret from User Service. In local dev and tests, it's `test-secret`.

### Checkpoint

- Tests passing: **15**
- All protected endpoints require a valid JWT
- Health endpoint remains public
- No separate auth test file -- auth is verified through route tests

---

## Step 9: Item Info Schemas

**Goal:** Define request/response schemas for the item-info endpoint.

**Why:** Same pattern as Step 3. We define the data shapes first, then build the logic around them.

### RED -- Write the failing tests

Add the following tests to the **end** of `tests/test_schemas.py`:

```python
from app.schemas.item_info import ItemInfoRequest, ItemInfoResponse


# --- Item Info ---


def test_item_info_request_minimal():
    req = ItemInfoRequest(name_en="Ranch Dressing")
    assert req.name_en == "Ranch Dressing"
    assert req.name_zh is None
    assert req.language_preference == "en"


def test_item_info_request_full():
    req = ItemInfoRequest(name_en="Ranch Dressing", name_zh="牧场沙拉酱", language_preference="en-zh")
    assert req.language_preference == "en-zh"


def test_item_info_request_invalid_language():
    with pytest.raises(ValidationError):
        ItemInfoRequest(name_en="Ranch", language_preference="fr")


def test_item_info_response_valid():
    resp = ItemInfoResponse(
        taste="Creamy and tangy",
        usage="Great as a dip or salad dressing",
        picking="Check expiration date",
        storage="Refrigerate after opening",
        funFact="Originally created at a ranch in California",
    )
    assert resp.taste == "Creamy and tangy"
```

Run:

```bash
uv run pytest tests/test_schemas.py
```

Expected: **FAIL** -- `ModuleNotFoundError: No module named 'app.schemas.item_info'`. RED.

### GREEN -- Create the schema

Create `app/schemas/item_info.py`:

```python
from typing import Literal
from pydantic import BaseModel, Field


class ItemInfoRequest(BaseModel):
    name_en: str = Field(min_length=1)
    name_zh: str | None = None
    language_preference: Literal["en", "zh", "en-zh"] = "en"


class ItemInfoResponse(BaseModel):
    taste: str
    usage: str
    picking: str
    storage: str
    funFact: str
```

> **What's happening:** `Literal["en", "zh", "en-zh"]` restricts the field to exactly those three values. `str | None = None` makes `name_zh` optional (can be omitted or null). `funFact` uses camelCase to match the frontend's expected JSON keys.

Run:

```bash
uv run pytest
```

Expected: **19 passed** (15 + 4 new schema tests). GREEN.

### Checkpoint

- Tests passing: **19**
- Item info data shapes defined

---

## Step 10: Item Info Service & Route

**Goal:** Build the full item-info feature: service, prompt, route, and tests. This step combines what took three steps for translate (Steps 5, 7, 8) into one because the pattern is now familiar.

### RED -- Write all the failing tests

Create `tests/test_item_info_service.py`:

```python
from unittest.mock import AsyncMock
from app.services.item_info_service import ItemInfoService
from app.schemas.item_info import ItemInfoResponse


async def test_get_info_returns_response():
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
```

Create `tests/test_item_info_route.py`:

```python
from unittest.mock import AsyncMock
from httpx import ASGITransport, AsyncClient
from app.main import app
from app.dependencies import get_item_info_service
from app.schemas.item_info import ItemInfoResponse


async def test_item_info_success(auth_headers):
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
    mock_service.get_info.assert_called_once_with(
        name_en="Ranch", name_zh="牧场酱", language_preference="en-zh"
    )


async def test_item_info_no_auth_returns_403():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/ai/item-info", json={"name_en": "Chicken"})
    assert response.status_code == 403
```

Run:

```bash
uv run pytest tests/test_item_info_service.py tests/test_item_info_route.py
```

Expected: **FAIL** -- `ModuleNotFoundError`. RED.

### GREEN -- Create everything

Add to `app/llm/prompts.py` -- append at the end of the file:

```python


def build_item_info_prompt(
    name_en: str, name_zh: str | None = None, language_preference: str = "en"
) -> list[dict]:
    item_name = f"{name_en} / {name_zh}" if name_zh else name_en

    lang_instruction = ""
    if language_preference == "en-zh":
        lang_instruction = " Write each field in English followed by Chinese translation."
    elif language_preference == "zh":
        lang_instruction = " Write each field in Chinese."

    return [
        {
            "role": "system",
            "content": "You are a grocery expert helping someone understand food products.",
        },
        {
            "role": "user",
            "content": (
                f'Provide information about this grocery item: "{item_name}".{lang_instruction}\n'
                f"Respond with ONLY valid JSON:\n"
                f'{{"taste": "1-2 sentences about flavor/texture", '
                f'"usage": "1-2 sentences about common uses", '
                f'"picking": "1-2 sentences about how to pick good ones", '
                f'"storage": "1-2 sentences about storage tips", '
                f'"funFact": "1 fun/interesting fact"}}'
            ),
        },
    ]
```

Create `app/services/item_info_service.py`:

```python
from app.llm.client import LLMClient
from app.llm.prompts import build_item_info_prompt
from app.schemas.item_info import ItemInfoResponse


class ItemInfoService:
    def __init__(self, llm_client: LLMClient):
        self.llm_client = llm_client

    async def get_info(
        self,
        name_en: str,
        name_zh: str | None = None,
        language_preference: str = "en",
    ) -> ItemInfoResponse:
        messages = build_item_info_prompt(name_en, name_zh, language_preference)
        result = await self.llm_client.chat(messages)
        return ItemInfoResponse(**result)
```

Update `app/dependencies.py` -- replace the entire file:

```python
from functools import lru_cache

from app.config import Settings
from app.llm.client import LLMClient
from app.services.translate_service import TranslateService
from app.services.item_info_service import ItemInfoService


@lru_cache
def get_settings() -> Settings:
    return Settings()


def get_llm_client() -> LLMClient:
    settings = get_settings()
    return LLMClient(
        api_key=settings.openrouter_api_key,
        base_url=settings.openrouter_base_url,
        model=settings.model_name,
    )


def get_translate_service() -> TranslateService:
    return TranslateService(get_llm_client())


def get_item_info_service() -> ItemInfoService:
    return ItemInfoService(get_llm_client())
```

Create `app/routes/item_info.py`:

```python
from fastapi import APIRouter, Depends
from app.schemas.item_info import ItemInfoRequest, ItemInfoResponse
from app.dependencies import get_item_info_service
from app.services.item_info_service import ItemInfoService
from app.auth import verify_token

router = APIRouter()


@router.post("/item-info", response_model=ItemInfoResponse)
async def item_info(
    request: ItemInfoRequest,
    service: ItemInfoService = Depends(get_item_info_service),
    _user_id: str = Depends(verify_token),
):
    return await service.get_info(
        name_en=request.name_en,
        name_zh=request.name_zh,
        language_preference=request.language_preference,
    )
```

Update `app/main.py` -- replace the entire file:

```python
from fastapi import FastAPI
from app.routes import health, translate, item_info

app = FastAPI(title="AI Service", version="0.1.0")

app.include_router(health.router)
app.include_router(translate.router, prefix="/api/v1/ai")
app.include_router(item_info.router, prefix="/api/v1/ai")
```

Run:

```bash
uv run pytest
```

Expected: **25 passed** (19 + 3 service + 3 route). GREEN.

### Checkpoint

- Tests passing: **25**
- Both endpoints fully working with mocked LLM
- All unit tests pass with no .env file needed

---

## Step 11: Integration Tests

**Goal:** Write tests that call the real OpenRouter API to verify prompts actually work.

**Why:** Unit tests prove our code logic is correct, but they can't verify that our prompts produce good results from a real LLM. Integration tests are marked `@pytest.mark.slow` so they're skipped by default -- they're slow, cost money, and can be flaky. Run them only when you want to validate prompt quality.

### Setup your `.env` file

Copy `.env.example` to `.env` and add your real OpenRouter API key:

```bash
cp .env.example .env
```

Edit `.env`:

```
OPENROUTER_API_KEY=sk-or-v1-your-real-key-here
JWT_SECRET=test-secret
```

### Write integration test fixtures

Create `tests/integration/conftest.py`:

```python
import os
import pytest
from app.llm.client import LLMClient


@pytest.fixture
def real_llm_client():
    """Create a real LLM client. Skips if no API key is set."""
    api_key = os.getenv("OPENROUTER_API_KEY", "")
    if not api_key:
        pytest.skip("OPENROUTER_API_KEY not set -- add to .env for integration tests")
    return LLMClient(api_key=api_key)
```

### Write integration tests

Create `tests/integration/test_translate_live.py`:

```python
import pytest
from app.services.translate_service import TranslateService

pytestmark = pytest.mark.slow


async def test_translate_chinese_to_english(real_llm_client):
    service = TranslateService(real_llm_client)
    result = await service.translate("鸡胸肉")

    assert result.name_en, "name_en should not be empty"
    assert "chicken" in result.name_en.lower()
    assert result.name_zh, "name_zh should not be empty"


async def test_translate_english_to_chinese(real_llm_client):
    service = TranslateService(real_llm_client)
    result = await service.translate("Salmon")

    assert result.name_en, "name_en should not be empty"
    assert result.name_zh, "name_zh should not be empty"
```

> **What's happening:** These tests call the real OpenRouter API. Assertions are fuzzy ("chicken" in the output, not exact string matching) because LLM output is non-deterministic. `pytestmark = pytest.mark.slow` marks ALL tests in the file as slow.

Create `tests/integration/test_item_info_live.py`:

```python
import pytest
from app.services.item_info_service import ItemInfoService

pytestmark = pytest.mark.slow


async def test_item_info_returns_all_fields(real_llm_client):
    service = ItemInfoService(real_llm_client)
    result = await service.get_info("Chicken breast")

    assert result.taste, "taste should not be empty"
    assert result.usage, "usage should not be empty"
    assert result.picking, "picking should not be empty"
    assert result.storage, "storage should not be empty"
    assert result.funFact, "funFact should not be empty"


async def test_item_info_bilingual(real_llm_client):
    service = ItemInfoService(real_llm_client)
    result = await service.get_info("Chicken breast", name_zh="鸡胸肉", language_preference="en-zh")

    assert result.taste, "taste should not be empty"
```

### Run the tests

Unit tests only (fast, no API key needed):

```bash
uv run pytest -m "not slow"
```

Expected: **25 passed**, 4 deselected.

Integration tests only (needs API key in `.env`):

```bash
uv run pytest -m slow
```

Expected: **4 passed** (may take 5-10 seconds for LLM responses).

All tests:

```bash
uv run pytest
```

Expected: **29 passed**.

### Checkpoint

- Tests passing: **29** (25 unit + 4 integration)
- Prompts produce correct results from real LLM

---

## Step 12: Polish & Verify

**Goal:** Lint, format, check coverage, and manually test the running server.

### Lint and format

```bash
uv run ruff check .
uv run ruff format --check .
```

If ruff reports issues, fix them:

```bash
uv run ruff check . --fix
uv run ruff format .
```

### Check test coverage

```bash
uv run pytest -m "not slow" --cov=app --cov-report=term-missing
```

You should see 80%+ coverage. Lines not covered are mostly error paths and the `if __name__` block.

### Start the server

Create your `.env` if you haven't already (see Step 11), then:

```bash
uv run uvicorn app.main:app --reload --port 4003
```

### Manual testing with curl

Health (no auth needed):

```bash
curl http://localhost:4003/health
```

Expected: `{"status":"ok"}`

Generate a test JWT (run in a separate terminal):

```bash
uv run python -c "
from jose import jwt
from datetime import datetime, timedelta, timezone
token = jwt.encode(
    {'sub': 'test-user', 'exp': datetime.now(timezone.utc) + timedelta(hours=1)},
    'test-secret',
    algorithm='HS256'
)
print(token)
"
```

Copy the token and use it (replace `YOUR_TOKEN`):

```bash
curl -X POST http://localhost:4003/api/v1/ai/translate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text": "鸡胸肉"}'
```

Expected: `{"name_en":"Chicken Breast","name_zh":"鸡胸肉"}` (exact wording may vary).

```bash
curl -X POST http://localhost:4003/api/v1/ai/item-info \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name_en": "Salmon", "language_preference": "en-zh"}'
```

Expected: JSON with `taste`, `usage`, `picking`, `storage`, `funFact` fields.

### Final verification checklist

- [ ] `uv run pytest -m "not slow"` -- 31 unit tests pass
- [ ] `uv run pytest -m slow` -- 4 integration tests pass
- [ ] `uv run pytest --cov=app` -- 80%+ coverage
- [ ] `uv run ruff check . && uv run ruff format --check .` -- clean
- [ ] Server starts on port 4003
- [ ] `GET /health` returns 200
- [ ] `POST /translate` and `/item-info` work with JWT
- [ ] Requests without JWT return 403

### Phase 1 complete

You've built a working AI service with:

- 3 endpoints (health, translate, item-info)
- JWT authentication
- Structured JSON responses from OpenRouter LLM
- 35 tests (31 unit + 4 integration)
- Clean architecture: Route -> Service -> LLM Client

**Next:** Phase 2 adds the alternatives, per-item inspire, and clarify endpoints.
