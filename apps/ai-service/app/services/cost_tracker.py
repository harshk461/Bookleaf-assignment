_daily_spend_usd = 0.0
_current_date: str | None = None
_tracker_path: str | None = None

# USD per 1M tokens (approximate OpenAI pricing)
MODEL_PRICING = {
    "gpt-4o-mini": {"input": 0.15, "output": 0.60},
    "gpt-4o": {"input": 2.50, "output": 10.00},
}


def _utc_date() -> str:
    from datetime import datetime, timezone

    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def init_tracker(path: str | None = None) -> None:
    import os

    global _tracker_path
    _tracker_path = path or os.environ.get("AI_SPEND_TRACKER_PATH", "/tmp/ai_daily_spend.json")
    _load()


def _load() -> None:
    import json
    import os

    global _daily_spend_usd, _current_date
    today = _utc_date()
    _current_date = today
    if not _tracker_path or not os.path.isfile(_tracker_path):
        _daily_spend_usd = 0.0
        return
    try:
        with open(_tracker_path, encoding="utf-8") as f:
            data = json.load(f)
        if data.get("date") == today:
            _daily_spend_usd = float(data.get("spend_usd", 0))
        else:
            _daily_spend_usd = 0.0
    except (OSError, json.JSONDecodeError, TypeError, ValueError):
        _daily_spend_usd = 0.0


def _persist() -> None:
    import json
    import os

    if not _tracker_path:
        return
    try:
        directory = os.path.dirname(_tracker_path)
        if directory:
            os.makedirs(directory, exist_ok=True)
        with open(_tracker_path, "w", encoding="utf-8") as f:
            json.dump({"date": _utc_date(), "spend_usd": _daily_spend_usd}, f)
    except OSError:
        pass


def estimate_cost(input_tokens: int, output_tokens: int, model: str) -> float:
    pricing = MODEL_PRICING.get(model, MODEL_PRICING["gpt-4o-mini"])
    return (input_tokens * pricing["input"] + output_tokens * pricing["output"]) / 1_000_000


def track_usage(input_tokens: int, output_tokens: int, model: str) -> None:
    global _daily_spend_usd, _current_date
    today = _utc_date()
    if _current_date != today:
        _current_date = today
        _daily_spend_usd = 0.0
    _daily_spend_usd += estimate_cost(input_tokens, output_tokens, model)
    _persist()


def is_over_budget(max_daily: float) -> bool:
    if _current_date != _utc_date():
        _load()
    return _daily_spend_usd >= max_daily


def reset_daily_spend() -> None:
    global _daily_spend_usd, _current_date
    _daily_spend_usd = 0.0
    _current_date = _utc_date()
    _persist()
