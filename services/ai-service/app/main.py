from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes import ai, health
from app.services import cache, queue


@asynccontextmanager
async def lifespan(app: FastAPI):
    await queue.connect()
    yield
    await cache.close_redis()
    await queue.close_queue()


app = FastAPI(title="SmartGrocery AI Service", lifespan=lifespan)

# Only enable CORS when explicitly configured (e.g. local dev).
# In production the API gateway handles CORS.
if settings.cors_origin:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.cors_origin],
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
        allow_headers=["Authorization", "Content-Type"],
    )

app.include_router(health.router)
app.include_router(ai.router)
