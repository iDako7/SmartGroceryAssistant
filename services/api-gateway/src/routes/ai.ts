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

  app.post('/api/v1/ai/inspire/item', {
    onRequest: auth,
    handler: (_req: FastifyRequest, reply: FastifyReply) =>
      reply.from(upstream('/api/v1/ai/inspire/item')),
  });

  app.post('/api/v1/ai/clarify', {
    onRequest: auth,
    handler: (_req: FastifyRequest, reply: FastifyReply) =>
      reply.from(upstream('/api/v1/ai/clarify')),
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

  app.get('/api/v1/ai/jobs/:id', {
    onRequest: auth,
    handler: (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) =>
      reply.from(upstream(`/api/v1/ai/jobs/${req.params.id}`)),
  });
}
