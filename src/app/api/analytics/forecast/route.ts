import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/supabase/helpers';

function linearRegression(xs: number[], ys: number[]) {
  const n = xs.length;
  if (n < 2) return { a: ys[0] ?? 0, b: 0, r2: 0 };
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  let sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) { sumXY += xs[i] * ys[i]; sumX2 += xs[i] * xs[i]; }
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return { a: sumY / n, b: 0, r2: 0 };
  const b = (n * sumXY - sumX * sumY) / denom;
  const a = (sumY - b * sumX) / n;
  const meanY = sumY / n;
  let ssTot = 0, ssRes = 0;
  for (let i = 0; i < n; i++) {
    ssTot += (ys[i] - meanY) ** 2;
    ssRes += (ys[i] - (a + b * xs[i])) ** 2;
  }
  const r2 = ssTot > 0 ? Math.max(0, 1 - ssRes / ssTot) : 0;
  return { a, b, r2 };
}

function confidence(r2Income: number, r2Expense: number): 'high' | 'medium' | 'low' {
  const avg = (r2Income + r2Expense) / 2;
  return avg >= 0.7 ? 'high' : avg >= 0.4 ? 'medium' : 'low';
}

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

    const { data: allTx } = await supabase
      .from('transactions')
      .select('type, amount, date');

    let txs = allTx ?? [];

    let startOffset = 5;
    if (txs.length > 0) {
      const earliest = txs.reduce((min, t) => t.date < min ? t.date : min, txs[0].date);
      const earliestDate = new Date(earliest);
      const monthsDiff = (curY - earliestDate.getFullYear()) * 12 + (curM - earliestDate.getMonth());
      startOffset = Math.min(5, Math.max(0, monthsDiff));
    } else {
      startOffset = 0;
    }

    const sixAgo = new Date(curY, curM - 5, 1).toISOString().split('T')[0];
    txs = txs.filter(t => t.date >= sixAgo);

    const dataPoints: { x: number; income: number; expense: number; monthKey: string }[] = [];
    let currentX = 1;
    for (let i = startOffset; i >= 0; i--) {
      const d = new Date(curY, curM - i, 1);
      const { start, end } = monthRange(d.getFullYear(), d.getMonth());
      const slice = txs.filter(t => t.date >= start && t.date <= end);
      dataPoints.push({
        x: currentX,
        monthKey: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        income:  slice.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0),
        expense: slice.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0),
      });
      currentX++;
    }

    const fIncome  = linearRegression(dataPoints.map(d => d.x), dataPoints.map(d => d.income));
    const fExpense = linearRegression(dataPoints.map(d => d.x), dataPoints.map(d => d.expense));

    const projections = [];
    for (let i = 1; i <= 3; i++) {
      const x = currentX - 1 + i;
      const d = new Date(curY, curM + i, 1);
      const pI = Math.max(0, fIncome.a + fIncome.b * x);
      const pE = Math.max(0, fExpense.a + fExpense.b * x);
      projections.push({
        month:             d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        month_key:         `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        projected_income:  Math.round(pI),
        projected_expense: Math.round(pE),
        projected_savings: Math.round(pI - pE),
        confidence:        confidence(fIncome.r2, fExpense.r2),
      });
    }

    const chartData = [
      ...dataPoints.map(dp => {
        const parts = dp.monthKey.split('-');
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
        return { month: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), income: dp.income, expense: dp.expense, type: 'actual' };
      }),
      ...projections.map(p => ({ month: p.month, projected_income: p.projected_income, projected_expense: p.projected_expense, type: 'forecast' })),
    ];

    // Current month stats
    const { start: cStart, end: cEnd } = monthRange(curY, curM);
    const curSlice = (txs ?? []).filter(t => t.date >= cStart && t.date <= cEnd);
    const curIncome  = curSlice.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const curExpense = curSlice.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    const daysPassed    = now.getDate();
    const daysInMonth   = new Date(curY, curM + 1, 0).getDate();
    const dailyBurnRate = daysPassed > 0 ? curExpense / daysPassed : 0;
    const { data: wallets } = await supabase.from('wallets').select('balance');
    const currentBalance = (wallets ?? []).reduce((s, w) => s + Number(w.balance), 0);

    return NextResponse.json({
      projections,
      chart_data: chartData,
      daily_burn_rate:             Math.round(dailyBurnRate),
      projected_month_end_expense: Math.round(curExpense + dailyBurnRate * (daysInMonth - daysPassed)),
      current_month_expense:       curExpense,
      current_balance:             currentBalance,
      income_trend:  fIncome.b  > 0 ? 'up' : fIncome.b  < -0.05 ? 'down' : 'stable',
      expense_trend: fExpense.b > 0 ? 'up' : fExpense.b < -0.05 ? 'down' : 'stable',
    });
  } catch {
    return NextResponse.json({ message: 'Server error.' }, { status: 500 });
  }
}
