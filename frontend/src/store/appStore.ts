import { create } from 'zustand';
import { Category, Wallet } from '@/types';
import api from '@/lib/api';

interface AppState {
  // Wallets
  wallets: Wallet[];
  walletsLoaded: boolean;
  fetchWallets: () => Promise<void>;
  setWallets: (wallets: Wallet[]) => void;
  updateWalletInStore: (wallet: Wallet) => void;
  removeWalletFromStore: (id: number) => void;

  // Categories
  categories: Category[];
  categoriesLoaded: boolean;
  fetchCategories: () => Promise<void>;
  setCategories: (categories: Category[]) => void;
  updateCategoryInStore: (category: Category) => void;
  removeCategoryFromStore: (id: number) => void;

  // Reset (saat logout)
  resetStore: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // ── Wallets ──────────────────────────────────────────────────
  wallets: [],
  walletsLoaded: false,

  fetchWallets: async () => {
    if (get().walletsLoaded) return;
    try {
      const res = await api.get('/wallets');
      set({ wallets: res.data, walletsLoaded: true });
    } catch {
      // handled by axios interceptor (401 → redirect to login)
    }
  },

  setWallets: (wallets) => set({ wallets, walletsLoaded: true }),

  updateWalletInStore: (wallet) =>
    set((state) => ({
      wallets: state.wallets.map((w) => (w.id === wallet.id ? wallet : w)),
    })),

  removeWalletFromStore: (id) =>
    set((state) => ({
      wallets: state.wallets.filter((w) => w.id !== id),
    })),

  // ── Categories ───────────────────────────────────────────────
  categories: [],
  categoriesLoaded: false,

  fetchCategories: async () => {
    if (get().categoriesLoaded) return;
    try {
      const res = await api.get('/categories');
      set({ categories: res.data, categoriesLoaded: true });
    } catch {
      // handled by interceptor
    }
  },

  setCategories: (categories) => set({ categories, categoriesLoaded: true }),

  updateCategoryInStore: (category) =>
    set((state) => ({
      categories: state.categories.map((c) =>
        c.id === category.id ? category : c
      ),
    })),

  removeCategoryFromStore: (id) =>
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
    })),

  // ── Reset ─────────────────────────────────────────────────────
  resetStore: () =>
    set({
      wallets: [],
      walletsLoaded: false,
      categories: [],
      categoriesLoaded: false,
    }),
}));