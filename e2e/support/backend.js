import { expect } from '@playwright/test';

export const backendHealthUrl = process.env.E2E_BACKEND_HEALTH_URL ?? 'http://localhost:3000/health';

export async function expectBackendHealthy(request) {
  const response = await request.get(backendHealthUrl);
  expect(response.ok(), `Backend must be running at ${backendHealthUrl}`).toBe(true);
}
