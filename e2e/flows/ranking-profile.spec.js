import { expect, test } from '@playwright/test';
import { expectBackendHealthy } from '../support/backend.js';

test.describe('ranking/profile', () => {
  test.beforeAll(async ({ request }) => {
    await expectBackendHealthy(request);
  });

  test('shows public ranking and filters by event', async ({ page }) => {
    const initialRankingResponse = page.waitForResponse((response) =>
      response.url().includes('/api/v1/ranking')
      && response.url().includes('event=3x3')
      && response.request().method() === 'GET',
    );

    await page.goto('/');

    expect((await initialRankingResponse).ok()).toBe(true);
    await expect(page.getByRole('heading', { name: /^ranking$/i })).toBeVisible();
    await expect(page.getByText(/top 100 speedcubers por elo/i)).toBeVisible();

    const userLinks = page.locator('a[href^="/users/"]');
    await expect(userLinks.first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'edulumulu' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'margallego' })).toBeVisible();
    await expect(page.getByText('2022LUCA04')).toBeVisible();

    const eventResponse = page.waitForResponse((response) =>
      response.url().includes('/api/v1/ranking')
      && response.url().includes('event=2x2')
      && response.request().method() === 'GET',
    );
    await page.getByRole('button', { name: '2x2' }).click();

    expect((await eventResponse).ok()).toBe(true);
    await expect(page.getByRole('button', { name: '2x2' })).toHaveAttribute('aria-pressed', 'true');
    await expect(userLinks.first()).toBeVisible();
  });

  test('opens a public profile from the ranking', async ({ page }) => {
    const rankingResponse = page.waitForResponse((response) =>
      response.url().includes('/api/v1/ranking')
      && response.request().method() === 'GET',
    );

    await page.goto('/');
    expect((await rankingResponse).ok()).toBe(true);

    const profileLink = page.getByRole('link', { name: 'margallego' });
    await expect(profileLink).toHaveAttribute('href', '/users/margallego');

    const profileResponse = page.waitForResponse((response) =>
      response.url().includes('/api/v1/users/margallego')
      && response.request().method() === 'GET',
    );
    await profileLink.click();

    expect((await profileResponse).ok()).toBe(true);
    await expect(page).toHaveURL(/\/users\/margallego$/);
    await expect(page.getByRole('heading', { name: 'margallego' })).toBeVisible();
    await expect(page.getByText('2013VICE01')).toBeVisible();
    await expect(page.getByText(/mar@mar\.com/i)).toBeHidden();
  });
});
