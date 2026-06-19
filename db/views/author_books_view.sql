CREATE OR REPLACE VIEW author_books_view AS
SELECT
  b.id,
  b.book_id,
  b.author_ref,
  a.author_id,
  b.title,
  b.isbn,
  b.genre,
  b.publication_date,
  b.status,
  b.mrp,
  b.author_royalty_per_copy,
  b.total_copies_sold,
  b.total_royalty_earned,
  b.royalty_paid,
  b.royalty_pending,
  b.last_royalty_payout_date,
  pp.name AS print_partner,
  COALESCE(
    ARRAY_AGG(p.name ORDER BY p.name) FILTER (WHERE p.name IS NOT NULL AND bp.is_available),
    ARRAY[]::VARCHAR[]
  ) AS available_on
FROM books b
JOIN authors a ON a.id = b.author_ref
LEFT JOIN print_partners pp ON pp.id = b.print_partner_ref
LEFT JOIN book_platforms bp ON bp.book_ref = b.id AND bp.deleted_at IS NULL
LEFT JOIN platforms p ON p.id = bp.platform_ref AND p.deleted_at IS NULL
WHERE b.deleted_at IS NULL
GROUP BY b.id, a.author_id, pp.name;
