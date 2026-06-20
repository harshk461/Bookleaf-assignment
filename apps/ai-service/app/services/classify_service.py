from app.config.constants import MAX_TOKENS_CLASSIFY
from app.models.requests import ClassifyRequest, ClassifyResponse
from app.prompts.classify_prompt import CLASSIFY_PROMPT
from app.prompts.system_base import SYSTEM_BASE
from app.services.gemini_client import chat_json
from app.utils.fallback import fallback_classify, is_valid_category, is_valid_priority
from app.utils.logger import logger
from app.utils.token_budget import truncate_description


def classify_ticket(req: ClassifyRequest) -> ClassifyResponse:
    user = f"Subject: {req.subject}\nDescription: {truncate_description(req.description)}"
    if req.book_title:
        user += f"\nBook: {req.book_title}"

    result = chat_json(f"{SYSTEM_BASE}\n{CLASSIFY_PROMPT}", user, MAX_TOKENS_CLASSIFY)
    if not result or not result.data:
        logger.warning("Classify fallback for subject=%r", req.subject)
        fb = fallback_classify()
        return ClassifyResponse(**fb)

    category = result.data.get("category", "general_inquiry")
    priority = result.data.get("priority", "medium")
    if not is_valid_category(category) or not is_valid_priority(priority):
        logger.warning(
            "Classify invalid output category=%s priority=%s subject=%r",
            category,
            priority,
            req.subject,
        )
        fb = fallback_classify()
        return ClassifyResponse(**fb)

    logger.info(
        "Classify ok subject=%r category=%s priority=%s model=%s",
        req.subject,
        category,
        priority,
        result.model,
    )
    return ClassifyResponse(
        category=category,
        priority=priority,
        input_tokens=result.input_tokens,
        output_tokens=result.output_tokens,
        estimated_cost_usd=result.estimated_cost_usd,
        latency_ms=result.latency_ms,
        model=result.model,
    )
