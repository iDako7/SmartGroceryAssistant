import json

from openai import AsyncOpenAI


class LLMError(Exception):
    """Raised when an LLM API call fails or returns unparseable output."""

    pass


class LLMClient:
    """Thin async wrapper around OpenRouter chat-completions in JSON mode."""

    def __init__(
        self,
        api_key: str,
        base_url: str = "https://openrouter.ai/api/v1",
        model: str = "openai/gpt-4o-mini",
    ):
        self.client = AsyncOpenAI(api_key=api_key, base_url=base_url)
        self.model = model

    async def chat(self, messages: list[dict]) -> dict:
        """Send chat messages and return parsed JSON content, or raise LLMError."""
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                # Force structured JSON output for deterministic downstream parsing.
                response_format={"type": "json_object"},
            )
        except Exception as e:
            raise LLMError(f"LLM API call failed: {e}") from e

        try:
            content = response.choices[0].message.content
            return json.loads(content)
        except (json.JSONDecodeError, IndexError, AttributeError) as e:
            raise LLMError(f"Failed to parse LLM response: {e}") from e
