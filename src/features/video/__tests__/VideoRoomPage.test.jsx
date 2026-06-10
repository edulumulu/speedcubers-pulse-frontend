import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import authReducer from '../../../store/slices/authSlice.js';
import videoReducer from '../../../store/slices/videoSlice.js';
import { VideoRoomPage } from '../VideoRoomPage.jsx';
import { videoService } from '../../../services/videoService.js';

vi.mock('../../../services/videoService.js', () => ({
  videoService: {
    requestToken: vi.fn(),
  },
}));

const routerFuture = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
};

function renderVideoRoom() {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      video: videoReducer,
    },
    preloadedState: {
      auth: {
        user: { id: '1', username: 'edulumulu' },
        accessToken: 'tok',
        refreshToken: null,
        loading: false,
        error: null,
      },
      video: { room: null, status: 'idle', error: null },
    },
  });

  return {
    user: userEvent.setup(),
    store,
    ...render(
      <Provider store={store}>
        <MemoryRouter future={routerFuture}>
          <VideoRoomPage />
        </MemoryRouter>
      </Provider>,
    ),
  };
}

describe('VideoRoomPage', () => {
  it('requests a video token and renders the waiting room as ready', async () => {
    videoService.requestToken.mockResolvedValueOnce({
      appId: 'agora-app',
      channelName: 'match-test',
      token: 'rtc-token',
      uid: 42,
      expiresAt: '2026-06-10T12:00:00.000Z',
    });

    const { user } = renderVideoRoom();

    await user.clear(screen.getByLabelText(/canal/i));
    await user.type(screen.getByLabelText(/canal/i), 'match-test');
    await user.click(screen.getByRole('button', { name: /solicitar token/i }));

    await waitFor(() => {
      expect(videoService.requestToken).toHaveBeenCalledWith({ channelName: 'match-test' });
    });
    expect(await screen.findByText('match-test')).toBeInTheDocument();
    expect(screen.getByText(/token listo/i)).toBeInTheDocument();
    expect(screen.getByText('agora-app')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /salir de la sala/i })).toBeInTheDocument();
  });

  it('shows backend errors when token request fails', async () => {
    videoService.requestToken.mockRejectedValueOnce({
      response: { data: { error: 'No se pudo crear el token' } },
    });

    const { user } = renderVideoRoom();

    await user.click(screen.getByRole('button', { name: /solicitar token/i }));

    expect(await screen.findByText('No se pudo crear el token')).toBeInTheDocument();
  });
});
