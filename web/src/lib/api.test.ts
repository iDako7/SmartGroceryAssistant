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
    fetchMock.mockClear();
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
    fetchMock.mockClear();
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
      json: async () => ({ token: 'tok', user: { id: '1', email: 'a@b.com' } }),
    });

    const { auth } = await import('./api');
    await auth.register('a@b.com', 'password123');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/v1/users/register');
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      email: 'a@b.com',
      password: 'password123',
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
    fetchMock.mockClear();
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

  it('updateItem sends PUT with correct data', async () => {
    const { lists } = await import('./api');
    await lists.updateItem('item-1', { name_en: 'Whole Milk', quantity: 2 });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/v1/lists/items/item-1');
    expect((init as RequestInit).method).toBe('PUT');
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      name_en: 'Whole Milk',
      quantity: 2,
    });
  });

  it('full fetches complete list', async () => {
    const { lists } = await import('./api');
    await lists.full();

    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/v1/lists/full');
  });
});

// ── auth.updateProfile ──────────────────────────────────

describe('auth.updateProfile', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockClear();
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: '1',
        email: 'a@b.com',
        language_preference: 'zh',
        dietary_restrictions: ['Vegan'],
        household_size: 3,
        taste_preferences: 'Spicy',
      }),
    });
  });

  afterEach(() => vi.restoreAllMocks());

  it('sends PUT to /api/v1/users/me with profile data', async () => {
    const { auth } = await import('./api');
    await auth.updateProfile({
      language_preference: 'zh',
      dietary_restrictions: ['Vegan'],
      household_size: 3,
      taste_preferences: 'Spicy',
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/v1/users/me');
    expect((init as RequestInit).method).toBe('PUT');
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      language_preference: 'zh',
      dietary_restrictions: ['Vegan'],
      household_size: 3,
      taste_preferences: 'Spicy',
    });
  });
});

// ── AI API ───────────────────────────────────────────────

describe('AI API', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockClear();
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    });
  });

  afterEach(() => vi.restoreAllMocks());

  it('itemInfo sends POST with name_en', async () => {
    const { ai } = await import('./api');
    await ai.itemInfo('Milk');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/v1/ai/item-info');
    expect((init as RequestInit).method).toBe('POST');
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({ name_en: 'Milk' });
  });

  it('alternatives sends POST with name_en and reason', async () => {
    const { ai } = await import('./api');
    await ai.alternatives('Milk', 'dairy free');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/v1/ai/alternatives');
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      name_en: 'Milk',
      reason: 'dairy free',
    });
  });

  it('translate sends POST with name_en and target_language', async () => {
    const { ai } = await import('./api');
    await ai.translate('Milk', 'Chinese');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/v1/ai/translate');
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      name_en: 'Milk',
      target_language: 'Chinese',
    });
  });

  it('suggest sends POST with sections map', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ job_id: 'j1', status: 'queued' }),
    });

    const { ai } = await import('./api');
    await ai.suggest({ Produce: ['Milk', 'Eggs'] });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/v1/ai/suggest');
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      sections: { Produce: ['Milk', 'Eggs'] },
    });
  });

  it('pollJob sends GET to correct path', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ job_id: 'j1', status: 'done', result: {} }),
    });

    const { ai } = await import('./api');
    await ai.pollJob('j1');

    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain('/api/v1/ai/jobs/j1');
  });
});

// ── Metrics buffer ───────────────────────────────────────

describe('Metrics buffer', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockClear();
    vi.stubGlobal('fetch', fetchMock);
    localStorage.clear();
  });

  afterEach(() => vi.restoreAllMocks());

  it('records metrics for successful API calls', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    });

    const { ai, getMetricsBuffer, clearMetricsBuffer } = await import('./api');
    clearMetricsBuffer();
    await ai.itemInfo('Milk');

    const buffer = getMetricsBuffer();
    expect(buffer.length).toBe(1);
    expect(buffer[0].path).toBe('/api/v1/ai/item-info');
    expect(buffer[0].method).toBe('POST');
    expect(buffer[0].status).toBe(200);
    expect(buffer[0].error).toBe(false);
    expect(buffer[0].durationMs).toBeGreaterThanOrEqual(0);
  });

  it('records metrics for failed API calls', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    const { ai, getMetricsBuffer, clearMetricsBuffer } = await import('./api');
    clearMetricsBuffer();
    await ai.itemInfo('Milk').catch(() => {});

    const buffer = getMetricsBuffer();
    expect(buffer.length).toBeGreaterThanOrEqual(1);
    const last = buffer[buffer.length - 1];
    expect(last.status).toBe(500);
    expect(last.error).toBe(true);
  });
});
