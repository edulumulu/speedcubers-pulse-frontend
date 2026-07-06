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

function roundNumber(round) {
  return round?.number ?? round?.round_number ?? null;
}

function roomStatusCopy({ isConnectedRtc, isJoiningRtc, isReady }) {
  if (isConnectedRtc) return 'Cámara y micrófono conectados a la sala.';
  if (isJoiningRtc) return 'Pidiendo permisos y entrando a la sala.';
  if (isReady) return 'La cámara está lista para competir.';
  return 'Crea una sala o únete con un código.';
}

function scorePlayerInitial(username, fallback) {
  return (username || fallback || '?').trim().charAt(0).toUpperCase();
}

function resolveScorePlayers(matchScore, currentUser) {
  const players = [matchScore?.host, matchScore?.guest].filter(Boolean);
  const ownPlayer = players.find((player) => player.id && player.id === currentUser?.id) ?? matchScore?.host ?? null;
  const rivalPlayer = players.find((player) => player.id !== ownPlayer?.id) ?? matchScore?.guest ?? null;

  return {
    ownPlayer,
    rivalPlayer,
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
  const {
    ownPlayer,
    rivalPlayer,
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
    openVideoRoom(createCompetitionRoom());
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
        <header className="border-b border-border/50 pb-4">
          <p className="text-xs font-mono uppercase text-accent tracking-widest">Competición 1v1</p>
          <h1 className="text-2xl font-bold mt-1">Sala de competición</h1>
          <p className="text-sm text-muted mt-1">Crea una sala privada, comparte el código y resuelve rondas contra otro cuber.</p>
        </header>

        {!isCompetitionActive && (
          <section className="grid lg:grid-cols-[320px_1fr] gap-5 items-start">
            <div className="card">
              <div className="mb-5">
                <p className="form-label mb-2">Crear sala</p>
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
              </div>

              <div className="border-t border-border pt-5">
                <form onSubmit={handleJoinRoom}>
                  <label className="form-label" htmlFor="roomCode">Código de sala</label>
                  <input
                    id="roomCode"
                    className="form-input uppercase"
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
              </div>

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

            <div className="border border-border bg-surface rounded-lg overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-b border-border">
                <div>
                  <h2 className="text-base font-semibold" data-testid="room-title">
                    {roomCode ? `Sala ${roomCode}` : 'Esperando sala de competencia'}
                  </h2>
                  <p className="text-xs text-muted">{roomStatusCopy({ isConnectedRtc, isJoiningRtc, isReady })}</p>
                </div>
                <span className={isConnectedRtc ? 'badge-green' : 'badge-cyan'} data-testid="rtc-status">
                  {rtcStatusLabel()}
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-3 p-4">
                <section
                  className="aspect-video rounded-md border border-border-light bg-bg overflow-hidden relative"
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
                          {isJoiningRtc ? 'Activando cámara y micrófono.' : 'Se activará al entrar en la sala.'}
                        </p>
                      </div>
                    </div>
                  )}
                  {isConnectedRtc && (
                    <span className="absolute left-3 top-3 badge-green">Tú</span>
                  )}
                </section>
                <section
                  className="aspect-video rounded-md border border-border-light bg-bg overflow-hidden relative"
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
                          {isConnectedRtc ? 'Esperando a que el otro cuber se una.' : 'Aún no hay sala activa.'}
                        </p>
                      </div>
                    </div>
                  )}
                </section>
              </div>

              {isReady && (
                <dl className="grid sm:grid-cols-[1.25fr_1fr_0.7fr] gap-3 px-4 pb-4 text-sm">
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
                <div
                  className="flex items-center gap-2 rounded-md border border-border-light bg-bg px-3 py-2"
                  aria-label={`Marcador de la sala: tú ${ownScore}, ${rivalUsername} ${rivalScore}`}
                  data-testid="persistent-match-score"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="grid h-7 w-7 place-items-center rounded-full border border-border bg-surface text-xs font-semibold text-[#e2f0ff]">
                      {scorePlayerInitial(ownPlayer?.username ?? currentUser?.username, 'T')}
                    </span>
                    <span className="hidden text-xs text-muted sm:inline">Tú</span>
                  </div>
                  <div className="flex items-baseline gap-1 font-mono text-[#e2f0ff]">
                    <span className="text-xl leading-none">{ownScore}</span>
                    <span className="text-sm text-muted">-</span>
                    <span className="text-xl leading-none">{rivalScore}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="hidden max-w-24 truncate text-xs text-muted sm:inline">{rivalUsername}</span>
                    <span className="grid h-7 w-7 place-items-center rounded-full border border-border bg-surface text-xs font-semibold text-[#e2f0ff]">
                      {scorePlayerInitial(rivalPlayer?.username, 'R')}
                    </span>
                  </div>
                </div>
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
