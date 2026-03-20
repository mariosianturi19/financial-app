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
    const insights: { type: string; icon: string; title: string; message: string; priority: number }[] = [];

    const { start: curStart, end: curEnd } = monthRange(curY, curM);
    const { start: lastStart, end: lastEnd } = monthRange(curY, curM - 1);

    // Fetch transaksi bulan ini, bulan lalu, dan 3 bulan terakhir
    const threeAgo = new Date(curY, curM - 2, 1).toISOString().split('T')[0];
    const { data: allTx } = await supabase
      .from('transactions')
      .select('type, amount, date, category_id, category:categories(name)')
      .gte('date', lastStart);

    const curTx   = (allTx ?? []).filter(t => t.date >= curStart  && t.date <= curEnd);
    const lastTx  = (allTx ?? []).filter(t => t.date >= lastStart && t.date <= lastEnd);
    const last3Tx = (allTx ?? []).filter(t => t.date >= threeAgo);

    const curExpense  = curTx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    const curIncome   = curTx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const lastExpense = lastTx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

    // 1. Pengeluaran naik/turun signifikan
    if (lastExpense > 0 && curExpense > 0) {
      const pct = ((curExpense - lastExpense) / lastExpense) * 100;
      if (pct > 20) {
        insights.push({ type: 'warning', icon: '📈', title: 'Pengeluaran Meningkat',
          message: `Pengeluaran bulan ini naik ${pct.toFixed(1)}% dibanding bulan lalu. Perlu perhatian.`, priority: 1 });
      } else if (pct < -15) {
        insights.push({ type: 'success', icon: '✅', title: 'Pengeluaran Menurun',
          message: `Pengeluaran bulan ini turun ${Math.abs(pct).toFixed(1)}% — kerja bagus!`, priority: 3 });
      }
    }

    // 2. Budget overrun
    const currentYM = `${curY}-${String(curM + 1).padStart(2, '0')}`;
    const { data: budgets } = await supabase
      .from('budgets')
      .select('*, category:categories(name)')
      .eq('month', currentYM);

    (budgets ?? []).forEach(b => {
      const spent = curTx.filter(t => t.type === 'expense' && t.category_id === b.category_id)
        .reduce((s, t) => s + Number(t.amount), 0);
      const pct = b.amount > 0 ? (spent / b.amount) * 100 : 0;
      const catName = ((b.category as unknown) as { name: string } | null)?.name ?? 'Kategori';
      if (pct >= 100) {
        insights.push({ type: 'danger', icon: '🚨', title: `Budget Terlampaui: ${catName}`,
          message: `Anggaran ${catName} sudah terlampaui ${(pct - 100).toFixed(1)}%. Pengeluaran: Rp${spent.toLocaleString('id-ID')} dari Rp${b.amount.toLocaleString('id-ID')}.`,
          priority: 1 });
      } else if (pct >= 80) {
        insights.push({ type: 'warning', icon: '⚠️', title: `Budget Hampir Habis: ${catName}`,
          message: `Anggaran ${catName} sudah terpakai ${pct.toFixed(1)}%.`, priority: 2 });
      }
    });

    // 3. Saving rate
    if (curIncome > 0) {
      const sr = ((curIncome - curExpense) / curIncome) * 100;
      if (sr < 0) {
        insights.push({ type: 'danger', icon: '💸', title: 'Pengeluaran Melebihi Pemasukan',
          message: `Bulan ini kamu defisit Rp${(curExpense - curIncome).toLocaleString('id-ID')}. Kurangi pengeluaran atau cari pendapatan tambahan.`, priority: 1 });
      } else if (sr < 10) {
        insights.push({ type: 'warning', icon: '⚡', title: 'Saving Rate Rendah',
          message: `Hanya ${sr.toFixed(1)}% penghasilan yang tersimpan bulan ini. Idealnya minimal 20%.`, priority: 2 });
      } else if (sr >= 30) {
        insights.push({ type: 'success', icon: '🌟', title: 'Saving Rate Excellent',
          message: `${sr.toFixed(1)}% penghasilan tersimpan — kamu di jalur yang sangat baik!`, priority: 4 });
      }
    }

    // 4. Konsentrasi kategori >50%
    if (curExpense > 0) {
      const catSpend: Record<number, { name: string; total: number }> = {};
      curTx.filter(t => t.type === 'expense').forEach(t => {
        const catName = ((t.category as unknown) as { name: string } | null)?.name ?? '?';
        if (!catSpend[t.category_id]) catSpend[t.category_id] = { name: catName, total: 0 };
        catSpend[t.category_id].total += Number(t.amount);
      });
      const top = Object.values(catSpend).sort((a, b) => b.total - a.total)[0];
      if (top && (top.total / curExpense) * 100 > 50) {
        insights.push({ type: 'info', icon: '🔍', title: 'Konsentrasi Pengeluaran Tinggi',
          message: `${((top.total / curExpense) * 100).toFixed(1)}% pengeluaran bulan ini berasal dari kategori "${top.name}". Pertimbangkan diversifikasi.`, priority: 3 });
      }
    }

    // 5. Emergency fund check (3 bulan avg)
    let monthlyAvg = 0;
    for (let i = 1; i <= 3; i++) {
      const { start, end } = monthRange(curY, curM - i);
      monthlyAvg += (allTx ?? []).filter(t => t.type === 'expense' && t.date >= start && t.date <= end).reduce((s, t) => s + Number(t.amount), 0);
    }
    monthlyAvg /= 3;
    const { data: wallets } = await supabase.from('wallets').select('balance');
    const totalBalance = (wallets ?? []).reduce((s, w) => s + Number(w.balance), 0);
    const monthsCovered = monthlyAvg > 0 ? totalBalance / monthlyAvg : 0;
    if (monthsCovered < 3 && monthlyAvg > 0) {
      insights.push({ type: 'warning', icon: '🛡️', title: 'Dana Darurat Kurang',
        message: `Saldo saat ini hanya cukup untuk ${monthsCovered.toFixed(1)} bulan pengeluaran. Idealnya 3-6 bulan.`, priority: 2 });
    } else if (monthsCovered >= 6) {
      insights.push({ type: 'success', icon: '🛡️', title: 'Dana Darurat Aman',
        message: `Saldo mencukupi ${monthsCovered.toFixed(1)} bulan pengeluaran. Dana darurat kamu sangat solid!`, priority: 4 });
    }

    // 6. Tidak ada pemasukan bulan ini
    if (curIncome === 0 && now.getDate() > 5) {
      insights.push({ type: 'warning', icon: '💡', title: 'Belum Ada Pemasukan Tercatat',
        message: 'Belum ada pemasukan yang dicatat bulan ini. Pastikan semua sumber pendapatan tercatat.', priority: 2 });
    }

    // 7. Daily burn rate
    const daysPassed   = now.getDate();
    const dailyBurn    = daysPassed > 0 ? curExpense / daysPassed : 0;
    const avgDailyBurn = lastExpense > 0 ? lastExpense / new Date(curY, curM, 0).getDate() : 0;
    if (avgDailyBurn > 0 && dailyBurn > avgDailyBurn * 1.3) {
      insights.push({ type: 'warning', icon: '🔥', title: 'Laju Pengeluaran Tinggi',
        message: `Rata-rata pengeluaran harian bulan ini Rp${dailyBurn.toLocaleString('id-ID', { maximumFractionDigits: 0 })}/hari, lebih tinggi ${(((dailyBurn - avgDailyBurn) / avgDailyBurn) * 100).toFixed(0)}% dari bulan lalu.`,
        priority: 2 });
    }

    insights.sort((a, b) => a.priority - b.priority);

    return NextResponse.json({
      insights,
      total_insights: insights.length,
      has_warnings:   insights.some(i => ['warning', 'danger'].includes(i.type)),
    });
  } catch {
    return NextResponse.json({ message: 'Server error.' }, { status: 500 });
  }
}
