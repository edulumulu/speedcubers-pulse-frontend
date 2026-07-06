import api from './api.js';

function normalizeTokenResponse(data, fallbackChannelName) {
  const tokenData = data?.token ? data : data?.videoToken;

  return {
    appId: tokenData?.appId ?? import.meta.env.VITE_AGORA_APP_ID ?? '',
    channelName: tokenData?.channelName ?? tokenData?.channel ?? fallbackChannelName,
    token: tokenData?.token ?? '',
    uid: tokenData?.uid ?? tokenData?.userId ?? null,
    expiresAt: tokenData?.expiresAt ?? tokenData?.expires_at ?? null,
    quota: tokenData?.quota ?? null,
  };
}

export const videoService = {
  requestToken({ channelName }) {
    return api
      .post('/video/token', { channelName })
      .then((r) => normalizeTokenResponse(r.data, channelName));
  },
  reportUsage({ seconds }) {
    return api
      .post('/video/usage', { seconds })
      .then((r) => r.data?.quota ?? null);
  },
};
