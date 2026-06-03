import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Kept separate from vite.config.ts so the Tauri dev-server config (fixed port,
// file watching) stays out of the test runtime.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './vitest.setup.ts',
  },
});
