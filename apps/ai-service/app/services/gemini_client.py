import json
import time

import google.generativeai as genai
from google.generativeai.types import GenerationConfig

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
        self.model = model or settings.gemini_model
        self.estimated_cost_usd = estimate_cost(
            self.input_tokens, self.output_tokens, self.model
        )


def _is_configured() -> bool:
    key = settings.gemini_api_key.strip()
    if not key:
        return False
    placeholders = ("your-key-here", "AIza-your-key-here", "sk-your")
    return not any(key.startswith(p) or p in key for p in placeholders)


def _usage_counts(response) -> tuple[int, int]:
    usage = getattr(response, "usage_metadata", None)
    if not usage:
        return 0, 0
    input_tokens = getattr(usage, "prompt_token_count", 0) or 0
    output_tokens = getattr(usage, "candidates_token_count", 0) or 0
    return input_tokens, output_tokens


def chat_json(system: str, user: str, max_tokens: int) -> AiCallResult | None:
    if is_over_budget(settings.max_daily_spend_usd):
        return None
    if not _is_configured():
        return None

    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel(
        settings.gemini_model,
        system_instruction=system,
    )
    start = time.perf_counter()
    try:
        response = model.generate_content(
            user,
            generation_config=GenerationConfig(
                max_output_tokens=max_tokens,
                response_mime_type="application/json",
            ),
        )
    except Exception:
        return None

    latency_ms = int((time.perf_counter() - start) * 1000)
    input_tokens, output_tokens = _usage_counts(response)
    track_usage(input_tokens, output_tokens, settings.gemini_model)

    content = getattr(response, "text", None)
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
    if not _is_configured():
        return None

    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel(
        settings.gemini_model,
        system_instruction=system,
    )
    start = time.perf_counter()
    try:
        response = model.generate_content(
            user,
            generation_config=GenerationConfig(max_output_tokens=max_tokens),
        )
    except Exception:
        return None

    latency_ms = int((time.perf_counter() - start) * 1000)
    input_tokens, output_tokens = _usage_counts(response)
    track_usage(input_tokens, output_tokens, settings.gemini_model)
    content = getattr(response, "text", None)
    return AiCallResult(
        content=content,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        latency_ms=latency_ms,
    )
