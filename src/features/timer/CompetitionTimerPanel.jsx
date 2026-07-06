import { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

const TICK_MS = 50;
const INSPECTION_PLUS_TWO_MS = 15000;
const INSPECTION_DNF_MS = 17000;
const INSPECTION_WARNING_EIGHT_MS = 8000;
const INSPECTION_WARNING_TWELVE_MS = 12000;
const MATCH_SCORE_FLASH_MS = 2000;
const MIX_READY_DELAY_MS = 9000;

const defaultNow = () => performance.now();
const defaultWallNow = () => Date.now();

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

function resultUser(result) {
  return result?.user?.username ?? result?.user?.id ?? 'Competidor';
}

function penaltyLabel(result) {
  const nextPenalty = resultPenalty(result);
  if (nextPenalty === 'none') return '';
  return ` (${nextPenalty.toUpperCase()})`;
}

function roundResolution(result) {
  return result?.roundResolution ?? result?.round_resolution ?? null;
}

function roundResolutionResults(resolution) {
  if (!resolution) return [];
  if (resolution.status === 'completed') {
    return [resolution.winnerResult, resolution.loserResult].filter(Boolean);
  }
  return resolution.results ?? [];
}

function isInteractiveTarget(target) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;

  return ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName);
}

function inspectionSecond(elapsedMs) {
  return Math.max(1, Math.floor(elapsedMs / 1000) + 1);
}

function inspectionWarning(elapsedMs) {
  if (elapsedMs >= INSPECTION_WARNING_TWELVE_MS) return '12 segundos';
  if (elapsedMs >= INSPECTION_WARNING_EIGHT_MS) return '8 segundos';
  return null;
}

function playerInitial(username, fallback) {
  return (username || fallback || '?').trim().charAt(0).toUpperCase();
}

function announceInspectionWarning(message) {
  if (!message || typeof window === 'undefined' || !window.speechSynthesis || !window.SpeechSynthesisUtterance) {
    return;
  }

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(new window.SpeechSynthesisUtterance(message));
}

export function CompetitionTimerPanel({
  roomCode,
  activeRound = null,
  latestCompletedRound = null,
  matchScore = null,
  event = '3x3',
  eventOptions = [],
  currentUser = null,
  onChangeRoundEvent = null,
  onSubmit,
  onStartInspection = null,
  inspectionStartSignal = null,
  onDismissRoundFinal = null,
  roundFinalDismissSignal = null,
  submitStatus = 'idle',
  submitError = null,
  submittedResult = null,
  isWaitingForOpponent = false,
  now = defaultNow,
  wallNow = defaultWallNow,
}) {
  const hasScramble = Boolean(activeRound?.scramble);
  const [phase, setPhase] = useState(hasScramble ? 'scramble' : 'ready');
  const [showRoundFinal, setShowRoundFinal] = useState(false);
  const [showMatchScore, setShowMatchScore] = useState(false);
  const [mixLockedUntilMs, setMixLockedUntilMs] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [startedAt, setStartedAt] = useState(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [inspectionStartedAt, setInspectionStartedAt] = useState(null);
  const [inspectionElapsedMs, setInspectionElapsedMs] = useState(0);
  const [inspectionPenalty, setInspectionPenalty] = useState('none');
  const [penalty, setPenalty] = useState('none');
  const [hasStoppedTime, setHasStoppedTime] = useState(false);
  const [autoDnfSent, setAutoDnfSent] = useState(false);
  const [dismissedRoundFinalId, setDismissedRoundFinalId] = useState(null);
  const announcedWarnings = useRef(new Set());
  const autoDnfSubmitted = useRef(false);
  const handledInspectionSignal = useRef(null);
  const isSubmitting = submitStatus === 'loading';
  const isDnf = penalty === 'dnf';
  const canValidate = hasStoppedTime && !isWaitingForOpponent && inspectionPenalty !== 'dnf';
  const isInspecting = phase === 'inspection';
  const isSolving = phase === 'solve';
  const isMixLocked = phase === 'scramble' && wallNow() < mixLockedUntilMs;

  useEffect(() => {
    if (!isRunning || startedAt === null) return undefined;

    const intervalId = window.setInterval(() => {
      setElapsedMs(Math.max(0, Math.round(now() - startedAt)));
    }, TICK_MS);

    return () => window.clearInterval(intervalId);
  }, [isRunning, now, startedAt]);

  useEffect(() => {
    if (!isInspecting || inspectionStartedAt === null) return undefined;

    const intervalId = window.setInterval(() => {
      const nextElapsed = Math.max(0, Math.round(wallNow() - inspectionStartedAt));
      setInspectionElapsedMs(nextElapsed);

      if (nextElapsed > INSPECTION_DNF_MS && !autoDnfSubmitted.current) {
        autoDnfSubmitted.current = true;
        setInspectionPenalty('dnf');
        setPenalty('dnf');
        setIsRunning(false);
        setStartedAt(null);
        setElapsedMs(0);
        setInspectionStartedAt(null);
        setHasStoppedTime(false);
        setAutoDnfSent(true);
        setPhase('review');
        onSubmit({ timeMs: null, penalty: 'dnf' });
      }
    }, TICK_MS);

    return () => window.clearInterval(intervalId);
  }, [inspectionStartedAt, isInspecting, onSubmit, wallNow]);

  useEffect(() => {
    const warning = inspectionWarning(inspectionElapsedMs);
    if (!isInspecting || !warning || announcedWarnings.current.has(warning)) return;

    announcedWarnings.current.add(warning);
    announceInspectionWarning(warning);
  }, [inspectionElapsedMs, isInspecting]);

  const resetTimer = useCallback(() => {
    setShowRoundFinal(false);
    setShowMatchScore(false);
    setPhase(hasScramble ? 'scramble' : 'ready');
    setIsRunning(false);
    setStartedAt(null);
    setElapsedMs(0);
    setInspectionStartedAt(null);
    setInspectionElapsedMs(0);
    setInspectionPenalty('none');
    setPenalty('none');
    setHasStoppedTime(false);
    setAutoDnfSent(false);
    announcedWarnings.current = new Set();
    autoDnfSubmitted.current = false;
  }, [hasScramble]);

  useEffect(() => {
    resetTimer();
  }, [activeRound?.id, resetTimer]);

  useEffect(() => {
    if (!inspectionStartSignal?.startedAt) return;
    if (inspectionStartSignal.roundId && activeRound?.id && inspectionStartSignal.roundId !== activeRound.id) return;
    if (phase !== 'scramble' && phase !== 'ready') return;
    const signalKey = `${inspectionStartSignal.roundId ?? 'round'}:${inspectionStartSignal.startedAt}`;
    if (handledInspectionSignal.current === signalKey) return;

    handledInspectionSignal.current = signalKey;
    setInspectionStartedAt(inspectionStartSignal.startedAt);
    setInspectionElapsedMs(Math.max(0, Math.round(wallNow() - inspectionStartSignal.startedAt)));
    setInspectionPenalty('none');
    setPenalty('none');
    setHasStoppedTime(false);
    setAutoDnfSent(false);
    announcedWarnings.current = new Set();
    autoDnfSubmitted.current = false;
    setPhase('inspection');
  }, [activeRound?.id, inspectionStartSignal, phase, wallNow]);

  useEffect(() => {
    const resolvedRound = submittedResult?.roundResolution ?? submittedResult?.round_resolution ?? null;
    const latestResolvedRound = latestCompletedRound?.resolution ?? null;
    const nextResolution = resolvedRound && submittedResult?.nextRound ? resolvedRound : latestResolvedRound;
    if (!nextResolution || !['completed', 'draw'].includes(nextResolution.status)) return undefined;
    const nextRoundId = resolvedRound && submittedResult?.nextRound
      ? submittedResult?.round?.id
      : latestCompletedRound?.id;
    if (nextRoundId && nextRoundId === dismissedRoundFinalId) return undefined;

    setShowRoundFinal(true);
    return undefined;
  }, [
    dismissedRoundFinalId,
    latestCompletedRound?.id,
    latestCompletedRound?.resolution,
    submittedResult?.round?.id,
    submittedResult?.id,
    submittedResult?.nextRound,
    submittedResult?.roundResolution,
    submittedResult?.round_resolution,
  ]);

  useEffect(() => {
    if (!roundFinalDismissSignal?.roundId) return;
    const completedRoundId = latestCompletedRound?.id ?? submittedResult?.round?.id ?? null;
    if (completedRoundId && roundFinalDismissSignal.roundId !== completedRoundId) return;

    const dismissedAt = roundFinalDismissSignal.dismissedAt ?? wallNow();
    const scoreRemainingMs = Math.max(0, dismissedAt + MATCH_SCORE_FLASH_MS - wallNow());
    const lockRemainingMs = Math.max(0, dismissedAt + MIX_READY_DELAY_MS - wallNow());

    setDismissedRoundFinalId(roundFinalDismissSignal.roundId);
    setShowRoundFinal(false);
    setShowMatchScore(true);
    setMixLockedUntilMs(dismissedAt + MIX_READY_DELAY_MS);

    const scoreTimeoutId = window.setTimeout(() => {
      setShowMatchScore(false);
    }, scoreRemainingMs);
    const lockTimeoutId = window.setTimeout(() => {
      setMixLockedUntilMs(0);
    }, lockRemainingMs);

    return () => {
      window.clearTimeout(scoreTimeoutId);
      window.clearTimeout(lockTimeoutId);
    };
  }, [latestCompletedRound?.id, roundFinalDismissSignal, submittedResult?.round?.id, wallNow]);

  function handleStart(nextPenalty = inspectionPenalty) {
    const nextStart = now();
    setStartedAt(nextStart);
    setElapsedMs(0);
    setPenalty(nextPenalty);
    setHasStoppedTime(false);
    setIsRunning(true);
    setPhase('solve');
  }

  function handleStop() {
    const finalElapsed = isRunning && startedAt !== null
      ? Math.max(0, Math.round(now() - startedAt))
      : elapsedMs;

    setElapsedMs(finalElapsed);
    setIsRunning(false);
    setStartedAt(null);
    setHasStoppedTime(true);
    setPhase('review');
  }

  function handleStartInspection() {
    if (isSubmitting || isWaitingForOpponent) return;

    const nextStartedAt = wallNow();
    if (onStartInspection) {
      onStartInspection({ roundId: activeRound?.id ?? null, startedAt: nextStartedAt });
      return;
    }

    setInspectionStartedAt(nextStartedAt);
    setInspectionElapsedMs(0);
    setInspectionPenalty('none');
    setPenalty('none');
    setHasStoppedTime(false);
    announcedWarnings.current = new Set();
    setPhase('inspection');
  }

  function handleStartSolveFromInspection() {
    const finalInspectionElapsed = inspectionStartedAt !== null
      ? Math.max(0, Math.round(wallNow() - inspectionStartedAt))
      : inspectionElapsedMs;
    const nextPenalty = finalInspectionElapsed >= INSPECTION_PLUS_TWO_MS ? '+2' : 'none';

    setInspectionElapsedMs(finalInspectionElapsed);
    setInspectionStartedAt(null);
    setInspectionPenalty(nextPenalty);
    setPenalty(nextPenalty);
    handleStart(nextPenalty);
  }

  function handleToggleTimer() {
    if (isSubmitting || isWaitingForOpponent || isRoundFinal || showMatchScore || isMixLocked) return;
    if (isInspecting) {
      handleStartSolveFromInspection();
      return;
    }
    if (isSolving || isRunning) {
      handleStop();
      return;
    }
    if (!hasStoppedTime) {
      if (hasScramble) {
        handleStartInspection();
      } else {
        handleStart();
      }
    }
  }

  useEffect(() => {
    function handleKeyDown(event) {
      const isTimerKey = [' ', 'Spacebar'].includes(event.key) || event.code === 'Space';
      const isRoundFinalKey = isRoundFinal
        && (isTimerKey || event.key === 'Enter' || event.key === 'Tab' || event.code === 'Tab');
      const isMixTabKey = (event.key === 'Tab' || event.code === 'Tab') && phase === 'scramble';

      if (isRoundFinalKey) {
        event.preventDefault();
        handleDismissRoundFinal();
        return;
      }

      if (showMatchScore && (isTimerKey || event.key === 'Tab' || event.code === 'Tab')) {
        event.preventDefault();
        return;
      }

      if (!isTimerKey && !isMixTabKey) return;
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (isInteractiveTarget(event.target)) return;
      event.preventDefault();
      handleToggleTimer();
    }

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  });

  function combinePenalty(nextPenalty) {
    if (nextPenalty === 'dnf' || inspectionPenalty === 'dnf') return 'dnf';
    if (inspectionPenalty === '+2' && nextPenalty === '+2') return '+4';
    if (inspectionPenalty === '+2' || nextPenalty === '+2') return '+2';
    return 'none';
  }

  async function handleSubmit(nextPenalty) {
    const finalPenalty = combinePenalty(nextPenalty);
    const nextTimeMs = finalPenalty === 'dnf' ? null : elapsedMs;

    const result = await onSubmit({
      timeMs: nextTimeMs,
      penalty: finalPenalty,
    });
    if (result?.roundResolution || result?.round_resolution) return;
    resetTimer();
  }

  function handleDismissRoundFinal() {
    const completedRoundId = latestCompletedRound?.id ?? submittedResult?.round?.id ?? null;
    if (onDismissRoundFinal) {
      onDismissRoundFinal({ roundId: completedRoundId });
      return;
    }

    const dismissedAt = wallNow();
    setDismissedRoundFinalId(completedRoundId);
    setShowRoundFinal(false);
    setShowMatchScore(true);
    setMixLockedUntilMs(dismissedAt + MIX_READY_DELAY_MS);
    window.setTimeout(() => {
      setShowMatchScore(false);
    }, MATCH_SCORE_FLASH_MS);
    window.setTimeout(() => {
      setMixLockedUntilMs(0);
    }, MIX_READY_DELAY_MS);
  }

  const submittedTime = submittedResult ? resultTime(submittedResult) : null;
  const submittedPenalty = submittedResult ? resultPenalty(submittedResult) : 'none';
  const resolution = roundResolution(submittedResult) ?? (!isWaitingForOpponent ? latestCompletedRound?.resolution : null);
  const isRoundFinal = showRoundFinal && Boolean(resolution);
  const canChangeRoundEvent = phase === 'scramble' && !isRoundFinal && !showMatchScore && !isSubmitting && !isWaitingForOpponent;
  const scorePlayers = [matchScore?.host, matchScore?.guest].filter(Boolean);
  const ownScorePlayer = scorePlayers.find((player) => player.id && player.id === currentUser?.id) ?? matchScore?.host ?? null;
  const rivalScorePlayer = scorePlayers.find((player) => player.id !== ownScorePlayer?.id) ?? matchScore?.guest ?? null;
  const ownScore = ownScorePlayer?.score ?? 0;
  const rivalScore = rivalScorePlayer?.score ?? 0;
  const ownUsername = ownScorePlayer?.username ?? currentUser?.username ?? 'Tú';
  const rivalUsername = rivalScorePlayer?.username ?? 'Rival';
  const finalResults = roundResolutionResults(resolution);
  const activeRoundNumber = activeRound?.number ?? null;
  const activeScramble = activeRound?.scramble ?? null;
  const currentInspectionWarning = inspectionWarning(inspectionElapsedMs);
  const timerHint = hasScramble
    ? 'Barra espaciadora para inspección, inicio y parada'
    : 'Barra espaciadora para iniciar o parar';

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
          {isInspecting ? 'Inspección' : isRunning ? 'Cronometrando' : isWaitingForOpponent ? 'Esperando rival' : 'Listo'}
        </span>
      </div>

      {isRoundFinal && (
        <div
          className="mt-4 rounded-md border border-emerald-400/25 bg-emerald-400/10 px-4 py-8 text-center"
          role="status"
          aria-live="polite"
          data-testid="round-final-flash"
        >
          <p className="text-sm text-muted">Resultado de ronda</p>
          <p className="mt-2 text-2xl font-semibold text-[#e2f0ff]">
            {resolution.status === 'draw'
              ? 'Empate'
              : `Gana ${resolution.winner?.username ?? 'competidor'}`}
          </p>
          {finalResults.length > 0 && (
            <div className="mt-5 grid gap-2 text-left" data-testid="round-final-results">
              {finalResults.map((result) => (
                <div
                  key={result.id ?? `${resultUser(result)}-${resultFinalTime(result)}`}
                  className="flex items-center justify-between rounded-md border border-border bg-bg/70 px-3 py-2"
                >
                  <span className="text-sm text-muted">{resultUser(result)}</span>
                  <span className="font-mono text-lg text-[#e2f0ff]">
                    {formatSolveTime(resultFinalTime(result))}
                    {penaltyLabel(result)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showMatchScore && (
        <div
          className="mt-4 rounded-md border border-border-light bg-bg px-4 py-8 text-center"
          role="status"
          aria-live="polite"
          data-testid="match-score-flash"
        >
          <div className="mx-auto grid max-w-xs grid-cols-[1fr_auto_1fr] items-start gap-6">
            <div className="grid justify-items-center gap-2">
              <div className="grid h-14 w-14 place-items-center rounded-full border border-border-light bg-surface text-lg font-semibold text-[#e2f0ff]">
                {playerInitial(ownUsername, 'T')}
              </div>
              <p className="max-w-24 truncate text-xs text-muted">Tú</p>
            </div>
            <div className="h-14" aria-hidden="true" />
            <div className="grid justify-items-center gap-2">
              <div className="grid h-14 w-14 place-items-center rounded-full border border-border-light bg-surface text-lg font-semibold text-[#e2f0ff]">
                {playerInitial(rivalUsername, 'R')}
              </div>
              <p className="max-w-24 truncate text-xs text-muted">{rivalUsername}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-7">
            <p className="font-mono text-7xl leading-none text-[#e2f0ff] sm:text-8xl">{ownScore}</p>
            <span className="font-mono text-5xl leading-none text-muted sm:text-6xl">-</span>
            <p className="font-mono text-7xl leading-none text-[#e2f0ff] sm:text-8xl">{rivalScore}</p>
          </div>
          <p className="mx-auto mt-5 max-w-xs text-sm leading-snug text-muted">
            Marcador acumulado de rondas. Se muestra un momento y después entra la nueva mezcla.
          </p>
        </div>
      )}

      {activeScramble && phase === 'scramble' && !isRoundFinal && !showMatchScore && (
        <div className="mt-4 rounded-md border border-accent/25 bg-accent/5 px-4 py-5 text-center">
          {eventOptions.length > 0 && (
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <label className="form-label mb-0" htmlFor="round-event">
                Cubo
              </label>
              <select
                id="round-event"
                className="form-input sm:max-w-40"
                value={event}
                onChange={(changeEvent) => onChangeRoundEvent?.(changeEvent.target.value)}
                disabled={!canChangeRoundEvent || !onChangeRoundEvent}
                data-testid="round-event-select"
              >
                {eventOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          <p className="font-mono text-xl leading-relaxed text-[#e2f0ff] break-words">{activeScramble}</p>
        </div>
      )}

      {!showMatchScore && (
        <div className="mt-5 rounded-md border border-border-light bg-bg px-4 py-5 text-center">
          <div className="font-mono text-5xl sm:text-6xl leading-none" aria-live="off" data-testid="timer-display">
            {isRoundFinal
              ? resolution.status === 'draw'
                ? 'Empate'
                : formatSolveTime(resultFinalTime(resolution.winnerResult))
              : isInspecting ? inspectionSecond(inspectionElapsedMs) : isDnf ? 'DNF' : formatSolveTime(elapsedMs)}
          </div>
          <p className="text-xs text-muted mt-3">
            {isInspecting ? currentInspectionWarning ?? 'Inspección en curso' : timerHint}
          </p>
        </div>
      )}

      {!isRoundFinal && !showMatchScore && (
        <div className="mt-4">
          <button
            className={isRunning || isInspecting ? 'btn-secondary' : 'btn-primary'}
            type="button"
            onClick={handleToggleTimer}
            disabled={isSubmitting || isWaitingForOpponent || isMixLocked}
            data-testid="timer-toggle-button"
          >
            {isInspecting
              ? 'Iniciar solve'
              : isRunning
                ? 'Parar'
                : isWaitingForOpponent
                  ? 'Esperando rival'
                  : hasScramble
                    ? isMixLocked ? 'Preparando mezcla' : 'Comenzar inspección'
                    : 'Iniciar'}
          </button>
        </div>
      )}

      {isRoundFinal && (
        <button
          className="btn-primary mt-4"
          type="button"
          onClick={handleDismissRoundFinal}
          data-testid="round-final-ok-button"
        >
          OK
        </button>
      )}

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

      {autoDnfSent && !submittedResult && (
        <div className="mt-4 rounded-md border border-red-400/20 bg-red-400/10 px-3 py-2.5 text-sm text-red-400">
          Inspección agotada: resultado DNF enviado.
        </div>
      )}

      {canValidate && (
        <div className="mt-4 rounded-md border border-border bg-bg px-3 py-2.5 text-sm text-muted">
          {inspectionPenalty === '+2'
            ? 'Inspección fuera de tiempo: se enviará con +2.'
            : inspectionPenalty === 'dnf'
              ? 'Inspección agotada: resultado DNF.'
              : 'Revisa el resultado antes de enviarlo.'}
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
            {submittedPenalty === '+4' ? ' (+4)' : ''}
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
    event: PropTypes.string,
    scramble: PropTypes.string,
    status: PropTypes.string,
  }),
  event: PropTypes.string,
  eventOptions: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
  })),
  onChangeRoundEvent: PropTypes.func,
  onStartInspection: PropTypes.func,
  inspectionStartSignal: PropTypes.shape({
    roundId: PropTypes.string,
    startedAt: PropTypes.number,
  }),
  onDismissRoundFinal: PropTypes.func,
  roundFinalDismissSignal: PropTypes.shape({
    roundId: PropTypes.string,
    dismissedAt: PropTypes.number,
  }),
  latestCompletedRound: PropTypes.shape({
    id: PropTypes.string,
    number: PropTypes.number,
    resolution: PropTypes.object,
  }),
  matchScore: PropTypes.shape({
    host: PropTypes.shape({ id: PropTypes.string, username: PropTypes.string, score: PropTypes.number }),
    guest: PropTypes.shape({ id: PropTypes.string, username: PropTypes.string, score: PropTypes.number }),
    roundsPlayed: PropTypes.number,
  }),
  currentUser: PropTypes.shape({
    id: PropTypes.string,
    username: PropTypes.string,
  }),
  onSubmit: PropTypes.func.isRequired,
  submitStatus: PropTypes.oneOf(['idle', 'loading', 'ready', 'failed']),
  submitError: PropTypes.string,
  submittedResult: PropTypes.shape({
    timeMs: PropTypes.oneOfType([PropTypes.number, PropTypes.oneOf([null])]),
    time_ms: PropTypes.oneOfType([PropTypes.number, PropTypes.oneOf([null])]),
    time: PropTypes.oneOfType([PropTypes.number, PropTypes.oneOf([null])]),
    penalty: PropTypes.oneOf(['none', '+2', '+4', 'dnf']),
    nextRound: PropTypes.object,
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
  wallNow: PropTypes.func,
};
