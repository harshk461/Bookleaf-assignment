import { listAuthorBooks, getAuthorBook } from '../repositories/books.repository.js';
import { NotFoundError } from '../utils/errors.js';

function mapBook(row: Record<string, unknown>) {
  return {
    id: row.id,
    bookId: row.book_id,
    title: row.title,
    isbn: row.isbn,
    genre: row.genre,
    publicationDate: row.publication_date,
    status: row.status,
    mrp: row.mrp != null ? Number(row.mrp) : null,
    authorRoyaltyPerCopy: row.author_royalty_per_copy != null ? Number(row.author_royalty_per_copy) : null,
    totalCopiesSold: Number(row.total_copies_sold),
    totalRoyaltyEarned: Number(row.total_royalty_earned),
    royaltyPaid: Number(row.royalty_paid),
    royaltyPending: Number(row.royalty_pending),
    lastRoyaltyPayoutDate: row.last_royalty_payout_date,
    printPartner: row.print_partner,
    availableOn: (row.available_on as string[]) ?? [],
  };
}

export async function getBooks(authorRef: string) {
  const rows = await listAuthorBooks(authorRef);
  return rows.map(mapBook);
}

export async function getBook(authorRef: string, bookId: string) {
  const row = await getAuthorBook(authorRef, bookId);
  if (!row) throw new NotFoundError('Book not found');
  return mapBook(row);
}
