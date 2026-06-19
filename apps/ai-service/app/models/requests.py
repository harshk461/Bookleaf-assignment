from pydantic import BaseModel, Field


class ClassifyRequest(BaseModel):
    subject: str
    description: str
    book_title: str | None = None


class ClassifyResponse(BaseModel):
    category: str
    priority: str


class DraftRequest(BaseModel):
    subject: str
    description: str
    category: str | None = None
    book_title: str | None = None
    author_name: str | None = None


class DraftResponse(BaseModel):
    content: str
