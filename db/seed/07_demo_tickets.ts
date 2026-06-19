import type { PoolClient } from 'pg';

interface DemoTicketSeed {
  ticketNumber: string;
  authorId: string;
  bookId: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  authorMessage: string;
  adminMessage: string;
}

const DEMO_TICKETS: DemoTicketSeed[] = [
  {
    ticketNumber: 'TKT-2025-00001',
    authorId: 'AUTH001',
    bookId: 'BK001',
    subject: 'Pending royalty on Whispers of the Ganges',
    description:
      'I received my last royalty payout in October but still have ₹3,570 showing as pending. Can you confirm when the next payout will be processed?',
    category: 'royalty_payments',
    priority: 'high',
    authorMessage:
      'I received my last royalty payout in October but still have ₹3,570 showing as pending. Can you confirm when the next payout will be processed?',
    adminMessage:
      'Hi Priya, thank you for reaching out. Your pending royalty of ₹3,570 for Whispers of the Ganges is scheduled for the Q1 2026 payout cycle (processed by 15 Feb 2026). Your bank details on file are current. Please let us know if you need a line-item breakdown.',
  },
  {
    ticketNumber: 'TKT-2025-00002',
    authorId: 'AUTH003',
    bookId: 'BK005',
    subject: 'No royalty received for Between Two Temples',
    description:
      'My book has been live for 4 months with 67 copies sold but I have not received any royalty payment yet. Please advise.',
    category: 'royalty_payments',
    priority: 'high',
    authorMessage:
      'My book has been live for 4 months with 67 copies sold but I have not received any royalty payment yet. Please advise.',
    adminMessage:
      'Hi Ananya, royalties for Between Two Temples are accrued quarterly. Your current pending balance is ₹2,546, which will be included in the next payout once it crosses the ₹1,000 threshold after the Q1 2026 cycle closes. We will send you a statement before transfer.',
  },
  {
    ticketNumber: 'TKT-2025-00003',
    authorId: 'AUTH002',
    bookId: 'BK003',
    subject: 'Flipkart listing not showing updated cover',
    description:
      'The updated cover for Code & Karma is live on Amazon but Flipkart still shows the old cover art. Can this be corrected?',
    category: 'distribution_availability',
    priority: 'medium',
    authorMessage:
      'The updated cover for Code & Karma is live on Amazon but Flipkart still shows the old cover art. Can this be corrected?',
    adminMessage:
      'Hi Rohit, we have raised a metadata refresh request with Flipkart for Code & Karma. Their catalog team typically updates within 5–7 business days. We will confirm once the new cover is live.',
  },
  {
    ticketNumber: 'TKT-2025-00004',
    authorId: 'AUTH002',
    bookId: 'BK004',
    subject: 'Amazon US royalty breakdown request',
    description:
      'Could you share a platform-wise royalty breakdown for Startup Sutra? I want to understand how much came from each marketplace.',
    category: 'royalty_payments',
    priority: 'medium',
    authorMessage:
      'Could you share a platform-wise royalty breakdown for Startup Sutra? I want to understand how much came from each marketplace.',
    adminMessage:
      'Hi Rohit, you can view the per-platform sales breakdown on your book detail page in the author portal. For Startup Sutra, Amazon India accounts for the largest share, followed by Flipkart and Amazon US. Let us know if any line item looks incorrect.',
  },
];

async function lookupId(
  client: PoolClient,
  table: string,
  column: string,
  value: string,
): Promise<string | null> {
  const res = await client.query(`SELECT id FROM ${table} WHERE ${column} = $1`, [value]);
  return (res.rows[0]?.id as string) ?? null;
}

export async function seedDemoTickets(client: PoolClient): Promise<void> {
  const existing = await client.query('SELECT 1 FROM tickets LIMIT 1');
  if ((existing.rowCount ?? 0) > 0) return;

  const adminRef = await lookupId(client, 'users', 'email', 'admin@bookleaf.com');
  if (!adminRef) throw new Error('Admin user not found for demo ticket seed');

  for (const demo of DEMO_TICKETS) {
    const authorRef = await lookupId(client, 'authors', 'author_id', demo.authorId);
    const bookRef = authorRef
      ? await client
          .query(`SELECT id FROM books WHERE book_id = $1 AND author_ref = $2`, [demo.bookId, authorRef])
          .then((r) => (r.rows[0]?.id as string) ?? null)
      : null;
    const authorUserRef = await client
      .query(
        `SELECT u.id FROM users u JOIN authors a ON a.id = u.author_ref WHERE a.author_id = $1`,
        [demo.authorId],
      )
      .then((r) => (r.rows[0]?.id as string) ?? null);

    if (!authorRef || !bookRef || !authorUserRef) {
      console.warn(`Skipping demo ticket ${demo.ticketNumber}: missing author/book/user refs`);
      continue;
    }

    const ticketRes = await client.query(
      `INSERT INTO tickets (
        ticket_number, author_ref, book_ref, subject, description,
        status, category, priority, ai_category, ai_priority, assigned_admin_ref
      ) VALUES ($1, $2, $3, $4, $5, 'open', $6, $7, $6, $7, $8)
      RETURNING id`,
      [
        demo.ticketNumber,
        authorRef,
        bookRef,
        demo.subject,
        demo.description,
        demo.category,
        demo.priority,
        adminRef,
      ],
    );
    const ticketRef = ticketRes.rows[0].id as string;

    await client.query(
      `INSERT INTO ticket_messages (ticket_ref, sender_type, sender_ref, content, is_initial)
       VALUES ($1, 'author', $2, $3, true)`,
      [ticketRef, authorUserRef, demo.authorMessage],
    );

    await client.query(
      `INSERT INTO ticket_messages (ticket_ref, sender_type, sender_ref, content, is_initial)
       VALUES ($1, 'admin', $2, $3, false)`,
      [ticketRef, adminRef, demo.adminMessage],
    );
  }

  console.log(`Seeded ${DEMO_TICKETS.length} demo tickets with conversations`);
}
