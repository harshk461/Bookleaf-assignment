from app.config.constants import CATEGORIES, PRIORITIES


def fallback_classify() -> dict[str, str]:
    return {"category": "general_inquiry", "priority": "medium"}


def fallback_draft() -> str:
    return (
        "Thank you for contacting BookLeaf support. We have received your query "
        "and our team will review it and respond shortly."
    )


def fallback_acknowledgement(ticket_number: str) -> str:
    return (
        f"Thank you for contacting BookLeaf Support. We have received your ticket "
        f"({ticket_number}) and our team will review your request and follow up "
        f"within 24-48 business hours."
    )


def is_valid_category(value: str) -> bool:
    return value in CATEGORIES


def is_valid_priority(value: str) -> bool:
    return value in PRIORITIES
