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
