import type { FastifyInstance } from 'fastify';
import { config } from '../config.js';

// No JWT required — these routes create/return tokens
export default async function authRoutes(app: FastifyInstance) {
  app.post('/api/v1/users/register', {
    config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    handler: (request, reply) =>
      reply.from(`${config.services.user}/api/v1/users/register`),
  });

  app.post('/api/v1/users/login', {
    config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    handler: (request, reply) =>
      reply.from(`${config.services.user}/api/v1/users/login`),
  });
}
