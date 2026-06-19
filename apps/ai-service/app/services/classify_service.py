from app.config.constants import MAX_TOKENS_CLASSIFY
from app.models.requests import ClassifyRequest, ClassifyResponse
from app.prompts.classify_prompt import CLASSIFY_PROMPT
from app.prompts.system_base import SYSTEM_BASE
from app.services.openai_client import chat_json
from app.utils.fallback import fallback_classify, is_valid_category, is_valid_priority
from app.utils.token_budget import truncate_description


def classify_ticket(req: ClassifyRequest) -> ClassifyResponse:
    user = f"Subject: {req.subject}\nDescription: {truncate_description(req.description)}"
    if req.book_title:
        user += f"\nBook: {req.book_title}"

    result = chat_json(f"{SYSTEM_BASE}\n{CLASSIFY_PROMPT}", user, MAX_TOKENS_CLASSIFY)
    if not result:
        fb = fallback_classify()
        return ClassifyResponse(**fb)

    category = result.get("category", "general_inquiry")
    priority = result.get("priority", "medium")
    if not is_valid_category(category) or not is_valid_priority(priority):
        fb = fallback_classify()
        return ClassifyResponse(**fb)

    return ClassifyResponse(category=category, priority=priority)
