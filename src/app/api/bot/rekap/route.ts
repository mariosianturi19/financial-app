import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * GET /api/bot/rekap?phone=62812xxxx&bulan=2025-04
 * Rekap transaksi user bulan ini (atau bulan tertentu jika disuplai).
 * Dipanggil oleh WA Bot — dilindungi x-bot-api-key.
 */
export async function GET(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-bot-api-key');
    if (!apiKey || apiKey !== process.env.BOT_API_KEY) {
      return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
    }

    const phone = req.nextUrl.searchParams.get('phone');
    const bulan = req.nextUrl.searchParams.get('bulan'); // format: YYYY-MM (opsional)

    if (!phone) return NextResponse.json({ message: 'phone wajib ada.' }, { status: 422 });

    const supabase = supabaseAdmin;

    // ── Temukan user ─────────────────────────────────────────────
    const phoneStr = String(phone);
    const phone62 = phoneStr.startsWith('0') ? '62' + phoneStr.slice(1) : phoneStr;
    const phone0  = phoneStr.startsWith('62') ? '0' + phoneStr.slice(2) : phoneStr;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .or(`phone_number.eq.${phone62},phone_number.eq.${phone0}`)
      .single();

    if (!profile) {
      return NextResponse.json({ message: 'Nomor WA tidak terdaftar.', code: 'PHONE_NOT_REGISTERED' }, { status: 404 });
    }

    // ── Tentukan rentang tanggal ──────────────────────────────────
    // Gunakan WIB (UTC+7) agar konsisten dengan pencatatan transaksi
    const nowWIB  = new Date(Date.now() + 7 * 60 * 60 * 1000);
    const yearStr = bulan ? bulan.split('-')[0] : String(nowWIB.getUTCFullYear());
    const monStr  = bulan ? bulan.split('-')[1] : String(nowWIB.getUTCMonth() + 1).padStart(2, '0');

    const startDate = `${yearStr}-${monStr}-01`;
    // Hari terakhir bulan: maju ke bulan berikutnya lalu kurangi 1 hari
    const lastDay   = new Date(Number(yearStr), Number(monStr), 0).getDate();
    const endDate   = `${yearStr}-${monStr}-${String(lastDay).padStart(2, '0')}`;

    // ── Ambil semua transaksi bulan tersebut ──────────────────────
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('type, amount, date, description, category:categories(name), wallet:wallets(name)')
      .eq('user_id', profile.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (error) throw error;

    const txList = transactions ?? [];

    // ── Akumulasi total income dan expense ────────────────────────
    let totalIncome  = 0;
    let totalExpense = 0;
    const expenseByCategory: Record<string, number> = {};

    for (const tx of txList) {
      const amt = Number(tx.amount);
      if (tx.type === 'income') {
        totalIncome += amt;
      } else {
        totalExpense += amt;
        const catName = (tx.category as unknown as { name: string } | null)?.name ?? 'Lainnya';
        expenseByCategory[catName] = (expenseByCategory[catName] ?? 0) + amt;
      }
    }

    // Sort kategori pengeluaran terbesar
    const topExpenses = Object.entries(expenseByCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    const monthLabel  = monthNames[Number(monStr) - 1] + ' ' + yearStr;

    return NextResponse.json({
      month_label:     monthLabel,
      start_date:      startDate,
      end_date:        endDate,
      total_income:    totalIncome,
      total_expense:   totalExpense,
      net:             totalIncome - totalExpense,
      tx_count:        txList.length,
      top_expenses:    topExpenses, // [['nama_kategori', total], ...]
    });

  } catch {
    return NextResponse.json({ message: 'Server error.' }, { status: 500 });
  }
}
