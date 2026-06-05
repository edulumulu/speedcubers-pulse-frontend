import api from './api.js';

export const userService = {
  getByUsername: (username) =>
    api.get(`/users/${username}`).then(r => r.data),

  getMe: (token) =>
    api.get('/users/me', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data),

  updateMe: (data, token) =>
    api.patch('/users/me', data, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data),

  deleteMe: (token) =>
    api.delete('/users/me', { headers: { Authorization: `Bearer ${token}` } }),
};
