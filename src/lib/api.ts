import axios from 'axios';

/**
 * Semua request dikirim ke /api/* (Next.js Route Handlers).
 * Autentikasi ditangani otomatis via Supabase session cookies.
 * Tidak perlu inject token secara manual.
 */
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Response interceptor — jika 401, redirect ke login
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