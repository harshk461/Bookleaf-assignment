import { getDb } from '../db/index.js';

export async function listMessages(ticketRef: string) {
  return getDb().query(
    `SELECT id, sender_type, content, is_initial, created_at
     FROM ticket_messages
     WHERE ticket_ref = $1 AND deleted_at IS NULL
     ORDER BY created_at ASC`,
    [ticketRef],
  );
}

export async function insertMessage(input: {
  ticketRef: string;
  senderType: 'author' | 'admin';
  senderRef: string;
  content: string;
  isInitial?: boolean;
}) {
  return getDb().queryOne(
    `INSERT INTO ticket_messages (ticket_ref, sender_type, sender_ref, content, is_initial)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [input.ticketRef, input.senderType, input.senderRef, input.content, input.isInitial ?? false],
  );
}
