import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { presenceSocketService } from '../../services/presenceSocketService.js';
import {
  challengeCancelled,
  challengeCleared,
  challengeExpired,
  challengeFailed,
  challengeRejected,
  selectChallengeError,
  selectChallengeNotice,
  selectIncomingChallenge,
  selectOutgoingChallenge,
} from '../../store/slices/challengeSlice.js';

function msUntil(dateString) {
  const timestamp = Date.parse(dateString);
  if (Number.isNaN(timestamp)) return 30000;
  return Math.max(0, timestamp - Date.now());
}

function userInitial(username) {
  return username?.trim()?.charAt(0)?.toUpperCase() || '?';
}

function CompetitorBadge({ username, line }) {
  return (
    <div className="grid justify-items-center gap-2 text-center">
      <div className="relative grid h-[104px] w-[104px] place-items-center rounded-full border border-accent/70 bg-[#06101b] shadow-[0_0_0_6px_rgba(34,211,238,0.04),0_0_28px_rgba(34,211,238,0.12)] before:absolute before:inset-1.5 before:rounded-full before:border before:border-accent/40">
        <div className="relative z-10 grid h-[58px] w-[58px] place-items-center rounded-full border border-accent/60 bg-[#102c3f] text-[22px] font-black text-[#e2f0ff]">
          {userInitial(username)}
        </div>
      </div>
      <div>
        <span className="block text-[17px] font-black text-[#e2f0ff]">{username}</span>
        {line && <p className="mt-1 text-sm text-muted">{line}</p>}
      </div>
    </div>
  );
}

CompetitorBadge.propTypes = {
  username: PropTypes.string,
  line: PropTypes.string,
};

export function ChallengePanel() {
  const dispatch = useDispatch();
  const incoming = useSelector(selectIncomingChallenge);
  const outgoing = useSelector(selectOutgoingChallenge);
  const error = useSelector(selectChallengeError);
  const notice = useSelector(selectChallengeNotice);

  useEffect(() => {
    if (!incoming?.id) return undefined;
    const timeoutId = window.setTimeout(() => {
      dispatch(challengeExpired({ id: incoming.id }));
    }, msUntil(incoming.expiresAt));
    return () => window.clearTimeout(timeoutId);
  }, [dispatch, incoming?.expiresAt, incoming?.id]);

  useEffect(() => {
    if (!outgoing?.id) return undefined;
    const timeoutId = window.setTimeout(() => {
      dispatch(challengeExpired({ id: outgoing.id }));
    }, msUntil(outgoing.expiresAt));
    return () => window.clearTimeout(timeoutId);
  }, [dispatch, outgoing?.expiresAt, outgoing?.id]);

  async function acceptIncoming() {
    try {
      await presenceSocketService.acceptChallenge({ challengeId: incoming.id });
    } catch (err) {
      dispatch(challengeFailed(err.message));
    }
  }

  async function rejectIncoming() {
    try {
      await presenceSocketService.rejectChallenge({ challengeId: incoming.id });
      dispatch(challengeRejected(incoming));
    } catch (err) {
      dispatch(challengeFailed(err.message));
    }
  }

  async function cancelOutgoing() {
    try {
      await presenceSocketService.cancelChallenge({ challengeId: outgoing.id });
      dispatch(challengeCancelled({ challenge: outgoing }));
    } catch (err) {
      dispatch(challengeFailed(err.message));
    }
  }

  if (!incoming && !outgoing && !error && !notice) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 px-4 py-6 backdrop-blur-sm">
      <aside className="w-[min(23.125rem,100%)] overflow-hidden rounded-xl border border-accent/60 bg-surface shadow-2xl shadow-black/60">
        {incoming && (
          <section>
            <div className="border-b border-border-light bg-[linear-gradient(90deg,rgba(34,211,238,0.18),rgba(8,19,31,0)),rgba(3,7,13,0.5)] px-5 py-4">
              <p className="text-xs font-black uppercase text-accent">Duelo 1v1</p>
              <h2 className="mt-2 text-[22px] font-bold leading-tight text-[#e2f0ff]">Invitación a sala</h2>
            </div>
            <div className="grid gap-5 p-5">
              <CompetitorBadge
                username={incoming.challenger?.username}
                line="quiere competir contigo ahora"
              />
              <div className="grid grid-cols-2 gap-2.5">
                <button type="button" className="btn-primary py-2.5" onClick={acceptIncoming}>
                  Aceptar reto
                </button>
                <button type="button" className="btn-secondary py-2.5" onClick={rejectIncoming}>
                  Rechazar
                </button>
              </div>
              <p className="text-center text-xs text-muted">Si aceptas, se abrirá la sala automáticamente.</p>
            </div>
          </section>
        )}

        {!incoming && outgoing && (
          <section>
            <div className="border-b border-border-light bg-[linear-gradient(90deg,rgba(34,211,238,0.18),rgba(8,19,31,0)),rgba(3,7,13,0.5)] px-5 py-4">
              <p className="text-xs font-black uppercase text-accent">Reto enviado</p>
              <h2 className="mt-2 text-[22px] font-bold leading-tight text-[#e2f0ff]">Esperando respuesta</h2>
            </div>
            <div className="grid gap-5 p-5">
              <CompetitorBadge
                username={outgoing.challenged?.username}
                line="tiene tu invitación pendiente"
              />
              <div className="flex items-center justify-center gap-2 text-sm text-muted">
                <span>Caduca en unos segundos</span>
                <span className="inline-flex gap-1" aria-hidden="true">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent/50" />
                  <span className="h-1.5 w-1.5 rounded-full bg-accent/70" />
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                </span>
              </div>
              <button type="button" className="btn-secondary py-2.5" onClick={cancelOutgoing}>
                Cancelar reto
              </button>
            </div>
          </section>
        )}

        {!incoming && !outgoing && error && (
          <section className="grid gap-2 p-5">
            <p className="text-xs font-bold uppercase text-red-300">Reto no enviado</p>
            <p className="text-sm text-muted">{error}</p>
            <button type="button" className="btn-secondary mt-1 py-2" onClick={() => dispatch(challengeCleared())}>
              Cerrar
            </button>
          </section>
        )}

        {!incoming && !outgoing && !error && notice && (
          <section className="grid gap-2 p-5">
            <p className="text-xs font-bold uppercase text-accent">Reto actualizado</p>
            <p className="text-sm text-muted">{notice}</p>
            <button type="button" className="btn-secondary mt-1 py-2" onClick={() => dispatch(challengeCleared())}>
              Cerrar
            </button>
          </section>
        )}
      </aside>
    </div>
  );
}
