import { getDb } from '../db/index.js';

export interface AttachmentRow extends Record<string, unknown> {
  id: string;
  ticket_ref: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  storage_key: string;
  uploaded_by: string;
  created_at: string;
}

export async function insertAttachment(input: {
  ticketRef: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  uploadedBy: string;
}) {
  return getDb().queryOne<AttachmentRow>(
    `INSERT INTO ticket_attachments
      (ticket_ref, file_name, mime_type, size_bytes, storage_key, uploaded_by)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [
      input.ticketRef,
      input.fileName,
      input.mimeType,
      input.sizeBytes,
      input.storageKey,
      input.uploadedBy,
    ],
  );
}

export async function listAttachments(ticketId: string) {
  return getDb().query<AttachmentRow>(
    `SELECT * FROM ticket_attachments WHERE ticket_ref = $1 ORDER BY created_at ASC`,
    [ticketId],
  );
}

export async function getAttachment(ticketId: string, attachmentId: string) {
  return getDb().queryOne<AttachmentRow>(
    `SELECT * FROM ticket_attachments WHERE id = $1 AND ticket_ref = $2`,
    [attachmentId, ticketId],
  );
}

function mapAttachment(row: AttachmentRow) {
  return {
    id: row.id,
    fileName: row.file_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    createdAt: row.created_at,
  };
}

export { mapAttachment };
