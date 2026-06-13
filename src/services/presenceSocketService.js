import { io } from 'socket.io-client';

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
  return {
    connected: false,
    on(event, handler) {
      handlers.set(event, handler);
      return this;
    },
    off(event) {
      handlers.delete(event);
      return this;
    },
    emit() {
      return this;
    },
    disconnect() {
      handlers.clear();
      return this;
    },
  };
}

export const presenceSocketService = {
  connect({ token }) {
    if (import.meta.env.MODE === 'test') return testSocket();

    return io(socketUrl(), {
      auth: { token },
      transports: ['websocket'],
      autoConnect: true,
    });
  },
};
