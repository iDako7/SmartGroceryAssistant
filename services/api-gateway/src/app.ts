import Fastify from 'fastify';
import fastifyReplyFrom from '@fastify/reply-from';
import fastifyWebsocket from '@fastify/websocket';

import jwtPlugin from './plugins/jwt.js';
import corsPlugin from './plugins/cors.js';
import rateLimitPlugin from './plugins/rateLimit.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import listRoutes from './routes/lists.js';
import aiRoutes from './routes/ai.js';
import wsRoutes from './routes/ws.js';

export function buildApp() {
  const app = Fastify({
    logger: {
      transport: {
        target: 'pino-pretty',
        options: { colorize: true },
      },
    },
  });

  // ── Infrastructure plugins ───────────────────────────────
  app.register(corsPlugin);
  app.register(rateLimitPlugin);
  app.register(jwtPlugin);
  app.register(fastifyReplyFrom);
  app.register(fastifyWebsocket);

  // ── Health check ─────────────────────────────────────────
  app.get('/health', async () => ({ status: 'ok' }));

  // ── Routes ───────────────────────────────────────────────
  app.register(authRoutes);
  app.register(userRoutes);
  app.register(listRoutes);
  app.register(aiRoutes);
  app.register(wsRoutes);

  return app;
}
