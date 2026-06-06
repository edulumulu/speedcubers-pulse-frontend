import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import authReducer from '../../store/slices/authSlice.js';
import userReducer from '../../store/slices/userSlice.js';
import { AppRouter } from '../../router/AppRouter.jsx';

const makeStore = (authOverrides = {}) =>
  configureStore({
    reducer: { auth: authReducer, user: userReducer },
    preloadedState: {
      auth: { user: null, accessToken: null, refreshToken: null, loading: false, error: null, ...authOverrides },
      user: { profile: null, me: null, loading: false, error: null },
    },
  });

const renderAt = (path, authOverrides = {}) =>
  render(
    <Provider store={makeStore(authOverrides)}>
      <MemoryRouter initialEntries={[path]}>
        <AppRouter />
      </MemoryRouter>
    </Provider>,
  );

// Unauthenticated routes
describe('public routes', () => {
  it('/ renders home page', () => {
    renderAt('/');
    expect(document.querySelector('nav')).toBeInTheDocument();
    expect(screen.getByText(/próximamente/i)).toBeInTheDocument();
  });

  it('/login renders login page', () => {
    renderAt('/login');
    expect(screen.getByRole('heading', { name: /bienvenido/i })).toBeInTheDocument();
  });

  it('/register renders register page', () => {
    renderAt('/register');
    expect(screen.getByRole('heading', { name: /crear cuenta/i })).toBeInTheDocument();
  });

  it('/forgot-password renders forgot password page', () => {
    renderAt('/forgot-password');
    expect(screen.getByRole('heading', { name: /recuperar contraseña/i })).toBeInTheDocument();
  });

  it('/reset-password renders reset password page', () => {
    renderAt('/reset-password');
    // No token → shows invalid link message
    expect(screen.getByText(/enlace de recuperación inválido/i)).toBeInTheDocument();
  });

  it('/users/:username renders public profile page', () => {
    renderAt('/users/margallego');
    // UserProfilePage renders — loading state or profile
    expect(document.querySelector('main')).toBeInTheDocument();
  });

  it('unknown route redirects to /', () => {
    renderAt('/ruta-que-no-existe');
    expect(screen.getByText(/próximamente/i)).toBeInTheDocument();
  });
});

// Protected routes (unauthenticated → redirect to /login)
describe('protected routes — unauthenticated', () => {
  it('/profile redirects to /login when not authenticated', () => {
    renderAt('/profile');
    expect(screen.getByRole('heading', { name: /bienvenido/i })).toBeInTheDocument();
  });
});

// Protected routes (authenticated)
describe('protected routes — authenticated', () => {
  const authUser = { user: { id: '1', username: 'edulumulu' }, accessToken: 'tok' };

  it('/profile renders profile page when authenticated', () => {
    renderAt('/profile', authUser);
    expect(screen.getByRole('heading', { name: /mi perfil/i })).toBeInTheDocument();
  });

  it('/login redirects to / when already authenticated', () => {
    renderAt('/login', authUser);
    expect(screen.getByText(/próximamente/i)).toBeInTheDocument();
  });

  it('/register redirects to / when already authenticated', () => {
    renderAt('/register', authUser);
    expect(screen.getByText(/próximamente/i)).toBeInTheDocument();
  });

  it('/forgot-password redirects to / when already authenticated', () => {
    renderAt('/forgot-password', authUser);
    expect(screen.getByText(/próximamente/i)).toBeInTheDocument();
  });
});
