from app.config.constants import MAX_TOKENS_DRAFT
from app.models.requests import DraftRequest, DraftResponse
from app.prompts.draft_prompt import DRAFT_PROMPT
from app.prompts.kb_sections import royalty, isbn, printing, distribution, production, company
from app.prompts.system_base import SYSTEM_BASE
from app.services.openai_client import chat_text
from app.utils.fallback import fallback_draft
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

    content = chat_text(f"{SYSTEM_BASE}\n{DRAFT_PROMPT}", user, MAX_TOKENS_DRAFT)
    return DraftResponse(content=content or fallback_draft())
