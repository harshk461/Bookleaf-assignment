from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"
    max_daily_spend_usd: float = 5.0
    ai_spend_tracker_path: str = "/tmp/ai_daily_spend.json"
    port: int = 8000


settings = Settings()
