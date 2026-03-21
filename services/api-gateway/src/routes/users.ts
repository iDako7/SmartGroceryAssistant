import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../config.js';

export default async function userRoutes(app: FastifyInstance) {
  const auth = [app.authenticate];

  app.get('/api/v1/users/me', {
    onRequest: auth,
    handler: (_req: FastifyRequest, reply: FastifyReply) =>
      reply.from(`${config.services.user}/api/v1/users/me`),
  });

  app.put('/api/v1/users/me', {
    onRequest: auth,
    handler: (_req: FastifyRequest, reply: FastifyReply) =>
      reply.from(`${config.services.user}/api/v1/users/me`),
  });
}
