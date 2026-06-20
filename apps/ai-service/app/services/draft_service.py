from app.config.constants import MAX_TOKENS_DRAFT
from app.models.requests import DraftRequest, DraftResponse
from app.prompts.draft_prompt import DRAFT_PROMPT
from app.prompts.kb_sections import royalty, isbn, printing, distribution, production, company
from app.prompts.system_base import SYSTEM_BASE
from app.services.gemini_client import chat_text
from app.utils.fallback import fallback_draft
from app.utils.logger import logger
from app.utils.token_budget import truncate_description

KB_MAP = {
    "royalty_payments": royalty.SECTION,
    "isbn_metadata": isbn.SECTION,
    "printing_quality": printing.SECTION,
    "distribution_availability": distribution.SECTION,
    "book_status_production": production.SECTION,
    "general_inquiry": company.SECTION,
}


def draft_response(req: DraftRequest) -> DraftResponse:
    kb = KB_MAP.get(req.category or "general_inquiry", company.SECTION)
    user = (
        f"Subject: {req.subject}\n"
        f"Description: {truncate_description(req.description)}\n"
        f"KB: {kb}"
    )
    if req.book_title:
        user += f"\nBook: {req.book_title}"
    if req.author_name:
        user += f"\nAuthor: {req.author_name}"
    if req.book_context:
        ctx = req.book_context
        user += (
            f"\nBook context (from dashboard): status={ctx.get('status')}, "
            f"copies_sold={ctx.get('total_copies_sold')}, "
            f"royalty_pending={ctx.get('royalty_pending')}, "
            f"royalty_paid={ctx.get('royalty_paid')}, "
            f"last_payout={ctx.get('last_royalty_payout_date')}"
        )

    result = chat_text(f"{SYSTEM_BASE}\n{DRAFT_PROMPT}", user, MAX_TOKENS_DRAFT)
    if not result or not result.content:
        logger.warning("Draft fallback for subject=%r category=%s", req.subject, req.category)
        return DraftResponse(content=fallback_draft())

    logger.info(
        "Draft ok subject=%r category=%s model=%s",
        req.subject,
        req.category,
        result.model,
    )
    return DraftResponse(
        content=result.content,
        input_tokens=result.input_tokens,
        output_tokens=result.output_tokens,
        estimated_cost_usd=result.estimated_cost_usd,
        latency_ms=result.latency_ms,
        model=result.model,
    )
