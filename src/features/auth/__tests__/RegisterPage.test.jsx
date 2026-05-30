import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test/renderWithProviders.jsx';
import { RegisterPage } from '../RegisterPage.jsx';

describe('RegisterPage', () => {
  it('renders step 1 fields', () => {
    renderWithProviders(<RegisterPage />);
    expect(screen.getByPlaceholderText('edulumulu')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('tu@email.com')).toBeInTheDocument();
  });

  it('renders step indicators', () => {
    renderWithProviders(<RegisterPage />);
    expect(screen.getByText('Cuenta')).toBeInTheDocument();
    expect(screen.getByText('WCA')).toBeInTheDocument();
    expect(screen.getByText('Listo')).toBeInTheDocument();
  });

  it('renders continue button on step 1', () => {
    renderWithProviders(<RegisterPage />);
    expect(screen.getByRole('button', { name: /continuar/i })).toBeInTheDocument();
  });

  it('renders link to login', () => {
    renderWithProviders(<RegisterPage />);
    expect(screen.getByRole('link', { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  it('shows error message when register fails', () => {
    renderWithProviders(<RegisterPage />, {
      preloadedState: { auth: { user: null, accessToken: null, refreshToken: null, loading: false, error: 'Username already in use' } },
    });
    expect(screen.getByText('Username already in use')).toBeInTheDocument();
  });

  it('updates username field on input', async () => {
    renderWithProviders(<RegisterPage />);
    const input = screen.getByPlaceholderText('edulumulu');
    await userEvent.type(input, 'newuser');
    expect(input).toHaveValue('newuser');
  });
});
