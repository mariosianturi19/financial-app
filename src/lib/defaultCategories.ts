/**
 * Default categories — sama persis dengan DefaultCategoriesSeeder di Laravel.
 * Di-seed otomatis saat user baru register.
 */
export const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Gaji',                 icon: '💼', color: '#34d399', type: 'income' as const },
  { name: 'Bonus',                icon: '🎁', color: '#a78bfa', type: 'income' as const },
  { name: 'Dikasih Orang Tua',   icon: '🏠', color: '#60a5fa', type: 'income' as const },
  { name: 'Freelance / Sampingan', icon: '💻', color: '#fb923c', type: 'income' as const },
  { name: 'Penjualan',            icon: '🛍️', color: '#f472b6', type: 'income' as const },
  { name: 'Lainnya',              icon: '✨', color: '#94a3b8', type: 'income' as const },
];

export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Makanan',              icon: '🍔', color: '#fb7185', type: 'expense' as const },
  { name: 'Transportasi',         icon: '🚗', color: '#60a5fa', type: 'expense' as const },
  { name: 'Tagihan',              icon: '⚡', color: '#fbbf24', type: 'expense' as const },
  { name: 'Tempat Tinggal',       icon: '🏠', color: '#34d399', type: 'expense' as const },
  { name: 'Kesehatan',            icon: '💊', color: '#f472b6', type: 'expense' as const },
  { name: 'Pendidikan',           icon: '📚', color: '#a78bfa', type: 'expense' as const },
  { name: 'Nongkrong / Jajan',    icon: '☕', color: '#fb923c', type: 'expense' as const },
  { name: 'Shopping',             icon: '👔', color: '#e879f9', type: 'expense' as const },
  { name: 'Hiburan',              icon: '🎬', color: '#2dd4bf', type: 'expense' as const },
  { name: 'Spotify',              icon: '🎵', color: '#4ade80', type: 'expense' as const },
];

export const ALL_DEFAULT_CATEGORIES = [
  ...DEFAULT_INCOME_CATEGORIES,
  ...DEFAULT_EXPENSE_CATEGORIES,
];
