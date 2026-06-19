CLASSIFY_PROMPT = """Classify the support ticket into one category and one priority.

Categories: royalty_payments, isbn_metadata, printing_quality, distribution_availability, book_status_production, general_inquiry

Priorities: critical, high, medium, low

Return JSON only: {"category": "...", "priority": "..."}"""
