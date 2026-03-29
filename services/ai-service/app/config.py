from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    openrouter_api_key: str
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    model_name: str = "openai/gpt-4o-mini"
    debug: bool = False
