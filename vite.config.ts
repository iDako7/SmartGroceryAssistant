/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    passWithNoTests: true,
    env: {
      // Clear the API key in tests — Phase 1 tests use mock paths (setTimeout).
      // Phase 2A tests stub this per-test via vi.stubEnv().
      VITE_OPENROUTER_API_KEY: '',
    },
  },
})
