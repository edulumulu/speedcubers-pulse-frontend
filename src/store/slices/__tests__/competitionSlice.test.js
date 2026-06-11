import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import competitionReducer, {
  clearCompetitionError,
  createCompetitionRoom,
  joinCompetitionRoom,
  leaveCompetitionRoom,
} from '../competitionSlice.js';
import { competitionService } from '../../../services/competitionService.js';

vi.mock('../../../services/competitionService.js', () => ({
  competitionService: {
    createRoom: vi.fn(),
    joinRoom: vi.fn(),
  },
}));

const room = {
  id: 'room-1',
  code: 'ABC123',
  channelName: 'match-test',
};

const makeStore = (preloaded = {}) =>
  configureStore({
    reducer: { competition: competitionReducer },
    preloadedState: { competition: { room: null, status: 'idle', error: null, ...preloaded } },
  });

describe('competitionSlice reducers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initial state has correct defaults', () => {
    const store = makeStore();
    expect(store.getState().competition).toEqual({
      room: null,
      status: 'idle',
      error: null,
    });
  });

  it('leaveCompetitionRoom resets room state', () => {
    const store = makeStore({ room, status: 'ready', error: 'old error' });

    store.dispatch(leaveCompetitionRoom());

    expect(store.getState().competition).toEqual({
      room: null,
      status: 'idle',
      error: null,
    });
  });

  it('clearCompetitionError clears only the error field', () => {
    const store = makeStore({ room, status: 'ready', error: 'old error' });

    store.dispatch(clearCompetitionError());

    expect(store.getState().competition).toEqual({
      room,
      status: 'ready',
      error: null,
    });
  });

  it('createCompetitionRoom stores a created room', async () => {
    competitionService.createRoom.mockResolvedValueOnce(room);
    const store = makeStore();

    await store.dispatch(createCompetitionRoom());

    expect(competitionService.createRoom).toHaveBeenCalledTimes(1);
    expect(store.getState().competition).toEqual({
      room,
      status: 'ready',
      error: null,
    });
  });

  it('joinCompetitionRoom stores a joined room', async () => {
    competitionService.joinRoom.mockResolvedValueOnce(room);
    const store = makeStore();

    await store.dispatch(joinCompetitionRoom({ code: 'ABC123' }));

    expect(competitionService.joinRoom).toHaveBeenCalledWith({ code: 'ABC123' });
    expect(store.getState().competition).toEqual({
      room,
      status: 'ready',
      error: null,
    });
  });

  it('stores service errors when create fails', async () => {
    competitionService.createRoom.mockRejectedValueOnce({
      response: { data: { error: 'Sala no disponible' } },
    });
    const store = makeStore();

    await store.dispatch(createCompetitionRoom());

    expect(store.getState().competition).toEqual({
      room: null,
      status: 'failed',
      error: 'Sala no disponible',
    });
  });

  it('uses a fallback error when join fails without response details', async () => {
    competitionService.joinRoom.mockRejectedValueOnce(new Error('Network error'));
    const store = makeStore();

    await store.dispatch(joinCompetitionRoom({ code: 'ABC123' }));

    expect(store.getState().competition).toEqual({
      room: null,
      status: 'failed',
      error: 'Error al preparar la sala de competencia',
    });
  });
});
