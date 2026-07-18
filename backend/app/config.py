import re

from openai import OpenAI
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    flask_env: str = "development"
    flask_secret_key: str = "unsafe-development-key"
    frontend_origin: str = "http://localhost:3000"
    supabase_url: str | None = None
    supabase_anon_key: str | None = None
    openai_api_key: str | None = None


def get_api_keys(api_key: str) -> list[str]:
    """
    Parses a single API key or a comma, semicolon, or whitespace-separated list of API keys.
    """
    if not api_key:
        return []
    return [k.strip() for k in re.split(r"[\s,;]+", api_key) if k.strip()]


def get_llm_client_and_model(api_key: str) -> tuple[OpenAI, str]:
    # Support comma-separated keys (take the first valid key)
    keys = [k.strip() for k in api_key.split(",") if k.strip()]
    if not keys:
        raise ValueError("No valid API key provided.")

    actual_key = keys[0]

    # Recognize Gemini keys by prefixes or if they don't look like standard OpenAI keys
    is_gemini = (
        actual_key.startswith("AIzaSy")
        or actual_key.startswith("AQ.")
        or not actual_key.startswith("sk-")
    )

    if is_gemini:
        client = OpenAI(
            api_key=actual_key, base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
        )
        return client, "gemini-3.5-flash"
    else:
        client = OpenAI(api_key=actual_key)
        return client, "gpt-4o-mini"
