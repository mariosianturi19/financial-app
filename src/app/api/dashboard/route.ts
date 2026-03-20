import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/supabase/helpers';

export async function GET() {
  try {
    const supabase = await createClient();
    const user = await getAuthUser(supabase);
    if (!user) return NextResponse.json({ message: 'Unauthenticated.' }, { status: 401 });

    const uid = user.id;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-based

    // Helper: get first day of month N months ago
    const monthStart = (y: number, m: number) =>
      new Date(y, m, 1).toISOString().split('T')[0];
    const monthEnd = (y: number, m: number) =>
      new Date(y, m + 1, 0).toISOString().split('T')[0];

    const curStart = monthStart(year, month);
    const curEnd   = monthEnd(year, month);

    // Total balance dari semua wallets
    const { data: wallets } = await supabase.from('wallets').select('balance');
    const totalBalance = (wallets ?? []).reduce((s, w) => s + Number(w.balance), 0);

    // Income & Expense bulan ini
    const { data: monthTx } = await supabase
      .from('transactions')
      .select('type, amount')
      .gte('date', curStart)
      .lte('date', curEnd);

    const totalIncome  = (monthTx ?? []).filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const totalExpense = (monthTx ?? []).filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

    // 5 transaksi terbaru
    const { data: recentTransactions } = await supabase
      .from('transactions')
      .select('*, category:categories(*), wallet:wallets(*)')
      .order('date', { ascending: false })
      .order('id', { ascending: false })
      .limit(5);

    // Pengeluaran per kategori bulan ini
    const { data: expenseTx } = await supabase
      .from('transactions')
      .select('category_id, amount, category:categories(*)')
      .eq('type', 'expense')
      .gte('date', curStart)
      .lte('date', curEnd);

    const expenseByCategoryMap: Record<number, { category_id: number; total: number; category: unknown }> = {};
    (expenseTx ?? []).forEach(tx => {
      const cid = tx.category_id;
      if (!expenseByCategoryMap[cid]) {
        expenseByCategoryMap[cid] = { category_id: cid, total: 0, category: tx.category };
      }
      expenseByCategoryMap[cid].total += Number(tx.amount);
    });
    const expenseByCategory = Object.values(expenseByCategoryMap);

    // Monthly trend — 6 bulan terakhir
    const sixMonthsAgo = new Date(year, month - 5, 1).toISOString().split('T')[0];
    const { data: allTx } = await supabase
      .from('transactions')
      .select('type, amount, date')
      .gte('date', sixMonthsAgo);

    const monthlyTrend: { month: string; income: number; expense: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, month - i, 1);
      const y2 = d.getFullYear(), m2 = d.getMonth();
      const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const start = monthStart(y2, m2), end = monthEnd(y2, m2);
      const slice = (allTx ?? []).filter(t => t.date >= start && t.date <= end);
      monthlyTrend.push({
        month:   label,
        income:  slice.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0),
        expense: slice.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0),
      });
    }

    return NextResponse.json({
      total_balance:       totalBalance,
      total_income:        totalIncome,
      total_expense:       totalExpense,
      recent_transactions: recentTransactions ?? [],
      expense_by_category: expenseByCategory,
      monthly_trend:       monthlyTrend,
    });
  } catch {
    return NextResponse.json({ message: 'Server error.' }, { status: 500 });
  }
}
