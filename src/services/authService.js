import api from './api.js';

export const authService = {
  login: (credentials) =>
    api.post('/auth/login', credentials).then((r) => r.data),

  register: (data) =>
    api.post('/auth/register', data).then((r) => r.data),

  logout: (token) =>
    api.post('/auth/logout', {}, { headers: { Authorization: `Bearer ${token}` } }),

  refresh: () =>
    api.post('/auth/refresh', {}).then((r) => r.data),

  linkWca: (wcaId, token) =>
    api.post('/auth/link-wca', { wca_id: wcaId }, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.data),

  checkAvailability: (params) =>
    api.get('/auth/check', { params }).then((r) => r.data),

  forgotPassword: (email) =>
    api.post('/auth/forgot-password', { email }).then((r) => r.data),

  resetPassword: (token, password) =>
    api.post('/auth/reset-password', { token, password }).then((r) => r.data),
};
