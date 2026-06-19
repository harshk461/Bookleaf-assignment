import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { FastifyInstance } from 'fastify';
import { authHeader, createTestApp, login, TEST_USERS } from './helpers.js';

describe('rbac', () => {
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

  it('author cannot access admin ticket list', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/tickets',
      headers: authHeader(authorToken),
    });
    assert.equal(res.statusCode, 403);
  });

  it('admin cannot access author books as author-scoped route', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/author/books',
      headers: authHeader(adminToken),
    });
    assert.equal(res.statusCode, 403);
  });

  it('author cannot access another author ticket', async () => {
    const authorListRes = await app.inject({
      method: 'GET',
      url: '/api/author/tickets',
      headers: authHeader(authorToken),
    });
    assert.equal(authorListRes.statusCode, 200);
    const myTickets = authorListRes.json() as Array<{ id: string }>;
    assert.ok(myTickets.length > 0, 'author should have at least one ticket');

    const otherAuthorToken = await login(
      app,
      'rohit.kapoor@email.com',
      TEST_USERS.author.password,
    );
    const res = await app.inject({
      method: 'GET',
      url: `/api/author/tickets/${myTickets[0].id}`,
      headers: authHeader(otherAuthorToken),
    });
    assert.equal(res.statusCode, 404);
  });
});
