import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice.js';
import userReducer from './slices/userSlice.js';
import rankingReducer from './slices/rankingSlice.js';
import videoReducer from './slices/videoSlice.js';
import competitionReducer from './slices/competitionSlice.js';
import presenceReducer from './slices/presenceSlice.js';
import challengeReducer from './slices/challengeSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    ranking: rankingReducer,
    competition: competitionReducer,
    video: videoReducer,
    presence: presenceReducer,
    challenge: challengeReducer,
  },
});
