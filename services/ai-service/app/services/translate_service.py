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
