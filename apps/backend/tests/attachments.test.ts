import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { FastifyInstance } from 'fastify';
import { authHeader, createTestApp, login, multipartBody, TEST_USERS } from './helpers.js';

describe('attachments', () => {
  let app: FastifyInstance;
  let authorToken: string;

  before(async () => {
    app = await createTestApp();
    authorToken = await login(app, TEST_USERS.author.email, TEST_USERS.author.password);
  });

  after(async () => {
    await app.close();
  });

  it('create ticket with attachment and download', async () => {
    const { payload, contentType } = multipartBody([
      { name: 'bookId', value: 'BK001' },
      { name: 'subject', value: 'Attachment test ticket' },
      { name: 'description', value: 'Ticket with PDF attachment' },
      {
        name: 'file',
        file: {
          filename: 'test.pdf',
          content: Buffer.from('%PDF-1.4 test'),
          contentType: 'application/pdf',
        },
      },
    ]);

    const createRes = await app.inject({
      method: 'POST',
      url: '/api/author/tickets',
      headers: {
        ...authHeader(authorToken),
        'content-type': contentType,
      },
      payload,
    });
    assert.equal(createRes.statusCode, 200);
    const ticket = createRes.json() as {
      id: string;
      attachments: Array<{ id: string; fileName: string }>;
    };
    assert.ok(ticket.attachments.length >= 1);

    const attachmentId = ticket.attachments[0].id;
    const downloadRes = await app.inject({
      method: 'GET',
      url: `/api/author/tickets/${ticket.id}/attachments/${attachmentId}`,
      headers: authHeader(authorToken),
    });
    assert.equal(downloadRes.statusCode, 200);
    assert.ok(downloadRes.rawPayload.length > 0);
  });
});
