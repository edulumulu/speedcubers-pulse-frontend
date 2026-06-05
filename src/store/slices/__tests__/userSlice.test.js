import { configureStore } from '@reduxjs/toolkit';
import userReducer, {
  fetchMe,
  fetchProfile,
  selectMe,
  selectProfile,
  selectUserLoading,
  selectUserError,
} from '../userSlice.js';
import authReducer from '../authSlice.js';

const makeStore = (preloadedAuth = {}) =>
  configureStore({
    reducer: { auth: authReducer, user: userReducer },
    preloadedState: {
      auth: { user: null, accessToken: 'tok', refreshToken: null, loading: false, error: null, ...preloadedAuth },
      user: { profile: null, me: null, loading: false, error: null },
    },
  });

describe('userSlice reducers', () => {
  it('has correct initial state', () => {
    const store = makeStore();
    const state = store.getState().user;
    expect(state.profile).toBeNull();
    expect(state.me).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('fetchMe.pending sets loading true', () => {
    const store = makeStore();
    store.dispatch({ type: fetchMe.pending.type });
    expect(selectUserLoading(store.getState())).toBe(true);
    expect(selectUserError(store.getState())).toBeNull();
  });

  it('fetchMe.fulfilled sets me and clears loading', () => {
    const store = makeStore();
    const user = { id: '1', username: 'alice', email: 'alice@test.com' };
    store.dispatch({ type: fetchMe.fulfilled.type, payload: { user, wcaProfile: null } });
    expect(selectMe(store.getState())).toEqual({ ...user, wcaId: null });
    expect(selectUserLoading(store.getState())).toBe(false);
  });

  it('fetchMe.rejected sets error and clears loading', () => {
    const store = makeStore();
    store.dispatch({ type: fetchMe.rejected.type, payload: 'Error al cargar tu perfil' });
    expect(selectUserError(store.getState())).toBe('Error al cargar tu perfil');
    expect(selectUserLoading(store.getState())).toBe(false);
    expect(selectMe(store.getState())).toBeNull();
  });

  it('fetchProfile.fulfilled sets profile', () => {
    const store = makeStore();
    const profile = { id: '2', username: 'bob', wcaId: '2015BOBI01' };
    store.dispatch({ type: fetchProfile.fulfilled.type, payload: profile });
    expect(selectProfile(store.getState())).toEqual(profile);
  });

  it('fetchProfile.rejected sets error', () => {
    const store = makeStore();
    store.dispatch({ type: fetchProfile.rejected.type, payload: 'Usuario no encontrado' });
    expect(selectUserError(store.getState())).toBe('Usuario no encontrado');
  });
});
