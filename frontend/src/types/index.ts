export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Category {
  id: number;
  user_id: number;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color: string;
}

export interface Wallet {
  id: number;
  user_id: number;
  name: string;
  balance: number;
  currency: string;
  icon?: string;
  color: string;
}

export interface Transaction {
  id: number;
  user_id: number;
  wallet_id: number;
  category_id: number;
  type: 'income' | 'expense';
  amount: number;
  description?: string;
  date: string;
  category?: Category;
  wallet?: Wallet;
}

export interface Budget {
  id: number;
  category_id: number;
  amount: number;
  month: string;
  spent?: number;
  category?: Category;
}

export interface DashboardSummary {
  total_balance: number;
  total_income: number;
  total_expense: number;
  recent_transactions: Transaction[];
  expense_by_category: { category_id: number; total: number; category: Category }[];
  monthly_trend: { month: string; income: number; expense: number }[];
}
