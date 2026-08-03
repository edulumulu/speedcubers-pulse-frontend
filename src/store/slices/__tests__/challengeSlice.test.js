import challengeReducer, {
  challengeAccepted,
  challengeCancelled,
  challengeExpired,
  challengeReceived,
  challengeRejected,
  challengeSent,
} from '../challengeSlice.js';

const challenge = {
  id: 'challenge-1',
  event: '3x3',
  challenger: { id: 'user-1', username: 'alice' },
  challenged: { id: 'user-2', username: 'bob' },
  expiresAt: '2026-08-03T10:00:30.000Z',
};

describe('challengeSlice', () => {
  it('stores incoming challenges', () => {
    const state = challengeReducer(undefined, challengeReceived(challenge));
    expect(state.incoming).toEqual(challenge);
  });

  it('stores outgoing challenges', () => {
    const state = challengeReducer(undefined, challengeSent(challenge));
    expect(state).toMatchObject({ outgoing: challenge, status: 'sent' });
  });

  it('clears challenges when accepted', () => {
    const state = challengeReducer(
      { incoming: challenge, outgoing: null, status: 'idle', error: null, notice: null },
      challengeAccepted(),
    );
    expect(state).toMatchObject({ incoming: null, outgoing: null, status: 'accepted' });
  });

  it('clears matching challenges when rejected', () => {
    const state = challengeReducer(
      { incoming: null, outgoing: challenge, status: 'sent', error: null, notice: null },
      challengeRejected({ challenge }),
    );
    expect(state).toMatchObject({ outgoing: null, status: 'rejected', notice: null });
  });

  it('expires matching challenges', () => {
    const state = challengeReducer(
      { incoming: challenge, outgoing: null, status: 'idle', error: null, notice: null },
      challengeExpired({ id: challenge.id }),
    );
    expect(state).toMatchObject({ incoming: null, status: 'expired', notice: 'Reto caducado' });
  });

  it('cancels matching challenges without showing a notice', () => {
    const state = challengeReducer(
      { incoming: challenge, outgoing: null, status: 'idle', error: null, notice: null },
      challengeCancelled({ challenge }),
    );
    expect(state).toMatchObject({ incoming: null, status: 'cancelled', notice: null });
  });
});
