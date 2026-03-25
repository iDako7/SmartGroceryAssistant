import 'dotenv/config';

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

export const config = {
  port: Number(process.env.API_GATEWAY_PORT ?? 3001),
  host: process.env.HOST ?? '0.0.0.0',

  jwt: {
    secret: required('JWT_SECRET'),
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },

  services: {
    user: process.env.USER_SERVICE_URL ?? 'http://localhost:4001',
    list: process.env.LIST_SERVICE_URL ?? 'http://localhost:4002',
    ai:   process.env.AI_SERVICE_URL   ?? 'http://localhost:4003',
  },
} as const;
