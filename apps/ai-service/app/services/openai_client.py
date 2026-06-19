import json
from openai import OpenAI
from app.config.settings import settings
from app.services.cost_tracker import is_over_budget, track_usage


def get_client() -> OpenAI | None:
    if not settings.openai_api_key or settings.openai_api_key.startswith("sk-your"):
        return None
    return OpenAI(api_key=settings.openai_api_key)


def chat_json(system: str, user: str, max_tokens: int) -> dict | None:
    if is_over_budget(settings.max_daily_spend_usd):
        return None
    client = get_client()
    if not client:
        return None
    response = client.chat.completions.create(
        model=settings.openai_model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        max_tokens=max_tokens,
        response_format={"type": "json_object"},
    )
    usage = response.usage
    if usage:
        track_usage(usage.prompt_tokens or 0, usage.completion_tokens or 0, settings.openai_model)
    content = response.choices[0].message.content
    return json.loads(content) if content else None


def chat_text(system: str, user: str, max_tokens: int) -> str | None:
    if is_over_budget(settings.max_daily_spend_usd):
        return None
    client = get_client()
    if not client:
        return None
    response = client.chat.completions.create(
        model=settings.openai_model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        max_tokens=max_tokens,
    )
    usage = response.usage
    if usage:
        track_usage(usage.prompt_tokens or 0, usage.completion_tokens or 0, settings.openai_model)
    return response.choices[0].message.content
