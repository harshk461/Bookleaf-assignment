import { getDb } from '../db/index.js';

export async function listAuthorTickets(authorRef: string) {
  return getDb().query(
    `SELECT t.*, b.book_id, b.title AS book_title
     FROM tickets t
     LEFT JOIN books b ON b.id = t.book_ref
     WHERE t.author_ref = $1 AND t.deleted_at IS NULL
     ORDER BY t.created_at DESC`,
    [authorRef],
  );
}

export async function getTicketForAuthor(authorRef: string, ticketId: string) {
  return getDb().queryOne(
    `SELECT t.*, b.book_id, b.title AS book_title
     FROM tickets t
     LEFT JOIN books b ON b.id = t.book_ref
     WHERE t.id = $1 AND t.author_ref = $2 AND t.deleted_at IS NULL`,
    [ticketId, authorRef],
  );
}

export async function listAdminTickets(filters: {
  status?: string;
  category?: string;
  priority?: string;
}) {
  const clauses = ['t.deleted_at IS NULL'];
  const params: unknown[] = [];
  if (filters.status) {
    params.push(filters.status);
    clauses.push(`t.status = $${params.length}`);
  }
  if (filters.category) {
    params.push(filters.category);
    clauses.push(`t.category = $${params.length}`);
  }
  if (filters.priority) {
    params.push(filters.priority);
    clauses.push(`t.priority = $${params.length}`);
  }
  return getDb().query(
    `SELECT t.*, a.name AS author_name, b.book_id, b.title AS book_title,
            u.name AS assigned_admin_name
     FROM tickets t
     JOIN authors a ON a.id = t.author_ref
     LEFT JOIN books b ON b.id = t.book_ref
     LEFT JOIN users u ON u.id = t.assigned_admin_ref
     WHERE ${clauses.join(' AND ')}
     ORDER BY t.priority DESC NULLS LAST, t.created_at DESC`,
    params,
  );
}

export async function getTicketById(ticketId: string) {
  return getDb().queryOne(
    `SELECT t.*, a.name AS author_name, b.book_id, b.title AS book_title,
            u.name AS assigned_admin_name
     FROM tickets t
     JOIN authors a ON a.id = t.author_ref
     LEFT JOIN books b ON b.id = t.book_ref
     LEFT JOIN users u ON u.id = t.assigned_admin_ref
     WHERE t.id = $1 AND t.deleted_at IS NULL`,
    [ticketId],
  );
}

export async function resolveBookRef(bookId: string | null, authorRef: string) {
  if (!bookId) return null;
  const row = await getDb().queryOne<{ id: string }>(
    `SELECT id FROM books WHERE book_id = $1 AND author_ref = $2 AND deleted_at IS NULL`,
    [bookId, authorRef],
  );
  return row?.id ?? null;
}

export async function nextTicketNumber() {
  const row = await getDb().queryOne<{ n: number }>(
    `SELECT COUNT(*)::int + 1 AS n FROM tickets`,
  );
  const n = String(row?.n ?? 1).padStart(5, '0');
  return `TKT-${new Date().getFullYear()}-${n}`;
}

export async function insertTicket(input: {
  ticketNumber: string;
  authorRef: string;
  bookRef: string | null;
  subject: string;
  description: string;
}) {
  return getDb().queryOne(
    `INSERT INTO tickets (ticket_number, author_ref, book_ref, subject, description)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [input.ticketNumber, input.authorRef, input.bookRef, input.subject, input.description],
  );
}

export async function updateTicketAiMetadata(
  ticketId: string,
  data: {
    category: string;
    priority: string;
    aiCategory: string;
    aiPriority: string;
    failed: boolean;
  },
) {
  await getDb().execute(
    `UPDATE tickets SET
      category = $2, priority = $3, ai_category = $4, ai_priority = $5,
      ai_classification_failed = $6, ai_classified_at = NOW(), updated_at = NOW()
     WHERE id = $1`,
    [ticketId, data.category, data.priority, data.aiCategory, data.aiPriority, data.failed],
  );
}

export async function patchTicket(ticketId: string, fields: Record<string, unknown>) {
  const allowed = [
    'status', 'category', 'priority', 'assigned_admin_ref',
    'category_overridden', 'priority_overridden',
  ];
  const sets: string[] = [];
  const params: unknown[] = [ticketId];
  for (const key of allowed) {
    if (fields[key] !== undefined) {
      params.push(fields[key]);
      sets.push(`${key} = $${params.length}`);
    }
  }
  if (!sets.length) return null;
  sets.push('updated_at = NOW()');
  return getDb().queryOne(
    `UPDATE tickets SET ${sets.join(', ')} WHERE id = $1 RETURNING *`,
    params,
  );
}
