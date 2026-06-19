def test_fallback_classify():
    from app.utils.fallback import fallback_classify

    result = fallback_classify()
    assert result["category"] == "general_inquiry"
    assert result["priority"] == "medium"


def test_classify_returns_503_when_over_budget(client, monkeypatch):
    from app.config import settings
    from app.services import cost_tracker

    monkeypatch.setattr(settings.settings, "max_daily_spend_usd", 0.0)
    cost_tracker.reset_daily_spend()

    res = client.post(
        "/classify",
        json={
            "subject": "Royalty question",
            "description": "Where is my payment?",
        },
    )
    assert res.status_code == 503
    assert res.json()["detail"] == "AI daily budget exceeded"


def test_draft_returns_503_when_over_budget(client, monkeypatch):
    from app.config import settings
    from app.services import cost_tracker

    monkeypatch.setattr(settings.settings, "max_daily_spend_usd", 0.0)
    cost_tracker.reset_daily_spend()

    res = client.post(
        "/draft",
        json={
            "subject": "Royalty question",
            "description": "Where is my payment?",
            "category": "royalty_payments",
        },
    )
    assert res.status_code == 503
    assert res.json()["detail"] == "AI daily budget exceeded"


def test_classify_fallback_without_api_key(client, monkeypatch):
    from app.config import settings
    from app.services import cost_tracker

    monkeypatch.setattr(settings.settings, "openai_api_key", "")
    monkeypatch.setattr(settings.settings, "max_daily_spend_usd", 100.0)
    cost_tracker.reset_daily_spend()

    res = client.post(
        "/classify",
        json={
            "subject": "General question",
            "description": "Hello",
        },
    )
    assert res.status_code == 200
    body = res.json()
    assert body["category"] == "general_inquiry"
    assert body["priority"] == "medium"
