import api from './api.js';

export const presenceService = {
  getOnlineUsers() {
    return api.get('/users/online').then((r) => r.data);
  },
};
