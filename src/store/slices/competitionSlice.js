import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { competitionService } from '../../services/competitionService.js';

function roomError(err) {
  return err.response?.data?.error || 'Error al preparar la sala de competencia';
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

const competitionSlice = createSlice({
  name: 'competition',
  initialState: {
    room: null,
    status: 'idle',
    error: null,
  },
  reducers: {
    leaveCompetitionRoom(state) {
      state.room = null;
      state.status = 'idle';
      state.error = null;
    },
    clearCompetitionError(state) {
      state.error = null;
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
      });
  },
});

export const { leaveCompetitionRoom, clearCompetitionError } = competitionSlice.actions;
export default competitionSlice.reducer;

export const selectCompetitionRoom = (state) => state.competition.room;
export const selectCompetitionStatus = (state) => state.competition.status;
export const selectCompetitionError = (state) => state.competition.error;
