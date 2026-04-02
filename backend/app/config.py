"""Application configuration via environment variables."""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Supabase
    supabase_url: str
    supabase_key: str

    # AI Services
    openai_api_key: str | None = None
    openrouter_api_key: str | None = None
    ai_model_priority: str = "openai/gpt-4o-mini,anthropic/claude-3.5-sonnet,google/gemini-flash-1.5"

    # YouTube
    youtube_api_key: str

    # App
    app_env: str = "development"
    cors_allowed_origins: str = "http://localhost:3000"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()
