import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import authReducer from '../../../store/slices/authSlice.js';
import presenceReducer from '../../../store/slices/presenceSlice.js';
import competitionReducer from '../../../store/slices/competitionSlice.js';
import challengeReducer from '../../../store/slices/challengeSlice.js';
import { PresenceConnection } from '../PresenceConnection.jsx';
import { presenceService } from '../../../services/presenceService.js';
import { presenceSocketService } from '../../../services/presenceSocketService.js';

vi.mock('../../../services/presenceService.js', () => ({
  presenceService: {
    getOnlineUsers: vi.fn(),
  },
}));

vi.mock('../../../services/presenceSocketService.js', () => ({
  presenceSocketService: {
    connect: vi.fn(),
  },
}));

function makeSocket() {
  return {
    on: vi.fn().mockReturnThis(),
    off: vi.fn().mockReturnThis(),
    emit: vi.fn().mockReturnThis(),
    disconnect: vi.fn().mockReturnThis(),
  };
}

function renderConnection(accessToken = 'token-1') {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      presence: presenceReducer,
      competition: competitionReducer,
      challenge: challengeReducer,
    },
    preloadedState: {
      auth: {
        user: { id: '1', username: 'alice' },
        accessToken,
        refreshToken: null,
        loading: false,
        error: null,
      },
      presence: { users: [], status: 'idle', socketStatus: 'idle', error: null },
      competition: { room: null, status: 'idle', error: null, result: null, resultStatus: 'idle', resultError: null },
      challenge: { incoming: null, outgoing: null, status: 'idle', error: null, notice: null },
    },
  });

  return {
    store,
    ...render(
      <Provider store={store}>
        <MemoryRouter>
          <PresenceConnection />
        </MemoryRouter>
      </Provider>,
    ),
  };
}

describe('PresenceConnection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    presenceService.getOnlineUsers.mockResolvedValue({ users: [] });
  });

  it('connects with the auth token and registers presence events', async () => {
    const socket = makeSocket();
    presenceSocketService.connect.mockReturnValue(socket);

    renderConnection();

    await waitFor(() => {
      expect(presenceSocketService.connect).toHaveBeenCalledWith({ token: 'token-1' });
    });
    expect(socket.on).toHaveBeenCalledWith('presence:online', expect.any(Function));
    expect(socket.on).toHaveBeenCalledWith('presence:offline', expect.any(Function));
    expect(socket.on).toHaveBeenCalledWith('challenge:received', expect.any(Function));
    expect(socket.on).toHaveBeenCalledWith('challenge:accepted', expect.any(Function));
    expect(socket.on).toHaveBeenCalledWith('challenge:cancelled', expect.any(Function));
  });

  it('disconnects the socket on cleanup', async () => {
    const socket = makeSocket();
    presenceSocketService.connect.mockReturnValue(socket);
    const { unmount } = renderConnection();

    await waitFor(() => {
      expect(presenceSocketService.connect).toHaveBeenCalled();
    });
    unmount();

    expect(socket.disconnect).toHaveBeenCalled();
  });
});
