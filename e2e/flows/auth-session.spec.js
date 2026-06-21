import { expect, test } from '@playwright/test';
import { uniqueE2eUser } from '../fixtures/users.js';
import { expectAuthenticated, expectGuest, expectNoTokenPersistence } from '../support/session.js';

const backendHealthUrl = process.env.E2E_BACKEND_HEALTH_URL ?? 'http://localhost:3000/health';

test.describe('auth/session', () => {
  test.beforeAll(async ({ request }) => {
    const response = await request.get(backendHealthUrl);
    expect(response.ok(), `Backend must be running at ${backendHealthUrl}`).toBe(true);
  });

  test('keeps a registered user authenticated across reloads and logout', async ({ page }) => {
    const user = uniqueE2eUser();

    await page.goto('/register');
    await expect(page.getByRole('heading', { name: /crear cuenta/i })).toBeVisible();

    await page.getByLabel(/nombre de usuario/i).fill(user.username);
    await page.getByLabel(/^email$/i).fill(user.email);
    await page.getByLabel(/contraseña/i).fill(user.password);

    const availabilityResponse = page.waitForResponse((response) =>
      response.url().includes('/api/v1/auth/check') && response.request().method() === 'GET',
    );
    await page.getByRole('button', { name: /continuar/i }).click();
    expect((await availabilityResponse).ok()).toBe(true);

    await expect(page.getByLabel(/wca id/i)).toBeVisible();

    const registerResponse = page.waitForResponse((response) =>
      response.url().includes('/api/v1/auth/register') && response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: /saltar por ahora/i }).click();
    expect((await registerResponse).status()).toBe(201);

    await expectAuthenticated(page, user.username);
    await expectNoTokenPersistence(page);

    const firstRefreshResponse = page.waitForResponse((response) =>
      response.url().includes('/api/v1/auth/refresh') && response.request().method() === 'POST',
    );
    await page.reload();
    expect((await firstRefreshResponse).status()).toBe(200);
    await expectAuthenticated(page, user.username);
    await expectNoTokenPersistence(page);

    const logoutResponse = page.waitForResponse((response) =>
      response.url().includes('/api/v1/auth/logout') && response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: /salir/i }).click();
    expect((await logoutResponse).status()).toBe(204);
    await expectGuest(page);

    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: /bienvenido de nuevo/i })).toBeVisible();

    await page.getByLabel(/^email$/i).fill(user.email);
    await page.getByLabel(/contraseña/i).fill(user.password);

    const loginResponse = page.waitForResponse((response) =>
      response.url().includes('/api/v1/auth/login') && response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    expect((await loginResponse).status()).toBe(200);

    await expectAuthenticated(page, user.username);
    await expectNoTokenPersistence(page);

    const secondRefreshResponse = page.waitForResponse((response) =>
      response.url().includes('/api/v1/auth/refresh') && response.request().method() === 'POST',
    );
    await page.reload();
    expect((await secondRefreshResponse).status()).toBe(200);
    await expectAuthenticated(page, user.username);
  });
});
