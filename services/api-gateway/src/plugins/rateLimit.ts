import fp from 'fastify-plugin';
import fastifyRateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';

export default fp(async (app: FastifyInstance) => {
  app.register(fastifyRateLimit, {
    global: true,
    max: 100,        // requests per window
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
      error: 'Too many requests',
      statusCode: 429,
    }),
  });
});
