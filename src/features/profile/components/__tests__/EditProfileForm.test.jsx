import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../../../store/slices/authSlice.js';
import { EditProfileForm } from '../EditProfileForm.jsx';

function renderForm(me, updateMe) {
  const store = configureStore({ reducer: { auth: authReducer } });
  return {
    store,
    ...render(
      <Provider store={store}>
        <BrowserRouter>
          <EditProfileForm me={me} updateMe={updateMe} />
        </BrowserRouter>
      </Provider>,
    ),
  };
}

describe('EditProfileForm', () => {
  const me = { username: 'edulumulu', email: 'edu@example.com' };

  it('renders with current user values', () => {
    renderForm(me, vi.fn());
    expect(screen.getByDisplayValue('edulumulu')).toBeInTheDocument();
    expect(screen.getByDisplayValue('edu@example.com')).toBeInTheDocument();
  });

  it('does NOT include username in payload when username is unchanged', async () => {
    const updateMe = vi.fn(() => ({ type: 'profile/updateMe' }));
    renderForm(me, updateMe);
    // Change only email
    const emailInput = screen.getByDisplayValue('edu@example.com');
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'new@example.com');
    await userEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));
    expect(updateMe).toHaveBeenCalledTimes(1);
    const payload = updateMe.mock.calls[0][0];
    expect(payload).not.toHaveProperty('username');
    expect(payload.email).toBe('new@example.com');
  });

  it('includes username in payload when username changed', async () => {
    const updateMe = vi.fn(() => ({ type: 'profile/updateMe' }));
    renderForm(me, updateMe);
    const usernameInput = screen.getByDisplayValue('edulumulu');
    await userEvent.clear(usernameInput);
    await userEvent.type(usernameInput, 'newuser');
    await userEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));
    const payload = updateMe.mock.calls[0][0];
    expect(payload.username).toBe('newuser');
  });

  it('includes password in payload when password is provided', async () => {
    const updateMe = vi.fn(() => ({ type: 'profile/updateMe' }));
    renderForm(me, updateMe);
    await userEvent.type(screen.getByPlaceholderText(/dejar vacío/i), 'NewPass1');
    await userEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));
    const payload = updateMe.mock.calls[0][0];
    expect(payload.password).toBe('NewPass1');
  });

  it('does NOT include password in payload when password is empty', async () => {
    const updateMe = vi.fn(() => ({ type: 'profile/updateMe' }));
    renderForm(me, updateMe);
    await userEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));
    const payload = updateMe.mock.calls[0][0];
    expect(payload).not.toHaveProperty('password');
  });
});
