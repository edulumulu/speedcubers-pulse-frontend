import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { videoService } from '../../services/videoService.js';

export const requestVideoToken = createAsyncThunk(
  'video/requestToken',
  async ({ channelName }, { rejectWithValue }) => {
    try {
      return await videoService.requestToken({ channelName });
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Error al preparar la sala de video');
    }
  },
);

const videoSlice = createSlice({
  name: 'video',
  initialState: {
    room: null,
    status: 'idle',
    error: null,
  },
  reducers: {
    leaveVideoRoom(state) {
      state.room = null;
      state.status = 'idle';
      state.error = null;
    },
    clearVideoError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(requestVideoToken.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(requestVideoToken.fulfilled, (state, action) => {
        state.status = 'ready';
        state.room = action.payload;
      })
      .addCase(requestVideoToken.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export const { leaveVideoRoom, clearVideoError } = videoSlice.actions;
export default videoSlice.reducer;

export const selectVideoRoom = (state) => state.video.room;
export const selectVideoStatus = (state) => state.video.status;
export const selectVideoError = (state) => state.video.error;
