import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  incoming: null,
  outgoing: null,
  status: 'idle',
  error: null,
  notice: null,
};

const challengeSlice = createSlice({
  name: 'challenge',
  initialState,
  reducers: {
    challengeSending(state) {
      state.status = 'sending';
      state.error = null;
      state.notice = null;
    },
    challengeSent(state, action) {
      state.status = 'sent';
      state.outgoing = action.payload;
      state.error = null;
      state.notice = null;
    },
    challengeReceived(state, action) {
      state.incoming = action.payload;
      state.error = null;
      state.notice = null;
    },
    challengeAccepted(state) {
      state.incoming = null;
      state.outgoing = null;
      state.status = 'accepted';
      state.error = null;
      state.notice = null;
    },
    challengeRejected(state, action) {
      const challengeId = action.payload?.challenge?.id ?? action.payload?.id;
      if (!challengeId || state.outgoing?.id === challengeId) {
        state.outgoing = null;
      }
      if (!challengeId || state.incoming?.id === challengeId) {
        state.incoming = null;
      }
      state.status = 'rejected';
      state.error = null;
      state.notice = null;
    },
    challengeCancelled(state, action) {
      const challengeId = action.payload?.challenge?.id ?? action.payload?.id;
      if (!challengeId || state.outgoing?.id === challengeId) {
        state.outgoing = null;
      }
      if (!challengeId || state.incoming?.id === challengeId) {
        state.incoming = null;
      }
      state.status = 'cancelled';
      state.error = null;
      state.notice = null;
    },
    challengeExpired(state, action) {
      const challengeId = action.payload?.id;
      if (state.outgoing?.id === challengeId) state.outgoing = null;
      if (state.incoming?.id === challengeId) state.incoming = null;
      state.status = 'expired';
      state.notice = 'Reto caducado';
    },
    challengeFailed(state, action) {
      state.status = 'failed';
      state.error = action.payload || 'No se pudo enviar el reto';
      state.notice = null;
    },
    challengeCleared(state) {
      state.incoming = null;
      state.outgoing = null;
      state.status = 'idle';
      state.error = null;
      state.notice = null;
    },
  },
});

export const {
  challengeSending,
  challengeSent,
  challengeReceived,
  challengeAccepted,
  challengeRejected,
  challengeCancelled,
  challengeExpired,
  challengeFailed,
  challengeCleared,
} = challengeSlice.actions;

export default challengeSlice.reducer;

export const selectIncomingChallenge = (state) => state.challenge.incoming;
export const selectOutgoingChallenge = (state) => state.challenge.outgoing;
export const selectChallengeStatus = (state) => state.challenge.status;
export const selectChallengeError = (state) => state.challenge.error;
export const selectChallengeNotice = (state) => state.challenge.notice;
