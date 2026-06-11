import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  createCompetitionRoom,
  joinCompetitionRoom,
  leaveCompetitionRoom,
  selectCompetitionError,
  selectCompetitionRoom,
  selectCompetitionStatus,
} from '../../store/slices/competitionSlice.js';
import {
  leaveVideoRoom,
  requestVideoToken,
  selectVideoError,
  selectVideoRoom,
  selectVideoStatus,
} from '../../store/slices/videoSlice.js';
import { useAgoraRoom } from './useAgoraRoom.js';

export function VideoRoomPage() {
  const dispatch = useDispatch();
  const competitionRoom = useSelector(selectCompetitionRoom);
  const competitionStatus = useSelector(selectCompetitionStatus);
  const competitionError = useSelector(selectCompetitionError);
  const room = useSelector(selectVideoRoom);
  const status = useSelector(selectVideoStatus);
  const error = useSelector(selectVideoError);
  const [joinCode, setJoinCode] = useState('');
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
  const visibleError = competitionError || error || rtcError;
  const hasCompetitionRoom = Boolean(competitionRoom);
  const controlsDisabled = isLoading || hasCompetitionRoom;
  const roomCode = competitionRoom?.code;

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
    await leaveRtcRoom();
    dispatch(leaveVideoRoom());
    dispatch(leaveCompetitionRoom());
  }

  function rtcStatusLabel() {
    if (rtcStatus === 'joining') return 'Conectando RTC';
    if (rtcStatus === 'connected') return remoteUsers.length ? 'Rival conectado' : 'En directo';
    if (rtcStatus === 'failed') return 'Error RTC';
    return isReady ? 'Token listo' : roomCode ? 'Sala creada' : 'Waiting room';
  }

  return (
    <main className="min-h-[calc(100vh-65px)] max-w-6xl mx-auto px-4 py-6">
      <div className="flex flex-col gap-6">
        <header className="border-b border-border/50 pb-4">
          <p className="text-xs font-mono uppercase text-accent tracking-widest">Fase 4</p>
          <h1 className="text-2xl font-bold mt-1">Sala de video</h1>
          <p className="text-sm text-muted mt-1">Prepara una sala privada para competir cara a cara.</p>
        </header>

        <section className="grid lg:grid-cols-[320px_1fr] gap-5 items-start">
          <div className="card">
            <div className="mb-5">
              <p className="form-label mb-2">Crear sala</p>
              <button className="btn-primary" type="button" onClick={handleCreateRoom} disabled={controlsDisabled}>
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

                <button className="btn-secondary" type="submit" disabled={controlsDisabled}>
                  {competitionStatus === 'loading'
                    ? 'Entrando...'
                    : status === 'loading'
                      ? 'Conectando video...'
                      : 'Unirse con código'}
                </button>
              </form>
            </div>

            {visibleError && (
              <div className="mt-5 px-3 py-2.5 bg-red-400/10 border border-red-400/20 rounded-md text-red-400 text-sm">
                {visibleError}
              </div>
            )}

            {hasCompetitionRoom && (
              <button className="btn-secondary mt-3" type="button" onClick={handleLeave}>
                Salir de la sala
              </button>
            )}
          </div>

          <div className="border border-border bg-surface rounded-lg overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-b border-border">
              <div>
                <h2 className="text-base font-semibold">
                  {roomCode ? `Sala ${roomCode}` : 'Esperando sala de competencia'}
                </h2>
                <p className="text-xs text-muted">
                  {isConnectedRtc
                    ? 'Cámara y micrófono conectados a la sala.'
                    : isJoiningRtc
                      ? 'Pidiendo permisos y entrando a la sala.'
                      : isReady
                        ? 'Token listo para conectar el cliente RTC.'
                        : 'Crea una sala o únete con un código.'}
                </p>
              </div>
              <span className={isConnectedRtc ? 'badge-green' : 'badge-cyan'}>
                {rtcStatusLabel()}
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-3 p-4">
              <div className="aspect-video rounded-md border border-border-light bg-bg overflow-hidden relative">
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
              </div>
              <div className="aspect-video rounded-md border border-border-light bg-bg overflow-hidden relative">
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
              </div>
            </div>

            {isReady && (
              <dl className="grid sm:grid-cols-3 gap-3 px-4 pb-4 text-sm">
                <div className="border border-border rounded-md p-3">
                  <dt className="text-xs text-muted">Código</dt>
                  <dd className="mt-1 font-mono text-xs break-all">{roomCode || 'Sin código'}</dd>
                </div>
                <div className="border border-border rounded-md p-3">
                  <dt className="text-xs text-muted">Canal</dt>
                  <dd className="mt-1 font-mono text-xs break-all">{room.channelName}</dd>
                </div>
                <div className="border border-border rounded-md p-3">
                  <dt className="text-xs text-muted">UID</dt>
                  <dd className="mt-1 font-mono text-xs">{room.uid ?? 'auto'}</dd>
                </div>
              </dl>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
