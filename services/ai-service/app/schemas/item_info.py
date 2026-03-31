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
