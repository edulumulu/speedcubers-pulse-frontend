import api from './api.js';

function normalizeRoomResponse(data) {
  const roomData = data?.room ?? data?.competition ?? data?.competitionRoom ?? data;

  return {
    id: roomData?.id ?? roomData?.roomId ?? null,
    code: roomData?.code ?? roomData?.roomCode ?? roomData?.codigo ?? '',
    channelName: roomData?.channelName ?? roomData?.channel ?? roomData?.videoChannelName ?? '',
    event: roomData?.event ?? '3x3',
    status: roomData?.status ?? 'waiting',
    host: roomData?.host ?? null,
    guest: roomData?.guest ?? null,
    activeRound: roomData?.activeRound ?? null,
    latestCompletedRound: roomData?.latestCompletedRound ?? null,
    matchScore: roomData?.matchScore ?? null,
  };
}

function normalizeResultResponse(data) {
  return data?.result ?? data;
}

export const competitionService = {
  createRoom({ event = '3x3' } = {}) {
    return api.post('/competitions', { event }).then((r) => normalizeRoomResponse(r.data));
  },

  joinRoom({ code }) {
    return api.post('/competitions/join', { code }).then((r) => normalizeRoomResponse(r.data));
  },

  getRoom({ code }) {
    return api.get(`/competitions/${code}`).then((r) => normalizeRoomResponse(r.data));
  },

  updateRoundEvent({ code, event }) {
    return api.patch(`/competitions/${code}/round/event`, { event }).then((r) => normalizeRoomResponse(r.data));
  },

  submitResult({ code, timeMs, penalty = 'none' }) {
    return api
      .post(`/competitions/${code}/results`, { timeMs, penalty })
      .then((r) => normalizeResultResponse(r.data));
  },
};
