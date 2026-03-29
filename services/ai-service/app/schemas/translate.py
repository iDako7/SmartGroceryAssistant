from pydantic import BaseModel, Field


class TranslateRequest(BaseModel):
    text: str = Field(min_length=1)


class TranslateResponse(BaseModel):
    name_en: str
    name_zh: str
