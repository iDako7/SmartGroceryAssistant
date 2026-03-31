from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.llm.client import LLMError
from app.routes import health, translate, item_info

app = FastAPI(title="AI Service", version="0.1.0")


@app.exception_handler(LLMError)
async def llm_error_handler(request: Request, exc: LLMError):
    return JSONResponse(status_code=502, content={"detail": str(exc)})


app.include_router(health.router)
app.include_router(translate.router, prefix="/api/v1/ai")
app.include_router(item_info.router, prefix="/api/v1/ai")
