from app.config.constants import MAX_TOKENS_ACKNOWLEDGE
from app.models.requests import AcknowledgeRequest, AcknowledgeResponse
from app.prompts.acknowledge_prompt import ACKNOWLEDGE_PROMPT
from app.prompts.system_base import SYSTEM_BASE
from app.services.gemini_client import chat_text
from app.utils.fallback import fallback_acknowledgement
from app.utils.token_budget import truncate_description


def acknowledge_ticket(req: AcknowledgeRequest) -> AcknowledgeResponse:
    user = (
        f"Ticket: {req.ticket_number}\n"
        f"Subject: {req.subject}\n"
        f"Description: {truncate_description(req.description)}"
    )
    if req.category:
        user += f"\nCategory: {req.category}"
    if req.priority:
        user += f"\nPriority: {req.priority}"
    if req.book_title:
        user += f"\nBook: {req.book_title}"
    if req.author_name:
        user += f"\nAuthor: {req.author_name}"

    result = chat_text(f"{SYSTEM_BASE}\n{ACKNOWLEDGE_PROMPT}", user, MAX_TOKENS_ACKNOWLEDGE)
    if not result or not result.content:
        return AcknowledgeResponse(content=fallback_acknowledgement(req.ticket_number))

    return AcknowledgeResponse(
        content=result.content,
        input_tokens=result.input_tokens,
        output_tokens=result.output_tokens,
        estimated_cost_usd=result.estimated_cost_usd,
        latency_ms=result.latency_ms,
        model=result.model,
    )
