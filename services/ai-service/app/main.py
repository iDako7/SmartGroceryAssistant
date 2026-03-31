from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import ai, health
from app.services import cache


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await cache.close_redis()


app = FastAPI(title="SmartGrocery AI Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(ai.router)
