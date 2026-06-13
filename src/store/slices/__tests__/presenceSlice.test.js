import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import presenceReducer, {
  fetchOnlineUsers,
  onlineUserReceived,
  onlineUserRemoved,
  presenceConnected,
  presenceConnecting,
  presenceDisconnected,
} from '../presenceSlice.js';
import { presenceService } from '../../../services/presenceService.js';

vi.mock('../../../services/presenceService.js', () => ({
  presenceService: {
    getOnlineUsers: vi.fn(),
  },
}));

const makeStore = (preloaded = {}) =>
  configureStore({
    reducer: { presence: presenceReducer },
    preloadedState: {
      presence: {
        users: [],
        status: 'idle',
        socketStatus: 'idle',
        error: null,
        ...preloaded,
      },
    },
  });

describe('presenceSlice', () => {
  beforeEach(() => vi.clearAllMocks());

  it('stores fetched online users', async () => {
    presenceService.getOnlineUsers.mockResolvedValueOnce({
      users: [{ id: '1', username: 'alice' }],
    });
    const store = makeStore();

    await store.dispatch(fetchOnlineUsers());

    expect(store.getState().presence).toMatchObject({
      users: [{ id: '1', username: 'alice' }],
      status: 'succeeded',
      error: null,
    });
  });

  it('upserts online users sorted by username', () => {
    const store = makeStore({ users: [{ id: '2', username: 'zoe' }] });

    store.dispatch(onlineUserReceived({ id: '1', username: 'alice' }));
    store.dispatch(onlineUserReceived({ id: '2', username: 'zoe-updated' }));

    expect(store.getState().presence.users).toEqual([
      { id: '1', username: 'alice' },
      { id: '2', username: 'zoe-updated' },
    ]);
  });

  it('removes offline users', () => {
    const store = makeStore({
      users: [
        { id: '1', username: 'alice' },
        { id: '2', username: 'zoe' },
      ],
    });

    store.dispatch(onlineUserRemoved({ id: '1' }));

    expect(store.getState().presence.users).toEqual([{ id: '2', username: 'zoe' }]);
  });

  it('tracks socket status', () => {
    const store = makeStore();

    store.dispatch(presenceConnecting());
    expect(store.getState().presence.socketStatus).toBe('connecting');

    store.dispatch(presenceConnected());
    expect(store.getState().presence.socketStatus).toBe('connected');

    store.dispatch(presenceDisconnected());
    expect(store.getState().presence).toMatchObject({ socketStatus: 'idle', users: [] });
  });
});
