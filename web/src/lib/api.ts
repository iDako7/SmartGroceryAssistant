import type { Item, ProfileUpdate, Section, User } from '../types';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// ── Token storage ──────────────────────────────────────────

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('sga_token');
}

export function setToken(token: string): void {
  localStorage.setItem('sga_token', token);
}

export function clearToken(): void {
  localStorage.removeItem('sga_token');
}

// ── Metrics ───────────────────────────────────────────────

export interface ApiMetricEntry {
  path: string;
  method: string;
  status: number;
  durationMs: number;
  timestamp: number;
  error?: boolean;
}

const metricsBuffer: ApiMetricEntry[] = [];
const MAX_BUFFER_SIZE = 200;

export function getMetricsBuffer(): readonly ApiMetricEntry[] {
  return metricsBuffer;
}

export function clearMetricsBuffer(): void {
  metricsBuffer.length = 0;
}

function recordMetric(entry: ApiMetricEntry): void {
  if (metricsBuffer.length >= MAX_BUFFER_SIZE) metricsBuffer.shift();
  metricsBuffer.push(entry);

  if (process.env.NODE_ENV === 'development') {
    const tag = entry.error ? 'ERR' : 'OK';
    console.debug(
      `[API ${tag}] ${entry.method} ${entry.path} → ${entry.status} (${entry.durationMs.toFixed(0)}ms)`
    );
  }
}

// ── Core fetch ─────────────────────────────────────────────

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const method = init.method ?? 'GET';
  const start = performance.now();
  let status = 0;

  try {
    const res = await fetch(`${BASE}${path}`, { ...init, headers });
    status = res.status;

    if (res.status === 401) {
      clearToken();
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as { message?: string }).message ?? `HTTP ${res.status}`);
    }

    return res.json() as Promise<T>;
  } catch (err) {
    if (status === 0) status = -1; // network error
    throw err;
  } finally {
    recordMetric({
      path,
      method,
      status,
      durationMs: performance.now() - start,
      timestamp: Date.now(),
      error: status < 200 || status >= 400,
    });
  }
}

// ── Auth ───────────────────────────────────────────────────

export const auth = {
  register: (email: string, password: string) =>
    request<{ token: string; user: User }>(
      '/api/v1/users/register',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    ),
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>(
      '/api/v1/users/login',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    ),
  me: () => request<User>('/api/v1/users/me'),
  updateProfile: (data: ProfileUpdate) =>
    request<User>('/api/v1/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// ── Lists ──────────────────────────────────────────────────

export const lists = {
  full: () => request<{ sections: (Section & { items?: Item[] })[] }>('/api/v1/lists/full'),
  createSection: (name: string, position: number) =>
    request('/api/v1/lists/sections', { method: 'POST', body: JSON.stringify({ name, position }) }),
  updateSection: (id: string, data: { name?: string; position?: number }) =>
    request(`/api/v1/lists/sections/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSection: (id: string) => request(`/api/v1/lists/sections/${id}`, { method: 'DELETE' }),
  createItem: (sectionId: string, name_en: string, quantity = 1) =>
    request(`/api/v1/lists/sections/${sectionId}/items`, {
      method: 'POST',
      body: JSON.stringify({ name_en, quantity }),
    }),
  updateItem: (id: string, data: { name_en?: string; quantity?: number; checked?: boolean }) =>
    request(`/api/v1/lists/items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteItem: (id: string) => request(`/api/v1/lists/items/${id}`, { method: 'DELETE' }),
};

// ── AI ─────────────────────────────────────────────────────

export const ai = {
  translate: (name_en: string, target_language: string) =>
    request<{ name_translated: string; notes: string }>('/api/v1/ai/translate', {
      method: 'POST',
      body: JSON.stringify({ name_en, target_language }),
    }),
  itemInfo: (name_en: string) =>
    request<{
      category: string;
      typical_unit: string;
      storage_tip: string;
      nutrition_note: string;
    }>('/api/v1/ai/item-info', { method: 'POST', body: JSON.stringify({ name_en }) }),
  alternatives: (name_en: string, reason = '') =>
    request<{ alternatives: { name: string; reason: string }[] }>('/api/v1/ai/alternatives', {
      method: 'POST',
      body: JSON.stringify({ name_en, reason }),
    }),
  suggest: (sections: Record<string, string[]>) =>
    request<{ job_id: string; status: string }>('/api/v1/ai/suggest', {
      method: 'POST',
      body: JSON.stringify({ sections }),
    }),
  inspire: (sections: Record<string, string[]>, preferences = '') =>
    request<{ job_id: string; status: string }>('/api/v1/ai/inspire', {
      method: 'POST',
      body: JSON.stringify({ sections, preferences }),
    }),
  pollJob: (jobId: string) =>
    request<{ job_id: string; status: string; result?: unknown }>(`/api/v1/ai/jobs/${jobId}`),
};
