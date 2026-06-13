import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { competitionService } from '../../services/competitionService.js';

function roomError(err) {
  return err.response?.data?.error || 'Error al preparar la sala de competencia';
}

function resultError(err) {
  return err.response?.data?.error || 'Error al enviar el resultado';
}

function roundNumber(round) {
  return round?.number ?? round?.round_number ?? null;
}

function shouldClearSubmittedResult(currentResult, nextRoom) {
  const submittedRoundNumber = roundNumber(currentResult?.round);
  const activeRoundNumber = roundNumber(nextRoom?.activeRound);
  return submittedRoundNumber !== null && activeRoundNumber !== null && activeRoundNumber > submittedRoundNumber;
}

export const createCompetitionRoom = createAsyncThunk(
  'competition/createRoom',
  async (_, { rejectWithValue }) => {
    try {
      return await competitionService.createRoom();
    } catch (err) {
      return rejectWithValue(roomError(err));
    }
  },
);

export const joinCompetitionRoom = createAsyncThunk(
  'competition/joinRoom',
  async ({ code }, { rejectWithValue }) => {
    try {
      return await competitionService.joinRoom({ code });
    } catch (err) {
      return rejectWithValue(roomError(err));
    }
  },
);

export const refreshCompetitionRoom = createAsyncThunk(
  'competition/refreshRoom',
  async ({ code }, { rejectWithValue }) => {
    try {
      return await competitionService.getRoom({ code });
    } catch (err) {
      return rejectWithValue(roomError(err));
    }
  },
);

export const submitCompetitionResult = createAsyncThunk(
  'competition/submitResult',
  async ({ code, timeMs, penalty }, { rejectWithValue }) => {
    try {
      return await competitionService.submitResult({ code, timeMs, penalty });
    } catch (err) {
      return rejectWithValue(resultError(err));
    }
  },
);

const competitionSlice = createSlice({
  name: 'competition',
  initialState: {
    room: null,
    status: 'idle',
    error: null,
    result: null,
    resultStatus: 'idle',
    resultError: null,
  },
  reducers: {
    leaveCompetitionRoom(state) {
      state.room = null;
      state.status = 'idle';
      state.error = null;
      state.result = null;
      state.resultStatus = 'idle';
      state.resultError = null;
    },
    clearCompetitionError(state) {
      state.error = null;
      state.resultError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createCompetitionRoom.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(createCompetitionRoom.fulfilled, (state, action) => {
        state.status = 'ready';
        state.room = action.payload;
      })
      .addCase(createCompetitionRoom.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(joinCompetitionRoom.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(joinCompetitionRoom.fulfilled, (state, action) => {
        state.status = 'ready';
        state.room = action.payload;
      })
      .addCase(joinCompetitionRoom.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(refreshCompetitionRoom.fulfilled, (state, action) => {
        state.status = 'ready';
        state.room = action.payload;
        if (shouldClearSubmittedResult(state.result, action.payload)) {
          state.result = null;
          state.resultStatus = 'idle';
          state.resultError = null;
        }
      })
      .addCase(refreshCompetitionRoom.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(submitCompetitionResult.pending, (state) => {
        state.resultStatus = 'loading';
        state.resultError = null;
        state.result = null;
      })
      .addCase(submitCompetitionResult.fulfilled, (state, action) => {
        state.resultStatus = 'ready';
        state.result = action.payload;
        if (state.room && action.payload?.nextRound) {
          state.room.activeRound = action.payload.nextRound;
        }
        if (state.room && action.payload?.roundResolution) {
          state.room.latestCompletedRound = {
            ...(action.payload.round ?? {}),
            status: 'completed',
            resolution: action.payload.roundResolution,
          };
        }
      })
      .addCase(submitCompetitionResult.rejected, (state, action) => {
        state.resultStatus = 'failed';
        state.resultError = action.payload;
      });
  },
});

export const { leaveCompetitionRoom, clearCompetitionError } = competitionSlice.actions;
export default competitionSlice.reducer;

export const selectCompetitionRoom = (state) => state.competition.room;
export const selectCompetitionStatus = (state) => state.competition.status;
export const selectCompetitionError = (state) => state.competition.error;
export const selectCompetitionResult = (state) => state.competition.result;
export const selectCompetitionResultStatus = (state) => state.competition.resultStatus;
export const selectCompetitionResultError = (state) => state.competition.resultError;
