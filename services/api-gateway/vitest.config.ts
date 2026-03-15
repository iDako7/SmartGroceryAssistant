import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: {
      JWT_SECRET: 'test-secret',
      USER_SERVICE_URL: 'http://localhost:49001',
      LIST_SERVICE_URL: 'http://localhost:49002',
      AI_SERVICE_URL: 'http://localhost:49003',
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      // Handle .js extension imports in TypeScript source
    },
  },
});
