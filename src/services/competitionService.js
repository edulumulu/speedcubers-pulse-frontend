import api from './api.js';

function normalizeRoomResponse(data) {
  const roomData = data?.room ?? data?.competition ?? data?.competitionRoom ?? data;

  return {
    id: roomData?.id ?? roomData?.roomId ?? null,
    code: roomData?.code ?? roomData?.roomCode ?? roomData?.codigo ?? '',
    channelName: roomData?.channelName ?? roomData?.channel ?? roomData?.videoChannelName ?? '',
  };
}

export const competitionService = {
  createRoom() {
    return api.post('/competitions').then((r) => normalizeRoomResponse(r.data));
  },

  joinRoom({ code }) {
    return api.post('/competitions/join', { code }).then((r) => normalizeRoomResponse(r.data));
  },
};
