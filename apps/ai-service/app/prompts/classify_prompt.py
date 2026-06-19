CLASSIFY_PROMPT = """Classify the support ticket into one category and one priority.

Categories: royalty_payments, isbn_metadata, printing_quality, distribution_availability, book_status_production, general_inquiry

Priorities: critical, high, medium, low

Priority rubric:
- critical/high: ISBN mismatches, no royalty for 6+ months, severe print defects, account-blocking issues
- medium: royalty questions, distribution delays, production status updates
- low: bio updates, general policy questions, minor metadata changes

Examples:
- "No royalty for 6 months" -> royalty_payments, high
- "ISBN different on Amazon vs book" -> isbn_metadata, critical
- "Can I update my author bio?" -> general_inquiry, low

Return JSON only: {"category": "...", "priority": "..."}"""
