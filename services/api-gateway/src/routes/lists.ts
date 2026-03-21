import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../config.js';

const upstream = (path: string) => `${config.services.list}${path}`;

export default async function listRoutes(app: FastifyInstance) {
  const auth = [app.authenticate];

  app.get('/api/v1/lists/full', {
    onRequest: auth,
    handler: (_req: FastifyRequest, reply: FastifyReply) =>
      reply.from(upstream('/api/v1/lists/full')),
  });

  app.get('/api/v1/lists/sections', {
    onRequest: auth,
    handler: (_req: FastifyRequest, reply: FastifyReply) =>
      reply.from(upstream('/api/v1/lists/sections')),
  });

  app.post('/api/v1/lists/sections', {
    onRequest: auth,
    handler: (_req: FastifyRequest, reply: FastifyReply) =>
      reply.from(upstream('/api/v1/lists/sections')),
  });

  app.put('/api/v1/lists/sections/:id', {
    onRequest: auth,
    handler: (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) =>
      reply.from(upstream(`/api/v1/lists/sections/${req.params.id}`)),
  });

  app.delete('/api/v1/lists/sections/:id', {
    onRequest: auth,
    handler: (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) =>
      reply.from(upstream(`/api/v1/lists/sections/${req.params.id}`)),
  });

  app.get('/api/v1/lists/sections/:id/items', {
    onRequest: auth,
    handler: (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) =>
      reply.from(upstream(`/api/v1/lists/sections/${req.params.id}/items`)),
  });

  app.post('/api/v1/lists/sections/:id/items', {
    onRequest: auth,
    handler: (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) =>
      reply.from(upstream(`/api/v1/lists/sections/${req.params.id}/items`)),
  });

  app.put('/api/v1/lists/items/:id', {
    onRequest: auth,
    handler: (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) =>
      reply.from(upstream(`/api/v1/lists/items/${req.params.id}`)),
  });

  app.delete('/api/v1/lists/items/:id', {
    onRequest: auth,
    handler: (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) =>
      reply.from(upstream(`/api/v1/lists/items/${req.params.id}`)),
  });
}
