import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/supabase/helpers';

function monthRange(y: number, m: number) {
  return {
    start: new Date(y, m, 1).toISOString().split('T')[0],
    end:   new Date(y, m + 1, 0).toISOString().split('T')[0],
  };
}

export async function GET() {
  try {
    const supabase = await createClient();
    const user = await getAuthUser(supabase);
    if (!user) return NextResponse.json({ message: 'Unauthenticated.' }, { status: 401 });

    const now = new Date();
    const curY = now.getFullYear(), curM = now.getMonth();

    // Fetch semua transaksi
    const { data: allTx } = await supabase
      .from('transactions')
      .select('type, amount, date, category_id, category:categories(id,name,icon,color,type,is_default)');

    let txAll = allTx ?? [];

    // Dynamic 12-month data: start from earliest transaction, max 11 months ago
    let startOffset = 11;
    if (txAll.length > 0) {
      const earliest = txAll.reduce((min, t) => t.date < min ? t.date : min, txAll[0].date);
      const earliestDate = new Date(earliest);
      const monthsDiff = (curY - earliestDate.getFullYear()) * 12 + (curM - earliestDate.getMonth());
      startOffset = Math.min(11, Math.max(0, monthsDiff));
    } else {
      startOffset = 0;
    }

    const twelveAgo = new Date(curY, curM - 11, 1).toISOString().split('T')[0];
    txAll = txAll.filter(t => t.date >= twelveAgo);

    const months = [];
    for (let i = startOffset; i >= 0; i--) {
      const d = new Date(curY, curM - i, 1);
      const { start, end } = monthRange(d.getFullYear(), d.getMonth());
      const slice = txAll.filter(t => t.date >= start && t.date <= end);
      const income  = slice.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
      const expense = slice.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
      months.push({
        month:        d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        month_key:    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        income, expense,
        savings:      income - expense,
        savings_rate: income > 0 ? Math.round(((income - expense) / income) * 100 * 10) / 10 : 0,
      });
    }

    // Top 5 categories 3 bulan terakhir
    const threeAgo = new Date(curY, curM - 2, 1).toISOString().split('T')[0];
    const expense3m = txAll.filter(t => t.type === 'expense' && t.date >= threeAgo);
    const catMap: Record<number, { category: unknown; total: number; count: number }> = {};
    expense3m.forEach(t => {
      if (!catMap[t.category_id]) catMap[t.category_id] = { category: t.category, total: 0, count: 0 };
      catMap[t.category_id].total += Number(t.amount);
      catMap[t.category_id].count++;
    });
    const topCategories = Object.values(catMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map(c => ({ ...c, avg_per_tx: c.count > 0 ? Math.round(c.total / c.count) : 0 }));

    // By day of week (0=Sun..6=Sat) — compute in TypeScript
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayMap: Record<number, { total: number; count: number }> = {};
    expense3m.forEach(t => {
      const dow = new Date(t.date + 'T12:00:00').getDay();
      if (!dayMap[dow]) dayMap[dow] = { total: 0, count: 0 };
      dayMap[dow].total += Number(t.amount);
      dayMap[dow].count++;
    });
    const byDayOfWeek = Object.entries(dayMap)
      .map(([d, v]) => ({ day: dayNames[Number(d)], avg: Math.round(v.total / v.count), count: v.count }))
      .sort((a, b) => dayNames.indexOf(a.day) - dayNames.indexOf(b.day));

    // By week of month (current month)
    const { start: curStart, end: curEnd } = monthRange(curY, curM);
    const curMonthTx = txAll.filter(t => t.type === 'expense' && t.date >= curStart && t.date <= curEnd);
    const weekMap: Record<number, number> = {};
    curMonthTx.forEach(t => {
      const weekNum = Math.floor((new Date(t.date + 'T12:00:00').getDate() - 1) / 7) + 1;
      weekMap[weekNum] = (weekMap[weekNum] ?? 0) + Number(t.amount);
    });
    const byWeekOfMonth = Object.entries(weekMap).map(([w, total]) => ({ week_num: Number(w), total }));

    // Net worth history
    const { data: wallets } = await supabase.from('wallets').select('balance');
    const currentBalance = (wallets ?? []).reduce((s, w) => s + Number(w.balance), 0);
    const history: { month: string; net_worth: number }[] = [];
    let balance = currentBalance;
    const reversed = [...months].reverse();
    reversed.forEach(m => {
      history.unshift({ month: m.month, net_worth: Math.round(balance) });
      balance -= m.savings;
    });

    const last3 = months.slice(-3);
    const avgIncome  = last3.reduce((s, m) => s + m.income, 0) / 3;
    const avgExpense = last3.reduce((s, m) => s + m.expense, 0) / 3;

    return NextResponse.json({
      monthly_data:        months,
      top_categories:      topCategories,
      by_day_of_week:      byDayOfWeek,
      by_week_of_month:    byWeekOfMonth,
      net_worth_history:   history,
      avg_monthly_income:  Math.round(avgIncome),
      avg_monthly_expense: Math.round(avgExpense),
      avg_savings_rate:    avgIncome > 0 ? Math.round(((avgIncome - avgExpense) / avgIncome) * 100 * 10) / 10 : 0,
    });
  } catch {
    return NextResponse.json({ message: 'Server error.' }, { status: 500 });
  }
}
