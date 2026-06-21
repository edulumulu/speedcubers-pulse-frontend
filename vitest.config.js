import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary'],
      // Services and router are tested via integration — exclude from thresholds
      exclude: [
        'src/main.jsx',
        'src/App.jsx',
        'src/store/store.js',
        'src/services/**',
        'src/router/**',
        'src/styles/**',
        'src/test/**',
        '**/__tests__/**',
        '**/*.config.*',
        'e2e/**',
        'node_modules/**',
        'dist/**',
        'coverage/**',
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
