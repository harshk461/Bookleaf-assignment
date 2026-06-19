import * as salesRepo from '../repositories/sales.repository.js';
import { getAuthorBook } from '../repositories/books.repository.js';
import { NotFoundError } from '../utils/errors.js';

function mapSale(row: Record<string, unknown>) {
  return {
    id: row.id,
    saleDate: row.sale_date,
    platform: row.platform ?? null,
    quantity: Number(row.quantity),
    unitMrp: row.unit_mrp != null ? Number(row.unit_mrp) : null,
    royaltyPerCopy: Number(row.royalty_per_copy),
    royaltyAmount: Number(row.royalty_amount),
    payoutStatus: row.payout_status,
    orderReference: row.order_reference ?? null,
  };
}

export async function getBookSales(authorRef: string, bookId: string) {
  const book = await getAuthorBook(authorRef, bookId);
  if (!book) throw new NotFoundError('Book not found');
  const rows = await salesRepo.listSalesByBook(book.id as string);
  return rows.map(mapSale);
}
