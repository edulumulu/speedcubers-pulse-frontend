import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';
import authReducer from '../../../../store/slices/authSlice.js';
import userReducer from '../../../../store/slices/userSlice.js';
import { EditProfileForm } from '../EditProfileForm.jsx';

// Mock authService so linkWca doesn't hit the network
vi.mock('../../../../services/authService.js', () => ({
  authService: {
    linkWca: vi.fn(),
  },
}));

// Mock userService so updateMe doesn't hit the network
vi.mock('../../../../services/userService.js', () => ({
  userService: {
    updateMe: vi.fn(),
    getMe: vi.fn(),
    deleteMe: vi.fn(),
    getByUsername: vi.fn(),
  },
}));

function renderForm(me) {
  const store = configureStore({
    reducer: { auth: authReducer, user: userReducer },
    preloadedState: {
      auth: { accessToken: 'fake-token', user: null, loading: false, error: null },
      user: { me, profile: null, loading: false, error: null },
    },
  });
  return {
    store,
    ...render(
      <Provider store={store}>
        <BrowserRouter>
          <EditProfileForm me={me} />
        </BrowserRouter>
      </Provider>,
    ),
  };
}

describe('EditProfileForm', () => {
  const me = { username: 'edulumulu', email: 'edu@example.com', wcaId: null };

  it('renders with current user values', () => {
    renderForm(me);
    expect(screen.getByDisplayValue('edulumulu')).toBeInTheDocument();
    expect(screen.getByDisplayValue('edu@example.com')).toBeInTheDocument();
  });

  it('renders WCA ID input section when wcaId is null', () => {
    renderForm(me);
    expect(screen.getByPlaceholderText(/2022LUCA04/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /vincular/i })).toBeInTheDocument();
  });

  it('renders WCA ID as read-only when wcaId is set', () => {
    renderForm({ ...me, wcaId: '2022LUCA04' });
    expect(screen.getByText('2022LUCA04')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /vincular/i })).not.toBeInTheDocument();
    expect(screen.getByText(/No se puede cambiar/i)).toBeInTheDocument();
  });

  it('shows validation error for invalid WCA ID format', async () => {
    renderForm(me);
    await userEvent.type(screen.getByPlaceholderText(/2022LUCA04/i), 'invalid');
    await userEvent.click(screen.getByRole('button', { name: /vincular/i }));
    expect(screen.getByText(/Formato inválido/i)).toBeInTheDocument();
  });

  it('shows Guardar cambios button', () => {
    renderForm(me);
    expect(screen.getByRole('button', { name: /guardar cambios/i })).toBeInTheDocument();
  });
});
