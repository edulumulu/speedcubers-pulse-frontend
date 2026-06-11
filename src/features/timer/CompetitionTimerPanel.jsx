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

export function CompetitionTimerPanel({
  roomCode,
  onSubmit,
  submitStatus = 'idle',
  submitError = null,
  submittedResult = null,
  now = () => performance.now(),
}) {
  const [isRunning, setIsRunning] = useState(false);
  const [startedAt, setStartedAt] = useState(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [penalty, setPenalty] = useState('none');
  const [hasStoppedTime, setHasStoppedTime] = useState(false);
  const isSubmitting = submitStatus === 'loading';
  const isDnf = penalty === 'dnf';
  const canValidate = hasStoppedTime;

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
    if (isSubmitting) return;
    if (isRunning) {
      handleStop();
      return;
    }
    if (!hasStoppedTime) handleStart();
  }

  useEffect(() => {
    function handleKeyDown(event) {
      const isTimerKey = [' ', 'Spacebar', 'Tab'].includes(event.key) || ['Space', 'Tab'].includes(event.code);
      if (!isTimerKey) return;
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
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

  return (
    <section className="border border-border bg-surface rounded-lg p-4" aria-labelledby="competition-timer-title">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <p className="form-label mb-1">Timer local</p>
          <h2 id="competition-timer-title" className="text-base font-semibold">
            {roomCode ? `Resultado sala ${roomCode}` : 'Resultado de competencia'}
          </h2>
        </div>
        <span className={isRunning ? 'badge-green' : 'badge-cyan'}>
          {isRunning ? 'Cronometrando' : 'Listo'}
        </span>
      </div>

      <div className="mt-5 rounded-md border border-border-light bg-bg px-4 py-5 text-center">
        <div className="font-mono text-5xl sm:text-6xl leading-none" aria-live="polite">
          {isDnf ? 'DNF' : formatSolveTime(elapsedMs)}
        </div>
        <p className="text-xs text-muted mt-3">Barra espaciadora para iniciar o parar</p>
      </div>

      <div className="mt-4">
        <button
          className={isRunning ? 'btn-secondary' : 'btn-primary'}
          type="button"
          onClick={handleToggleTimer}
          disabled={isSubmitting}
        >
          {isRunning ? 'Parar' : 'Iniciar'}
        </button>
      </div>

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
          >
            {isSubmitting ? 'Enviando...' : 'OK'}
          </button>
          <button
            className="btn-secondary"
            type="button"
            onClick={() => handleSubmit('+2')}
            disabled={isSubmitting}
          >
            +2
          </button>
          <button
            className="btn-secondary"
            type="button"
            onClick={() => handleSubmit('dnf')}
            disabled={isSubmitting}
          >
            DNF
          </button>
        </div>
      )}

      {submittedResult && (
        <div className="mt-4 rounded-md border border-emerald-400/20 bg-emerald-400/10 px-3 py-2.5 text-sm text-emerald-400">
          Resultado enviado: {formatSolveTime(submittedTime)}
          {submittedPenalty === '+2' ? ' (+2)' : ''}
          {submittedPenalty === 'dnf' ? ' (DNF)' : ''}
        </div>
      )}

      {submitError && (
        <div className="mt-4 rounded-md border border-red-400/20 bg-red-400/10 px-3 py-2.5 text-sm text-red-400">
          {submitError}
        </div>
      )}
    </section>
  );
}

CompetitionTimerPanel.propTypes = {
  roomCode: PropTypes.string,
  onSubmit: PropTypes.func.isRequired,
  submitStatus: PropTypes.oneOf(['idle', 'loading', 'ready', 'failed']),
  submitError: PropTypes.string,
  submittedResult: PropTypes.shape({
    timeMs: PropTypes.oneOfType([PropTypes.number, PropTypes.oneOf([null])]),
    time_ms: PropTypes.oneOfType([PropTypes.number, PropTypes.oneOf([null])]),
    time: PropTypes.oneOfType([PropTypes.number, PropTypes.oneOf([null])]),
    penalty: PropTypes.oneOf(['none', '+2', 'dnf']),
  }),
  now: PropTypes.func,
};
