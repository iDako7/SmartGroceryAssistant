import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../config.js';

const upstream = (path: string) => `${config.services.ai}${path}`;

export default async function aiRoutes(app: FastifyInstance) {
  const auth = [app.authenticate];

  app.post('/api/v1/ai/suggest', {
    onRequest: auth,
    handler: (_req: FastifyRequest, reply: FastifyReply) =>
      reply.from(upstream('/api/v1/ai/suggest')),
  });

  app.post('/api/v1/ai/inspire', {
    onRequest: auth,
    handler: (_req: FastifyRequest, reply: FastifyReply) =>
      reply.from(upstream('/api/v1/ai/inspire')),
  });

  app.post('/api/v1/ai/translate', {
    onRequest: auth,
    handler: (_req: FastifyRequest, reply: FastifyReply) =>
      reply.from(upstream('/api/v1/ai/translate')),
  });

  app.post('/api/v1/ai/item-info', {
    onRequest: auth,
    handler: (_req: FastifyRequest, reply: FastifyReply) =>
      reply.from(upstream('/api/v1/ai/item-info')),
  });

  app.post('/api/v1/ai/alternatives', {
    onRequest: auth,
    handler: (_req: FastifyRequest, reply: FastifyReply) =>
      reply.from(upstream('/api/v1/ai/alternatives')),
  });
}
