from functools import cached_property

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    openrouter_api_key: str = ""
    openrouter_model_fast: str = "qwen/qwen3-235b-a22b-2507"
    openrouter_model_full: str = "qwen/qwen3-235b-a22b-2507"
    jwt_secret: str = "change_me_in_production"
    redis_host: str = "localhost"
    # Use SGA_REDIS_PORT to avoid collision with k8s auto-injected REDIS_PORT=tcp://...
    redis_port: int = Field(default=6379, validation_alias="SGA_REDIS_PORT")
    redis_password: str = "redis_secret"
    celery_result_ttl: int = 3600

    @cached_property
    def celery_broker_url(self) -> str:
        return f"redis://:{self.redis_password}@{self.redis_host}:{self.redis_port}/1"

    model_config = {"env_file": "../../.env", "extra": "ignore"}


settings = Settings()
