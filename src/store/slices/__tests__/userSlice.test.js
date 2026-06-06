import { configureStore } from '@reduxjs/toolkit';
import userReducer, {
  updateMe,
  deleteMe,
  fetchMe,
  selectMe,
  selectUserLoading,
  selectUserError,
} from '../userSlice.js';

const makeStore = (preloaded = {}) =>
  configureStore({ reducer: { user: userReducer }, preloadedState: { user: preloaded } });

const defaultState = { profile: null, me: null, loading: false, error: null };

describe('userSlice reducers', () => {
  describe('fetchMe', () => {
    it('pending sets loading true and clears error', () => {
      const store = makeStore({ ...defaultState, error: 'old' });
      store.dispatch({ type: fetchMe.pending.type });
      expect(store.getState().user.loading).toBe(true);
      expect(store.getState().user.error).toBeNull();
    });

    it('fulfilled sets me from payload', () => {
      const store = makeStore({ ...defaultState, loading: true });
      store.dispatch({
        type: fetchMe.fulfilled.type,
        payload: { user: { id: '1', username: 'alice' }, wcaProfile: { wcaId: '2022ALIC01' } },
      });
      const state = store.getState().user;
      expect(state.loading).toBe(false);
      expect(state.me).toEqual({ id: '1', username: 'alice', wcaId: '2022ALIC01' });
    });

    it('rejected sets error and clears loading', () => {
      const store = makeStore({ ...defaultState, loading: true });
      store.dispatch({ type: fetchMe.rejected.type, payload: 'Error al cargar' });
      const state = store.getState().user;
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Error al cargar');
    });
  });

  describe('updateMe', () => {
    it('pending sets loading true and clears error', () => {
      const store = makeStore({ ...defaultState, error: 'old error' });
      store.dispatch({ type: updateMe.pending.type });
      expect(store.getState().user.loading).toBe(true);
      expect(store.getState().user.error).toBeNull();
    });

    it('fulfilled updates me from payload', () => {
      const store = makeStore({ ...defaultState, me: { username: 'old', wcaId: '2022TEST01' }, loading: true });
      store.dispatch({
        type: updateMe.fulfilled.type,
        payload: { user: { id: '1', username: 'newname', email: 'new@example.com' } },
      });
      const state = store.getState().user;
      expect(state.loading).toBe(false);
      expect(state.me.username).toBe('newname');
      expect(state.me.wcaId).toBe('2022TEST01');
    });

    it('rejected sets error and clears loading', () => {
      const store = makeStore({ ...defaultState, loading: true });
      store.dispatch({ type: updateMe.rejected.type, payload: 'Error al actualizar' });
      const state = store.getState().user;
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Error al actualizar');
    });
  });

  describe('deleteMe', () => {
    it('pending sets loading true and clears error', () => {
      const store = makeStore({ ...defaultState, error: 'old' });
      store.dispatch({ type: deleteMe.pending.type });
      expect(store.getState().user.loading).toBe(true);
      expect(store.getState().user.error).toBeNull();
    });

    it('fulfilled clears me', () => {
      const store = makeStore({ ...defaultState, me: { username: 'alice' }, loading: true });
      store.dispatch({ type: deleteMe.fulfilled.type });
      const state = store.getState().user;
      expect(state.loading).toBe(false);
      expect(state.me).toBeNull();
    });

    it('rejected sets error and clears loading', () => {
      const store = makeStore({ ...defaultState, loading: true });
      store.dispatch({ type: deleteMe.rejected.type, payload: 'Error al eliminar' });
      const state = store.getState().user;
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Error al eliminar');
    });
  });
});

describe('userSlice selectors', () => {
  it('selectMe returns me', () => {
    const me = { username: 'alice' };
    expect(selectMe({ user: { ...defaultState, me } })).toEqual(me);
  });

  it('selectUserLoading returns loading', () => {
    expect(selectUserLoading({ user: { ...defaultState, loading: true } })).toBe(true);
  });

  it('selectUserError returns error', () => {
    expect(selectUserError({ user: { ...defaultState, error: 'oops' } })).toBe('oops');
  });
});
