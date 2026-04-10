import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import jwt from 'jsonwebtoken';

import { buildApp } from '../app.js';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;

function signToken(payload: object = { sub: 'user-1' }): string {
  return jwt.sign(payload, 'test-secret', { expiresIn: '1h' });
}

beforeAll(async () => {
  app = buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

// ── Health check ──────────────────────────────────────────

describe('GET /health', () => {
  it('returns 200 ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
  });
});

// ── JWT-protected routes return 401 without token ─────────
// These tests verify auth middleware rejects BEFORE proxying upstream,
// so they don't require upstream services to be running.

describe('JWT-protected routes reject unauthenticated', () => {
  const protectedRoutes = [
    { method: 'GET' as const, url: '/api/v1/users/me' },
    { method: 'PUT' as const, url: '/api/v1/users/me' },
    { method: 'GET' as const, url: '/api/v1/lists/full' },
    { method: 'GET' as const, url: '/api/v1/lists/sections' },
    { method: 'POST' as const, url: '/api/v1/lists/sections' },
    { method: 'PUT' as const, url: '/api/v1/lists/sections/s1' },
    { method: 'DELETE' as const, url: '/api/v1/lists/sections/s1' },
    { method: 'GET' as const, url: '/api/v1/lists/sections/s1/items' },
    { method: 'POST' as const, url: '/api/v1/lists/sections/s1/items' },
    { method: 'PUT' as const, url: '/api/v1/lists/items/i1' },
    { method: 'DELETE' as const, url: '/api/v1/lists/items/i1' },
    { method: 'POST' as const, url: '/api/v1/ai/suggest' },
    { method: 'POST' as const, url: '/api/v1/ai/inspire/item' },
    { method: 'POST' as const, url: '/api/v1/ai/clarify' },
    { method: 'POST' as const, url: '/api/v1/ai/translate' },
    { method: 'POST' as const, url: '/api/v1/ai/item-info' },
    { method: 'POST' as const, url: '/api/v1/ai/alternatives' },
    { method: 'GET' as const, url: '/api/v1/ai/jobs/j1' },
  ];

  for (const { method, url } of protectedRoutes) {
    it(`${method} ${url} → 401 without token`, async () => {
      const res = await app.inject({ method, url });
      expect(res.statusCode).toBe(401);
    });
  }
});

// ── Invalid JWT is rejected ───────────────────────────────

describe('invalid JWT is rejected', () => {
  it('returns 401 with bad token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/users/me',
      headers: { authorization: 'Bearer invalid.token.here' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('returns 401 with wrong secret', async () => {
    const token = jwt.sign({ sub: 'user-1' }, 'wrong-secret', { expiresIn: '1h' });
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/users/me',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(401);
  });

  it('returns 401 with expired token', async () => {
    const token = jwt.sign({ sub: 'user-1', exp: Math.floor(Date.now() / 1000) - 60 }, 'test-secret');
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/users/me',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(401);
  });
});

// ── Unknown routes return 404 ─────────────────────────────

describe('unknown routes', () => {
  it('returns 404 for unregistered path', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/nonexistent' });
    expect(res.statusCode).toBe(404);
  });
});

// ── CORS headers ──────────────────────────────────────────

describe('CORS', () => {
  it('includes access-control-allow-origin header', async () => {
    const res = await app.inject({
      method: 'OPTIONS',
      url: '/health',
      headers: { origin: 'http://localhost:3000' },
    });
    expect(res.headers['access-control-allow-origin']).toBeDefined();
  });
});
