import { screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { renderWithProviders } from '../../../test/renderWithProviders.jsx';
import { EditProfileForm } from '../components/EditProfileForm.jsx';

vi.mock('../../../services/authService.js', () => ({
  authService: {
    linkWca: vi.fn(),
  },
}));

vi.mock('../../../services/userService.js', () => ({
  userService: {
    updateMe: vi.fn().mockResolvedValue({ id: '1', username: 'alice', email: 'alice@test.com' }),
  },
}));

const me = { id: '1', username: 'alice', email: 'alice@test.com', wcaId: null };

const baseState = {
  auth: { user: { id: '1', username: 'alice' }, accessToken: 'tok', refreshToken: null, loading: false, error: null },
  user: { profile: null, me, loading: false, error: null },
};

describe('EditProfileForm', () => {
  it('renders email and username fields with current values', () => {
    renderWithProviders(<EditProfileForm me={me} />, { preloadedState: baseState });
    expect(screen.getByDisplayValue('alice@test.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('alice')).toBeInTheDocument();
  });

  it('shows WCA ID input when wcaId is not linked', () => {
    renderWithProviders(<EditProfileForm me={me} />, { preloadedState: baseState });
    expect(screen.getByPlaceholderText('Ej: 2015GOME01')).toBeInTheDocument();
    expect(screen.getByText('Vincular')).toBeInTheDocument();
  });

  it('shows linked WCA ID when wcaId is present', () => {
    renderWithProviders(<EditProfileForm me={{ ...me, wcaId: '2022LUCA04' }} />, { preloadedState: baseState });
    expect(screen.getByText('2022LUCA04')).toBeInTheDocument();
    expect(screen.getByText('(vinculado)')).toBeInTheDocument();
  });

  it('shows loading state on submit button when loading', () => {
    renderWithProviders(<EditProfileForm me={me} />, {
      preloadedState: { ...baseState, user: { ...baseState.user, loading: true } },
    });
    expect(screen.getByText('Guardando...')).toBeInTheDocument();
  });

  it('shows generic error when error does not mention username', () => {
    renderWithProviders(<EditProfileForm me={me} />, {
      preloadedState: { ...baseState, user: { ...baseState.user, error: 'Email already in use' } },
    });
    expect(screen.getByText('Email already in use')).toBeInTheDocument();
  });

  it('shows 30-day username error message when error mentions username', () => {
    renderWithProviders(<EditProfileForm me={me} />, {
      preloadedState: { ...baseState, user: { ...baseState.user, error: 'username change too soon' } },
    });
    expect(screen.getByText('Debes esperar 30 días entre cambios de username')).toBeInTheDocument();
  });

  it('shows success message after successful submit', async () => {
    renderWithProviders(<EditProfileForm me={me} />, { preloadedState: baseState });
    fireEvent.submit(screen.getByRole('button', { name: 'Guardar cambios' }).closest('form'));
    await waitFor(() => expect(screen.getByText('Perfil actualizado correctamente')).toBeInTheDocument());
  });

  it('shows WCA link loading state while linking', async () => {
    const { authService } = await import('../../../services/authService.js');
    authService.linkWca.mockImplementation(() => new Promise(() => {}));

    renderWithProviders(<EditProfileForm me={me} />, { preloadedState: baseState });
    fireEvent.change(screen.getByPlaceholderText('Ej: 2015GOME01'), { target: { value: '2022LUCA04' } });
    fireEvent.click(screen.getByText('Vincular'));
    await waitFor(() => expect(screen.getByText('Vinculando...')).toBeInTheDocument());
  });

  it('shows WCA error when link fails', async () => {
    const { authService } = await import('../../../services/authService.js');
    authService.linkWca.mockRejectedValueOnce({ response: { data: { error: 'WCA ID not found' } } });

    renderWithProviders(<EditProfileForm me={me} />, { preloadedState: baseState });
    fireEvent.change(screen.getByPlaceholderText('Ej: 2015GOME01'), { target: { value: '2022LUCA04' } });
    fireEvent.click(screen.getByText('Vincular'));
    await waitFor(() => expect(screen.getByText('WCA ID not found')).toBeInTheDocument());
  });
});
