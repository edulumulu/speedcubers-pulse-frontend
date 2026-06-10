import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice.js';
import userReducer from './slices/userSlice.js';
import rankingReducer from './slices/rankingSlice.js';
import videoReducer from './slices/videoSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    ranking: rankingReducer,
    video: videoReducer,
  },
});
