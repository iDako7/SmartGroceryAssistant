from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    openrouter_api_key: str = ""
    openrouter_model: str = "anthropic/claude-3.5-haiku"
    jwt_secret: str = "change_me_in_production"
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_password: str = "redis_secret"
    rabbitmq_url: str = "amqp://sga:sga_secret@localhost:5672/"
    ai_service_port: int = 4003

    model_config = {"env_file": "../../.env", "extra": "ignore"}


settings = Settings()
