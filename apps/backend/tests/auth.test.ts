import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { FastifyInstance } from 'fastify';
import { authHeader, createTestApp, login, TEST_USERS } from './helpers.js';

describe('auth', () => {
  let app: FastifyInstance;

  before(async () => {
    app = await createTestApp();
  });

  after(async () => {
    await app.close();
  });

  it('login success returns token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: TEST_USERS.author,
    });
    assert.equal(res.statusCode, 200);
    assert.ok((res.json() as { token: string }).token);
  });

  it('login fail with wrong password', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: TEST_USERS.author.email, password: 'wrong-password' },
    });
    assert.equal(res.statusCode, 401);
  });

  it('/me with valid token', async () => {
    const token = await login(app, TEST_USERS.author.email, TEST_USERS.author.password);
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: authHeader(token),
    });
    assert.equal(res.statusCode, 200);
    assert.equal((res.json() as { email: string }).email, TEST_USERS.author.email);
  });

  it('/me without token returns 401', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/auth/me' });
    assert.equal(res.statusCode, 401);
  });

  it('logout returns ok', async () => {
    const token = await login(app, TEST_USERS.author.email, TEST_USERS.author.password);
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/logout',
      headers: authHeader(token),
    });
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.json(), { ok: true });
  });
});
