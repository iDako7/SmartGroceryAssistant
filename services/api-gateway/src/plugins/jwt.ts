import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../config.js';

export default fp(async (app: FastifyInstance) => {
  app.register(fastifyJwt, { secret: config.jwt.secret });

  // Decorate with a reusable auth hook — add to any route that needs JWT
  app.decorate(
    'authenticate',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch {
        reply.code(401).send({ error: 'Unauthorized' });
      }
    }
  );
});

// Augment FastifyInstance so TypeScript knows about `authenticate`
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
