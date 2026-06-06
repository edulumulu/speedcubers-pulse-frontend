import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary'],
      // Services and router are tested via integration — exclude from thresholds
      exclude: [
        'src/main.jsx',
        'src/services/**',
        'src/router/**',
        'src/styles/**',
        'src/test/**',
        '**/__tests__/**',
        '**/*.config.*',
        'e2e/**',
      ],
      thresholds: {
        branches: 75,
        functions: 60,
        lines: 80,
        statements: 80,
      },
    },
  },
});
