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
    expect(screen.getByText('R U R\' U\'')).toBeInTheDocument();
    expect(screen.getByText('Ronda empatada')).toBeInTheDocument();
  });
});
