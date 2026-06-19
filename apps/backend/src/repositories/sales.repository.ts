import { getDb } from '../db/index.js';

export async function listSalesByBook(bookRef: string) {
  return getDb().query(
    `SELECT bs.id, bs.sale_date, p.name AS platform, bs.quantity, bs.unit_mrp,
            bs.royalty_per_copy, bs.royalty_amount, bs.payout_status, bs.order_reference
     FROM book_sales bs
     LEFT JOIN platforms p ON p.id = bs.platform_ref
     WHERE bs.book_ref = $1
     ORDER BY bs.sale_date DESC, bs.created_at DESC`,
    [bookRef],
  );
}
