import axios from 'axios';

/**
 * Semua request dikirim ke /api/proxy/* (Next.js Route Handler).
 * Route Handler yang akan membaca httpOnly cookie dan menginject
 * Authorization: Bearer token sebelum meneruskan ke Laravel.
 * Token TIDAK pernah terekspos ke browser / JavaScript.
 */
const api = axios.create({
  baseURL: '/api/proxy',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Response interceptor — jika proxy mengembalikan 401, redirect ke login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;