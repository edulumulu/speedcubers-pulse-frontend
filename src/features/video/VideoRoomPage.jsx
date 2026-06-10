import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  leaveVideoRoom,
  requestVideoToken,
  selectVideoError,
  selectVideoRoom,
  selectVideoStatus,
} from '../../store/slices/videoSlice.js';

function createDefaultChannel() {
  return `match-${Date.now().toString(36)}`;
}

export function VideoRoomPage() {
  const dispatch = useDispatch();
  const room = useSelector(selectVideoRoom);
  const status = useSelector(selectVideoStatus);
  const error = useSelector(selectVideoError);
  const defaultChannel = useMemo(createDefaultChannel, []);
  const [channelName, setChannelName] = useState(defaultChannel);

  const isLoading = status === 'loading';
  const isReady = status === 'ready' && room;

  function handleSubmit(e) {
    e.preventDefault();
    const nextChannelName = channelName.trim();
    if (!nextChannelName) return;
    dispatch(requestVideoToken({ channelName: nextChannelName }));
  }

  function handleLeave() {
    dispatch(leaveVideoRoom());
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
          <form className="card" onSubmit={handleSubmit}>
            <label className="form-label" htmlFor="channelName">Canal</label>
            <input
              id="channelName"
              className="form-input"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              placeholder="match-123"
              disabled={isLoading}
              required
            />

            {error && (
              <div className="mb-5 px-3 py-2.5 bg-red-400/10 border border-red-400/20 rounded-md text-red-400 text-sm">
                {error}
              </div>
            )}

            <button className="btn-primary" type="submit" disabled={isLoading}>
              {isLoading ? 'Preparando sala...' : 'Solicitar token'}
            </button>

            {isReady && (
              <button className="btn-secondary mt-3" type="button" onClick={handleLeave}>
                Salir de la sala
              </button>
            )}
          </form>

          <div className="border border-border bg-surface rounded-lg overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-b border-border">
              <div>
                <h2 className="text-base font-semibold">
                  {isReady ? room.channelName : 'Esperando token de video'}
                </h2>
                <p className="text-xs text-muted">
                  {isReady ? 'Token listo para conectar el cliente RTC.' : 'Solicita un token para abrir la sala.'}
                </p>
              </div>
              <span className={isReady ? 'badge-green' : 'badge-cyan'}>
                {isReady ? 'Lista' : 'Waiting room'}
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-3 p-4">
              <div className="aspect-video rounded-md border border-border-light bg-bg flex items-center justify-center">
                <div className="text-center px-4">
                  <p className="text-sm font-medium text-[#e2f0ff]">Tu cámara</p>
                  <p className="text-xs text-muted mt-1">
                    {isReady ? 'Preparada para publicar video local.' : 'Se activará al entrar en la sala.'}
                  </p>
                </div>
              </div>
              <div className="aspect-video rounded-md border border-border-light bg-bg flex items-center justify-center">
                <div className="text-center px-4">
                  <p className="text-sm font-medium text-[#e2f0ff]">Rival</p>
                  <p className="text-xs text-muted mt-1">
                    {isReady ? 'Esperando a que el otro cuber se una.' : 'Aún no hay canal activo.'}
                  </p>
                </div>
              </div>
            </div>

            {isReady && (
              <dl className="grid sm:grid-cols-3 gap-3 px-4 pb-4 text-sm">
                <div className="border border-border rounded-md p-3">
                  <dt className="text-xs text-muted">App ID</dt>
                  <dd className="mt-1 font-mono text-xs break-all">{room.appId || 'Pendiente de configurar'}</dd>
                </div>
                <div className="border border-border rounded-md p-3">
                  <dt className="text-xs text-muted">UID</dt>
                  <dd className="mt-1 font-mono text-xs">{room.uid ?? 'auto'}</dd>
                </div>
                <div className="border border-border rounded-md p-3">
                  <dt className="text-xs text-muted">Expira</dt>
                  <dd className="mt-1 font-mono text-xs">{room.expiresAt ?? 'sin fecha'}</dd>
                </div>
              </dl>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
