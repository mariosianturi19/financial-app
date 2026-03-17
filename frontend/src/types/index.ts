// ── Existing types (tidak berubah) ──────────────────────────────
export interface User { id: number; name: string; email: string; }

export interface Category {
  id: number; user_id: number; name: string;
  type: 'income' | 'expense'; icon?: string; color: string;
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

// ── Fase 2 types ────────────────────────────────────────────────
export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';
export interface RecurringTransaction {
  id: number; user_id: number; wallet_id: number; category_id: number;
  type: 'income' | 'expense'; amount: number; description?: string;
  frequency: RecurringFrequency; start_date: string; next_due_date: string;
  end_date?: string; is_active: boolean; wallet?: Wallet; category?: Category;
}

export type GoalStatus = 'active' | 'completed' | 'cancelled';
export interface FinancialGoal {
  id: number; user_id: number; name: string; icon?: string; color: string;
  target_amount: number; current_amount: number; target_date?: string;
  status: GoalStatus; notes?: string; progress_percentage: number; remaining_amount: number;
}

export type BillingCycle = 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export interface Subscription {
  id: number; user_id: number; wallet_id: number; category_id?: number;
  name: string; icon?: string; color: string; amount: number;
  billing_cycle: BillingCycle; next_billing_date: string; start_date: string;
  is_active: boolean; notes?: string; yearly_cost: number; wallet?: Wallet; category?: Category;
}

export type DebtType   = 'debt' | 'receivable';
export type DebtStatus = 'active' | 'partially_paid' | 'paid';
export interface Debt {
  id: number; user_id: number; wallet_id: number; counterparty: string;
  type: DebtType; original_amount: number; paid_amount: number; remaining_amount: number;
  due_date?: string; description?: string; status: DebtStatus; color: string; wallet?: Wallet;
}

// ── Fase 3 types ────────────────────────────────────────────────
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