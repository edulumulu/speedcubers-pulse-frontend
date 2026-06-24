import { expect, request } from '@playwright/test';

const apiUrl = process.env.E2E_API_URL ?? 'http://localhost:3000/api/v1';
const frontendUrl = process.env.E2E_BASE_URL ?? 'http://localhost:5173';

export async function expectNoTokenPersistence(page) {
  const storageKeys = await page.evaluate(() => ({
    localStorage: Object.keys(window.localStorage),
    sessionStorage: Object.keys(window.sessionStorage),
  }));

  expect(storageKeys.localStorage.filter((key) => /token/i.test(key))).toEqual([]);
  expect(storageKeys.sessionStorage.filter((key) => /token/i.test(key))).toEqual([]);
}

export async function expectAuthenticated(page, username) {
  const navigation = page.getByRole('navigation');

  await expect(page.getByRole('heading', { name: /ranking/i })).toBeVisible();
  await expect(navigation.getByRole('link', { name: username })).toBeVisible();
  await expect(navigation.getByRole('button', { name: /salir/i })).toBeVisible();
  await expect(navigation.getByRole('link', { name: /competir/i })).toBeVisible();
  await expect(navigation.getByRole('link', { name: /^login$/i })).toBeHidden();
}

export async function expectGuest(page) {
  const navigation = page.getByRole('navigation');

  await expect(navigation.getByRole('link', { name: /^login$/i })).toBeVisible();
  await expect(navigation.getByRole('link', { name: /registro/i })).toBeVisible();
  await expect(navigation.getByRole('button', { name: /salir/i })).toBeHidden();
}

export async function registerAuthenticatedPage(browser, user) {
  const api = await request.newContext({ baseURL: `${apiUrl}/` });
  const registerResponse = await api.post('auth/register', { data: user });
  expect(registerResponse.status()).toBe(201);

  const context = await browser.newContext({
    baseURL: frontendUrl,
    storageState: await api.storageState(),
  });
  const page = await context.newPage();

  const refreshResponse = page.waitForResponse((response) =>
    response.url().includes('/api/v1/auth/refresh') && response.request().method() === 'POST',
  );
  await page.goto('/');
  expect((await refreshResponse).status()).toBe(200);
  await expectAuthenticated(page, user.username);
  await expectNoTokenPersistence(page);

  await api.dispose();
  return { context, page };
}
