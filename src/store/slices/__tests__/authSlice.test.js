import { configureStore } from '@reduxjs/toolkit';
import authReducer, { clearAuth, clearError, setTokens, register, logout, selectIsAuthenticated, selectUser } from '../authSlice.js';

const makeStore = (preloaded = {}) =>
  configureStore({ reducer: { auth: authReducer }, preloadedState: { auth: preloaded } });

describe('authSlice reducers', () => {
  it('clearAuth resets all auth state', () => {
    const store = makeStore({ user: { id: '1', username: 'alice' }, accessToken: 'tok', refreshToken: 'ref', loading: false, error: null });
    store.dispatch(clearAuth());
    const state = store.getState().auth;
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
  });

  it('clearError removes error without touching user', () => {
    const store = makeStore({ user: { id: '1' }, accessToken: 'tok', refreshToken: null, loading: false, error: 'oops' });
    store.dispatch(clearError());
    expect(store.getState().auth.error).toBeNull();
    expect(store.getState().auth.user).toEqual({ id: '1' });
  });

  it('setTokens stores tokens', () => {
    const store = makeStore({ user: null, accessToken: null, refreshToken: null, loading: false, error: null });
    store.dispatch(setTokens({ accessToken: 'acc', refreshToken: 'ref' }));
    expect(store.getState().auth.accessToken).toBe('acc');
    expect(store.getState().auth.refreshToken).toBe('ref');
  });
});

describe('authSlice async thunk reducers', () => {
  it('register.pending sets loading true and clears error', () => {
    const store = makeStore({ user: null, accessToken: null, refreshToken: null, loading: false, error: 'old error' });
    store.dispatch({ type: register.pending.type });
    const state = store.getState().auth;
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('register.rejected sets error and clears loading', () => {
    const store = makeStore({ user: null, accessToken: null, refreshToken: null, loading: true, error: null });
    store.dispatch({ type: register.rejected.type, payload: 'Username taken' });
    const state = store.getState().auth;
    expect(state.loading).toBe(false);
    expect(state.error).toBe('Username taken');
  });

  it('logout.fulfilled clears user and tokens', () => {
    const store = makeStore({ user: { id: '1' }, accessToken: 'tok', refreshToken: 'ref', loading: false, error: null });
    store.dispatch({ type: logout.fulfilled.type });
    const state = store.getState().auth;
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
  });
});

describe('authSlice selectors', () => {
  it('selectIsAuthenticated returns true when accessToken present', () => {
    const state = { auth: { accessToken: 'tok', user: null, refreshToken: null, loading: false, error: null } };
    expect(selectIsAuthenticated(state)).toBe(true);
  });

  it('selectIsAuthenticated returns false when no accessToken', () => {
    const state = { auth: { accessToken: null, user: null, refreshToken: null, loading: false, error: null } };
    expect(selectIsAuthenticated(state)).toBe(false);
  });

  it('selectUser returns current user', () => {
    const user = { id: '1', username: 'alice' };
    const state = { auth: { user, accessToken: 'tok', refreshToken: null, loading: false, error: null } };
    expect(selectUser(state)).toEqual(user);
  });
});
