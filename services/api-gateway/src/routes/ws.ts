import type { FastifyInstance } from 'fastify';
import { WebSocket } from 'ws';
import { config } from '../config.js';

export default async function wsRoutes(app: FastifyInstance) {
  app.get('/ws', { websocket: true }, (socket, request) => {
    // Verify JWT from query param or first message
    const token = (request.query as Record<string, string>)['token'];
    if (!token) {
      socket.close(1008, 'Missing token');
      return;
    }

    try {
      app.jwt.verify(token);
    } catch {
      socket.close(1008, 'Invalid token');
      return;
    }

    // Open upstream connection to list-service WebSocket
    const upstream = new WebSocket(`${config.services.list.replace('http', 'ws')}/ws`);

    upstream.on('message', (data: Buffer) => socket.send(data));
    socket.on('message', (data: Buffer) => upstream.send(data));

    socket.on('close', () => upstream.close());
    upstream.on('close', () => socket.close());

    upstream.on('error', () => socket.close(1011, 'Upstream error'));
  });
}
