import { io } from 'socket.io-client';

let activeSocket = null;

function socketUrl() {
  if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;
  if (!import.meta.env.VITE_API_URL) return 'http://localhost:3000';

  try {
    return new URL(import.meta.env.VITE_API_URL).origin;
  } catch {
    return 'http://localhost:3000';
  }
}

function testSocket() {
  const handlers = new Map();
  const socket = {
    connected: false,
    on(event, handler) {
      handlers.set(event, handler);
      return this;
    },
    off(event) {
      handlers.delete(event);
      return this;
    },
    emit(_event, _payload, ack) {
      if (ack) ack({ ok: true });
      return this;
    },
    disconnect() {
      handlers.clear();
      if (activeSocket === this) activeSocket = null;
      return this;
    },
    trigger(event, payload) {
      const handler = handlers.get(event);
      if (handler) handler(payload);
      return this;
    },
  };

  return socket;
}

function emitWithAck(event, payload) {
  return new Promise((resolve, reject) => {
    if (!activeSocket) {
      reject(new Error('Socket not connected'));
      return;
    }

    activeSocket.emit(event, payload, (response = {}) => {
      if (response.ok) {
        resolve(response);
        return;
      }
      reject(new Error(response.message || response.error || 'Socket request failed'));
    });
  });
}

export const presenceSocketService = {
  connect({ token }) {
    if (import.meta.env.MODE === 'test') {
      activeSocket = testSocket();
      return activeSocket;
    }

    activeSocket = io(socketUrl(), {
      auth: { token },
      transports: ['websocket'],
      autoConnect: true,
    });
    return activeSocket;
  },

  sendChallenge({ challengedUserId, event = '3x3' }) {
    return emitWithAck('challenge:send', { challengedUserId, event });
  },

  acceptChallenge({ challengeId }) {
    return emitWithAck('challenge:accept', { challengeId });
  },

  rejectChallenge({ challengeId }) {
    return emitWithAck('challenge:reject', { challengeId });
  },

  cancelChallenge({ challengeId }) {
    return emitWithAck('challenge:cancel', { challengeId });
  },
};
