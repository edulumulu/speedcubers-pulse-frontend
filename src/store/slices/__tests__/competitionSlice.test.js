import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import competitionReducer, {
  clearCompetitionError,
  createCompetitionRoom,
  joinCompetitionRoom,
  leaveCompetitionRoom,
  refreshCompetitionRoom,
  submitCompetitionResult,
  updateCompetitionRoundEvent,
} from '../competitionSlice.js';
import { competitionService } from '../../../services/competitionService.js';

vi.mock('../../../services/competitionService.js', () => ({
  competitionService: {
    createRoom: vi.fn(),
    getRoom: vi.fn(),
    joinRoom: vi.fn(),
    submitResult: vi.fn(),
    updateRoundEvent: vi.fn(),
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
    preloadedState: {
      competition: {
        room: null,
        status: 'idle',
        error: null,
        result: null,
        resultStatus: 'idle',
        resultError: null,
        ...preloaded,
      },
    },
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
      result: null,
      resultStatus: 'idle',
      resultError: null,
    });
  });

  it('leaveCompetitionRoom resets room state', () => {
    const store = makeStore({
      room,
      status: 'ready',
      error: 'old error',
      result: { id: 'result-1' },
      resultStatus: 'ready',
      resultError: 'old result error',
    });

    store.dispatch(leaveCompetitionRoom());

    expect(store.getState().competition).toEqual({
      room: null,
      status: 'idle',
      error: null,
      result: null,
      resultStatus: 'idle',
      resultError: null,
    });
  });

  it('clearCompetitionError clears only the error field', () => {
    const result = { id: 'result-1' };
    const store = makeStore({
      room,
      status: 'ready',
      error: 'old error',
      result,
      resultStatus: 'ready',
      resultError: 'old result error',
    });

    store.dispatch(clearCompetitionError());

    expect(store.getState().competition).toEqual({
      room,
      status: 'ready',
      error: null,
      result,
      resultStatus: 'ready',
      resultError: null,
    });
  });

  it('createCompetitionRoom stores a created room', async () => {
    competitionService.createRoom.mockResolvedValueOnce(room);
    const store = makeStore();

    await store.dispatch(createCompetitionRoom());

    expect(competitionService.createRoom).toHaveBeenCalledWith({ event: '3x3' });
    expect(store.getState().competition).toEqual({
      room,
      status: 'ready',
      error: null,
      result: null,
      resultStatus: 'idle',
      resultError: null,
    });
  });

  it('updateCompetitionRoundEvent stores the updated room snapshot', async () => {
    const nextRoom = { ...room, activeRound: { id: 'round-1', number: 1, event: '2x2', scramble: 'R U F' } };
    competitionService.updateRoundEvent.mockResolvedValueOnce(nextRoom);
    const store = makeStore({ room, status: 'ready' });

    await store.dispatch(updateCompetitionRoundEvent({ code: 'ABC123', event: '2x2' }));

    expect(competitionService.updateRoundEvent).toHaveBeenCalledWith({ code: 'ABC123', event: '2x2' });
    expect(store.getState().competition).toMatchObject({
      room: nextRoom,
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
      result: null,
      resultStatus: 'idle',
      resultError: null,
    });
  });

  it('refreshCompetitionRoom updates the current room snapshot', async () => {
    const activeRoom = { ...room, status: 'active' };
    competitionService.getRoom.mockResolvedValueOnce(activeRoom);
    const store = makeStore({ room, status: 'ready' });

    await store.dispatch(refreshCompetitionRoom({ code: 'ABC123' }));

    expect(competitionService.getRoom).toHaveBeenCalledWith({ code: 'ABC123' });
    expect(store.getState().competition).toEqual({
      room: activeRoom,
      status: 'ready',
      error: null,
      result: null,
      resultStatus: 'idle',
      resultError: null,
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
      result: null,
      resultStatus: 'idle',
      resultError: null,
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
      result: null,
      resultStatus: 'idle',
      resultError: null,
    });
  });

  it('submitCompetitionResult stores the submitted result without changing room state', async () => {
    const result = { id: 'result-1', timeMs: 12345, penalty: 'none' };
    competitionService.submitResult.mockResolvedValueOnce(result);
    const store = makeStore({ room, status: 'ready' });

    await store.dispatch(submitCompetitionResult({ code: 'ABC123', timeMs: 12345, penalty: 'none' }));

    expect(competitionService.submitResult).toHaveBeenCalledWith({
      code: 'ABC123',
      timeMs: 12345,
      penalty: 'none',
    });
    expect(store.getState().competition).toEqual({
      room,
      status: 'ready',
      error: null,
      result,
      resultStatus: 'ready',
      resultError: null,
    });
  });

  it('advances active round when submitted result closes the round', async () => {
    const nextRound = { id: 'round-2', number: 2, status: 'active' };
    const result = {
      id: 'result-2',
      timeMs: 13000,
      penalty: 'none',
      round: { id: 'round-1', number: 1 },
      roundResolution: { status: 'completed', winner: { username: 'host' } },
      nextRound,
    };
    competitionService.submitResult.mockResolvedValueOnce(result);
    const store = makeStore({
      room: { ...room, activeRound: { id: 'round-1', number: 1, status: 'active' } },
      status: 'ready',
    });

    await store.dispatch(submitCompetitionResult({ code: 'ABC123', timeMs: 13000, penalty: 'none' }));

    expect(store.getState().competition.room.activeRound).toEqual(nextRound);
    expect(store.getState().competition.room.latestCompletedRound).toMatchObject({
      id: 'round-1',
      number: 1,
      status: 'completed',
      resolution: result.roundResolution,
    });
  });

  it('clears submitted result when refresh sees a newer active round', async () => {
    const nextRoom = { ...room, activeRound: { id: 'round-2', number: 2, status: 'active' } };
    competitionService.getRoom.mockResolvedValueOnce(nextRoom);
    const store = makeStore({
      room: { ...room, activeRound: { id: 'round-1', number: 1, status: 'active' } },
      status: 'ready',
      result: { id: 'result-1', round: { id: 'round-1', number: 1 } },
      resultStatus: 'ready',
    });

    await store.dispatch(refreshCompetitionRoom({ code: 'ABC123' }));

    expect(store.getState().competition).toMatchObject({
      room: nextRoom,
      result: null,
      resultStatus: 'idle',
      resultError: null,
    });
  });

  it('stores a result error when submit fails', async () => {
    competitionService.submitResult.mockRejectedValueOnce({
      response: { data: { error: 'Resultado duplicado' } },
    });
    const store = makeStore({ room, status: 'ready' });

    await store.dispatch(submitCompetitionResult({ code: 'ABC123', timeMs: null, penalty: 'dnf' }));

    expect(store.getState().competition).toEqual({
      room,
      status: 'ready',
      error: null,
      result: null,
      resultStatus: 'failed',
      resultError: 'Resultado duplicado',
    });
  });
});
