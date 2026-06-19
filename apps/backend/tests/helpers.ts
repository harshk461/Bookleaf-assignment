import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';

export const TEST_PASSWORD = 'Password123!';

export const TEST_USERS = {
  author: { email: 'priya.sharma@email.com', password: TEST_PASSWORD },
  admin: { email: 'admin@bookleaf.com', password: TEST_PASSWORD },
};

export async function createTestApp(): Promise<FastifyInstance> {
  process.env.JWT_SECRET ??= 'test-secret-min-8-chars';
  process.env.DATABASE_URL ??= 'postgresql://bookleaf:bookleaf@localhost:5432/bookleaf';
  process.env.AI_SERVICE_URL ??= 'http://localhost:8000';
  process.env.CORS_ORIGIN ??= 'http://localhost:3000';
  if (!process.env.UPLOAD_DIR) {
    process.env.UPLOAD_DIR = mkdtempSync(path.join(tmpdir(), 'bookleaf-uploads-'));
  }
  return buildApp();
}

export async function login(
  app: FastifyInstance,
  email: string,
  password: string,
): Promise<string> {
  const res = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { email, password },
  });
  if (res.statusCode !== 200) {
    throw new Error(`Login failed (${res.statusCode}): ${res.body}`);
  }
  const body = res.json() as { token: string };
  return body.token;
}

export function authHeader(token: string): { authorization: string } {
  return { authorization: `Bearer ${token}` };
}

export function multipartBody(
  parts: Array<{
    name: string;
    value?: string;
    file?: { filename: string; content: Buffer; contentType: string };
  }>,
): { payload: Buffer; contentType: string } {
  const boundary = '----BookLeafTestBoundary';
  const chunks: Buffer[] = [];

  for (const part of parts) {
    if (part.file) {
      chunks.push(
        Buffer.from(
          `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${part.file.filename}"\r\nContent-Type: ${part.file.contentType}\r\n\r\n`,
        ),
      );
      chunks.push(part.file.content);
      chunks.push(Buffer.from('\r\n'));
    } else {
      chunks.push(
        Buffer.from(
          `--${boundary}\r\nContent-Disposition: form-data; name="${part.name}"\r\n\r\n${part.value ?? ''}\r\n`,
        ),
      );
    }
  }
  chunks.push(Buffer.from(`--${boundary}--\r\n`));

  return {
    payload: Buffer.concat(chunks),
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
}
