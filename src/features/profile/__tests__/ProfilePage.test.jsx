import { screen } from '@testing-library/react';
import { vi } from 'vitest';
import { renderWithProviders } from '../../../test/renderWithProviders.jsx';
import { ProfilePage } from '../ProfilePage.jsx';

vi.mock('../../../services/userService.js', () => ({
  userService: {
    getMe: vi.fn().mockResolvedValue({
      id: '1',
      username: 'alice',
      email: 'alice@test.com',
      wcaId: null,
      createdAt: '2024-01-15T10:00:00Z',
    }),
  },
}));

const authState = {
  auth: { user: { id: '1', username: 'alice' }, accessToken: 'tok', refreshToken: null, loading: false, error: null },
  user: {
    profile: null,
    me: { id: '1', username: 'alice', email: 'alice@test.com', wcaId: null },
    loading: false,
    error: null,
  },
};

describe('ProfilePage', () => {
  it('renders page heading', () => {
    renderWithProviders(<ProfilePage />, { preloadedState: authState });
    expect(screen.getByText('Mi perfil')).toBeInTheDocument();
  });

  it('renders edit form with user data', () => {
    renderWithProviders(<ProfilePage />, { preloadedState: authState });
    expect(screen.getByDisplayValue('alice')).toBeInTheDocument();
    expect(screen.getByDisplayValue('alice@test.com')).toBeInTheDocument();
  });

  it('renders WCA link section', () => {
    renderWithProviders(<ProfilePage />, { preloadedState: authState });
    expect(screen.getByText('WCA ID')).toBeInTheDocument();
  });

  it('shows loading state when loading and no me', () => {
    renderWithProviders(<ProfilePage />, {
      preloadedState: {
        ...authState,
        user: { ...authState.user, me: null, loading: true },
      },
    });
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('shows error when fetch fails', async () => {
    const { userService } = await import('../../../services/userService.js');
    userService.getMe.mockRejectedValueOnce({ response: { data: { error: 'Error al cargar tu perfil' } } });
    renderWithProviders(<ProfilePage />, {
      preloadedState: {
        ...authState,
        user: { profile: null, me: null, loading: false, error: null },
      },
    });
    expect(await screen.findByText('Error al cargar tu perfil')).toBeInTheDocument();
  });
});
