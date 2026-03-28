import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  Registry,
  Counter,
  Histogram,
  Gauge,
  collectDefaultMetrics,
} from 'prom-client';

// NOTE: /metrics endpoint is unauthenticated by design — in production,
// restrict access via reverse proxy or network policy (e.g. internal-only ingress).

const register = new Registry();

collectDefaultMetrics({ register });

// ── HTTP metrics ──────────────────────────────────────────

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'] as const,
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
});

const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'] as const,
  registers: [register],
});

// ── Rate limit metrics ────────────────────────────────────

const rateLimitHits = new Counter({
  name: 'rate_limit_hits_total',
  help: 'Total number of rate-limited requests',
  labelNames: ['method', 'route'] as const,
  registers: [register],
});

// ── WebSocket metrics ─────────────────────────────────────

const activeWsConnections = new Gauge({
  name: 'active_websocket_connections',
  help: 'Number of active WebSocket connections',
  registers: [register],
});

// ── Helpers ───────────────────────────────────────────────

function normalizeRoute(url: string): string {
  // Replace UUIDs and numeric IDs with :id placeholder
  return url
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
    .replace(/\/\d+/g, '/:id')
    .split('?')[0];
}

// ── Plugin ────────────────────────────────────────────────

export default fp(async (app: FastifyInstance) => {
  // Expose /metrics endpoint (no JWT required)
  app.get('/metrics', async (_req: FastifyRequest, reply: FastifyReply) => {
    reply.header('Content-Type', register.contentType);
    return register.metrics();
  });

  // Track request duration and count
  app.addHook('onRequest', async (request: FastifyRequest) => {
    (request as any).__metricsStart = process.hrtime.bigint();
  });

  app.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    const start = (request as any).__metricsStart as bigint | undefined;
    if (!start) return;

    const route = normalizeRoute(request.url);
    const method = request.method;
    const statusCode = String(reply.statusCode);
    const durationSec = Number(process.hrtime.bigint() - start) / 1e9;

    httpRequestDuration.observe({ method, route, status_code: statusCode }, durationSec);
    httpRequestsTotal.inc({ method, route, status_code: statusCode });

    // Track rate-limited responses
    if (reply.statusCode === 429) {
      rateLimitHits.inc({ method, route });
    }
  });
});

export { activeWsConnections, register };
