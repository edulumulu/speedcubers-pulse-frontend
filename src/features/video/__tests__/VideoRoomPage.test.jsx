import { configureStore } from '@reduxjs/toolkit';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import authReducer from '../../../store/slices/authSlice.js';
import competitionReducer from '../../../store/slices/competitionSlice.js';
import videoReducer from '../../../store/slices/videoSlice.js';
import { competitionService } from '../../../services/competitionService.js';
import { videoService } from '../../../services/videoService.js';
import { VideoRoomPage } from '../VideoRoomPage.jsx';
import { useAgoraRoom } from '../useAgoraRoom.js';

vi.mock('../../../services/competitionService.js', () => ({
  competitionService: {
    createRoom: vi.fn(),
    getRoom: vi.fn(),
    joinRoom: vi.fn(),
    submitResult: vi.fn(),
    updateRoundEvent: vi.fn(),
  },
}));

vi.mock('../../../services/videoService.js', () => ({
  videoService: {
    requestToken: vi.fn(),
    reportUsage: vi.fn(),
  },
}));

vi.mock('../useAgoraRoom.js', () => ({
  useAgoraRoom: vi.fn(),
}));

const competitionSocketMock = vi.hoisted(() => ({
  connect: vi.fn(),
  socket: null,
}));

vi.mock('../../../services/competitionSocketService.js', () => ({
  competitionSocketService: {
    connect: competitionSocketMock.connect,
  },
}));

const routerFuture = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
};

const competitionRoom = {
  id: 'room-1',
  code: 'ABC123',
  channelName: 'match-test',
  event: '3x3',
  status: 'active',
  host: { id: '1', username: 'edulumulu' },
  guest: { id: '2', username: 'rival' },
  matchScore: {
    host: { id: '1', username: 'edulumulu', score: 2 },
    guest: { id: '2', username: 'rival', score: 1 },
    roundsPlayed: 3,
  },
};

const waitingCompetitionRoom = {
  ...competitionRoom,
  status: 'waiting',
  guest: null,
};

const readyRoom = {
  appId: 'agora-app',
  channelName: 'match-test',
  token: 'rtc-token',
  uid: 42,
  expiresAt: '2026-06-10T12:00:00.000Z',
  quota: {
    limitSeconds: 3600,
    usedSeconds: 0,
    remainingSeconds: 3600,
    resetAt: '2026-07-01T00:00:00.000Z',
    global: {
      limitSeconds: 480000,
      usedSeconds: 0,
      remainingSeconds: 480000,
      resetAt: '2026-07-01T00:00:00.000Z',
    },
  },
};

const idleCompetitionState = {
  room: null,
  status: 'idle',
  error: null,
  result: null,
  resultStatus: 'idle',
  resultError: null,
};

const readyCompetitionState = {
  room: competitionRoom,
  status: 'ready',
  error: null,
  result: null,
  resultStatus: 'idle',
  resultError: null,
};

let bindRemoteVideo;
let leaveRtcRoom;
let agoraRoomState;

function createCompetitionSocket() {
  const handlers = new Map();
  const socket = {
    on: vi.fn((event, handler) => {
      handlers.set(event, handler);
      return socket;
    }),
    off: vi.fn((event) => {
      handlers.delete(event);
      return socket;
    }),
    emit: vi.fn((_event, _payload, ack) => {
      if (ack) ack({ ok: true });
      return socket;
    }),
    connect: vi.fn(() => {
      handlers.get('connect')?.();
      return socket;
    }),
    disconnect: vi.fn(() => {
      handlers.clear();
      return socket;
    }),
    trigger(event, payload) {
      handlers.get(event)?.(payload);
      return socket;
    },
  };
  return socket;
}

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

function renderVideoRoom({ preloadedCompetition, preloadedVideo } = {}) {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      competition: competitionReducer,
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
      competition: preloadedCompetition ?? idleCompetitionState,
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
    videoService.reportUsage.mockResolvedValue({
      limitSeconds: 3600,
      usedSeconds: 0,
      remainingSeconds: 3600,
      resetAt: '2026-07-01T00:00:00.000Z',
      global: {
        limitSeconds: 480000,
        usedSeconds: 0,
        remainingSeconds: 480000,
        resetAt: '2026-07-01T00:00:00.000Z',
      },
    });
    mockAgoraRoomState();
    useAgoraRoom.mockImplementation(() => agoraRoomState);
    competitionSocketMock.socket = createCompetitionSocket();
    competitionSocketMock.connect.mockReturnValue(competitionSocketMock.socket);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders create and join controls before entering a competition room', () => {
    renderVideoRoom();

    expect(screen.getByRole('button', { name: /crear sala/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/cubo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/código de sala/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /unirse con código/i })).toBeInTheDocument();
    expect(screen.getByText('Sin sala activa')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Tu cámara' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Rival' })).toBeInTheDocument();
    expect(screen.getByText('Listo para empezar.')).toBeInTheDocument();
    expect(screen.queryByText(/timer local/i)).not.toBeInTheDocument();
  });

  it('creates a competition room and requests a video token for its channel', async () => {
    competitionService.createRoom.mockResolvedValueOnce(waitingCompetitionRoom);
    videoService.requestToken.mockResolvedValueOnce(readyRoom);
    mockAgoraRoomState({ rtcStatus: 'connected' });

    const { user, store } = renderVideoRoom();

    await user.click(screen.getByRole('button', { name: /crear sala/i }));

    await waitFor(() => {
      expect(competitionService.createRoom).toHaveBeenCalledWith({ event: '3x3' });
      expect(videoService.requestToken).toHaveBeenCalledWith({ channelName: 'match-test' });
    });
    expect(await screen.findByTestId('room-code')).toHaveTextContent('ABC123');
    expect(screen.getByText('Video preparado.')).toBeInTheDocument();
    expect(screen.getByText('En directo')).toBeInTheDocument();
    expect(screen.getByTestId('room-channel')).toHaveTextContent('match-test');
    expect(screen.getByTestId('room-uid')).toHaveTextContent('42');
    expect(screen.getByRole('button', { name: /salir de la sala/i })).toBeInTheDocument();
    expect(store.getState().competition).toEqual({
      room: waitingCompetitionRoom,
      status: 'ready',
      error: null,
      result: null,
      resultStatus: 'idle',
      resultError: null,
    });
    expect(store.getState().video).toEqual({
      room: readyRoom,
      status: 'ready',
      error: null,
    });
  });

  it('uses the selected cube when creating a competition room', async () => {
    competitionService.createRoom.mockResolvedValueOnce({ ...waitingCompetitionRoom, event: '2x2' });
    videoService.requestToken.mockResolvedValueOnce(readyRoom);

    const { user } = renderVideoRoom();

    await user.selectOptions(screen.getByLabelText(/cubo/i), '2x2');
    await user.click(screen.getByRole('button', { name: /crear sala/i }));

    await waitFor(() => {
      expect(competitionService.createRoom).toHaveBeenCalledWith({ event: '2x2' });
    });
  });

  it('joins with an uppercased room code and requests the joined room token', async () => {
    competitionService.joinRoom.mockResolvedValueOnce(competitionRoom);
    videoService.requestToken.mockResolvedValueOnce(readyRoom);

    const { user } = renderVideoRoom();

    await user.type(screen.getByLabelText(/código de sala/i), 'abc123');
    await user.click(screen.getByRole('button', { name: /unirse con código/i }));

    await waitFor(() => {
      expect(competitionService.joinRoom).toHaveBeenCalledWith({ code: 'ABC123' });
      expect(videoService.requestToken).toHaveBeenCalledWith({ channelName: 'match-test' });
    });
    expect(await screen.findByTestId('room-code')).toHaveTextContent('ABC123');
  });

  it('does not request a video token when the competition response has no channel', async () => {
    competitionService.createRoom.mockResolvedValueOnce({
      id: 'room-1',
      code: 'ABC123',
      channelName: '',
      status: 'waiting',
      host: null,
      guest: null,
    });

    const { user, store } = renderVideoRoom();

    await user.click(screen.getByRole('button', { name: /crear sala/i }));

    expect(await screen.findByText('Sala ABC123')).toBeInTheDocument();
    expect(screen.getByText('Sala creada')).toBeInTheDocument();
    expect(videoService.requestToken).not.toHaveBeenCalled();
    expect(store.getState().video).toEqual({
      room: null,
      status: 'idle',
      error: null,
    });
  });

  it('leaves the RTC room and resets competition and video state', async () => {
    mockAgoraRoomState({ rtcStatus: 'connected' });

    const { user, store } = renderVideoRoom({
      preloadedCompetition: readyCompetitionState,
      preloadedVideo: { room: readyRoom, status: 'ready', error: null },
    });

    await user.click(screen.getByRole('button', { name: /salir de la sala/i }));

    expect(competitionSocketMock.socket.emit).toHaveBeenCalledWith(
      'competition:join',
      { code: 'ABC123' },
      expect.any(Function),
    );
    expect(competitionSocketMock.socket.emit).toHaveBeenCalledWith(
      'competition:leave',
      { code: 'ABC123' },
      expect.any(Function),
    );
    expect(leaveRtcRoom).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Sin sala activa')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /salir de la sala/i })).not.toBeInTheDocument();
    expect(store.getState().competition).toEqual({
      room: null,
      status: 'idle',
      error: null,
      result: null,
      resultStatus: 'idle',
      resultError: null,
    });
    expect(store.getState().video).toEqual({
      room: null,
      status: 'idle',
      error: null,
    });
  });

  it('leaves the room when the other participant exits', async () => {
    mockAgoraRoomState({ rtcStatus: 'connected' });

    const { store } = renderVideoRoom({
      preloadedCompetition: readyCompetitionState,
      preloadedVideo: { room: readyRoom, status: 'ready', error: null },
    });

    act(() => {
      competitionSocketMock.socket.trigger('competition:left', { code: 'ABC123', leftBy: '2' });
    });

    await waitFor(() => {
      expect(screen.getByText('Sin sala activa')).toBeInTheDocument();
    });
    expect(leaveRtcRoom).toHaveBeenCalledTimes(1);
    expect(competitionSocketMock.socket.emit).not.toHaveBeenCalledWith(
      'competition:leave',
      expect.anything(),
      expect.any(Function),
    );
    expect(store.getState().competition.room).toBeNull();
    expect(store.getState().video.room).toBeNull();
  });

  it('renders a remote user when the Agora room reports a rival stream', () => {
    mockAgoraRoomState({
      remoteUsers: [{ uid: 7, videoTrack: { play: vi.fn() } }],
      rtcStatus: 'connected',
    });

    renderVideoRoom({
      preloadedCompetition: readyCompetitionState,
      preloadedVideo: { room: readyRoom, status: 'ready', error: null },
    });

    expect(screen.getByText('Rival conectado')).toBeInTheDocument();
    expect(screen.getByText('Rival #7')).toBeInTheDocument();
    expect(screen.getByTestId('remote-video')).toBeInTheDocument();
    expect(bindRemoteVideo).toHaveBeenCalledWith(7, expect.any(HTMLDivElement));
  });

  it('shows the persistent match score and event icon in the active room video stage', () => {
    renderVideoRoom({
      preloadedCompetition: readyCompetitionState,
      preloadedVideo: { room: readyRoom, status: 'ready', error: null },
    });

    const score = screen.getByTestId('persistent-match-score');
    expect(screen.getByTestId('active-event-icon')).toHaveAccessibleName('Cubo actual: 3x3');
    expect(score).toHaveAccessibleName('Marcador de la sala: tú 2, rival 1');
    expect(score).toHaveTextContent('2');
    expect(score).toHaveTextContent('1');
  });

  it('shows competition errors when create or join fails', async () => {
    competitionService.createRoom.mockRejectedValueOnce({
      response: { data: { error: 'No se pudo crear la sala' } },
    });

    const { user, store } = renderVideoRoom();

    await user.click(screen.getByRole('button', { name: /crear sala/i }));

    expect(await screen.findByText('No se pudo crear la sala')).toBeInTheDocument();
    expect(screen.getByText('Sin sala activa')).toBeInTheDocument();
    expect(videoService.requestToken).not.toHaveBeenCalled();
    expect(store.getState().competition).toEqual({
      room: null,
      status: 'failed',
      error: 'No se pudo crear la sala',
      result: null,
      resultStatus: 'idle',
      resultError: null,
    });
  });

  it('shows the video quota dialog when the monthly free trial is exhausted', async () => {
    competitionService.createRoom.mockResolvedValueOnce(waitingCompetitionRoom);
    videoService.requestToken.mockRejectedValueOnce({
      response: {
        data: {
          error: 'Se ha agotado tu prueba gratuita mensual',
          code: 'VIDEO_QUOTA_EXCEEDED',
        },
      },
    });

    const { user } = renderVideoRoom();

    await user.click(screen.getByRole('button', { name: /crear sala/i }));

    expect(await screen.findByRole('alertdialog', { name: /límite de video alcanzado/i })).toBeInTheDocument();
    expect(screen.getByText('Se ha agotado tu prueba gratuita mensual')).toBeInTheDocument();
  });

  it('shows the video quota dialog when the global free quota is exhausted', async () => {
    competitionService.createRoom.mockResolvedValueOnce(waitingCompetitionRoom);
    videoService.requestToken.mockRejectedValueOnce({
      response: {
        data: {
          error: 'El cupo gratuito mensual de vídeo se ha agotado temporalmente',
          code: 'VIDEO_GLOBAL_QUOTA_EXCEEDED',
        },
      },
    });

    const { user } = renderVideoRoom();

    await user.click(screen.getByRole('button', { name: /crear sala/i }));

    expect(await screen.findByRole('alertdialog', { name: /límite de video alcanzado/i })).toBeInTheDocument();
    expect(screen.getByText('El cupo gratuito mensual de vídeo se ha agotado temporalmente')).toBeInTheDocument();
  });

  it('disconnects video when reported usage exhausts the global quota', async () => {
    vi.useFakeTimers();
    mockAgoraRoomState({ rtcStatus: 'connected' });
    videoService.reportUsage.mockResolvedValueOnce({
      limitSeconds: 3600,
      usedSeconds: 30,
      remainingSeconds: 3570,
      resetAt: '2026-07-01T00:00:00.000Z',
      global: {
        limitSeconds: 480000,
        usedSeconds: 480000,
        remainingSeconds: 0,
        resetAt: '2026-07-01T00:00:00.000Z',
      },
    });

    renderVideoRoom({
      preloadedCompetition: readyCompetitionState,
      preloadedVideo: { room: readyRoom, status: 'ready', error: null },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30000);
    });

    expect(screen.getByRole('alertdialog', { name: /límite de video alcanzado/i })).toBeInTheDocument();
    expect(screen.getByText('El cupo gratuito mensual de vídeo se ha agotado temporalmente')).toBeInTheDocument();
  });

  it('submits a DNF result from an active competition room', async () => {
    const result = { id: 'result-1', timeMs: null, penalty: 'dnf' };
    competitionService.submitResult.mockResolvedValueOnce(result);

    const { user, store } = renderVideoRoom({
      preloadedCompetition: readyCompetitionState,
      preloadedVideo: { room: readyRoom, status: 'ready', error: null },
    });

    expect(screen.getByText(/timer local/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /iniciar/i }));
    await user.click(screen.getByRole('button', { name: /^parar$/i }));
    await user.click(screen.getByRole('button', { name: /enviar resultado dnf/i }));

    await waitFor(() => {
      expect(competitionService.submitResult).toHaveBeenCalledWith({
        code: 'ABC123',
        timeMs: null,
        penalty: 'dnf',
      });
    });
    expect(await screen.findByText('Último resultado enviado')).toBeInTheDocument();
    expect(screen.getByText('DNF (DNF)')).toBeInTheDocument();
    expect(store.getState().competition).toEqual({
      ...readyCompetitionState,
      result,
      resultStatus: 'ready',
      resultError: null,
    });
  });

  it('refreshes a waiting competition room and enables the timer when it becomes active', async () => {
    competitionService.getRoom.mockResolvedValueOnce(competitionRoom);

    const { user, store } = renderVideoRoom({
      preloadedCompetition: {
        room: waitingCompetitionRoom,
        status: 'ready',
        error: null,
        result: null,
        resultStatus: 'idle',
        resultError: null,
      },
      preloadedVideo: { room: readyRoom, status: 'ready', error: null },
    });

    expect(screen.getByText('Esperando rival')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /actualizar sala/i }));

    await waitFor(() => {
      expect(competitionService.getRoom).toHaveBeenCalledWith({ code: 'ABC123' });
    });
    expect(await screen.findByText('Resultado sala ABC123')).toBeInTheDocument();
    expect(store.getState().competition.room.status).toBe('active');
  });

  it('shows result submit errors without leaving the video room', async () => {
    competitionService.submitResult.mockRejectedValueOnce({
      response: { data: { error: 'Resultado ya enviado' } },
    });

    const { user, store } = renderVideoRoom({
      preloadedCompetition: readyCompetitionState,
      preloadedVideo: { room: readyRoom, status: 'ready', error: null },
    });

    await user.click(screen.getByRole('button', { name: /iniciar/i }));
    await user.click(screen.getByRole('button', { name: /^parar$/i }));
    await user.click(screen.getByRole('button', { name: /enviar resultado dnf/i }));

    expect(await screen.findByText('Resultado ya enviado')).toBeInTheDocument();
    expect(screen.getByTestId('room-code')).toHaveTextContent('ABC123');
    expect(store.getState().competition).toEqual({
      ...readyCompetitionState,
      resultStatus: 'failed',
      resultError: 'Resultado ya enviado',
    });
  });
});
