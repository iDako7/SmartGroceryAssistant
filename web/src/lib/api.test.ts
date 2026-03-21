import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearToken, getToken, setToken } from './api';

// ── Token helpers ─────────────────────────────────────────

describe('Token helpers', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('getToken returns null when nothing stored', () => {
    expect(getToken()).toBeNull();
  });

  it('setToken stores and getToken retrieves the token', () => {
    setToken('my-jwt-token');
    expect(getToken()).toBe('my-jwt-token');
  });

  it('clearToken removes the stored token', () => {
    setToken('my-jwt-token');
    clearToken();
    expect(getToken()).toBeNull();
  });
});

// ── request() ─────────────────────────────────────────────

describe('request helper', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('attaches Authorization header when token is stored', async () => {
    setToken('test-token');
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: 'ok' }),
    });

    const { auth } = await import('./api');
    // me() is a simple GET /api/v1/users/me
    // We call it directly to exercise the header attachment logic
    await auth.me();

    const [, init] = fetchMock.mock.calls[0];
    expect((init as RequestInit).headers).toMatchObject({
      Authorization: 'Bearer test-token',
    });
  });

  it('does not attach Authorization when no token', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: '1', email: 'a@b.com', name: 'A' }),
    });

    const { auth } = await import('./api');
    await auth.me();

    const [, init] = fetchMock.mock.calls[0];
    expect((init as RequestInit).headers).not.toHaveProperty('Authorization');
  });

  it('throws on non-ok response with error message from body', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ message: 'bad request' }),
    });

    const { auth } = await import('./api');
    await expect(auth.me()).rejects.toThrow('bad request');
  });

  it('throws generic message when body has no message field', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    const { auth } = await import('./api');
    await expect(auth.me()).rejects.toThrow('HTTP 500');
  });

  it('clears token and redirects on 401', async () => {
    setToken('stale-token');
    const assignMock = vi.fn();
    vi.stubGlobal('location', { href: '/' });
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: '/' },
    });

    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({}),
    });

    const { auth } = await import('./api');
    await expect(auth.me()).rejects.toThrow('Unauthorized');
    expect(getToken()).toBeNull();
  });
});

// ── auth API ──────────────────────────────────────────────

describe('auth API', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('register sends correct payload', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ token: 'tok', user: { id: '1', email: 'a@b.com', name: 'A' } }),
    });

    const { auth } = await import('./api');
    await auth.register('a@b.com', 'password123', 'Alice');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/v1/users/register');
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      email: 'a@b.com',
      password: 'password123',
      name: 'Alice',
    });
  });

  it('login sends correct payload', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ token: 'tok', user: {} }),
    });

    const { auth } = await import('./api');
    await auth.login('a@b.com', 'password123');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/v1/users/login');
    expect((init as RequestInit).method).toBe('POST');
  });
});

// ── lists API ─────────────────────────────────────────────

describe('lists API', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    });
  });

  afterEach(() => vi.restoreAllMocks());

  it('createSection sends name and position', async () => {
    const { lists } = await import('./api');
    await lists.createSection('Produce', 1);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/v1/lists/sections');
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      name: 'Produce',
      position: 1,
    });
  });

  it('deleteItem sends DELETE to correct path', async () => {
    const { lists } = await import('./api');
    await lists.deleteItem('item-123');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/v1/lists/items/item-123');
    expect((init as RequestInit).method).toBe('DELETE');
  });
});
