import { screen } from '@testing-library/react';
import { vi } from 'vitest';
import { renderWithProviders } from '../../../test/renderWithProviders.jsx';
import { UserProfilePage } from '../UserProfilePage.jsx';

vi.mock('../../../services/userService.js', () => ({
  userService: {
    getByUsername: vi.fn().mockResolvedValue({
      id: '2',
      username: 'bob',
      wcaId: '2015BOBI01',
      createdAt: '2023-06-01T00:00:00Z',
      wca: { name: 'Bob Ibáñez', country: 'Spain', countryIso2: 'ES' },
    }),
  },
}));

// Mock useParams to return a username
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useParams: () => ({ username: 'bob' }) };
});

const baseState = {
  auth: { user: null, accessToken: null, refreshToken: null, loading: false, error: null },
  user: {
    profile: {
      id: '2',
      username: 'bob',
      wcaId: '2015BOBI01',
      createdAt: '2023-06-01T00:00:00Z',
      wca: { name: 'Bob Ibáñez', country: 'Spain', countryIso2: 'ES' },
    },
    me: null,
    loading: false,
    error: null,
  },
};

describe('UserProfilePage', () => {
  it('renders profile username', () => {
    renderWithProviders(<UserProfilePage />, { preloadedState: baseState });
    expect(screen.getByText('bob')).toBeInTheDocument();
  });

  it('renders WCA ID badge', () => {
    renderWithProviders(<UserProfilePage />, { preloadedState: baseState });
    expect(screen.getByText('2015BOBI01')).toBeInTheDocument();
  });

  it('renders WCA live data', () => {
    renderWithProviders(<UserProfilePage />, { preloadedState: baseState });
    expect(screen.getByText('Bob Ibáñez')).toBeInTheDocument();
    expect(screen.getByText('Spain')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    renderWithProviders(<UserProfilePage />, {
      preloadedState: { ...baseState, user: { ...baseState.user, profile: null, loading: true } },
    });
    expect(screen.getByText('Cargando perfil...')).toBeInTheDocument();
  });

  it('shows error when fetch fails', async () => {
    const { userService } = await import('../../../services/userService.js');
    userService.getByUsername.mockRejectedValueOnce({ response: { data: { error: 'Usuario no encontrado' } } });
    renderWithProviders(<UserProfilePage />, {
      preloadedState: {
        ...baseState,
        user: { profile: null, me: null, loading: false, error: null },
      },
    });
    expect(await screen.findByText('Usuario no encontrado')).toBeInTheDocument();
  });
});
