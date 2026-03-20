import { create } from 'zustand';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  setAuth: (user: User) => void;
  clearAuth: () => void;
  initFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isInitializing: true,

  /**
   * Dipanggil setelah login/register berhasil.
   * Token sudah disimpan di httpOnly cookie oleh Route Handler.
   */
  setAuth: (user: User) => {
    set({ user, isAuthenticated: true });
  },

  /**
   * Dipanggil saat logout.
   * Cookie dihapus oleh /api/auth/logout Route Handler.
   */
  clearAuth: () => {
    set({ user: null, isAuthenticated: false });
  },

  /**
   * Cek session dengan memanggil /api/auth/me (server-side cookie check).
   * Menggantikan baca localStorage.
   */
  initFromStorage: async () => {
    set({ isInitializing: true });
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const user = (await res.json()) as User;
        set({ user, isAuthenticated: true });
      } else {
        set({ user: null, isAuthenticated: false });
      }
    } catch {
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isInitializing: false });
    }
  },
}));