import { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import {
  createCompetitionRoom,
  joinCompetitionRoom,
  leaveCompetitionRoom,
  refreshCompetitionRoom,
  selectCompetitionError,
  selectCompetitionResult,
  selectCompetitionResultError,
  selectCompetitionResultStatus,
  selectCompetitionRoom,
  selectCompetitionStatus,
  submitCompetitionResult,
  updateCompetitionRoundEvent,
} from '../../store/slices/competitionSlice.js';
import {
  leaveVideoRoom,
  requestVideoToken,
  selectVideoError,
  selectVideoRoom,
  selectVideoStatus,
} from '../../store/slices/videoSlice.js';
import { selectUser } from '../../store/slices/authSlice.js';
import { CompetitionTimerPanel } from '../timer/CompetitionTimerPanel.jsx';
import { useAgoraRoom } from './useAgoraRoom.js';
import { competitionSocketService } from '../../services/competitionSocketService.js';
import { videoService } from '../../services/videoService.js';

const VIDEO_QUOTA_EXHAUSTED_MESSAGE = 'Se ha agotado tu prueba gratuita mensual';
const VIDEO_USAGE_REPORT_INTERVAL_MS = 30000;
const EVENT_OPTIONS = [
  { value: '3x3', label: '3x3' },
  { value: '2x2', label: '2x2' },
  { value: '4x4', label: '4x4' },
  { value: '5x5', label: '5x5' },
  { value: '6x6', label: '6x6' },
  { value: '7x7', label: '7x7' },
  { value: 'oh', label: '3x3 OH' },
  { value: 'pyraminx', label: 'Pyraminx' },
  { value: 'skewb', label: 'Skewb' },
];

const CUBE_EVENT_CELLS = {
  '2x2': 2,
  '3x3': 3,
  '4x4': 4,
  '5x5': 5,
  '6x6': 6,
  '7x7': 7,
};

function roundNumber(round) {
  return round?.number ?? round?.round_number ?? null;
}

function roomStatusCopy({ isConnectedRtc, isJoiningRtc, isReady }) {
  if (isConnectedRtc) return 'Video preparado.';
  if (isJoiningRtc) return 'Conectando video.';
  if (isReady) return 'Listo para competir.';
  return 'Listo para empezar.';
}

function CubeGridIcon({ cells }) {
  const size = 500;
  const margin = cells >= 6 ? 22 : 30;
  const gap = cells >= 6 ? 20 : cells >= 5 ? 28 : 36;
  const cellSize = (size - margin * 2 - gap * (cells - 1)) / cells;
  const squares = Array.from({ length: cells * cells }, (_, index) => {
    const row = Math.floor(index / cells);
    const column = index % cells;
    return {
      id: `${row}-${column}`,
      x: margin + column * (cellSize + gap),
      y: margin + row * (cellSize + gap),
    };
  });

  return (
    <svg viewBox="0 0 500 500" aria-hidden="true" className="h-full w-full fill-current">
      {squares.map((square) => (
        <rect
          key={square.id}
          x={square.x}
          y={square.y}
          width={cellSize}
          height={cellSize}
        />
      ))}
    </svg>
  );
}

CubeGridIcon.propTypes = {
  cells: PropTypes.number.isRequired,
};

function PyraminxIcon() {
  return (
    <svg viewBox="0 0 500 500" aria-hidden="true" className="h-full w-full fill-current">
      <g clipRule="evenodd" fillRule="evenodd">
        <path d="m250.011 71.163c20.532 35.558 40.61 70.329 60.917 105.497-40.682 0-80.999 0-121.824 0 20.215-35.015 40.325-69.848 60.907-105.497z" />
        <path d="m98.746 333.155c20.443 35.413 40.466 70.099 60.748 105.233-40.658 0-80.703 0-121.493 0 20.275-35.124 40.326-69.861 60.745-105.233z" />
        <path d="m401.275 333.155c20.408 35.349 40.43 70.036 60.725 105.19-40.625 0-80.668 0-121.439 0 20.216-35.027 40.267-69.765 60.714-105.19z" />
        <path d="m189.235 438.43c20.374-35.287 40.388-69.953 60.733-105.188 20.383 35.302 40.432 70.026 60.732 105.188-40.684 0-80.713 0-121.465 0z" />
        <path d="m189.222 193.807h121.481c-20.283 35.137-40.336 69.875-60.733 105.213-20.347-35.242-40.372-69.922-60.748-105.213z" />
        <path d="m264.949 307.287c20.256-35.079 40.248-69.701 60.699-105.119 20.459 35.437 40.449 70.061 60.688 105.119-40.684 0-80.705 0-121.387 0z" />
        <path d="m325.604 430.023c-20.439-35.398-40.402-69.979-60.631-105.014h121.252c-20.19 34.971-40.155 69.557-60.621 105.014z" />
        <path d="m235.007 307.329c-40.677 0-80.64 0-121.344 0 20.236-35.051 40.229-69.681 60.671-105.088 20.427 35.38 40.421 70.01 60.673 105.088z" />
        <path d="m113.753 324.944h121.242c-20.21 35.009-40.162 69.573-60.61 104.995-20.35-35.242-40.335-69.849-60.632-104.995z" />
      </g>
    </svg>
  );
}

function SkewbIcon() {
  return (
    <svg viewBox="0 0 500 500" aria-hidden="true" className="h-full w-full fill-current">
      <path d="m215.48131-138.07208h276.13837v276.13837h-276.13837z" strokeWidth=".955982" transform="matrix(.70710678 .70710678 -.70710678 .70710678 0 0)" />
      <path d="m43 43.5h187.5l-187.5 187.5z" />
      <path d="m43 456.5v-187.5l187.5 187.5z" />
      <path d="m457 456.5h-187.5l187.5-187.5z" />
      <path d="m457 43.5v187.5l-187.5-187.5z" />
    </svg>
  );
}

function OneHandedIcon() {
  return (
    <svg viewBox="0 0 500 500" aria-hidden="true" className="h-full w-full fill-current">
      <path clipRule="evenodd" d="m298.473 332.997c0-2.802 0-5.242 0-8.212-14.722 0-29.174.015-43.626-.003-19.157-.023-38.316.072-57.472-.166-10.302-.129-18.292-7.216-20.328-17.286-1.853-9.163 3.034-19.079 12.012-22.986 3.381-1.472 7.402-2.037 11.135-2.051 40.813-.139 81.629.009 122.443-.161 9.123-.038 15.375 4.223 21.629 10.393 25.26 24.919 50.955 49.397 76.488 74.041 3.596 3.471 6.904 7.313 10.838 10.345 6.215 4.787 8.258 10.58 8.043 18.449-.553 20.143-.186 40.312-.184 60.47v8.481c-9.523-9.161-17.688-17.688-26.564-25.398-13.682-11.885-27.795-23.277-41.836-34.744-8.523-6.962-18.785-9.397-29.422-9.31-23.133.192-46.261 1.237-69.394 1.434-28.321.242-56.652-.366-84.968.079-12.632.199-23.001-4.502-31.481-12.761-29.835-29.058-59.207-58.59-88.763-87.933-6.604-6.557-8.228-14.462-5.22-22.947 2.912-8.216 9.268-12.885 18.003-13.75 6.879-.682 12.596 2 17.604 6.694 19.688 18.456 39.46 36.825 59.202 55.224 3.777 3.521 7.468 7.144 11.396 10.486 1.268 1.08 3.166 2.005 4.778 2.009 41.318.085 82.636.04 123.953.002.472 0 .942-.21 1.734-.399z" fillRule="evenodd" />
      <path d="m131.259 43.322h55.921v55.921h-55.921z" />
      <path d="m209.549 43.322h55.921v55.921h-55.921z" />
      <path d="m287.838 43.322h55.922v55.921h-55.922z" />
      <path d="m131.539 121.612h55.921v55.921h-55.921z" />
      <path d="m209.828 121.612h55.922v55.921h-55.922z" />
      <path d="m288.117 121.612h55.922v55.921h-55.922z" />
      <path d="m131.679 199.901h55.921v55.921h-55.921z" />
      <path d="m209.968 199.901h55.92v55.921h-55.92z" />
      <path d="m288.258 199.901h55.92v55.921h-55.92z" />
    </svg>
  );
}

function EventIcon({ event, className = '' }) {
  const cells = CUBE_EVENT_CELLS[event];
  if (cells) return <CubeGridIcon cells={cells} />;
  if (event === 'pyraminx') return <PyraminxIcon />;
  if (event === 'skewb') return <SkewbIcon />;
  if (event === 'oh') return <OneHandedIcon />;

  return (
    <span className={`grid h-full w-full place-items-center font-mono text-xl font-semibold ${className}`}>
      {event}
    </span>
  );
}

EventIcon.propTypes = {
  event: PropTypes.string.isRequired,
  className: PropTypes.string,
};

function resolveScorePlayers(matchScore, currentUser) {
  const players = [matchScore?.host, matchScore?.guest].filter(Boolean);
  const ownPlayer = players.find((player) => player.id && player.id === currentUser?.id) ?? matchScore?.host ?? null;
  const rivalPlayer = players.find((player) => player.id !== ownPlayer?.id) ?? matchScore?.guest ?? null;

  return {
    ownScore: ownPlayer?.score ?? 0,
    rivalScore: rivalPlayer?.score ?? 0,
    rivalUsername: rivalPlayer?.username ?? 'Rival',
  };
}

export function VideoRoomPage() {
  const dispatch = useDispatch();
  const competitionRoom = useSelector(selectCompetitionRoom);
  const competitionStatus = useSelector(selectCompetitionStatus);
  const competitionError = useSelector(selectCompetitionError);
  const competitionResult = useSelector(selectCompetitionResult);
  const competitionResultStatus = useSelector(selectCompetitionResultStatus);
  const competitionResultError = useSelector(selectCompetitionResultError);
  const accessToken = useSelector((state) => state.auth.accessToken);
  const currentUser = useSelector(selectUser);
  const room = useSelector(selectVideoRoom);
  const status = useSelector(selectVideoStatus);
  const error = useSelector(selectVideoError);
  const [joinCode, setJoinCode] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('3x3');
  const [copyStatus, setCopyStatus] = useState('idle');
  const [competitionSocket, setCompetitionSocket] = useState(null);
  const [inspectionStart, setInspectionStart] = useState(null);
  const [roundFinalDismiss, setRoundFinalDismiss] = useState(null);
  const [quotaExpiredMessage, setQuotaExpiredMessage] = useState(null);
  const videoUsageRef = useRef({
    roomKey: null,
    lastReportedAt: null,
    expired: false,
  });
  const {
    localVideoRef,
    remoteUsers,
    rtcStatus,
    rtcError,
    bindRemoteVideo,
    leaveRtcRoom,
  } = useAgoraRoom(room);

  const isLoading = competitionStatus === 'loading' || status === 'loading';
  const isReady = status === 'ready' && room;
  const isJoiningRtc = rtcStatus === 'joining';
  const isConnectedRtc = rtcStatus === 'connected';
  const visibleError = quotaExpiredMessage ? null : competitionError || error || rtcError;
  const hasCompetitionRoom = Boolean(competitionRoom);
  const controlsDisabled = isLoading || hasCompetitionRoom;
  const roomCode = competitionRoom?.code;
  const isCompetitionActive = competitionRoom?.status === 'active';
  const activeRoundNumber = roundNumber(competitionRoom?.activeRound);
  const activeEvent = competitionRoom?.activeRound?.event ?? competitionRoom?.event ?? selectedEvent;
  const {
    ownScore,
    rivalScore,
    rivalUsername,
  } = resolveScorePlayers(competitionRoom?.matchScore, currentUser);
  const submittedRoundNumber = roundNumber(competitionResult?.round);
  const isWaitingForNextRound = Boolean(
    isCompetitionActive
      && submittedRoundNumber !== null
      && (activeRoundNumber === null || activeRoundNumber <= submittedRoundNumber)
      && !competitionResult?.nextRound,
  );

  const reportCurrentVideoUsage = useCallback(async () => {
    if (!room || rtcStatus !== 'connected') return;

    const roomKey = `${room.channelName}:${room.uid}`;
    const currentUsage = videoUsageRef.current;
    if (currentUsage.roomKey !== roomKey || !currentUsage.lastReportedAt) return;

    const now = Date.now();
    const seconds = Math.floor((now - currentUsage.lastReportedAt) / 1000);
    if (seconds < 1) return;

    const previousReportedAt = currentUsage.lastReportedAt;
    videoUsageRef.current = {
      ...currentUsage,
      lastReportedAt: now,
    };

    try {
      const quota = await videoService.reportUsage({ seconds });
      if (quota?.remainingSeconds <= 0) {
        setQuotaExpiredMessage(VIDEO_QUOTA_EXHAUSTED_MESSAGE);
      }
    } catch {
      videoUsageRef.current = {
        ...videoUsageRef.current,
        lastReportedAt: previousReportedAt,
      };
    }
  }, [room, rtcStatus]);

  const expireVideoQuota = useCallback(async () => {
    if (videoUsageRef.current.expired) return;
    videoUsageRef.current = {
      ...videoUsageRef.current,
      expired: true,
    };
    setQuotaExpiredMessage(VIDEO_QUOTA_EXHAUSTED_MESSAGE);
    await reportCurrentVideoUsage();
    await leaveRtcRoom();
    dispatch(leaveVideoRoom());
    dispatch(leaveCompetitionRoom());
  }, [dispatch, leaveRtcRoom, reportCurrentVideoUsage]);

  useEffect(() => {
    if (!room) return;
    videoUsageRef.current = {
      roomKey: `${room.channelName}:${room.uid}`,
      lastReportedAt: Date.now(),
      expired: false,
    };
    setQuotaExpiredMessage(null);
  }, [room]);

  useEffect(() => {
    if (error === VIDEO_QUOTA_EXHAUSTED_MESSAGE) {
      setQuotaExpiredMessage(VIDEO_QUOTA_EXHAUSTED_MESSAGE);
    }
  }, [error]);

  useEffect(() => {
    if (!room?.quota || rtcStatus !== 'connected') return undefined;

    const remainingMs = Math.max(0, room.quota.remainingSeconds ?? 0) * 1000;
    const intervalId = window.setInterval(() => {
      reportCurrentVideoUsage();
    }, VIDEO_USAGE_REPORT_INTERVAL_MS);
    const timeoutId = window.setTimeout(() => {
      expireVideoQuota();
    }, remainingMs);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
      reportCurrentVideoUsage();
    };
  }, [expireVideoQuota, reportCurrentVideoUsage, room?.quota, rtcStatus]);

  useEffect(() => {
    if (!roomCode || (isCompetitionActive && !isWaitingForNextRound)) return undefined;

    const intervalId = window.setInterval(() => {
      dispatch(refreshCompetitionRoom({ code: roomCode }));
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [dispatch, isCompetitionActive, isWaitingForNextRound, roomCode]);

  useEffect(() => {
    setInspectionStart(null);
  }, [competitionRoom?.activeRound?.id]);

  useEffect(() => {
    if (activeEvent) setSelectedEvent(activeEvent);
  }, [activeEvent]);

  useEffect(() => {
    if (!accessToken || !roomCode || !isCompetitionActive) return undefined;

    const socket = competitionSocketService.connect({ token: accessToken });
    setCompetitionSocket(socket);

    socket.on('connect', () => {
      socket.emit('competition:join', { code: roomCode });
    });
    socket.on('competition:inspection:started', (payload) => {
      if (payload?.code !== roomCode) return;
      setInspectionStart({
        roundId: payload.roundId,
        startedAt: payload.startedAt,
      });
    });
    socket.on('competition:round-final:dismissed', (payload) => {
      if (payload?.code !== roomCode) return;
      setRoundFinalDismiss({
        roundId: payload.roundId,
        dismissedAt: payload.dismissedAt ?? Date.now(),
      });
    });
    socket.on('competition:round:updated', (payload) => {
      if (payload?.code !== roomCode) return;
      dispatch(refreshCompetitionRoom({ code: roomCode }));
    });
    socket.connect();

    return () => {
      socket.off('connect');
      socket.off('competition:inspection:started');
      socket.off('competition:round-final:dismissed');
      socket.off('competition:round:updated');
      socket.disconnect();
      setCompetitionSocket(null);
    };
  }, [accessToken, dispatch, isCompetitionActive, roomCode]);

  useEffect(() => {
    setCopyStatus('idle');
  }, [roomCode]);

  async function openVideoRoom(roomAction) {
    try {
      const nextRoom = await dispatch(roomAction).unwrap();
      if (!nextRoom.channelName) return;
      dispatch(requestVideoToken({ channelName: nextRoom.channelName }));
    } catch {
      // The rejected thunk stores the visible error in Redux.
    }
  }

  function handleCreateRoom() {
    openVideoRoom(createCompetitionRoom({ event: selectedEvent }));
  }

  function handleJoinRoom(e) {
    e.preventDefault();
    const nextCode = joinCode.trim().toUpperCase();
    if (!nextCode) return;
    openVideoRoom(joinCompetitionRoom({ code: nextCode }));
  }

  async function handleLeave() {
    await reportCurrentVideoUsage();
    await leaveRtcRoom();
    dispatch(leaveVideoRoom());
    dispatch(leaveCompetitionRoom());
  }

  async function handleSubmitResult({ timeMs, penalty }) {
    if (!roomCode) return null;

    try {
      const result = await dispatch(submitCompetitionResult({ code: roomCode, timeMs, penalty })).unwrap();
      competitionSocket?.emit('competition:round:changed', {
        code: roomCode,
        roundId: result?.round?.id ?? null,
      });
      return result;
    } catch {
      // The rejected thunk stores the visible error in Redux.
      return null;
    }
  }

  function handleStartInspection({ roundId, startedAt }) {
    if (!roomCode) return;

    const payload = { code: roomCode, roundId, startedAt };
    setInspectionStart({ roundId, startedAt });
    if (!competitionSocket) return;

    competitionSocket.emit('competition:join', { code: roomCode }, () => {
      competitionSocket.emit('competition:inspection:start', payload);
    });
  }

  async function handleChangeRoundEvent(event) {
    setSelectedEvent(event);
    if (!roomCode || !competitionRoom?.activeRound?.id) return;

    try {
      const nextRoom = await dispatch(updateCompetitionRoundEvent({ code: roomCode, event })).unwrap();
      competitionSocket?.emit('competition:round:changed', {
        code: roomCode,
        roundId: nextRoom?.activeRound?.id ?? competitionRoom.activeRound.id,
      });
    } catch {
      // The rejected thunk stores the visible error in Redux.
    }
  }

  function handleDismissRoundFinal({ roundId }) {
    if (!roomCode) return;

    if (!competitionSocket) {
      setRoundFinalDismiss({ roundId, dismissedAt: Date.now() });
      return;
    }

    competitionSocket.emit('competition:join', { code: roomCode }, () => {
      competitionSocket.emit('competition:round-final:dismiss', { code: roomCode, roundId });
    });
  }

  function handleRefreshRoom() {
    if (!roomCode) return;
    dispatch(refreshCompetitionRoom({ code: roomCode }));
  }

  async function handleCopyRoomCode() {
    if (!roomCode || !navigator.clipboard) return;
    await navigator.clipboard.writeText(roomCode);
    setCopyStatus('copied');
  }

  function rtcStatusLabel() {
    if (rtcStatus === 'joining') return 'Conectando cámara';
    if (rtcStatus === 'connected') return remoteUsers.length ? 'Rival conectado' : 'En directo';
    if (rtcStatus === 'failed') return 'Error de video';
    return isReady ? 'Sala preparada' : roomCode ? 'Sala creada' : 'Sin sala';
  }

  return (
    <main className="min-h-[calc(100vh-65px)] max-w-7xl mx-auto px-4 py-6" data-testid="compete-page">
      {quotaExpiredMessage && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4" role="alertdialog" aria-modal="true" aria-labelledby="video-quota-title">
          <div className="w-full max-w-md rounded-lg border border-red-400/30 bg-surface p-5 shadow-2xl">
            <h2 id="video-quota-title" className="text-lg font-semibold text-[#e2f0ff]">Límite de video alcanzado</h2>
            <p className="mt-2 text-sm text-muted">{quotaExpiredMessage}</p>
            <button
              className="btn-primary mt-5"
              type="button"
              onClick={() => setQuotaExpiredMessage(null)}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-3 border-b border-border/50 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-mono uppercase text-accent tracking-widest">Competición 1v1</p>
            <h1 className="mt-2 text-4xl font-extrabold leading-none text-[#e2f0ff] sm:text-5xl">Sala de competición</h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">Crea o únete a una sala 1v1.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-md border border-border bg-surface px-3 py-2 text-muted">Sala privada</span>
            <span className="rounded-md border border-border bg-surface px-3 py-2 text-muted">Video RTC</span>
            <span className="rounded-md border border-border bg-surface px-3 py-2 text-muted">Timer 1v1</span>
          </div>
        </header>

        {!isCompetitionActive && (
          <section className="grid gap-5 lg:grid-cols-[390px_minmax(0,1fr)] lg:items-start">
            <aside className="grid gap-4">
              <div className="rounded-lg border border-border bg-surface p-4">
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-[#e2f0ff]">Crear sala</h2>
                  <p className="mt-1 text-sm text-muted">Elige cubo inicial.</p>
                </div>
                <label className="form-label mb-2 text-[#bdd3e8]" htmlFor="initial-event">Cubo</label>
                <select
                  id="initial-event"
                  className="form-input mb-4 min-h-[52px] rounded-[10px] border-[#1b3c57] bg-[#0d1a26] text-[15px] focus:border-accent focus:bg-[#102133] focus:ring-2 focus:ring-accent/20"
                  value={selectedEvent}
                  onChange={(event) => setSelectedEvent(event.target.value)}
                  disabled={controlsDisabled}
                  data-testid="initial-event-select"
                >
                  {EVENT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  className="btn-primary"
                  type="button"
                  onClick={handleCreateRoom}
                  disabled={controlsDisabled}
                  data-testid="create-room-button"
                >
                  {competitionStatus === 'loading'
                    ? 'Creando sala...'
                    : status === 'loading'
                      ? 'Conectando video...'
                      : 'Crear sala'}
                </button>

                <div className="my-5 border-t border-border" />
                <form onSubmit={handleJoinRoom}>
                  <label className="form-label mb-2 text-[#bdd3e8]" htmlFor="roomCode">Código de sala</label>
                  <input
                    id="roomCode"
                    className="form-input mb-4 min-h-[52px] rounded-[10px] border-[#1b3c57] bg-[#0d1a26] text-[15px] uppercase placeholder:text-[#8aa2ba] focus:border-accent focus:bg-[#102133] focus:ring-2 focus:ring-accent/20"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="ABC123"
                    disabled={controlsDisabled}
                    required
                  />

                  <button
                    className="btn-secondary"
                    type="submit"
                    disabled={controlsDisabled}
                    data-testid="join-room-button"
                  >
                    {competitionStatus === 'loading'
                      ? 'Entrando...'
                      : status === 'loading'
                        ? 'Conectando video...'
                        : 'Unirse con código'}
                  </button>
                </form>

                {visibleError && (
                  <div
                    className="mt-5 px-3 py-2.5 bg-red-400/10 border border-red-400/20 rounded-md text-red-400 text-sm"
                    role="alert"
                  >
                    {visibleError}
                  </div>
                )}

                {hasCompetitionRoom && (
                  <button className="btn-secondary mt-3" type="button" onClick={handleLeave} data-testid="leave-room-button">
                    Salir de la sala
                  </button>
                )}
              </div>

              {!hasCompetitionRoom && (
                <div className="rounded-lg border border-border bg-[#07101a] p-4">
                  <h3 className="mb-3 text-sm font-semibold text-[#e2f0ff]">Resumen</h3>
                  <div className="grid gap-3 text-sm text-muted">
                    <div className="grid grid-cols-[28px_minmax(0,1fr)] items-start gap-3">
                      <span className="grid h-7 w-7 place-items-center rounded-full border border-border text-xs font-semibold text-[#e2f0ff]">1</span>
                      <span>Crea una sala o entra con código.</span>
                    </div>
                    <div className="grid grid-cols-[28px_minmax(0,1fr)] items-start gap-3">
                      <span className="grid h-7 w-7 place-items-center rounded-full border border-border text-xs font-semibold text-[#e2f0ff]">2</span>
                      <span>La cámara queda preparada mientras esperas rival.</span>
                    </div>
                    <div className="grid grid-cols-[28px_minmax(0,1fr)] items-start gap-3">
                      <span className="grid h-7 w-7 place-items-center rounded-full border border-border text-xs font-semibold text-[#e2f0ff]">3</span>
                      <span>Al unirse ambos, empieza la competición.</span>
                    </div>
                  </div>
                </div>
              )}

              {hasCompetitionRoom && (
                <div className="rounded-lg border border-border bg-[#07101a] p-4">
                  <h3 className="mb-3 text-sm font-semibold text-[#e2f0ff]">Datos técnicos</h3>
                  <dl className="grid gap-3">
                    <div className="rounded-md border border-border bg-surface p-3">
                      <dt className="text-xs text-muted">Canal</dt>
                      <dd className="mt-2 font-mono text-sm text-[#e2f0ff]">{room?.channelName ? 'Disponible' : 'Sin canal'}</dd>
                    </div>
                    <div className="rounded-md border border-border bg-surface p-3">
                      <dt className="text-xs text-muted">UID</dt>
                      <dd className="mt-2 font-mono text-sm text-[#e2f0ff]">{room?.uid ? 'Asignado' : 'auto'}</dd>
                    </div>
                  </dl>
                </div>
              )}
            </aside>

            <div className="overflow-hidden rounded-lg border border-border bg-surface">
              <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-base font-semibold" data-testid="room-title">
                    {roomCode ? `Sala ${roomCode}` : 'Sin sala activa'}
                  </h2>
                  <p className="text-xs text-muted">{roomStatusCopy({ isConnectedRtc, isJoiningRtc, isReady })}</p>
                </div>
                <span className={isConnectedRtc ? 'badge-green' : 'badge-cyan'} data-testid="rtc-status">
                  {rtcStatusLabel()}
                </span>
              </div>

              <div className="grid gap-3 p-4 md:grid-cols-2">
                <section
                  className="relative min-h-[210px] overflow-hidden rounded-md border border-border-light bg-[radial-gradient(circle_at_50%_38%,rgba(34,211,238,0.14),transparent_28%),linear-gradient(145deg,#0b1722,#04080d_68%)] md:aspect-video"
                  aria-labelledby="local-video-title"
                  role="group"
                >
                  <h3 id="local-video-title" className="sr-only">Tu cámara</h3>
                  <div ref={localVideoRef} className="absolute inset-0" data-testid="local-video" />
                  {!isConnectedRtc && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center px-4">
                        <p className="text-sm font-medium text-[#e2f0ff]">Tu cámara</p>
                        <p className="text-xs text-muted mt-1">
                          {isJoiningRtc ? 'Activando cámara.' : 'Cámara inactiva.'}
                        </p>
                      </div>
                    </div>
                  )}
                  {isConnectedRtc && (
                    <span className="absolute left-3 top-3 badge-green">Tú</span>
                  )}
                </section>
                <section
                  className="relative min-h-[210px] overflow-hidden rounded-md border border-border-light bg-[radial-gradient(circle_at_50%_35%,rgba(52,211,153,0.13),transparent_28%),linear-gradient(145deg,#0b1722,#04080d_68%)] md:aspect-video"
                  aria-labelledby="remote-video-title"
                  role="group"
                >
                  <h3 id="remote-video-title" className="sr-only">Rival</h3>
                  {remoteUsers[0] ? (
                    <>
                      <div
                        ref={(element) => bindRemoteVideo(remoteUsers[0].uid, element)}
                        className="absolute inset-0"
                        data-testid="remote-video"
                      />
                      <span className="absolute left-3 top-3 badge-green">Rival #{remoteUsers[0].uid}</span>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center px-4">
                        <p className="text-sm font-medium text-[#e2f0ff]">Rival</p>
                        <p className="text-xs text-muted mt-1">
                          {isConnectedRtc ? 'Esperando rival.' : 'Sin rival.'}
                        </p>
                      </div>
                    </div>
                  )}
                </section>
              </div>

              {isReady && (
                <dl className="grid gap-3 px-4 pb-4 text-sm sm:grid-cols-[1.25fr_1fr_0.7fr]">
                  <div className="border border-accent/25 bg-accent/5 rounded-md p-3">
                    <dt className="text-xs text-muted">Código de sala</dt>
                    <dd className="mt-1 font-mono text-xl text-[#e2f0ff] break-all" data-testid="room-code">{roomCode || 'Sin código'}</dd>
                  </div>
                  <div className="border border-border rounded-md p-3">
                    <dt className="text-xs text-muted">Canal</dt>
                    <dd className="mt-1 font-mono text-xs break-all" data-testid="room-channel">{room.channelName}</dd>
                  </div>
                  <div className="border border-border rounded-md p-3">
                    <dt className="text-xs text-muted">UID</dt>
                    <dd className="mt-1 font-mono text-xs" data-testid="room-uid">{room.uid ?? 'auto'}</dd>
                  </div>
                </dl>
              )}
            </div>
          </section>
        )}

        {hasCompetitionRoom && isCompetitionActive && (
          <section className="grid xl:grid-cols-[minmax(0,1fr)_380px] gap-4 items-start" aria-label="Sala de competición activa">
            <div className="xl:col-span-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-border bg-surface rounded-lg px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.6)]" aria-hidden="true" />
                <div className="min-w-0">
                  <h2 className="text-base font-semibold" data-testid="room-title">
                    Sala 1v1{activeRoundNumber ? ` · Ronda ${activeRoundNumber}` : ''}
                  </h2>
                  <p className="text-xs text-muted">{remoteUsers.length ? 'Rival conectado · competición activa' : 'Esperando stream del rival'}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <details className="relative">
                  <summary className="list-none cursor-pointer rounded-md border border-border bg-bg px-3 py-2 text-sm text-muted hover:border-border-light hover:text-[#e2f0ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                    Detalles de sala
                  </summary>
                  <dl className="absolute right-0 z-20 mt-2 grid min-w-72 gap-3 rounded-md border border-border bg-bg p-3 text-sm shadow-xl">
                    <div>
                      <dt className="text-xs text-muted">Código</dt>
                      <dd className="mt-1 font-mono text-xs break-all" data-testid="room-code">{roomCode || 'Sin código'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted">Canal</dt>
                      <dd className="mt-1 font-mono text-xs break-all" data-testid="room-channel">{room?.channelName ?? 'Sin canal'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted">UID</dt>
                      <dd className="mt-1 font-mono text-xs" data-testid="room-uid">{room?.uid ?? 'auto'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted">Estado</dt>
                      <dd className="mt-1">
                        <span className={isConnectedRtc ? 'badge-green' : 'badge-cyan'} data-testid="rtc-status">
                          {rtcStatusLabel()}
                        </span>
                      </dd>
                    </div>
                  </dl>
                </details>
                <button
                  className="btn-secondary w-auto px-4 py-2"
                  type="button"
                  onClick={handleLeave}
                  aria-label="Salir de la sala"
                  data-testid="leave-room-button"
                >
                  Salir
                </button>
              </div>
            </div>

            <div className="relative min-h-[440px] lg:min-h-[620px] overflow-hidden rounded-lg border border-border bg-bg">
              <section
                className="absolute inset-0"
                aria-labelledby="remote-video-title"
                role="group"
              >
                <h3 id="remote-video-title" className="sr-only">Rival</h3>
                {remoteUsers[0] ? (
                  <>
                    <div
                      ref={(element) => bindRemoteVideo(remoteUsers[0].uid, element)}
                      className="absolute inset-0"
                      data-testid="remote-video"
                    />
                    <span className="absolute left-4 top-4 badge-green">Rival #{remoteUsers[0].uid}</span>
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_50%_35%,rgba(34,211,238,0.14),transparent_28%),linear-gradient(145deg,#08131f,#03070d_62%)]">
                    <div className="grid h-56 w-56 place-items-center rounded-full border border-accent/25 bg-surface text-sm text-muted">
                      Video rival
                    </div>
                    <span className="absolute left-4 top-4 badge-cyan">Rival</span>
                  </div>
                )}
              </section>

              <div
                className="absolute right-5 top-5 z-10 grid grid-cols-[auto_auto_auto] items-center gap-3 font-mono text-[#07101a] before:absolute before:-inset-x-6 before:-inset-y-4 before:-z-10 before:rounded-2xl before:bg-[linear-gradient(135deg,rgba(248,250,252,0.82),rgba(226,240,255,0.46)),radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.54),rgba(226,240,255,0)_70%)] before:blur-[9px]"
                aria-label={`Marcador de la sala: tú ${ownScore}, ${rivalUsername} ${rivalScore}`}
                data-testid="persistent-match-score"
              >
                <span className="text-5xl leading-none sm:text-6xl">{ownScore}</span>
                <span className="text-4xl leading-none text-[#183247] sm:text-5xl">-</span>
                <span className="text-5xl leading-none sm:text-6xl">{rivalScore}</span>
              </div>

              <div
                className="absolute bottom-4 left-4 z-10 h-20 w-20 text-[#07101a] before:absolute before:-inset-4 before:-z-10 before:rounded-2xl before:bg-[linear-gradient(135deg,rgba(248,250,252,0.82),rgba(226,240,255,0.42)),radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.54),rgba(226,240,255,0)_70%)] before:blur-[9px]"
                aria-label={`Cubo actual: ${EVENT_OPTIONS.find((option) => option.value === activeEvent)?.label ?? activeEvent}`}
                data-testid="active-event-icon"
              >
                <EventIcon event={activeEvent} />
              </div>

              <section
                className="absolute bottom-4 right-4 aspect-video w-44 overflow-hidden rounded-lg border border-border-light bg-surface shadow-2xl sm:w-56"
                aria-labelledby="local-video-title"
                role="group"
              >
                <h3 id="local-video-title" className="sr-only">Tu cámara</h3>
                <div ref={localVideoRef} className="absolute inset-0" data-testid="local-video" />
                {!isConnectedRtc && (
                  <div className="absolute inset-0 grid place-items-center bg-bg">
                    <p className="text-xs text-muted">Tu cámara</p>
                  </div>
                )}
                <span className="absolute left-2 top-2 rounded-full bg-bg/80 px-2 py-1 text-xs font-semibold text-[#e2f0ff]">
                  Tu cámara
                </span>
              </section>
            </div>

            <aside className="grid gap-4">
              <CompetitionTimerPanel
                roomCode={roomCode}
                activeRound={competitionRoom.activeRound}
                latestCompletedRound={competitionRoom.latestCompletedRound}
                matchScore={competitionRoom.matchScore}
                event={activeEvent}
                eventOptions={EVENT_OPTIONS}
                onChangeRoundEvent={handleChangeRoundEvent}
                currentUser={currentUser}
                onSubmit={handleSubmitResult}
                submitStatus={competitionResultStatus}
                submitError={competitionResultError}
                submittedResult={competitionResult}
                isWaitingForOpponent={isWaitingForNextRound}
                inspectionStartSignal={inspectionStart}
                onStartInspection={handleStartInspection}
                roundFinalDismissSignal={roundFinalDismiss}
                onDismissRoundFinal={handleDismissRoundFinal}
              />
            </aside>
          </section>
        )}

        {hasCompetitionRoom && !isCompetitionActive && (
          <section
            className="border border-border bg-surface rounded-lg p-4"
            aria-labelledby="waiting-room-title"
            role="status"
            aria-live="polite"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <p className="form-label mb-1">Sala preparada</p>
                <h2 id="waiting-room-title" className="text-base font-semibold">Esperando rival</h2>
                <p className="text-sm text-muted mt-1">
                  Comparte el código para activar el cronómetro cuando el otro cuber entre.
                </p>
              </div>
              <div className="rounded-md border border-accent/25 bg-accent/5 px-4 py-3">
                <p className="text-xs text-muted">Código</p>
                <p className="font-mono text-2xl text-[#e2f0ff] tracking-wide">{roomCode}</p>
              </div>
            </div>
            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              <button className="btn-primary" type="button" onClick={handleCopyRoomCode} disabled={!roomCode}>
                {copyStatus === 'copied' ? 'Código copiado' : 'Copiar código'}
              </button>
              <button className="btn-secondary" type="button" onClick={handleRefreshRoom} data-testid="refresh-room-button">
                Actualizar sala
              </button>
            </div>
          </section>
        )}

      </div>
    </main>
  );
}
