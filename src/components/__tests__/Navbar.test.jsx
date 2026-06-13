import { screen } from '@testing-library/react';
import { Navbar } from '../ui/Navbar.jsx';
import { renderWithProviders } from '../../test/renderWithProviders.jsx';

describe('Navbar', () => {
  it('shows login and register links when not authenticated', () => {
    renderWithProviders(<Navbar />);
    expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /registro/i })).toBeInTheDocument();
  });

  it('shows username and logout when authenticated', () => {
    renderWithProviders(<Navbar />, {
      preloadedState: {
        auth: {
          user: { id: '1', username: 'edulumulu' },
          accessToken: 'tok',
          refreshToken: 'ref',
          loading: false,
          error: null,
        },
        presence: {
          users: [{ id: '2', username: 'rival' }],
          status: 'succeeded',
          socketStatus: 'connected',
          error: null,
        },
      },
    });
    expect(screen.getByText('edulumulu')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /salir/i })).toBeInTheDocument();
    expect(screen.getByText(/online 1/i)).toBeInTheDocument();
    expect(screen.getByText('rival')).toBeInTheDocument();
  });

  it('shows ranking link always', () => {
    renderWithProviders(<Navbar />);
    expect(screen.getByRole('link', { name: /ranking/i })).toBeInTheDocument();
  });
});
