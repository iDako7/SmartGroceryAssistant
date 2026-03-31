# Previous AI Service Configuration Reference

Saved before Option B cleanup (2026-03-28). Use as reference when setting up Phase 1 with `uv init`.

## pyproject.toml

```toml
[project]
name = "ai-service"
version = "0.1.0"
requires-python = ">=3.12,<3.14"
dependencies = [
    "fastapi==0.115.0",
    "uvicorn[standard]==0.30.6",
    "openai>=1.50.0",
    "redis>=5.1.1",              # Phase 3 — not needed for Phase 1
    "python-jose[cryptography]==3.3.0",
    "pydantic-settings==2.5.2",
    "python-dotenv==1.0.1",
]

[dependency-groups]
dev = [
    "pytest>=8.3.0",
    "pytest-asyncio>=0.24.0",
    "httpx>=0.27.0",
    "pytest-mock>=3.14.0",
    "ruff>=0.11.0",
]

[tool.ruff]
target-version = "py312"
line-length = 120

[tool.ruff.lint]
select = ["E", "F", "I", "UP", "B"]
# E=pycodestyle errors, F=pyflakes, I=isort, UP=pyupgrade, B=flake8-bugbear
```

## Dockerfile

```dockerfile
FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim AS builder
WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

FROM python:3.12-slim
WORKDIR /app
COPY . .
COPY --from=builder /app/.venv .venv

ENV PATH="/app/.venv/bin:$PATH"
EXPOSE 4003
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "4003"]
```

## Phase 1 deps (what to `uv add`)

```bash
# Runtime
uv add fastapi "uvicorn[standard]" openai "pyjwt[crypto]" pydantic-settings python-dotenv

# Dev
uv add --dev pytest pytest-asyncio httpx pytest-mock ruff
```

Note: previous code used `python-jose[cryptography]` for JWT. `pyjwt[crypto]` is a lighter alternative — either works. Check which one you prefer.

## Ruff config (add to pyproject.toml after `uv init`)

```toml
[tool.ruff]
target-version = "py312"
line-length = 120

[tool.ruff.lint]
select = ["E", "F", "I", "UP", "B"]
```
