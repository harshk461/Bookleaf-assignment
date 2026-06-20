import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { FastifyInstance } from 'fastify';
import { authHeader, createTestApp, login, TEST_PASSWORD, TEST_USERS } from './helpers.js';

describe('tickets', () => {
  let app: FastifyInstance;
  let authorToken: string;
  let otherAuthorToken: string;
  let adminToken: string;

  before(async () => {
    app = await createTestApp();
    authorToken = await login(app, TEST_USERS.author.email, TEST_USERS.author.password);
    otherAuthorToken = await login(app, 'rohit.kapoor@email.com', TEST_PASSWORD);
    adminToken = await login(app, TEST_USERS.admin.email, TEST_USERS.admin.password);
  });

  after(async () => {
    await app.close();
  });

  it('author can create a ticket', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/author/tickets',
      headers: authHeader(authorToken),
      payload: {
        bookId: 'BK001',
        subject: 'Integration test ticket',
        description: 'Created by API integration test',
      },
    });
    assert.equal(res.statusCode, 200);
    const body = res.json() as {
      subject: string;
      id: string;
      messages?: Array<{ senderType: string; content: string }>;
    };
    assert.equal(body.subject, 'Integration test ticket');
    assert.ok(body.id);
    assert.ok(body.messages && body.messages.length === 1);
    assert.equal(body.messages[0].senderType, 'author');
  });

  it('processes acknowledgement job and inserts admin message', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/author/tickets',
      headers: authHeader(authorToken),
      payload: {
        bookId: 'BK001',
        subject: 'Ack queue test',
        description: 'Testing async acknowledgement processor',
      },
    });
    assert.equal(createRes.statusCode, 200);
    const created = createRes.json() as {
      id: string;
      ticketNumber: string;
      category: string | null;
      priority: string | null;
    };

    const { processAcknowledgementJob } = await import(
      '../src/queues/acknowledgement.processor.js'
    );
    await processAcknowledgementJob({
      ticketId: created.id,
      ticketNumber: created.ticketNumber,
      subject: 'Ack queue test',
      description: 'Testing async acknowledgement processor',
      category: created.category ?? 'general_inquiry',
      priority: created.priority ?? 'medium',
      bookTitle: null,
      authorName: 'Priya Sharma',
    });

    const detailRes = await app.inject({
      method: 'GET',
      url: `/api/author/tickets/${created.id}`,
      headers: authHeader(authorToken),
    });
    assert.equal(detailRes.statusCode, 200);
    const detail = detailRes.json() as {
      messages: Array<{ senderType: string; content: string }>;
    };
    assert.ok(detail.messages.length >= 2);
    assert.equal(detail.messages[0].senderType, 'author');
    assert.equal(detail.messages[1].senderType, 'admin');
    assert.match(detail.messages[1].content, /BookLeaf Support|received your ticket/i);
  });

  it('admin list supports date filter', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/tickets?from=2020-01-01&to=2030-12-31',
      headers: authHeader(adminToken),
    });
    assert.equal(res.statusCode, 200);
    assert.ok(Array.isArray(res.json()));
  });

  it('admin can generate AI draft via POST', async () => {
    const listRes = await app.inject({
      method: 'GET',
      url: '/api/admin/tickets',
      headers: authHeader(adminToken),
    });
    const tickets = listRes.json() as Array<{ id: string }>;
    assert.ok(tickets.length > 0);

    const draftRes = await app.inject({
      method: 'POST',
      url: `/api/admin/tickets/${tickets[0].id}/draft`,
      headers: {
        ...authHeader(adminToken),
        'content-type': 'application/json',
      },
      payload: {},
    });
    assert.equal(draftRes.statusCode, 200);
    const body = draftRes.json() as { aiDraft: string; aiDraftFailed?: boolean };
    assert.ok(body.aiDraft.length > 0);
  });

  it('admin can override ticket category', async () => {
    const listRes = await app.inject({
      method: 'GET',
      url: '/api/admin/tickets',
      headers: authHeader(adminToken),
    });
    const tickets = listRes.json() as Array<{ id: string; category: string }>;
    assert.ok(tickets.length > 0);

    const ticketId = tickets[0].id;
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/admin/tickets/${ticketId}`,
      headers: authHeader(adminToken),
      payload: { category: 'royalty_payments' },
    });
    assert.equal(res.statusCode, 200);
    const body = res.json() as { category: string; categoryOverridden: boolean };
    assert.equal(body.category, 'royalty_payments');
    assert.equal(body.categoryOverridden, true);
  });

  it('author can send follow-up message after admin response', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/author/tickets',
      headers: authHeader(authorToken),
      payload: {
        bookId: 'BK001',
        subject: 'Follow-up chat test',
        description: 'Initial author message for chat test',
      },
    });
    assert.equal(createRes.statusCode, 200);
    const created = createRes.json() as { id: string };

    const adminRes = await app.inject({
      method: 'POST',
      url: `/api/admin/tickets/${created.id}/responses`,
      headers: authHeader(adminToken),
      payload: { content: 'Thanks for reaching out. We are looking into this.' },
    });
    assert.equal(adminRes.statusCode, 200);

    const authorReplyRes = await app.inject({
      method: 'POST',
      url: `/api/author/tickets/${created.id}/messages`,
      headers: authHeader(authorToken),
      payload: { content: 'Could you share an update on the timeline?' },
    });
    assert.equal(authorReplyRes.statusCode, 200);

    const body = authorReplyRes.json() as {
      messages: Array<{ senderType: string; content: string; isInitial?: boolean }>;
    };
    const followUp = body.messages.find((m) => m.content.includes('timeline'));
    assert.ok(followUp);
    assert.equal(followUp.senderType, 'author');
    assert.equal(followUp.isInitial, false);
  });

  it('author cannot message a closed ticket', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/author/tickets',
      headers: authHeader(authorToken),
      payload: {
        bookId: null,
        subject: 'Closed ticket chat test',
        description: 'Testing closed ticket guard',
      },
    });
    assert.equal(createRes.statusCode, 200);
    const created = createRes.json() as { id: string };

    const closeRes = await app.inject({
      method: 'PATCH',
      url: `/api/admin/tickets/${created.id}`,
      headers: authHeader(adminToken),
      payload: { status: 'closed' },
    });
    assert.equal(closeRes.statusCode, 200);

    const replyRes = await app.inject({
      method: 'POST',
      url: `/api/author/tickets/${created.id}/messages`,
      headers: authHeader(authorToken),
      payload: { content: 'This should be rejected' },
    });
    assert.equal(replyRes.statusCode, 400);
  });

  it('author cannot message another author ticket', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/author/tickets',
      headers: authHeader(authorToken),
      payload: {
        bookId: 'BK001',
        subject: 'Ownership chat test',
        description: 'Only priya should reply here',
      },
    });
    assert.equal(createRes.statusCode, 200);
    const created = createRes.json() as { id: string };

    const replyRes = await app.inject({
      method: 'POST',
      url: `/api/author/tickets/${created.id}/messages`,
      headers: authHeader(otherAuthorToken),
      payload: { content: 'Unauthorized follow-up' },
    });
    assert.equal(replyRes.statusCode, 404);
  });
});
