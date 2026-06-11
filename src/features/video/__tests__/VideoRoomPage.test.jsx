import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import authReducer from '../../../store/slices/authSlice.js';
import videoReducer from '../../../store/slices/videoSlice.js';
import { VideoRoomPage } from '../VideoRoomPage.jsx';
import { videoService } from '../../../services/videoService.js';
import { useAgoraRoom } from '../useAgoraRoom.js';

vi.mock('../../../services/videoService.js', () => ({
  videoService: {
    requestToken: vi.fn(),
  },
}));

vi.mock('../useAgoraRoom.js', () => ({
  useAgoraRoom: vi.fn(),
}));

const routerFuture = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
};

const readyRoom = {
  appId: 'agora-app',
  channelName: 'match-test',
  token: 'rtc-token',
  uid: 42,
  expiresAt: '2026-06-10T12:00:00.000Z',
};

let bindRemoteVideo;
let leaveRtcRoom;
let agoraRoomState;

function mockAgoraRoomState(overrides = {}) {
  agoraRoomState = {
    localVideoRef: { current: null },
    remoteUsers: [],
    rtcStatus: 'idle',
    rtcError: null,
    bindRemoteVideo,
    leaveRtcRoom,
    ...overrides,
  };
}

function renderVideoRoom({ preloadedVideo } = {}) {
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
      video: preloadedVideo ?? { room: null, status: 'idle', error: null },
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
  beforeEach(() => {
    vi.clearAllMocks();
    bindRemoteVideo = vi.fn();
    leaveRtcRoom = vi.fn().mockResolvedValue(undefined);
    mockAgoraRoomState();
    useAgoraRoom.mockImplementation(() => agoraRoomState);
  });

  it('renders local and remote placeholders before joining an Agora room', () => {
    renderVideoRoom();

    expect(screen.getByText('Esperando token de video')).toBeInTheDocument();
    expect(screen.getByText('Tu cámara')).toBeInTheDocument();
    expect(screen.getByText('Rival')).toBeInTheDocument();
    expect(screen.getByText('Se activará al entrar en la sala.')).toBeInTheDocument();
    expect(screen.getByText('Aún no hay canal activo.')).toBeInTheDocument();
  });

  it('requests a video token and renders the Agora room as ready after join', async () => {
    videoService.requestToken.mockResolvedValueOnce(readyRoom);
    mockAgoraRoomState({ rtcStatus: 'connected' });

    const { user, store } = renderVideoRoom();

    await user.clear(screen.getByLabelText(/canal/i));
    await user.type(screen.getByLabelText(/canal/i), 'match-test');
    await user.click(screen.getByRole('button', { name: /solicitar token/i }));

    await waitFor(() => {
      expect(videoService.requestToken).toHaveBeenCalledWith({ channelName: 'match-test' });
    });
    expect(await screen.findByText('match-test')).toBeInTheDocument();
    expect(screen.getByText('Cámara y micrófono conectados al canal.')).toBeInTheDocument();
    expect(screen.getByText('En directo')).toBeInTheDocument();
    expect(screen.getByText('agora-app')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('2026-06-10T12:00:00.000Z')).toBeInTheDocument();
    expect(screen.getByText('Esperando a que el otro cuber se una.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /salir de la sala/i })).toBeInTheDocument();
    expect(store.getState().video).toEqual({
      room: readyRoom,
      status: 'ready',
      error: null,
    });
  });

  it('leaves the Agora room and resets the waiting room state', async () => {
    videoService.requestToken.mockResolvedValueOnce(readyRoom);
    mockAgoraRoomState({ rtcStatus: 'connected' });

    const { user, store } = renderVideoRoom();

    await user.clear(screen.getByLabelText(/canal/i));
    await user.type(screen.getByLabelText(/canal/i), 'match-test');
    await user.click(screen.getByRole('button', { name: /solicitar token/i }));
    await screen.findByRole('button', { name: /salir de la sala/i });

    await user.click(screen.getByRole('button', { name: /salir de la sala/i }));

    expect(leaveRtcRoom).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Esperando token de video')).toBeInTheDocument();
    expect(screen.queryByText('agora-app')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /salir de la sala/i })).not.toBeInTheDocument();
    expect(store.getState().video).toEqual({
      room: null,
      status: 'idle',
      error: null,
    });
  });

  it('renders a remote user when the Agora room reports a rival stream', () => {
    mockAgoraRoomState({
      remoteUsers: [{ uid: 7, videoTrack: { play: vi.fn() } }],
      rtcStatus: 'connected',
    });

    renderVideoRoom({ preloadedVideo: { room: readyRoom, status: 'ready', error: null } });

    expect(screen.getByText('Rival conectado')).toBeInTheDocument();
    expect(screen.getByText('Rival #7')).toBeInTheDocument();
    expect(screen.getByTestId('remote-video')).toBeInTheDocument();
    expect(bindRemoteVideo).toHaveBeenCalledWith(7, expect.any(HTMLDivElement));
  });

  it('shows permission or join errors when entering the Agora room fails', async () => {
    videoService.requestToken.mockRejectedValueOnce({
      response: { data: { error: 'No se pudo acceder a la cámara o micrófono' } },
    });

    const { user, store } = renderVideoRoom();

    await user.click(screen.getByRole('button', { name: /solicitar token/i }));

    expect(await screen.findByText('No se pudo acceder a la cámara o micrófono')).toBeInTheDocument();
    expect(screen.getByText('Esperando token de video')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /salir de la sala/i })).not.toBeInTheDocument();
    expect(store.getState().video).toEqual({
      room: null,
      status: 'failed',
      error: 'No se pudo acceder a la cámara o micrófono',
    });
  });
});
