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
