from fastapi import FastAPI
from app.routes import health, translate

app = FastAPI(title="AI Service", version="0.1.0")

app.include_router(health.router)
app.include_router(translate.router, prefix="/api/v1/ai")
