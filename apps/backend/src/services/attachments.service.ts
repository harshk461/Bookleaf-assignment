import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { loadEnv } from '../config/env.js';
import { AppError } from '../utils/errors.js';

const ALLOWED_MIME_PREFIXES = ['image/', 'application/pdf'];

export function getUploadDir(): string {
  return process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads');
}

export function getMaxUploadBytes(): number {
  return Number(process.env.MAX_UPLOAD_BYTES) || 5 * 1024 * 1024;
}

export function validateMimeType(mimeType: string): void {
  const allowed = ALLOWED_MIME_PREFIXES.some(
    (prefix) => mimeType === prefix.replace(/\/$/, '') || mimeType.startsWith(prefix),
  );
  if (!allowed) {
    throw new AppError(400, 'File type not allowed. Use PDF or image files.');
  }
}

export async function saveTicketFile(
  ticketId: string,
  fileName: string,
  buffer: Buffer,
): Promise<string> {
  loadEnv();
  const uploadDir = getUploadDir();
  const ticketDir = path.join(uploadDir, ticketId);
  await fs.mkdir(ticketDir, { recursive: true });

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storageKey = path.join(ticketId, `${randomUUID()}-${safeName}`);
  const fullPath = path.join(uploadDir, storageKey);
  await fs.writeFile(fullPath, buffer);
  return storageKey;
}

export async function readTicketFile(storageKey: string): Promise<Buffer> {
  const fullPath = path.join(getUploadDir(), storageKey);
  return fs.readFile(fullPath);
}
