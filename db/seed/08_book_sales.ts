import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PoolClient } from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(__dirname, 'data', 'bookleaf_sample_data.json');

interface SampleBook {
  book_id: string;
  publication_date?: string;
  status: string;
  mrp?: number;
  author_royalty_per_copy?: number;
  total_copies_sold: number;
  total_royalty_earned: number;
  royalty_paid: number;
  royalty_pending: number;
  available_on?: string[];
}

interface SampleAuthor {
  books: SampleBook[];
}

function splitQuantity(total: number, parts: number): number[] {
  if (parts <= 0) return [];
  const base = Math.floor(total / parts);
  const remainder = total % parts;
  return Array.from({ length: parts }, (_, i) => base + (i < remainder ? 1 : 0));
}

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

async function reconcileBookSnapshots(client: PoolClient): Promise<void> {
  await client.query(`
    UPDATE books b SET
      total_copies_sold    = s.total_qty,
      total_royalty_earned = s.total_royalty,
      royalty_paid         = s.paid_royalty,
      royalty_pending      = s.pending_royalty
    FROM (
      SELECT book_ref,
             SUM(quantity) AS total_qty,
             SUM(royalty_amount) AS total_royalty,
             SUM(royalty_amount) FILTER (WHERE payout_status = 'paid') AS paid_royalty,
             SUM(royalty_amount) FILTER (WHERE payout_status IN ('pending','rolled_over')) AS pending_royalty
      FROM book_sales
      GROUP BY book_ref
    ) s
    WHERE b.id = s.book_ref
  `);
}

export async function seedBookSales(client: PoolClient): Promise<void> {
  const existing = await client.query('SELECT 1 FROM book_sales LIMIT 1');
  if ((existing.rowCount ?? 0) > 0) return;

  const platformRes = await client.query('SELECT id, name FROM platforms');
  const platformMap = new Map<string, string>(
    platformRes.rows.map((r) => [r.name as string, r.id as string]),
  );

  const raw = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8')) as { authors: SampleAuthor[] };
  let saleCount = 0;

  for (const author of raw.authors) {
    for (const book of author.books) {
      const rate = book.author_royalty_per_copy;
      if (!rate || book.total_copies_sold <= 0 || book.total_royalty_earned <= 0) continue;

      const bookRes = await client.query('SELECT id FROM books WHERE book_id = $1', [book.book_id]);
      const bookRef = bookRes.rows[0]?.id as string | undefined;
      if (!bookRef) continue;

      const paidCopies = Math.round(book.royalty_paid / rate);
      const pendingCopies = book.total_copies_sold - paidCopies;
      const platforms = (book.available_on?.length ? book.available_on : ['BookLeaf Store']).filter(
        (p) => platformMap.has(p),
      );
      if (!platforms.length) continue;

      const baseDate = book.publication_date ?? '2024-01-01';

      async function insertSales(copies: number, status: 'paid' | 'pending', monthOffset: number) {
        if (copies <= 0) return;
        const quantities = splitQuantity(copies, platforms.length);
        for (let i = 0; i < platforms.length; i++) {
          const qty = quantities[i];
          if (qty <= 0) continue;
          const platformRef = platformMap.get(platforms[i]);
          if (!platformRef) continue;
          await client.query(
            `INSERT INTO book_sales (
              book_ref, platform_ref, sale_date, quantity, unit_mrp,
              royalty_per_copy, royalty_amount, payout_status, order_reference
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              bookRef,
              platformRef,
              addMonths(baseDate, monthOffset + i),
              qty,
              book.mrp ?? null,
              rate,
              qty * rate,
              status,
              `ORD-${book.book_id}-${status.toUpperCase()}-${i + 1}`,
            ],
          );
          saleCount++;
        }
      }

      await insertSales(paidCopies, 'paid', 1);
      await insertSales(pendingCopies, 'pending', 6);
    }
  }

  await reconcileBookSnapshots(client);
  console.log(`Seeded ${saleCount} book sales rows and reconciled book snapshots`);
}
