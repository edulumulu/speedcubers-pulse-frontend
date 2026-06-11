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
      fireEvent.click(screen.getByRole('button', { name: /^ok$/i }));
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
      fireEvent.click(screen.getByRole('button', { name: /^\+2$/i }));
    });

    expect(onSubmit).toHaveBeenCalledWith({ timeMs: 8765, penalty: '+2' });
  });

  it('submits DNF after the timer has stopped', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    let nowValue = 0;
    const now = vi.fn(() => nowValue);

    render(<CompetitionTimerPanel roomCode="ABC123" now={now} onSubmit={onSubmit} />);

    expect(screen.queryByRole('button', { name: /^dnf$/i })).not.toBeInTheDocument();

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /iniciar/i }));
    });
    nowValue = 4321;
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /^parar$/i }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^dnf$/i }));
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
    expect(screen.getByText('Resultado enviado: 12.345 (+2)')).toBeInTheDocument();

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
});
