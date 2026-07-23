import { useCallback, useEffect, useRef, useState } from 'react';
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
import { EventIcon } from '../../components/EventIcon.jsx';

const VIDEO_QUOTA_EXHAUSTED_MESSAGE = 'Se ha agotado tu prueba gratuita mensual';
const VIDEO_GLOBAL_QUOTA_EXHAUSTED_MESSAGE = 'El cupo gratuito mensual de vídeo se ha agotado temporalmente';
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

function roundNumber(round) {
  return round?.number ?? round?.round_number ?? null;
}

function roomStatusCopy({ isConnectedRtc, isJoiningRtc, isReady }) {
  if (isConnectedRtc) return 'Video preparado.';
  if (isJoiningRtc) return 'Conectando video.';
  if (isReady) return 'Listo para competir.';
  return 'Listo para empezar.';
}

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

function exhaustedQuotaMessage(quota) {
  if (quota?.global?.remainingSeconds <= 0) return VIDEO_GLOBAL_QUOTA_EXHAUSTED_MESSAGE;
  if (quota?.remainingSeconds <= 0) return VIDEO_QUOTA_EXHAUSTED_MESSAGE;
  return null;
}

function quotaRemainingSeconds(quota) {
  const userRemaining = quota?.remainingSeconds ?? Number.POSITIVE_INFINITY;
  const globalRemaining = quota?.global?.remainingSeconds ?? Number.POSITIVE_INFINITY;
  return Math.min(userRemaining, globalRemaining);
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
      const quotaMessage = exhaustedQuotaMessage(quota);
      if (quotaMessage) {
        setQuotaExpiredMessage(quotaMessage);
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
    setQuotaExpiredMessage(exhaustedQuotaMessage(room?.quota) ?? VIDEO_QUOTA_EXHAUSTED_MESSAGE);
    await reportCurrentVideoUsage();
    await leaveRtcRoom();
    dispatch(leaveVideoRoom());
    dispatch(leaveCompetitionRoom());
  }, [dispatch, leaveRtcRoom, reportCurrentVideoUsage, room?.quota]);

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
    if (error === VIDEO_QUOTA_EXHAUSTED_MESSAGE || error === VIDEO_GLOBAL_QUOTA_EXHAUSTED_MESSAGE) {
      setQuotaExpiredMessage(error);
    }
  }, [error]);

  useEffect(() => {
    if (!room?.quota || rtcStatus !== 'connected') return undefined;

    const remainingMs = Math.max(0, quotaRemainingSeconds(room.quota)) * 1000;
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
