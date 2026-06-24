import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CompetitionTimerPanel, formatSolveTime } from '../CompetitionTimerPanel.jsx';

describe('formatSolveTime', () => {
  it('formats milliseconds with second and minute precision', () => {
    expect(formatSolveTime(0)).toBe('0.000');
    expect(formatSolveTime(1234)).toBe('1.234');
    expect(formatSolveTime(65007)).toBe('1:05.007');
    expect(formatSolveTime(null)).toBe('DNF');
  });
});

describe('CompetitionTimerPanel', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts and stops with Space, then lets the user confirm an OK result', async () => {
    vi.useFakeTimers();
    let nowValue = 1000;
    const now = vi.fn(() => nowValue);
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<CompetitionTimerPanel roomCode="ABC123" now={now} onSubmit={onSubmit} />);

    act(() => {
      fireEvent.keyDown(document, { key: ' ', code: 'Space' });
    });
    nowValue = 2234;

    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(screen.getByText('1.234')).toBeInTheDocument();

    nowValue = 2500;
    act(() => {
      fireEvent.keyDown(document, { key: ' ', code: 'Space' });
    });

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/revisa el resultado/i)).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sin penalización/i }));
    });

    expect(onSubmit).toHaveBeenCalledWith({ timeMs: 1500, penalty: 'none' });
    expect(screen.getByText('0.000')).toBeInTheDocument();
  });

  it('submits +2 after the timer has stopped', async () => {
    let nowValue = 0;
    const now = vi.fn(() => nowValue);
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<CompetitionTimerPanel roomCode="ABC123" now={now} onSubmit={onSubmit} />);

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /iniciar/i }));
    });
    nowValue = 8765;
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /^parar$/i }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /penalización de 2 segundos/i }));
    });

    expect(onSubmit).toHaveBeenCalledWith({ timeMs: 8765, penalty: '+2' });
  });

  it('submits DNF after the timer has stopped', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    let nowValue = 0;
    const now = vi.fn(() => nowValue);

    render(<CompetitionTimerPanel roomCode="ABC123" now={now} onSubmit={onSubmit} />);

    expect(screen.queryByRole('button', { name: /enviar resultado dnf/i })).not.toBeInTheDocument();

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /iniciar/i }));
    });
    nowValue = 4321;
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /^parar$/i }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /enviar resultado dnf/i }));
    });

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ timeMs: null, penalty: 'dnf' });
    });
  });

  it('starts inspection before solving when the active round has a scramble', () => {
    vi.useFakeTimers();
    let nowValue = 0;
    const now = vi.fn(() => nowValue);
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <CompetitionTimerPanel
        roomCode="ABC123"
        activeRound={{ id: 'round-1', number: 1, scramble: 'R U R\' U\'' }}
        now={now}
        wallNow={now}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByText('R U R\' U\'')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /comenzar inspección/i })).toBeEnabled();

    act(() => {
      fireEvent.keyDown(document, { key: ' ', code: 'Space' });
    });

    expect(screen.getByTestId('timer-status')).toHaveTextContent('Inspección');
    expect(screen.queryByText('R U R\' U\'')).not.toBeInTheDocument();
    expect(screen.getByTestId('timer-display')).toHaveTextContent('1');

    nowValue = 7000;
    act(() => {
      fireEvent.keyDown(document, { key: ' ', code: 'Space' });
    });

    expect(screen.getByTestId('timer-status')).toHaveTextContent('Cronometrando');
  });

  it('submits +2 when the solve starts after fifteen seconds of inspection', async () => {
    vi.useFakeTimers();
    let nowValue = 0;
    const now = vi.fn(() => nowValue);
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <CompetitionTimerPanel
        roomCode="ABC123"
        activeRound={{ id: 'round-1', number: 1, scramble: 'R U R\' U\'' }}
        now={now}
        wallNow={now}
        onSubmit={onSubmit}
      />,
    );

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /comenzar inspección/i }));
    });
    nowValue = 16000;
    act(() => {
      fireEvent.keyDown(document, { key: ' ', code: 'Space' });
    });
    nowValue = 17234;
    act(() => {
      fireEvent.keyDown(document, { key: ' ', code: 'Space' });
    });

    expect(screen.getByText(/se enviará con \+2/i)).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sin penalización/i }));
    });

    expect(onSubmit).toHaveBeenCalledWith({ timeMs: 1234, penalty: '+2' });
  });

  it('submits +4 when inspection and solve both add +2', async () => {
    vi.useFakeTimers();
    let nowValue = 0;
    const now = vi.fn(() => nowValue);
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <CompetitionTimerPanel
        roomCode="ABC123"
        activeRound={{ id: 'round-1', number: 1, scramble: 'R U R\' U\'' }}
        now={now}
        wallNow={now}
        onSubmit={onSubmit}
      />,
    );

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /comenzar inspección/i }));
    });
    nowValue = 16000;
    act(() => {
      fireEvent.keyDown(document, { key: ' ', code: 'Space' });
    });
    nowValue = 17234;
    act(() => {
      fireEvent.keyDown(document, { key: ' ', code: 'Space' });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /penalización de 2 segundos/i }));
    });

    expect(onSubmit).toHaveBeenCalledWith({ timeMs: 1234, penalty: '+4' });
  });

  it('marks the result as DNF when inspection exceeds seventeen seconds', async () => {
    vi.useFakeTimers();
    let nowValue = 0;
    const now = vi.fn(() => nowValue);
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <CompetitionTimerPanel
        roomCode="ABC123"
        activeRound={{ id: 'round-1', number: 1, scramble: 'R U R\' U\'' }}
        now={now}
        wallNow={now}
        onSubmit={onSubmit}
      />,
    );

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /comenzar inspección/i }));
    });
    nowValue = 17001;
    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(onSubmit).toHaveBeenCalledWith({ timeMs: null, penalty: 'dnf' });
    expect(screen.getByTestId('timer-display')).toHaveTextContent('DNF');
    expect(screen.getByText(/resultado DNF enviado/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /enviar resultado dnf/i })).not.toBeInTheDocument();
  });

  it('starts inspection from an external synchronized signal', () => {
    const wallNowValue = 10000;
    const wallNow = vi.fn(() => wallNowValue);
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    const { rerender } = render(
      <CompetitionTimerPanel
        roomCode="ABC123"
        activeRound={{ id: 'round-1', number: 1, scramble: 'R U R\' U\'' }}
        wallNow={wallNow}
        onSubmit={onSubmit}
      />,
    );

    rerender(
      <CompetitionTimerPanel
        roomCode="ABC123"
        activeRound={{ id: 'round-1', number: 1, scramble: 'R U R\' U\'' }}
        inspectionStartSignal={{ roundId: 'round-1', startedAt: 9000 }}
        wallNow={wallNow}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByTestId('timer-status')).toHaveTextContent('Inspección');
    expect(screen.getByTestId('timer-display')).toHaveTextContent('2');
  });

  it('disables submit while sending and renders submitted result or error feedback', () => {
    const { rerender } = render(
      <CompetitionTimerPanel
        roomCode="ABC123"
        onSubmit={vi.fn()}
        submitStatus="loading"
        submittedResult={{ timeMs: 12345, penalty: '+2' }}
      />,
    );

    expect(screen.getByRole('button', { name: /iniciar/i })).toBeDisabled();
    expect(screen.getByText('Último resultado enviado')).toBeInTheDocument();
    expect(screen.getByText('12.345 (+2)')).toBeInTheDocument();

    rerender(
      <CompetitionTimerPanel
        roomCode="ABC123"
        onSubmit={vi.fn()}
        submitStatus="failed"
        submitError="No se pudo enviar"
      />,
    );

    expect(screen.getByText('No se pudo enviar')).toBeInTheDocument();
  });

  it('locks the timer while waiting for the opponent result', () => {
    const onSubmit = vi.fn();

    render(
      <CompetitionTimerPanel
        roomCode="ABC123"
        onSubmit={onSubmit}
        submittedResult={{ id: 'result-1', timeMs: 12345, penalty: 'none', round: { number: 1 } }}
        isWaitingForOpponent
      />,
    );

    expect(screen.getByRole('button', { name: /esperando rival/i })).toBeDisabled();
    expect(screen.getByText(/esperando a que el rival cierre esta ronda/i)).toBeInTheDocument();
  });

  it('does not start the timer with Tab navigation', () => {
    const onSubmit = vi.fn();

    render(<CompetitionTimerPanel roomCode="ABC123" onSubmit={onSubmit} />);

    act(() => {
      fireEvent.keyDown(document, { key: 'Tab', code: 'Tab' });
    });

    expect(screen.getByTestId('timer-display')).toHaveTextContent('0.000');
    expect(screen.getByRole('button', { name: /iniciar/i })).toBeEnabled();
  });

  it('renders the resolved round summary with Elo changes', () => {
    render(
      <CompetitionTimerPanel
        roomCode="ABC123"
        onSubmit={vi.fn()}
        submittedResult={{
          id: 'result-2',
          timeMs: 13000,
          penalty: 'none',
          round: { number: 1 },
          roundResolution: {
            status: 'completed',
            winner: { id: 'host-id', username: 'host' },
            loser: { id: 'guest-id', username: 'guest' },
            winnerResult: { finalTimeMs: 13000, penalty: 'none' },
            loserResult: { finalTimeMs: 15000, penalty: 'none' },
            elo: { winner: 1016, loser: 984 },
          },
        }}
      />,
    );

    expect(screen.getByText('Ronda resuelta')).toBeInTheDocument();
    expect(screen.getByText(/gana host con 13.000/i)).toBeInTheDocument();
    expect(screen.getByText(/host 1016/i)).toBeInTheDocument();
    expect(screen.getByText(/guest 984/i)).toBeInTheDocument();
  });

  it('renders the latest completed round summary after room refresh', () => {
    render(
      <CompetitionTimerPanel
        roomCode="ABC123"
        activeRound={{ id: 'round-2', number: 2, scramble: 'R U R\' U\'', status: 'active' }}
        latestCompletedRound={{
          id: 'round-1',
          number: 1,
          resolution: {
            status: 'draw',
            reason: 'both_dnf',
          },
        }}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByText('Ronda 2')).toBeInTheDocument();
    expect(screen.getByTestId('round-final-flash')).toBeInTheDocument();
    expect(screen.getByText('Ronda empatada')).toBeInTheDocument();
    expect(screen.queryByText('R U R\' U\'')).not.toBeInTheDocument();
  });

  it('shows both submitted results when a completed round arrives after refresh', () => {
    render(
      <CompetitionTimerPanel
        roomCode="ABC123"
        activeRound={{ id: 'round-2', number: 2, scramble: 'R U R\' U\'', status: 'active' }}
        latestCompletedRound={{
          id: 'round-1',
          number: 1,
          resolution: {
            status: 'completed',
            winner: { id: 'host-id', username: 'host' },
            loser: { id: 'guest-id', username: 'guest' },
            winnerResult: {
              id: 'host-result',
              user: { id: 'host-id', username: 'host' },
              finalTimeMs: 13000,
              penalty: 'none',
            },
            loserResult: {
              id: 'guest-result',
              user: { id: 'guest-id', username: 'guest' },
              finalTimeMs: 17000,
              penalty: '+2',
            },
          },
        }}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByTestId('round-final-flash')).toBeInTheDocument();
    expect(screen.getByTestId('round-final-results')).toHaveTextContent('host');
    expect(screen.getByTestId('round-final-results')).toHaveTextContent('13.000');
    expect(screen.getByTestId('round-final-results')).toHaveTextContent('guest');
    expect(screen.getByTestId('round-final-results')).toHaveTextContent('17.000 (+2)');
  });

  it('keeps the final result visible until the user confirms it', async () => {
    vi.useFakeTimers();
    const onDismissRoundFinal = vi.fn();

    const completedProps = {
      roomCode: 'ABC123',
      activeRound: { id: 'round-2', number: 2, scramble: 'R U R\' U\'', status: 'active' },
      latestCompletedRound: {
        id: 'round-1',
        number: 1,
        resolution: {
          status: 'draw',
          reason: 'equal_time',
          results: [
            { id: 'host-result', user: { username: 'host' }, finalTimeMs: 13000, penalty: 'none' },
            { id: 'guest-result', user: { username: 'guest' }, finalTimeMs: 13000, penalty: 'none' },
          ],
        },
      },
      onSubmit: vi.fn(),
      onDismissRoundFinal,
    };

    const { rerender } = render(
      <CompetitionTimerPanel
        {...completedProps}
      />,
    );

    expect(screen.getByTestId('round-final-flash')).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByTestId('round-final-ok-button'));
    });

    expect(onDismissRoundFinal).toHaveBeenCalledWith({ roundId: 'round-1' });

    rerender(
      <CompetitionTimerPanel
        {...completedProps}
        roundFinalDismissSignal={{ roundId: 'round-1', dismissedAt: Date.now() - 2000 }}
      />,
    );

    expect(screen.queryByTestId('round-final-flash')).not.toBeInTheDocument();
    expect(screen.getByTestId('match-score-flash')).toBeInTheDocument();
    expect(screen.queryByText('R U R\' U\'')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(screen.getByText('R U R\' U\'')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /preparando mezcla/i })).toBeDisabled();
  });

  it('uses Tab on the final result as continue without starting inspection underneath', () => {
    vi.useFakeTimers();

    render(
      <CompetitionTimerPanel
        roomCode="ABC123"
        activeRound={{ id: 'round-2', number: 2, scramble: 'R U R\' U\'', status: 'active' }}
        latestCompletedRound={{
          id: 'round-1',
          number: 1,
          resolution: {
            status: 'draw',
            reason: 'equal_time',
            results: [
              { id: 'host-result', user: { username: 'host' }, finalTimeMs: 13000, penalty: 'none' },
              { id: 'guest-result', user: { username: 'guest' }, finalTimeMs: 13000, penalty: 'none' },
            ],
          },
        }}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByTestId('round-final-flash')).toBeInTheDocument();
    act(() => {
      fireEvent.keyDown(document, { key: 'Tab', code: 'Tab' });
    });

    expect(screen.queryByTestId('round-final-flash')).not.toBeInTheDocument();
    expect(screen.getByTestId('match-score-flash')).toBeInTheDocument();
    expect(screen.getByTestId('timer-status')).toHaveTextContent('Listo');
    expect(screen.queryByTestId('timer-display')).not.toBeInTheDocument();
    expect(screen.getByTestId('match-score-flash')).toHaveTextContent('0');

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByText('R U R\' U\'')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /preparando mezcla/i })).toBeDisabled();
  });

  it('blocks starting inspection until nine seconds after the final result is confirmed', () => {
    vi.useFakeTimers();

    render(
      <CompetitionTimerPanel
        roomCode="ABC123"
        activeRound={{ id: 'round-2', number: 2, scramble: 'R U R\' U\'', status: 'active' }}
        latestCompletedRound={{
          id: 'round-1',
          number: 1,
          resolution: {
            status: 'completed',
            winner: { id: 'host-id', username: 'host' },
            loser: { id: 'guest-id', username: 'guest' },
            winnerResult: { id: 'host-result', user: { username: 'host' }, finalTimeMs: 13000, penalty: 'none' },
            loserResult: { id: 'guest-result', user: { username: 'guest' }, finalTimeMs: 15000, penalty: 'none' },
          },
        }}
        matchScore={{
          host: { id: 'host-id', username: 'host', score: 1 },
          guest: { id: 'guest-id', username: 'guest', score: 0 },
          roundsPlayed: 1,
        }}
        onSubmit={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId('round-final-ok-button'));
    expect(screen.getByTestId('match-score-flash')).toHaveTextContent('1');
    expect(screen.getByTestId('match-score-flash')).toHaveTextContent('0');

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText('R U R\' U\'')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /preparando mezcla/i })).toBeDisabled();

    act(() => {
      fireEvent.keyDown(document, { key: 'Tab', code: 'Tab' });
    });
    expect(screen.getByTestId('timer-status')).toHaveTextContent('Listo');

    act(() => {
      vi.advanceTimersByTime(7000);
    });
    expect(screen.getByRole('button', { name: /comenzar inspección/i })).toBeEnabled();

    act(() => {
      fireEvent.keyDown(document, { key: 'Tab', code: 'Tab' });
    });
    expect(screen.getByTestId('timer-status')).toHaveTextContent('Inspección');
  });

  it('does not restart inspection from a signal already consumed before submit reset', async () => {
    let nowValue = 10000;
    const now = vi.fn(() => nowValue);
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <CompetitionTimerPanel
        roomCode="ABC123"
        activeRound={{ id: 'round-1', number: 1, scramble: 'R U R\' U\'' }}
        inspectionStartSignal={{ roundId: 'round-1', startedAt: 10000 }}
        now={now}
        wallNow={now}
        onSubmit={onSubmit}
      />,
    );

    nowValue = 11000;
    act(() => {
      fireEvent.keyDown(document, { key: ' ', code: 'Space' });
    });
    nowValue = 12000;
    act(() => {
      fireEvent.keyDown(document, { key: ' ', code: 'Space' });
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('submit-ok-button'));
    });

    expect(onSubmit).toHaveBeenCalledWith({ timeMs: 1000, penalty: 'none' });
    expect(screen.getByTestId('timer-status')).toHaveTextContent('Listo');
    expect(screen.getByText('R U R\' U\'')).toBeInTheDocument();
    expect(screen.getByTestId('timer-display')).toHaveTextContent('0.000');
  });
});
