import { expect, test } from '@playwright/test';
import { uniqueE2eUser } from '../fixtures/users.js';
import { expectBackendHealthy } from '../support/backend.js';
import { registerAuthenticatedPage } from '../support/session.js';
import { enableFakeRtc } from '../support/video.js';

async function submitOkResult(page, code) {
  await page.getByTestId('timer-toggle-button').click();
  await expect(page.getByTestId('timer-status')).toHaveText('Inspección');
  await page.getByTestId('timer-toggle-button').click();
  await expect(page.getByTestId('timer-status')).toHaveText('Cronometrando');
  await page.waitForTimeout(100);
  await page.getByTestId('timer-toggle-button').click();
  await expect(page.getByTestId('submit-ok-button')).toBeVisible();

  const resultResponse = page.waitForResponse((response) =>
    response.url().includes(`/api/v1/competitions/${code}/results`)
    && response.request().method() === 'POST',
  );
  await page.getByTestId('submit-ok-button').click();

  const response = await resultResponse;
  expect(response.status()).toBe(201);
  return (await response.json()).result;
}

test.describe('competition 1v1', () => {
  test.beforeAll(async ({ request }) => {
    await expectBackendHealthy(request);
  });

  test('creates a room, joins with a rival and resolves the first round', async ({ browser }) => {
    const hostUser = uniqueE2eUser();
    const guestUser = uniqueE2eUser();
    const host = await registerAuthenticatedPage(browser, hostUser);
    const guest = await registerAuthenticatedPage(browser, guestUser);

    try {
      await enableFakeRtc(host.context, { uid: 101 });
      await enableFakeRtc(guest.context, { uid: 202 });

      await host.page.goto('/compete');
      await expect(host.page.getByTestId('compete-page')).toBeVisible();

      const createResponse = host.page.waitForResponse((response) =>
        response.url().endsWith('/api/v1/competitions') && response.request().method() === 'POST',
      );
      await host.page.getByTestId('create-room-button').click();

      const createPayload = await (await createResponse).json();
      const code = createPayload.competition.code;

      await expect(host.page.getByTestId('room-title')).toHaveText(`Sala ${code}`);
      await expect(host.page.getByTestId('room-code')).toHaveText(code);
      await expect(host.page.getByTestId('room-channel')).toHaveText(`match-${code.toLowerCase()}`);
      await expect(host.page.getByTestId('rtc-status')).toHaveText('En directo');
      await expect(host.page.getByRole('heading', { name: /esperando rival/i })).toBeVisible();

      await guest.page.goto('/compete');
      await expect(guest.page.getByTestId('compete-page')).toBeVisible();

      const joinResponse = guest.page.waitForResponse((response) =>
        response.url().includes('/api/v1/competitions/join') && response.request().method() === 'POST',
      );
      await guest.page.getByLabel(/código de sala/i).fill(code.toLowerCase());
      await guest.page.getByTestId('join-room-button').click();

      const joinPayload = await (await joinResponse).json();
      expect(joinPayload.competition.status).toBe('active');
      expect(joinPayload.competition.host.username).toBe(hostUser.username);
      expect(joinPayload.competition.guest.username).toBe(guestUser.username);

      await expect(guest.page.getByTestId('room-title')).toContainText('Sala 1v1');
      await expect(guest.page.getByTestId('room-code')).toHaveText(code);
      await expect(guest.page.getByTestId('competition-timer')).toBeVisible();
      await expect(guest.page.getByTestId('rtc-status')).toHaveText('En directo');

      const refreshResponse = host.page.waitForResponse((response) =>
        response.url().includes(`/api/v1/competitions/${code}`) && response.request().method() === 'GET',
      );
      await host.page.getByTestId('refresh-room-button').click();
      expect((await refreshResponse).status()).toBe(200);
      await expect(host.page.getByTestId('competition-timer')).toBeVisible();

      const hostResult = await submitOkResult(host.page, code);
      expect(hostResult.round.number).toBe(1);
      expect(hostResult.roundResolution).toBeNull();
      expect(hostResult.nextRound).toBeNull();
      await expect(host.page.getByTestId('waiting-opponent-message')).toBeVisible();

      const guestResult = await submitOkResult(guest.page, code);
      expect(guestResult.round.number).toBe(1);
      expect(guestResult.roundResolution.status).toMatch(/completed|draw/);
      expect(guestResult.nextRound.number).toBe(2);

      await expect(guest.page.getByTestId('round-resolution')).toBeVisible();
      await expect(host.page.getByTestId('room-title')).toContainText('Ronda 2', { timeout: 8_000 });
      await expect(host.page.getByTestId('round-resolution')).toBeVisible();
    } finally {
      await Promise.all([
        host.context.close(),
        guest.context.close(),
      ]);
    }
  });
});
