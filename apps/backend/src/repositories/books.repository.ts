import { getDb } from '../db/index.js';

export async function listAuthorBooks(authorRef: string) {
  return getDb().query(
    `SELECT * FROM author_books_view WHERE author_ref = $1 ORDER BY book_id`,
    [authorRef],
  );
}

export async function getAuthorBook(authorRef: string, bookId: string) {
  return getDb().queryOne(
    `SELECT * FROM author_books_view WHERE author_ref = $1 AND book_id = $2`,
    [authorRef, bookId],
  );
}

export async function getBookDraftContext(bookRef: string) {
  return getDb().queryOne<{
    status: string;
    royalty_pending: string;
    royalty_paid: string;
    last_royalty_payout_date: string | null;
    total_copies_sold: number;
  }>(
    `SELECT status, royalty_pending, royalty_paid, last_royalty_payout_date, total_copies_sold
     FROM books WHERE id = $1 AND deleted_at IS NULL`,
    [bookRef],
  );
}
