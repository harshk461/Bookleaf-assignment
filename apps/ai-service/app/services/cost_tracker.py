_daily_spend_usd = 0.0


def track_usage(input_tokens: int, output_tokens: int, model: str) -> None:
    global _daily_spend_usd
    # Rough gpt-4o-mini pricing estimate
    cost = (input_tokens * 0.15 + output_tokens * 0.6) / 1_000_000
    _daily_spend_usd += cost


def is_over_budget(max_daily: float) -> bool:
    return _daily_spend_usd >= max_daily


def reset_daily_spend() -> None:
    global _daily_spend_usd
    _daily_spend_usd = 0.0
