import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test/renderWithProviders.jsx';
import { LoginPage } from '../LoginPage.jsx';

describe('LoginPage', () => {
  it('renders email and password fields', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByPlaceholderText('tu@email.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  it('renders submit button', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  it('renders link to register', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByRole('link', { name: /crear cuenta/i })).toBeInTheDocument();
  });

  it('shows error message when auth fails', () => {
    renderWithProviders(<LoginPage />, {
      preloadedState: { auth: { user: null, accessToken: null, refreshToken: null, loading: false, error: 'Invalid credentials' } },
    });
    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
  });

  it('disables button while loading', () => {
    renderWithProviders(<LoginPage />, {
      preloadedState: { auth: { user: null, accessToken: null, refreshToken: null, loading: true, error: null } },
    });
    expect(screen.getByRole('button', { name: /iniciando/i })).toBeDisabled();
  });

  it('updates email field on input', async () => {
    renderWithProviders(<LoginPage />);
    const input = screen.getByPlaceholderText('tu@email.com');
    await userEvent.type(input, 'test@test.com');
    expect(input).toHaveValue('test@test.com');
  });
});
