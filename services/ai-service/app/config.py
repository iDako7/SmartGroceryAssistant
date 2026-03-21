from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    cors_origin: str = (
        ""  # set to enable CORS (e.g. "http://localhost:3000" for local dev)
    )
    openrouter_api_key: str = ""
    openrouter_model: str = "qwen/qwen3-235b-a22b-2507"
    jwt_secret: str  # required — no default; fail if unset
    redis_host: str = "localhost"
    # Use SGA_REDIS_PORT to avoid collision with k8s auto-injected REDIS_PORT=tcp://...
    redis_port: int = Field(default=6379, validation_alias="SGA_REDIS_PORT")
    redis_password: str = ""
    rabbitmq_url: str = "amqp://guest:guest@localhost:5672/"

    model_config = {"env_file": "../../.env", "extra": "ignore"}


settings = Settings()
