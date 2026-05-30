import { configureStore } from '@reduxjs/toolkit';
import authReducer, { clearAuth, clearError, setTokens, selectIsAuthenticated, selectUser } from '../authSlice.js';

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
