import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import challengeReducer from '../../../store/slices/challengeSlice.js';
import { presenceSocketService } from '../../../services/presenceSocketService.js';
import { ChallengePanel } from '../ChallengePanel.jsx';

vi.mock('../../../services/presenceSocketService.js', () => ({
  presenceSocketService: {
    acceptChallenge: vi.fn(),
    rejectChallenge: vi.fn(),
    cancelChallenge: vi.fn(),
  },
}));

const challenge = {
  id: 'challenge-1',
  event: '3x3',
  challenger: { id: 'user-1', username: 'edulumulu' },
  challenged: { id: 'user-2', username: 'margallego' },
  expiresAt: null,
};

function makeChallenge() {
  return {
    ...challenge,
    expiresAt: new Date(Date.now() + 30000).toISOString(),
  };
}

function renderPanel(challengeState) {
  const store = configureStore({
    reducer: { challenge: challengeReducer },
    preloadedState: { challenge: challengeState },
  });

  return {
    store,
    user: userEvent.setup(),
    ...render(
      <Provider store={store}>
        <ChallengePanel />
      </Provider>,
    ),
  };
}

describe('ChallengePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    presenceSocketService.cancelChallenge.mockResolvedValue({ ok: true });
  });

  it('shows the approved incoming challenge layout', () => {
    renderPanel({ incoming: makeChallenge(), outgoing: null, status: 'idle', error: null, notice: null });

    expect(screen.getByText('Duelo 1v1')).toBeInTheDocument();
    expect(screen.getByText('Invitación a sala')).toBeInTheDocument();
    expect(screen.getByText('edulumulu')).toBeInTheDocument();
    expect(screen.queryByText(/Evento:/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /aceptar reto/i })).toBeInTheDocument();
  });

  it('cancels an outgoing challenge and clears the popup', async () => {
    const outgoingChallenge = makeChallenge();
    const { user, store } = renderPanel({
      incoming: null,
      outgoing: outgoingChallenge,
      status: 'sent',
      error: null,
      notice: null,
    });

    await user.click(screen.getByRole('button', { name: /cancelar reto/i }));

    expect(presenceSocketService.cancelChallenge).toHaveBeenCalledWith({ challengeId: 'challenge-1' });
    await waitFor(() => {
      expect(screen.queryByText('Esperando respuesta')).not.toBeInTheDocument();
    });
    expect(store.getState().challenge).toMatchObject({
      outgoing: null,
      status: 'cancelled',
      notice: null,
    });
  });
});
