import json
import time
from openai import OpenAI
from app.config.settings import settings
from app.services.cost_tracker import estimate_cost, is_over_budget, track_usage


class AiCallResult:
    def __init__(
        self,
        content: str | None = None,
        data: dict | None = None,
        input_tokens: int = 0,
        output_tokens: int = 0,
        latency_ms: int = 0,
        model: str | None = None,
    ):
        self.content = content
        self.data = data
        self.input_tokens = input_tokens
        self.output_tokens = output_tokens
        self.latency_ms = latency_ms
        self.model = model or settings.openai_model
        self.estimated_cost_usd = estimate_cost(
            self.input_tokens, self.output_tokens, self.model
        )


def get_client() -> OpenAI | None:
    if not settings.openai_api_key or settings.openai_api_key.startswith("sk-your"):
        return None
    return OpenAI(api_key=settings.openai_api_key)


def chat_json(system: str, user: str, max_tokens: int) -> AiCallResult | None:
    if is_over_budget(settings.max_daily_spend_usd):
        return None
    client = get_client()
    if not client:
        return None
    start = time.perf_counter()
    response = client.chat.completions.create(
        model=settings.openai_model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        max_tokens=max_tokens,
        response_format={"type": "json_object"},
    )
    latency_ms = int((time.perf_counter() - start) * 1000)
    usage = response.usage
    input_tokens = usage.prompt_tokens or 0 if usage else 0
    output_tokens = usage.completion_tokens or 0 if usage else 0
    track_usage(input_tokens, output_tokens, settings.openai_model)
    content = response.choices[0].message.content
    data = json.loads(content) if content else None
    return AiCallResult(
        data=data,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        latency_ms=latency_ms,
    )


def chat_text(system: str, user: str, max_tokens: int) -> AiCallResult | None:
    if is_over_budget(settings.max_daily_spend_usd):
        return None
    client = get_client()
    if not client:
        return None
    start = time.perf_counter()
    response = client.chat.completions.create(
        model=settings.openai_model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        max_tokens=max_tokens,
    )
    latency_ms = int((time.perf_counter() - start) * 1000)
    usage = response.usage
    input_tokens = usage.prompt_tokens or 0 if usage else 0
    output_tokens = usage.completion_tokens or 0 if usage else 0
    track_usage(input_tokens, output_tokens, settings.openai_model)
    content = response.choices[0].message.content
    return AiCallResult(
        content=content,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        latency_ms=latency_ms,
    )
