def test_fallback_classify():
    from app.utils.fallback import fallback_classify

    result = fallback_classify()
    assert result["category"] == "general_inquiry"
    assert result["priority"] == "medium"
