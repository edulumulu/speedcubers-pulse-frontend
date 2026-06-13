import api from './api.js';

function normalizeRoomResponse(data) {
  const roomData = data?.room ?? data?.competition ?? data?.competitionRoom ?? data;

  return {
    id: roomData?.id ?? roomData?.roomId ?? null,
    code: roomData?.code ?? roomData?.roomCode ?? roomData?.codigo ?? '',
    channelName: roomData?.channelName ?? roomData?.channel ?? roomData?.videoChannelName ?? '',
    status: roomData?.status ?? 'waiting',
    host: roomData?.host ?? null,
    guest: roomData?.guest ?? null,
    activeRound: roomData?.activeRound ?? null,
    latestCompletedRound: roomData?.latestCompletedRound ?? null,
  };
}

function normalizeResultResponse(data) {
  return data?.result ?? data;
}

export const competitionService = {
  createRoom() {
    return api.post('/competitions').then((r) => normalizeRoomResponse(r.data));
  },

  joinRoom({ code }) {
    return api.post('/competitions/join', { code }).then((r) => normalizeRoomResponse(r.data));
  },

  getRoom({ code }) {
    return api.get(`/competitions/${code}`).then((r) => normalizeRoomResponse(r.data));
  },

  submitResult({ code, timeMs, penalty = 'none' }) {
    return api
      .post(`/competitions/${code}/results`, { timeMs, penalty })
      .then((r) => normalizeResultResponse(r.data));
  },
};
