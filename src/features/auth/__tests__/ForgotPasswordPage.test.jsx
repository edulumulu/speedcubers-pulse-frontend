import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { renderWithProviders } from '../../../test/renderWithProviders.jsx';
import { ForgotPasswordPage } from '../ForgotPasswordPage.jsx';
import { authService } from '../../../services/authService.js';

vi.mock('../../../services/authService.js', () => ({
  authService: {
    forgotPassword: vi.fn(),
  },
}));

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders email field and submit button', () => {
    renderWithProviders(<ForgotPasswordPage />);
    expect(screen.getByPlaceholderText('tu@email.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enviar enlace/i })).toBeInTheDocument();
  });

  it('shows success message after submit', async () => {
    authService.forgotPassword.mockResolvedValue({});
    renderWithProviders(<ForgotPasswordPage />);
    await userEvent.type(screen.getByPlaceholderText('tu@email.com'), 'test@example.com');
    await userEvent.click(screen.getByRole('button', { name: /enviar enlace/i }));
    await waitFor(() => {
      expect(screen.getByText(/si el email está registrado/i)).toBeInTheDocument();
    });
  });

  it('shows error message on API failure', async () => {
    authService.forgotPassword.mockRejectedValue(new Error('Network error'));
    renderWithProviders(<ForgotPasswordPage />);
    await userEvent.type(screen.getByPlaceholderText('tu@email.com'), 'test@example.com');
    await userEvent.click(screen.getByRole('button', { name: /enviar enlace/i }));
    await waitFor(() => {
      expect(screen.getByText(/error al enviar el email/i)).toBeInTheDocument();
    });
  });

  it('renders link back to login', () => {
    renderWithProviders(<ForgotPasswordPage />);
    expect(screen.getByRole('link', { name: /volver al login/i })).toBeInTheDocument();
  });
});
