import { defineConfig, devices } from '@playwright/test';

const frontendUrl = process.env.E2E_BASE_URL ?? 'http://localhost:5173';
const apiUrl = process.env.E2E_API_URL ?? 'http://localhost:3000/api/v1';
const socketUrl = process.env.E2E_SOCKET_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  workers: 1,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: false,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],
  use: {
    baseURL: frontendUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --host localhost',
    url: frontendUrl,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      ...process.env,
      VITE_API_URL: apiUrl,
      VITE_SOCKET_URL: socketUrl,
      VITE_AGORA_APP_ID: process.env.VITE_AGORA_APP_ID ?? '',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
