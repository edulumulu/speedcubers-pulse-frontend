export async function enableFakeRtc(context, { uid }) {
  await context.addInitScript(() => {
    window.__SPEEDCUBERS_FAKE_RTC__ = true;
  });

  await context.route('**/api/v1/video/token', async (route) => {
    const body = route.request().postDataJSON();
    const channelName = body?.channelName ?? 'match-e2e';

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        appId: 'e2e-agora-app',
        channelName,
        token: 'e2e-token',
        uid,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        quota: {
          limitSeconds: 3600,
          usedSeconds: 0,
          remainingSeconds: 3600,
          resetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
      }),
    });
  });

  await context.route('**/api/v1/video/usage', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        quota: {
          limitSeconds: 3600,
          usedSeconds: 60,
          remainingSeconds: 3540,
          resetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
      }),
    });
  });
}
