import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { rankingService } from '../../services/rankingService.js';

export const fetchRanking = createAsyncThunk(
  'ranking/fetchTop100',
  async (event = '3x3', { rejectWithValue }) => {
    try {
      return await rankingService.getTop100(event);
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Error al cargar el ranking');
    }
  },
);

const rankingSlice = createSlice({
  name: 'ranking',
  initialState: {
    data: [],
    event: '3x3',
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {
    setEvent(state, action) {
      state.event = action.payload;
      state.data = [];
      state.status = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRanking.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchRanking.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload.ranking;
        state.event = action.payload.event;
      })
      .addCase(fetchRanking.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export const { setEvent } = rankingSlice.actions;
export default rankingSlice.reducer;
