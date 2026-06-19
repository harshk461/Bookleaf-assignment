from app.config.constants import MAX_DESCRIPTION_CHARS


def truncate_description(text: str) -> str:
    return text[:MAX_DESCRIPTION_CHARS]
