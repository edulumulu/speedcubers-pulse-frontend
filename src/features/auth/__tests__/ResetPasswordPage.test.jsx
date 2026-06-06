import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { ResetPasswordPage } from '../ResetPasswordPage.jsx';
import { authService } from '../../../services/authService.js';

vi.mock('../../../services/authService.js', () => ({
  authService: {
    resetPassword: vi.fn(),
  },
}));

import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../../store/slices/authSlice.js';

function renderPage(initialEntry = '/reset-password') {
  const store = configureStore({ reducer: { auth: authReducer } });
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <ResetPasswordPage />
      </MemoryRouter>
    </Provider>,
  );
}

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows invalid link message when no token', () => {
    renderPage('/reset-password');
    expect(screen.getByText(/enlace de recuperación inválido/i)).toBeInTheDocument();
  });

  it('renders password fields when token present', () => {
    renderPage('/reset-password?token=abc123');
    expect(screen.getByPlaceholderText(/mín. 8 caracteres/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/repite la contraseña/i)).toBeInTheDocument();
  });

  it('shows validation error for short password', async () => {
    renderPage('/reset-password?token=abc123');
    await userEvent.type(screen.getByPlaceholderText(/mín. 8 caracteres/i), 'short');
    await userEvent.type(screen.getByPlaceholderText(/repite la contraseña/i), 'short');
    await userEvent.click(screen.getByRole('button', { name: /cambiar contraseña/i }));
    expect(screen.getByText(/mínimo 8 caracteres/i)).toBeInTheDocument();
  });

  it('shows validation error when passwords do not match', async () => {
    renderPage('/reset-password?token=abc123');
    await userEvent.type(screen.getByPlaceholderText(/mín. 8 caracteres/i), 'Password1');
    await userEvent.type(screen.getByPlaceholderText(/repite la contraseña/i), 'Password2');
    await userEvent.click(screen.getByRole('button', { name: /cambiar contraseña/i }));
    expect(screen.getByText(/las contraseñas no coinciden/i)).toBeInTheDocument();
  });

  it('calls resetPassword and navigates on success', async () => {
    authService.resetPassword.mockResolvedValue({});
    renderPage('/reset-password?token=abc123');
    await userEvent.type(screen.getByPlaceholderText(/mín. 8 caracteres/i), 'Password1');
    await userEvent.type(screen.getByPlaceholderText(/repite la contraseña/i), 'Password1');
    await userEvent.click(screen.getByRole('button', { name: /cambiar contraseña/i }));
    await waitFor(() => {
      expect(authService.resetPassword).toHaveBeenCalledWith('abc123', 'Password1');
    });
  });

  it('shows error message on API failure', async () => {
    authService.resetPassword.mockRejectedValue({ response: { data: { error: 'Token expirado' } } });
    renderPage('/reset-password?token=abc123');
    await userEvent.type(screen.getByPlaceholderText(/mín. 8 caracteres/i), 'Password1');
    await userEvent.type(screen.getByPlaceholderText(/repite la contraseña/i), 'Password1');
    await userEvent.click(screen.getByRole('button', { name: /cambiar contraseña/i }));
    await waitFor(() => {
      expect(screen.getByText('Token expirado')).toBeInTheDocument();
    });
  });
});
