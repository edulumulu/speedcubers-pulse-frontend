import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { presenceService } from '../../services/presenceService.js';

export const fetchOnlineUsers = createAsyncThunk(
  'presence/fetchOnlineUsers',
  async (_, { rejectWithValue }) => {
    try {
      return await presenceService.getOnlineUsers();
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Error al cargar usuarios online');
    }
  },
);

function upsertUser(users, user) {
  const index = users.findIndex((item) => item.id === user.id);
  if (index === -1) {
    users.push(user);
  } else {
    users[index] = { ...users[index], ...user };
  }
  users.sort((a, b) => a.username.localeCompare(b.username));
}

const presenceSlice = createSlice({
  name: 'presence',
  initialState: {
    users: [],
    status: 'idle',
    socketStatus: 'idle',
    error: null,
  },
  reducers: {
    presenceConnecting(state) {
      state.socketStatus = 'connecting';
      state.error = null;
    },
    presenceConnected(state) {
      state.socketStatus = 'connected';
      state.error = null;
    },
    presenceDisconnected(state) {
      state.socketStatus = 'idle';
      state.users = [];
    },
    presenceConnectionFailed(state, action) {
      state.socketStatus = 'failed';
      state.error = action.payload || 'Error de presencia online';
    },
    onlineUserReceived(state, action) {
      upsertUser(state.users, action.payload);
    },
    onlineUserRemoved(state, action) {
      const userId = action.payload?.id;
      state.users = state.users.filter((user) => user.id !== userId);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOnlineUsers.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchOnlineUsers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.users = action.payload.users ?? [];
      })
      .addCase(fetchOnlineUsers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export const {
  presenceConnecting,
  presenceConnected,
  presenceDisconnected,
  presenceConnectionFailed,
  onlineUserReceived,
  onlineUserRemoved,
} = presenceSlice.actions;
export default presenceSlice.reducer;

export const selectOnlineUsers = (state) => state.presence.users;
export const selectPresenceSocketStatus = (state) => state.presence.socketStatus;
