from __future__ import annotations

import json
import time

from google import genai
from google.genai import types

from app.config.settings import settings
from app.services.cost_tracker import estimate_cost, is_over_budget, track_usage
from app.utils.logger import logger

_client: genai.Client | None = None

# Thinking models (e.g. gemini-flash-latest → 2.5) burn tokens on internal reasoning;
# disable for short JSON/text support tasks.
_NO_THINKING = types.ThinkingConfig(thinking_budget=0)


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


def _get_client() -> genai.Client | None:
    global _client
    if not _is_configured():
        return None
    if _client is None:
        _client = genai.Client(api_key=settings.gemini_api_key)
    return _client


def _usage_counts(response) -> tuple[int, int]:
    usage = getattr(response, "usage_metadata", None)
    if not usage:
        return 0, 0
    input_tokens = getattr(usage, "prompt_token_count", 0) or 0
    output_tokens = getattr(usage, "candidates_token_count", 0) or 0
    return input_tokens, output_tokens


def _resolved_model(response) -> str:
    return getattr(response, "model_version", None) or settings.gemini_model


def _extract_text(response) -> str | None:
    """Collect visible text parts; skip internal thought content."""
    candidates = getattr(response, "candidates", None) or []
    if not candidates:
        return getattr(response, "text", None)

    parts = getattr(getattr(candidates[0], "content", None), "parts", None) or []
    chunks: list[str] = []
    for part in parts:
        if getattr(part, "thought", False):
            continue
        text = getattr(part, "text", None)
        if isinstance(text, str) and text:
            chunks.append(text)

    if chunks:
        return "".join(chunks).strip()

    text = getattr(response, "text", None)
    return text.strip() if isinstance(text, str) and text.strip() else None


def _parse_json(text: str | None) -> dict | None:
    if not text:
        return None
    try:
        data = json.loads(text)
        return data if isinstance(data, dict) else None
    except json.JSONDecodeError:
        return None


def chat_json(system: str, user: str, max_tokens: int) -> AiCallResult | None:
    if is_over_budget(settings.max_daily_spend_usd):
        logger.warning("Daily AI budget exceeded — skipping chat_json call")
        return None
    client = _get_client()
    if not client:
        logger.warning("Gemini client not configured — skipping chat_json call")
        return None

    start = time.perf_counter()
    try:
        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=user,
            config=types.GenerateContentConfig(
                system_instruction=system,
                max_output_tokens=max_tokens,
                response_mime_type="application/json",
                thinking_config=_NO_THINKING,
            ),
        )
    except Exception:
        logger.exception("Gemini chat_json request failed")
        return None

    latency_ms = int((time.perf_counter() - start) * 1000)
    input_tokens, output_tokens = _usage_counts(response)
    model = _resolved_model(response)
    track_usage(input_tokens, output_tokens, model)

    content = _extract_text(response)
    data = _parse_json(content)
    if not data:
        logger.warning(
            "Gemini chat_json returned invalid JSON (latency_ms=%s, model=%s)",
            latency_ms,
            model,
        )
        return None

    logger.info(
        "Gemini chat_json ok model=%s latency_ms=%s input_tokens=%s output_tokens=%s",
        model,
        latency_ms,
        input_tokens,
        output_tokens,
    )
    return AiCallResult(
        data=data,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        latency_ms=latency_ms,
        model=model,
    )


def chat_text(system: str, user: str, max_tokens: int) -> AiCallResult | None:
    if is_over_budget(settings.max_daily_spend_usd):
        logger.warning("Daily AI budget exceeded — skipping chat_text call")
        return None
    client = _get_client()
    if not client:
        logger.warning("Gemini client not configured — skipping chat_text call")
        return None

    start = time.perf_counter()
    try:
        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=user,
            config=types.GenerateContentConfig(
                system_instruction=system,
                max_output_tokens=max_tokens,
                thinking_config=_NO_THINKING,
            ),
        )
    except Exception:
        logger.exception("Gemini chat_text request failed")
        return None

    latency_ms = int((time.perf_counter() - start) * 1000)
    input_tokens, output_tokens = _usage_counts(response)
    model = _resolved_model(response)
    track_usage(input_tokens, output_tokens, model)
    content = _extract_text(response)
    if not content:
        logger.warning(
            "Gemini chat_text returned empty content (latency_ms=%s, model=%s)",
            latency_ms,
            model,
        )
        return None

    logger.info(
        "Gemini chat_text ok model=%s latency_ms=%s input_tokens=%s output_tokens=%s",
        model,
        latency_ms,
        input_tokens,
        output_tokens,
    )
    return AiCallResult(
        content=content,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        latency_ms=latency_ms,
        model=model,
    )
