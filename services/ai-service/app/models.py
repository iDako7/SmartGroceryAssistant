"""
Pydantic request/response models for AI service endpoints.
the Python/FastAPI equivalent of TypeScript interfaces, with extra runtime validation.
"""

from pydantic import BaseModel, Field


class UserProfile(BaseModel):
    dietary: list[str] = Field(default_factory=list)
    household_size: int = 0
    taste: str = ""


# ── Translate ────────────────────────────────────────────


class TranslateRequest(BaseModel):
    name_en: str
    target_language: str
    profile: UserProfile | None = None


class TranslateResponse(BaseModel):
    name_translated: str
    notes: str = ""


# ── Item Info ────────────────────────────────────────────


class ItemInfoRequest(BaseModel):
    name_en: str
    profile: UserProfile | None = None


# ── Item Info Response ──────────────────────────────────


class ItemInfoResponse(BaseModel):
    category: str = ""
    typical_unit: str = ""
    storage_tip: str = ""
    nutrition_note: str = ""


# ── Alternatives ─────────────────────────────────────────


class AlternativesRequest(BaseModel):
    name_en: str
    reason: str = ""
    profile: UserProfile | None = None


class Alternative(BaseModel):
    name_en: str
    match: str
    desc: str
    where: str


class AlternativesResponse(BaseModel):
    note: str
    alts: list[Alternative]


# ── Inspire (per-item) ──────────────────────────────────


class InspireItemRequest(BaseModel):
    name_en: str
    other_items: list[str] = Field(default_factory=list)
    profile: UserProfile | None = None


class RecipeAddItem(BaseModel):
    name_en: str


class Recipe(BaseModel):
    name: str
    emoji: str
    desc: str
    add: list[RecipeAddItem]


class InspireItemResponse(BaseModel):
    recipes: list[Recipe]


# ── Clarify ──────────────────────────────────────────────


class ClarifyRequest(BaseModel):
    sections: dict[str, list[str]]
    profile: UserProfile | None = None


class ClarifyQuestion(BaseModel):
    q: str
    options: list[str]
    allow_other: bool = Field(default=True, alias="allowOther")

    model_config = {"populate_by_name": True}


class ClarifyResponse(BaseModel):
    questions: list[ClarifyQuestion]


# ── Suggest (async) ─────────────────────────────────────


class ClarifyAnswer(BaseModel):
    question: str
    answer: str


class SuggestRequest(BaseModel):
    sections: dict[str, list[str]]
    answers: list[ClarifyAnswer] = Field(default_factory=list)
    profile: UserProfile | None = None


class SuggestClusterItem(BaseModel):
    name_en: str
    existing: bool
    why: str = ""


class SuggestCluster(BaseModel):
    name: str
    emoji: str
    desc: str
    items: list[SuggestClusterItem]


class SuggestUngroupedItem(BaseModel):
    name_en: str
    existing: bool = True


class StoreLayoutItem(BaseModel):
    name_en: str
    existing: bool


class StoreLayoutCategory(BaseModel):
    category: str
    emoji: str
    items: list[StoreLayoutItem]


class SuggestResponse(BaseModel):
    reason: str
    clusters: list[SuggestCluster]
    ungrouped: list[SuggestUngroupedItem]
    store_layout: list[StoreLayoutCategory] = Field(alias="storeLayout", default_factory=list)

    model_config = {"populate_by_name": True}


# ── Job Status ──────────────────────────────────────────


class JobStatusResponse(BaseModel):
    job_id: str
    status: str
    result: SuggestResponse | None = None
    error: str = ""
