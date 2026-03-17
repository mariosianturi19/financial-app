// ── Core types ───────────────────────────────────────────────────
export interface User { id: number; name: string; email: string; }

export interface Category {
  id: number;
  user_id: number;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color: string;
  is_default: boolean; // ← baru: kategori default tidak bisa dihapus
}

export interface Wallet {
  id: number; user_id: number; name: string; balance: number;
  currency: string; icon?: string; color: string;
}

export interface Transaction {
  id: number; user_id: number; wallet_id: number; category_id: number;
  type: 'income' | 'expense'; amount: number; description?: string; date: string;
  category?: Category; wallet?: Wallet;
}

export interface Budget {
  id: number; category_id: number; amount: number; month: string;
  spent?: number; category?: Category;
}

export interface DashboardSummary {
  total_balance: number; total_income: number; total_expense: number;
  recent_transactions: Transaction[];
  expense_by_category: { category_id: number; total: number; category: Category }[];
  monthly_trend: { month: string; income: number; expense: number }[];
}

// ── Analytics types ───────────────────────────────────────────────
export interface MonthlyData {
  month: string; month_key: string;
  income: number; expense: number; savings: number; savings_rate: number;
}

export interface TopCategory {
  category: Category | null; total: number; count: number; avg_per_tx: number;
}

export interface DayOfWeekData { day: string; avg: number; count: number; }

export interface NetWorthPoint { month: string; net_worth: number; }

export interface AdvancedAnalytics {
  monthly_data: MonthlyData[];
  top_categories: TopCategory[];
  by_day_of_week: DayOfWeekData[];
  by_week_of_month: { week_num: number; total: number }[];
  net_worth_history: NetWorthPoint[];
  avg_monthly_income: number;
  avg_monthly_expense: number;
  avg_savings_rate: number;
}

export interface ForecastProjection {
  month: string; month_key: string;
  projected_income: number; projected_expense: number;
  projected_savings: number; confidence: 'high' | 'medium' | 'low';
}

export interface ForecastChartPoint {
  month: string;
  income?: number; expense?: number;
  projected_income?: number; projected_expense?: number;
  type: 'actual' | 'forecast';
}

export interface ForecastData {
  projections: ForecastProjection[];
  chart_data: ForecastChartPoint[];
  daily_burn_rate: number;
  projected_month_end_expense: number;
  current_month_expense: number;
  current_balance: number;
  income_trend: 'up' | 'down' | 'stable';
  expense_trend: 'up' | 'down' | 'stable';
}

export type InsightType = 'success' | 'warning' | 'danger' | 'info';
export interface Insight {
  type: InsightType; icon: string; title: string; message: string; priority: number;
}

export interface InsightsData {
  insights: Insight[];
  total_insights: number;
  has_warnings: boolean;
}