import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { FastifyInstance } from 'fastify';
import { authHeader, createTestApp, login, TEST_USERS } from './helpers.js';

describe('tickets', () => {
  let app: FastifyInstance;
  let authorToken: string;
  let adminToken: string;

  before(async () => {
    app = await createTestApp();
    authorToken = await login(app, TEST_USERS.author.email, TEST_USERS.author.password);
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
    const body = res.json() as { subject: string; id: string };
    assert.equal(body.subject, 'Integration test ticket');
    assert.ok(body.id);
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
});
