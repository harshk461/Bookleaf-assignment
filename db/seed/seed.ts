import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'node:url';
import { createPgPool } from '../create-pool.js';
import { seedDemoTickets } from './07_demo_tickets.js';
import { seedBookSales } from './08_book_sales.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(__dirname, 'data', 'bookleaf_sample_data.json');

const PRINT_PARTNERS = [
  { slug: 'in_house', name: 'In-House' },
  { slug: 'repro_india', name: 'Repro India' },
  { slug: 'epitome_books', name: 'Epitome Books' },
];

const PLATFORMS = [
  { slug: 'amazon_india', name: 'Amazon India', region: 'IN' },
  { slug: 'flipkart', name: 'Flipkart', region: 'IN' },
  { slug: 'amazon_us', name: 'Amazon US', region: 'US' },
  { slug: 'amazon_uk', name: 'Amazon UK', region: 'UK' },
  { slug: 'bookleaf_store', name: 'BookLeaf Store', region: 'IN' },
];

interface SampleBook {
  book_id: string;
  title: string;
  isbn: string;
  genre: string;
  publication_date?: string;
  status: string;
  mrp?: number;
  author_royalty_per_copy?: number;
  total_copies_sold: number;
  total_royalty_earned: number;
  royalty_paid: number;
  royalty_pending: number;
  last_royalty_payout_date?: string;
  print_partner?: string;
  available_on?: string[];
}

interface SampleAuthor {
  author_id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  joined_date: string;
  books: SampleBook[];
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required');

  const password = process.env.SEED_PASSWORD ?? 'Password123!';
  const passwordHash = await bcrypt.hash(password, 10);
  const raw = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8')) as { authors: SampleAuthor[] };

  const pool = createPgPool(databaseUrl);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const partnerMap = new Map<string, string>();
    for (const p of PRINT_PARTNERS) {
      const res = await client.query(
        `INSERT INTO print_partners (slug, name) VALUES ($1, $2)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
        [p.slug, p.name],
      );
      partnerMap.set(p.name, res.rows[0].id);
    }

    const platformMap = new Map<string, string>();
    for (const p of PLATFORMS) {
      const res = await client.query(
        `INSERT INTO platforms (slug, name, region) VALUES ($1, $2, $3)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
        [p.slug, p.name, p.region],
      );
      platformMap.set(p.name, res.rows[0].id);
    }

    for (const author of raw.authors) {
      const authorRes = await client.query(
        `INSERT INTO authors (author_id, name, email, phone, city, joined_date)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (author_id) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
        [author.author_id, author.name, author.email, author.phone, author.city, author.joined_date],
      );
      const authorUuid = authorRes.rows[0].id as string;

      await client.query(
        `INSERT INTO users (email, password_hash, role, author_ref, name)
         VALUES ($1, $2, 'author', $3, $4)
         ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
        [author.email, passwordHash, authorUuid, author.name],
      );

      for (const book of author.books) {
        const printPartnerRef = book.print_partner ? partnerMap.get(book.print_partner) ?? null : null;
        const bookRes = await client.query(
          `INSERT INTO books (
            book_id, author_ref, title, isbn, genre, publication_date, status, mrp,
            author_royalty_per_copy, total_copies_sold, total_royalty_earned,
            royalty_paid, royalty_pending, last_royalty_payout_date, print_partner_ref
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
          ON CONFLICT (book_id) DO UPDATE SET title = EXCLUDED.title RETURNING id`,
          [
            book.book_id,
            authorUuid,
            book.title,
            book.isbn,
            book.genre,
            book.publication_date ?? null,
            book.status,
            book.mrp ?? null,
            book.author_royalty_per_copy ?? null,
            book.total_copies_sold,
            book.total_royalty_earned,
            book.royalty_paid,
            book.royalty_pending,
            book.last_royalty_payout_date ?? null,
            printPartnerRef,
          ],
        );
        const bookUuid = bookRes.rows[0].id as string;

        for (const platformName of book.available_on ?? []) {
          const platformRef = platformMap.get(platformName);
          if (!platformRef) continue;
          await client.query(
            `INSERT INTO book_platforms (book_ref, platform_ref)
             VALUES ($1, $2) ON CONFLICT (book_ref, platform_ref) DO NOTHING`,
            [bookUuid, platformRef],
          );
        }
      }
    }

    await client.query(
      `INSERT INTO users (email, password_hash, role, author_ref, name)
       VALUES ($1, $2, 'admin', NULL, 'BookLeaf Admin')
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      ['admin@bookleaf.com', passwordHash],
    );

    await seedDemoTickets(client);
    await seedBookSales(client);

    await client.query('COMMIT');
    console.log(`Seeded ${raw.authors.length} authors and admin@bookleaf.com`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
