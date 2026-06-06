import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userService } from '../../services/userService.js';
import { authService } from '../../services/authService.js';

export const fetchProfile = createAsyncThunk('user/fetchProfile', async (username, { rejectWithValue }) => {
  try {
    return await userService.getByUsername(username);
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Error al cargar el perfil');
  }
});

export const fetchMe = createAsyncThunk('user/fetchMe', async (_, { getState, rejectWithValue }) => {
  try {
    const { accessToken } = getState().auth;
    return await userService.getMe(accessToken);
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Error al cargar tu perfil');
  }
});

export const updateMe = createAsyncThunk('user/updateMe', async (data, { getState, rejectWithValue }) => {
  try {
    const { accessToken } = getState().auth;
    return await userService.updateMe(data, accessToken);
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Error al actualizar el perfil');
  }
});

export const linkWca = createAsyncThunk('user/linkWca', async (wcaId, { getState, rejectWithValue }) => {
  try {
    const { accessToken } = getState().auth;
    return await authService.linkWca(wcaId, accessToken);
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Error al vincular el WCA ID');
  }
});

export const deleteMe = createAsyncThunk('user/deleteMe', async (_, { getState, rejectWithValue }) => {
  try {
    const { accessToken } = getState().auth;
    return await userService.deleteMe(accessToken);
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Error al eliminar la cuenta');
  }
});

const userSlice = createSlice({
  name: 'user',
  initialState: {
    profile: null,
    me: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearUserError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchMe.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.loading = false;
        state.me = { ...action.payload.user, wcaId: action.payload.wcaProfile?.wcaId ?? null };
      })
      .addCase(fetchMe.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateMe.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateMe.fulfilled, (state, action) => {
        state.loading = false;
        state.me = { ...action.payload.user, wcaId: state.me?.wcaId ?? null };
      })
      .addCase(updateMe.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(linkWca.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(linkWca.fulfilled, (state, action) => {
        state.loading = false;
        if (state.me) {
          state.me = { ...state.me, wcaId: action.payload.wcaProfile?.wcaId ?? state.me.wcaId };
        }
      })
      .addCase(linkWca.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteMe.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(deleteMe.fulfilled, (state) => {
        state.loading = false;
        state.me = null;
      })
      .addCase(deleteMe.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearUserError } = userSlice.actions;
export default userSlice.reducer;

// Selectors
export const selectProfile = (state) => state.user.profile;
export const selectMe = (state) => state.user.me;
export const selectUserLoading = (state) => state.user.loading;
export const selectUserError = (state) => state.user.error;
