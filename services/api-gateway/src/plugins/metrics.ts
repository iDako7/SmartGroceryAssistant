import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  Registry,
  Counter,
  Histogram,
  Gauge,
  Summary,
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
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'] as const,
  registers: [register],
});

// ── Upstream service metrics ──────────────────────────────

const upstreamDuration = new Histogram({
  name: 'gateway_upstream_duration_seconds',
  help: 'Duration of upstream proxy requests broken down by target service',
  labelNames: ['method', 'service', 'route', 'status_code'] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

const upstreamErrorsTotal = new Counter({
  name: 'gateway_upstream_errors_total',
  help: 'Total upstream errors (5xx responses or network failures)',
  labelNames: ['service', 'route'] as const,
  registers: [register],
});

// ── Latency percentile summary (for p50/p95/p99 reporting) ─

const latencySummary = new Summary({
  name: 'gateway_request_latency_summary',
  help: 'Request latency percentiles',
  labelNames: ['service'] as const,
  percentiles: [0.5, 0.9, 0.95, 0.99],
  registers: [register],
});

// ── Rate limit metrics ────────────────────────────────────

const rateLimitHits = new Counter({
  name: 'rate_limit_hits_total',
  help: 'Total number of rate-limited requests',
  labelNames: ['method', 'route'] as const,
  registers: [register],
});

// ── Concurrent request gauge ──────────────────────────────

const inFlightRequests = new Gauge({
  name: 'gateway_in_flight_requests',
  help: 'Number of requests currently being processed',
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
  return url
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
    .replace(/\/\d+/g, '/:id')
    .split('?')[0];
}

function resolveService(url: string): string {
  if (url.startsWith('/api/v1/users') || url.startsWith('/api/v1/auth')) return 'user-service';
  if (url.startsWith('/api/v1/lists')) return 'list-service';
  if (url.startsWith('/api/v1/ai')) return 'ai-service';
  return 'gateway';
}

// ── Plugin ────────────────────────────────────────────────

export default fp(async (app: FastifyInstance) => {
  // Expose /metrics endpoint (no JWT required)
  app.get('/metrics', async (_req: FastifyRequest, reply: FastifyReply) => {
    reply.header('Content-Type', register.contentType);
    return register.metrics();
  });

  // Track request duration, count, and in-flight
  app.addHook('onRequest', async (request: FastifyRequest) => {
    (request as any).__metricsStart = process.hrtime.bigint();
    inFlightRequests.inc();
  });

  app.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    inFlightRequests.dec();

    const start = (request as any).__metricsStart as bigint | undefined;
    if (!start) return;

    const route = normalizeRoute(request.url);
    const method = request.method;
    const statusCode = String(reply.statusCode);
    const durationSec = Number(process.hrtime.bigint() - start) / 1e9;
    const service = resolveService(request.url);

    // Overall request metrics
    httpRequestDuration.observe({ method, route, status_code: statusCode }, durationSec);
    httpRequestsTotal.inc({ method, route, status_code: statusCode });

    // Per-service upstream metrics (only for proxied routes)
    if (service !== 'gateway') {
      upstreamDuration.observe({ method, service, route, status_code: statusCode }, durationSec);
      latencySummary.observe({ service }, durationSec);

      // Track upstream errors
      if (reply.statusCode >= 500) {
        upstreamErrorsTotal.inc({ service, route });
      }
    }

    // Track rate-limited responses
    if (reply.statusCode === 429) {
      rateLimitHits.inc({ method, route });
    }
  });
});

export { activeWsConnections, register };
