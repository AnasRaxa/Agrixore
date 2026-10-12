import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// The dashboard lives at /admin/ on the same site as the API, so its sign-in cookie is first-party.
// In development the API is on port 4000 and Vite forwards /api to it.
export default defineConfig({
  base: '/admin/',
  plugins: [react(), tailwindcss()],
  server: { port: 5174, proxy: { '/api': 'http://127.0.0.1:4000' } },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
