import api from './api.js';

export const rankingService = {
  getTop100(event = '3x3') {
    return api.get('/ranking', { params: { event } }).then((r) => r.data);
  },

  getUserStats(userId, event = '3x3') {
    return api.get(`/ranking/users/${userId}`, { params: { event } }).then((r) => r.data);
  },
};
