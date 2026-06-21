import { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';

const TICK_MS = 50;

export function formatSolveTime(timeMs) {
  if (timeMs === null || timeMs === undefined) return 'DNF';

  const safeMs = Math.max(0, Math.round(timeMs));
  const minutes = Math.floor(safeMs / 60000);
  const seconds = Math.floor((safeMs % 60000) / 1000);
  const milliseconds = safeMs % 1000;

  if (minutes > 0) {
    return `${minutes}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
  }

  return `${seconds}.${String(milliseconds).padStart(3, '0')}`;
}

function resultTime(result) {
  return result?.timeMs ?? result?.time_ms ?? result?.time ?? null;
}

function resultPenalty(result) {
  return result?.penalty ?? 'none';
}

function resultFinalTime(result) {
  return result?.finalTimeMs ?? result?.final_time_ms ?? resultTime(result);
}

function roundResolution(result) {
  return result?.roundResolution ?? result?.round_resolution ?? null;
}

function isInteractiveTarget(target) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;

  return ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName);
}

export function CompetitionTimerPanel({
  roomCode,
  activeRound = null,
  latestCompletedRound = null,
  onSubmit,
  submitStatus = 'idle',
  submitError = null,
  submittedResult = null,
  isWaitingForOpponent = false,
  now = () => performance.now(),
}) {
  const [isRunning, setIsRunning] = useState(false);
  const [startedAt, setStartedAt] = useState(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [penalty, setPenalty] = useState('none');
  const [hasStoppedTime, setHasStoppedTime] = useState(false);
  const isSubmitting = submitStatus === 'loading';
  const isDnf = penalty === 'dnf';
  const canValidate = hasStoppedTime && !isWaitingForOpponent;

  useEffect(() => {
    if (!isRunning || startedAt === null) return undefined;

    const intervalId = window.setInterval(() => {
      setElapsedMs(Math.max(0, Math.round(now() - startedAt)));
    }, TICK_MS);

    return () => window.clearInterval(intervalId);
  }, [isRunning, now, startedAt]);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setStartedAt(null);
    setElapsedMs(0);
    setPenalty('none');
    setHasStoppedTime(false);
  }, []);

  function handleStart() {
    const nextStart = now();
    setStartedAt(nextStart);
    setElapsedMs(0);
    setPenalty('none');
    setHasStoppedTime(false);
    setIsRunning(true);
  }

  function handleStop() {
    const finalElapsed = isRunning && startedAt !== null
      ? Math.max(0, Math.round(now() - startedAt))
      : elapsedMs;

    setElapsedMs(finalElapsed);
    setIsRunning(false);
    setStartedAt(null);
    setHasStoppedTime(true);
  }

  function handleToggleTimer() {
    if (isSubmitting || isWaitingForOpponent) return;
    if (isRunning) {
      handleStop();
      return;
    }
    if (!hasStoppedTime) handleStart();
  }

  useEffect(() => {
    function handleKeyDown(event) {
      const isTimerKey = [' ', 'Spacebar'].includes(event.key) || event.code === 'Space';
      if (!isTimerKey) return;
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (isInteractiveTarget(event.target)) return;
      event.preventDefault();
      handleToggleTimer();
    }

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  });

  async function handleSubmit(nextPenalty) {
    const nextTimeMs = nextPenalty === 'dnf' ? null : elapsedMs;

    await onSubmit({
      timeMs: nextTimeMs,
      penalty: nextPenalty,
    });
    resetTimer();
  }

  const submittedTime = submittedResult ? resultTime(submittedResult) : null;
  const submittedPenalty = submittedResult ? resultPenalty(submittedResult) : 'none';
  const resolution = roundResolution(submittedResult) ?? (!isWaitingForOpponent ? latestCompletedRound?.resolution : null);
  const activeRoundNumber = activeRound?.number ?? null;
  const activeScramble = activeRound?.scramble ?? null;

  return (
    <section
      className="border border-border bg-surface rounded-lg p-4"
      aria-labelledby="competition-timer-title"
      data-testid="competition-timer"
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <p className="form-label mb-1">Timer local</p>
          <h2 id="competition-timer-title" className="text-base font-semibold">
            {roomCode ? `Resultado sala ${roomCode}` : 'Resultado de competencia'}
          </h2>
          {activeRoundNumber && (
            <p className="text-xs text-muted mt-1">Ronda {activeRoundNumber}</p>
          )}
        </div>
        <span className={isRunning ? 'badge-green' : 'badge-cyan'} data-testid="timer-status">
          {isRunning ? 'Cronometrando' : isWaitingForOpponent ? 'Esperando rival' : 'Listo'}
        </span>
      </div>

      {activeScramble && (
        <div className="mt-4 rounded-md border border-accent/25 bg-accent/5 px-4 py-5 text-center">
          <p className="font-mono text-xl leading-relaxed text-[#e2f0ff] break-words">{activeScramble}</p>
        </div>
      )}

      <div className="mt-5 rounded-md border border-border-light bg-bg px-4 py-5 text-center">
        <div className="font-mono text-5xl sm:text-6xl leading-none" aria-live="off" data-testid="timer-display">
          {isDnf ? 'DNF' : formatSolveTime(elapsedMs)}
        </div>
        <p className="text-xs text-muted mt-3">Barra espaciadora para iniciar o parar</p>
      </div>

      <div className="mt-4">
        <button
          className={isRunning ? 'btn-secondary' : 'btn-primary'}
          type="button"
          onClick={handleToggleTimer}
          disabled={isSubmitting || isWaitingForOpponent}
          data-testid="timer-toggle-button"
        >
          {isRunning ? 'Parar' : isWaitingForOpponent ? 'Esperando rival' : 'Iniciar'}
        </button>
      </div>

      {isWaitingForOpponent && (
        <div
          className="mt-4 rounded-md border border-cyan-400/20 bg-cyan-400/10 px-3 py-2.5 text-sm text-cyan-300"
          role="status"
          aria-live="polite"
          data-testid="waiting-opponent-message"
        >
          Resultado enviado. Esperando a que el rival cierre esta ronda.
        </div>
      )}

      {canValidate && (
        <div className="mt-4 rounded-md border border-border bg-bg px-3 py-2.5 text-sm text-muted">
          Revisa el resultado antes de enviarlo.
        </div>
      )}

      {canValidate && (
        <div className="mt-4 grid sm:grid-cols-3 gap-3">
          <button
            className="btn-primary"
            type="button"
            onClick={() => handleSubmit('none')}
            disabled={isSubmitting}
            aria-label="Enviar resultado sin penalización"
            data-testid="submit-ok-button"
          >
            {isSubmitting ? 'Enviando...' : 'OK'}
          </button>
          <button
            className="btn-warning"
            type="button"
            onClick={() => handleSubmit('+2')}
            disabled={isSubmitting}
            aria-label="Enviar resultado con penalización de 2 segundos"
            data-testid="submit-plus-two-button"
          >
            +2
          </button>
          <button
            className="btn-danger"
            type="button"
            onClick={() => handleSubmit('dnf')}
            disabled={isSubmitting}
            aria-label="Enviar resultado DNF"
            data-testid="submit-dnf-button"
          >
            DNF
          </button>
        </div>
      )}

      {submittedResult && (
        <div
          className="mt-4 rounded-md border border-emerald-400/20 bg-emerald-400/10 px-3 py-2.5 text-sm text-emerald-400"
          role="status"
          aria-live="polite"
          data-testid="result-success"
        >
          <p className="font-semibold">Último resultado enviado</p>
          <p className="mt-1">
            {formatSolveTime(submittedTime)}
            {submittedPenalty === '+2' ? ' (+2)' : ''}
            {submittedPenalty === 'dnf' ? ' (DNF)' : ''}
          </p>
        </div>
      )}

      {resolution?.status === 'completed' && (
        <div
          className="mt-4 rounded-md border border-border bg-bg px-3 py-2.5 text-sm"
          role="status"
          aria-live="polite"
          data-testid="round-resolution"
        >
          <p className="font-semibold text-foreground">Ronda resuelta</p>
          <p className="text-muted mt-1">
            Gana {resolution.winner?.username ?? 'competidor'} con {formatSolveTime(resultFinalTime(resolution.winnerResult))}.
          </p>
          {resolution.elo && (
            <p className="text-xs text-muted mt-2">
              Elo: {resolution.winner?.username ?? 'ganador'} {resolution.elo.winner} · {resolution.loser?.username ?? 'rival'} {resolution.elo.loser}
            </p>
          )}
        </div>
      )}

      {resolution?.status === 'draw' && (
        <div
          className="mt-4 rounded-md border border-border bg-bg px-3 py-2.5 text-sm"
          role="status"
          aria-live="polite"
          data-testid="round-resolution"
        >
          <p className="font-semibold text-foreground">Ronda empatada</p>
          <p className="text-muted mt-1">No se actualiza el Elo en esta ronda.</p>
        </div>
      )}

      {submitError && (
        <div
          className="mt-4 rounded-md border border-red-400/20 bg-red-400/10 px-3 py-2.5 text-sm text-red-400"
          role="alert"
          data-testid="result-error"
        >
          {submitError}
        </div>
      )}
    </section>
  );
}

CompetitionTimerPanel.propTypes = {
  roomCode: PropTypes.string,
  activeRound: PropTypes.shape({
    id: PropTypes.string,
    number: PropTypes.number,
    scramble: PropTypes.string,
    status: PropTypes.string,
  }),
  latestCompletedRound: PropTypes.shape({
    id: PropTypes.string,
    number: PropTypes.number,
    resolution: PropTypes.object,
  }),
  onSubmit: PropTypes.func.isRequired,
  submitStatus: PropTypes.oneOf(['idle', 'loading', 'ready', 'failed']),
  submitError: PropTypes.string,
  submittedResult: PropTypes.shape({
    timeMs: PropTypes.oneOfType([PropTypes.number, PropTypes.oneOf([null])]),
    time_ms: PropTypes.oneOfType([PropTypes.number, PropTypes.oneOf([null])]),
    time: PropTypes.oneOfType([PropTypes.number, PropTypes.oneOf([null])]),
    penalty: PropTypes.oneOf(['none', '+2', 'dnf']),
    round: PropTypes.shape({
      id: PropTypes.string,
      number: PropTypes.number,
    }),
    roundResolution: PropTypes.shape({
      status: PropTypes.oneOf(['pending', 'completed', 'draw']),
      reason: PropTypes.string,
      winner: PropTypes.shape({ id: PropTypes.string, username: PropTypes.string }),
      loser: PropTypes.shape({ id: PropTypes.string, username: PropTypes.string }),
      winnerResult: PropTypes.object,
      loserResult: PropTypes.object,
      elo: PropTypes.shape({
        winner: PropTypes.number,
        loser: PropTypes.number,
      }),
    }),
  }),
  isWaitingForOpponent: PropTypes.bool,
  now: PropTypes.func,
};
