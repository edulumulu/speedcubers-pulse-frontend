import { expect } from '@playwright/test';

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
