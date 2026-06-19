import { getDb } from '../db/index.js';

export async function listNotes(ticketRef: string) {
  return getDb().query(
    `SELECT n.id, n.content, n.created_at, u.name AS admin_name
     FROM internal_notes n
     JOIN users u ON u.id = n.admin_ref
     WHERE n.ticket_ref = $1 AND n.deleted_at IS NULL
     ORDER BY n.created_at ASC`,
    [ticketRef],
  );
}

export async function insertNote(ticketRef: string, adminRef: string, content: string) {
  return getDb().queryOne(
    `INSERT INTO internal_notes (ticket_ref, admin_ref, content) VALUES ($1, $2, $3) RETURNING *`,
    [ticketRef, adminRef, content],
  );
}
