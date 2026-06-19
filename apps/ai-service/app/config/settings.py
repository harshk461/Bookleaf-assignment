from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    max_daily_spend_usd: float = 5.0
    ai_spend_tracker_path: str = "/tmp/ai_daily_spend.json"
    port: int = 8000


settings = Settings()
