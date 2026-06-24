import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../../../store/slices/authSlice.js';
import userReducer from '../../../../store/slices/userSlice.js';
import { ProfilePage } from '../../ProfilePage.jsx';

const routerFuture = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
};

// Mock userSlice thunks so they don't make real API calls
vi.mock('../../../../store/slices/userSlice.js', async (importOriginal) => {
  const actual = await importOriginal();
  // Return a thunk that does nothing (no-op) so the store state is not changed
  const noopThunk = () => () => Promise.resolve({ type: 'noop' });
  noopThunk.pending = { type: 'noop/pending' };
  noopThunk.fulfilled = { match: () => false, type: 'noop/fulfilled' };
  noopThunk.rejected = { type: 'noop/rejected' };
  return {
    ...actual,
    fetchMe: vi.fn(noopThunk),
    deleteMe: vi.fn(noopThunk),
  };
});

function renderProfilePage(preloadedState = {}) {
  const store = configureStore({
    reducer: { auth: authReducer, user: userReducer },
    preloadedState: {
      auth: { user: null, accessToken: 'tok', refreshToken: null, loading: false, error: null },
      user: { profile: null, me: null, loading: false, error: null },
      ...preloadedState,
    },
  });

  return {
    store,
    ...render(
      <Provider store={store}>
        <MemoryRouter future={routerFuture}>
          <ProfilePage />
        </MemoryRouter>
      </Provider>,
    ),
  };
}

describe('ProfilePage', () => {
  it('renders loading state when me is null and loading is true', () => {
    renderProfilePage({ user: { profile: null, me: null, loading: true, error: null } });
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('renders error when me is null and error is set', () => {
    renderProfilePage({ user: { profile: null, me: null, loading: false, error: 'Error al cargar' } });
    expect(screen.getByText('Error al cargar')).toBeInTheDocument();
  });

  it('renders EditProfileForm when me is loaded', () => {
    renderProfilePage({
      user: {
        profile: null,
        me: { username: 'edulumulu', email: 'edu@example.com' },
        loading: false,
        error: null,
      },
    });
    expect(screen.getByDisplayValue('edulumulu')).toBeInTheDocument();
  });

  it('renders delete account button', () => {
    renderProfilePage({
      user: {
        profile: null,
        me: { username: 'edulumulu', email: 'edu@example.com' },
        loading: false,
        error: null,
      },
    });
    expect(screen.getByRole('button', { name: /eliminar cuenta/i })).toBeInTheDocument();
  });

  it('clicking delete shows confirmation buttons', async () => {
    renderProfilePage({
      user: {
        profile: null,
        me: { username: 'edulumulu', email: 'edu@example.com' },
        loading: false,
        error: null,
      },
    });
    await userEvent.click(screen.getByRole('button', { name: /eliminar cuenta/i }));
    expect(screen.getByRole('button', { name: /sí, eliminar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
  });

  it('clicking cancel hides confirmation', async () => {
    renderProfilePage({
      user: {
        profile: null,
        me: { username: 'edulumulu', email: 'edu@example.com' },
        loading: false,
        error: null,
      },
    });
    await userEvent.click(screen.getByRole('button', { name: /eliminar cuenta/i }));
    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(screen.getByRole('button', { name: /eliminar cuenta/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cancelar/i })).not.toBeInTheDocument();
  });
});
