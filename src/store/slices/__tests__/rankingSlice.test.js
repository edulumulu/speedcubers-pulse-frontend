import { configureStore } from '@reduxjs/toolkit';
import rankingReducer, { setEvent, fetchRanking } from '../rankingSlice.js';

const makeStore = (preloaded = {}) =>
  configureStore({
    reducer: { ranking: rankingReducer },
    preloadedState: { ranking: { data: [], event: '3x3', status: 'idle', error: null, ...preloaded } },
  });

describe('rankingSlice reducers', () => {
  it('initial state has correct defaults', () => {
    const store = makeStore();
    const state = store.getState().ranking;
    expect(state.data).toEqual([]);
    expect(state.event).toBe('3x3');
    expect(state.status).toBe('idle');
    expect(state.error).toBeNull();
  });

  it('setEvent changes event and resets data and status', () => {
    const store = makeStore({ data: [{ position: 1 }], status: 'succeeded' });
    store.dispatch(setEvent('2x2'));
    const state = store.getState().ranking;
    expect(state.event).toBe('2x2');
    expect(state.data).toEqual([]);
    expect(state.status).toBe('idle');
  });

  it('fetchRanking.pending sets status to loading', () => {
    const store = makeStore();
    store.dispatch(fetchRanking.pending('', '3x3'));
    expect(store.getState().ranking.status).toBe('loading');
    expect(store.getState().ranking.error).toBeNull();
  });

  it('fetchRanking.fulfilled stores data and event', () => {
    const store = makeStore();
    const payload = { event: '2x2', ranking: [{ position: 1, username: 'top', elo: 1200 }] };
    store.dispatch(fetchRanking.fulfilled(payload, '', '2x2'));
    const state = store.getState().ranking;
    expect(state.status).toBe('succeeded');
    expect(state.data).toHaveLength(1);
    expect(state.data[0].username).toBe('top');
    expect(state.event).toBe('2x2');
  });

  it('fetchRanking.rejected stores error and sets failed status', () => {
    const store = makeStore();
    store.dispatch(fetchRanking.rejected(null, '', '3x3', 'Error al cargar el ranking'));
    const state = store.getState().ranking;
    expect(state.status).toBe('failed');
    expect(state.error).toBe('Error al cargar el ranking');
  });
});
