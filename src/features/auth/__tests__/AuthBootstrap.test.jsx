import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { vi } from 'vitest';
import authReducer from '../../../store/slices/authSlice.js';
import { AuthBootstrap } from '../AuthBootstrap.jsx';
import { authService } from '../../../services/authService.js';

vi.mock('../../../services/authService.js', () => ({
  authService: {
    refresh: vi.fn(),
  },
}));

function renderBootstrap() {
  const store = configureStore({ reducer: { auth: authReducer } });
  render(
    <Provider store={store}>
      <AuthBootstrap>
        <div>App lista</div>
      </AuthBootstrap>
    </Provider>,
  );
  return store;
}

describe('AuthBootstrap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('restores the session before rendering children', async () => {
    authService.refresh.mockResolvedValue({
      user: { id: '1', username: 'edulumulu' },
      tokens: { accessToken: 'acc', refreshToken: 'ref' },
    });

    const store = renderBootstrap();

    expect(screen.queryByText(/app lista/i)).not.toBeInTheDocument();
    expect(await screen.findByText(/app lista/i)).toBeInTheDocument();
    expect(store.getState().auth.accessToken).toBe('acc');
    expect(store.getState().auth.refreshToken).toBeNull();
  });

  it('renders children after an anonymous bootstrap', async () => {
    authService.refresh.mockRejectedValue(new Error('No active session'));

    const store = renderBootstrap();

    expect(await screen.findByText(/app lista/i)).toBeInTheDocument();
    expect(store.getState().auth.accessToken).toBeNull();
    expect(store.getState().auth.bootstrapped).toBe(true);
  });
});
