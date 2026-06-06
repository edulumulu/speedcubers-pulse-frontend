import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { renderWithProviders } from '../../../test/renderWithProviders.jsx';
import { RegisterPage } from '../RegisterPage.jsx';

vi.mock('../../../services/authService.js', () => ({
  authService: {
    checkAvailability: vi.fn().mockResolvedValue({ username: { taken: false }, email: { taken: false } }),
    register: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  },
}));

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

  it('shows username error when username is too short', async () => {
    renderWithProviders(<RegisterPage />);
    await userEvent.type(screen.getByPlaceholderText('edulumulu'), 'a');
    await userEvent.type(screen.getByPlaceholderText('tu@email.com'), 'valid@email.com');
    await userEvent.type(screen.getByPlaceholderText(/Mín. 8 caracteres/), 'ValidPass1');
    await userEvent.click(screen.getByRole('button', { name: /continuar/i }));
    expect(screen.getByText(/entre 2 y 20 caracteres/i)).toBeInTheDocument();
  });

  it('shows email error when email format is invalid', async () => {
    renderWithProviders(<RegisterPage />);
    await userEvent.type(screen.getByPlaceholderText('edulumulu'), 'validuser');
    await userEvent.type(screen.getByPlaceholderText('tu@email.com'), 'test@nodot');
    await userEvent.type(screen.getByPlaceholderText(/Mín. 8 caracteres/), 'ValidPass1');
    await userEvent.click(screen.getByRole('button', { name: /continuar/i }));
    expect(screen.getByText(/email no válido/i)).toBeInTheDocument();
  });

  it('shows password error when password has no uppercase', async () => {
    renderWithProviders(<RegisterPage />);
    await userEvent.type(screen.getByPlaceholderText('edulumulu'), 'validuser');
    await userEvent.type(screen.getByPlaceholderText('tu@email.com'), 'valid@email.com');
    await userEvent.type(screen.getByPlaceholderText(/Mín. 8 caracteres/), 'nouppercase1');
    await userEvent.click(screen.getByRole('button', { name: /continuar/i }));
    expect(screen.getByText(/mayúscula/i)).toBeInTheDocument();
  });

  it('shows password error when password has no number', async () => {
    renderWithProviders(<RegisterPage />);
    await userEvent.type(screen.getByPlaceholderText('edulumulu'), 'validuser');
    await userEvent.type(screen.getByPlaceholderText('tu@email.com'), 'valid@email.com');
    await userEvent.type(screen.getByPlaceholderText(/Mín. 8 caracteres/), 'NoNumberHere');
    await userEvent.click(screen.getByRole('button', { name: /continuar/i }));
    expect(screen.getByText(/número/i)).toBeInTheDocument();
  });

  it('shows password error when password is too short', async () => {
    renderWithProviders(<RegisterPage />);
    await userEvent.type(screen.getByPlaceholderText('edulumulu'), 'validuser');
    await userEvent.type(screen.getByPlaceholderText('tu@email.com'), 'valid@email.com');
    await userEvent.type(screen.getByPlaceholderText(/Mín. 8 caracteres/), 'Ab1');
    await userEvent.click(screen.getByRole('button', { name: /continuar/i }));
    expect(screen.getByText(/mínimo 8 caracteres/i)).toBeInTheDocument();
  });

  it('does NOT advance to step 1 when validation fails', async () => {
    renderWithProviders(<RegisterPage />);
    // Leave all fields empty and submit
    await userEvent.click(screen.getByRole('button', { name: /continuar/i }));
    // Step 0 fields still visible
    expect(screen.getByPlaceholderText('edulumulu')).toBeInTheDocument();
    // Step 1 WCA field not visible
    expect(screen.queryByPlaceholderText('2022LUCA04')).not.toBeInTheDocument();
  });

  it('advances to step 1 when validation passes and availability check succeeds', async () => {
    renderWithProviders(<RegisterPage />);
    await userEvent.type(screen.getByPlaceholderText('edulumulu'), 'validuser');
    await userEvent.type(screen.getByPlaceholderText('tu@email.com'), 'valid@email.com');
    await userEvent.type(screen.getByPlaceholderText(/Mín. 8 caracteres/), 'ValidPass1');
    await userEvent.click(screen.getByRole('button', { name: /continuar/i }));
    // After async check resolves, we should be on step 1
    expect(await screen.findByPlaceholderText('2022LUCA04')).toBeInTheDocument();
  });
});
