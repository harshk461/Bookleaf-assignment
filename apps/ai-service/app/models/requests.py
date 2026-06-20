from __future__ import annotations

from pydantic import BaseModel, Field


class ClassifyRequest(BaseModel):
    subject: str
    description: str
    book_title: str | None = None


class ClassifyResponse(BaseModel):
    category: str
    priority: str
    input_tokens: int | None = None
    output_tokens: int | None = None
    estimated_cost_usd: float | None = None
    latency_ms: int | None = None
    model: str | None = None


class DraftRequest(BaseModel):
    subject: str
    description: str
    category: str | None = None
    book_title: str | None = None
    author_name: str | None = None
    book_context: dict | None = None


class DraftResponse(BaseModel):
    content: str
    input_tokens: int | None = None
    output_tokens: int | None = None
    estimated_cost_usd: float | None = None
    latency_ms: int | None = None
    model: str | None = None
