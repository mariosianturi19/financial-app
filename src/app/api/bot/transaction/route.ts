import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { recalculateWalletBalance } from '@/lib/supabase/helpers';

/**
 * POST /api/bot/transaction
 * Endpoint ini KHUSUS dipanggil oleh script WA Bot (bukan user langsung).
 * Diamankan dengan header x-bot-api-key yang harus cocok dengan BOT_API_KEY di .env
 */
export async function POST(req: NextRequest) {
  try {
    // ── 1. Validasi Bot API Key (keamanan) ──────────────────────
    const apiKey = req.headers.get('x-bot-api-key');
    if (!apiKey || apiKey !== process.env.BOT_API_KEY) {
      return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
    }

    // Service role client: bypass RLS karena bot tidak punya session user
    const supabase = supabaseAdmin;
    const body = await req.json();
    const { phone, type, amount, category_query, wallet_query, description, date: backdateParam } = body;

    if (!phone || !type || !amount) {
      return NextResponse.json({ message: 'phone, type, dan amount wajib ada.' }, { status: 422 });
    }
    if (!['income', 'expense'].includes(type)) {
      return NextResponse.json({ message: 'type harus income atau expense.' }, { status: 422 });
    }

    // ── 2. Temukan user berdasarkan nomor HP ─────────────────────
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone_number', String(phone))
      .single();

    if (!profile) {
      return NextResponse.json({
        message: 'Nomor WA tidak terdaftar. Silakan daftarkan nomor HP kamu di aplikasi FinApp terlebih dahulu.',
        code: 'PHONE_NOT_REGISTERED',
      }, { status: 404 });
    }

    const userId = profile.id;
    const rp = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

    // ── 3. Ambil semua data wallet & kategori user ─────────────────
    const [{ data: wallets }, { data: categories }] = await Promise.all([
      supabase.from('wallets').select('id, name, balance').eq('user_id', userId),
      supabase.from('categories').select('id, name, type').eq('user_id', userId),
    ]);

    const catQueryOrig  = (category_query ?? '').toLowerCase().trim();
    const walletQuery   = (wallet_query   ?? '').toLowerCase().trim();
    let   effectiveCat  = catQueryOrig; // bisa diperluas kalau wallet dilipat

    // ── 4. Resolusi Wallet ────────────────────────────────────────────
    // Cari wallet berdasarkan kata terakhir dari perintah
    let matchedWallet = walletQuery
      ? (wallets ?? []).find((w) => w.name.toLowerCase().includes(walletQuery))
      : null;

    if (walletQuery && !matchedWallet) {
      // Kata terakhir tidak cocok dengan wallet manapun.
      // Cek: apakah jika dilipat ke catQuery, hasilnya cocok dengan nama kategori?
      const extendedCat = catQueryOrig ? `${catQueryOrig} ${walletQuery}` : walletQuery;
      const wouldMatchCategory = (categories ?? []).some(
        (c) => c.name.toLowerCase().includes(extendedCat) && c.type === type
      );

      if (wouldMatchCategory) {
        // ✅ Kata terakhir adalah bagian dari nama kategori multi-kata → lipat
        effectiveCat  = extendedCat;
        matchedWallet = (wallets ?? [])[0] ?? null; // pakai wallet default
      } else {
        // ❌ Tidak cocok kategori manapun → user salah sebut nama wallet → error
        const walletList = (wallets ?? []).map((w) => w.name).join(', ') || 'belum ada wallet';
        return NextResponse.json({
          message: `Wallet "${wallet_query}" tidak ditemukan. Wallet kamu: ${walletList}.`,
          code: 'WALLET_NOT_FOUND',
        }, { status: 404 });
      }
    }

    // Wallet tidak disebut sama sekali (wallet_query kosong) → wajib sebutkan wallet
    if (!matchedWallet && !walletQuery) {
      const walletList = (wallets ?? []);
      if (walletList.length === 0) {
        return NextResponse.json({
          message: 'Kamu belum punya wallet. Buat wallet terlebih dahulu di aplikasi FinApp.',
          code: 'WALLET_NOT_FOUND',
        }, { status: 404 });
      }
      const names = walletList.map((w) => w.name).join(', ');
      const example = `${type === 'expense' ? 'out' : 'in'} ${amount} ${category_query ?? 'kategori'} ${walletList[0].name.toLowerCase()}`;
      return NextResponse.json({
        message: `Sebutkan nama wallet.\nWallet kamu: ${names}.\n\nContoh: ${example}`,
        code: 'WALLET_REQUIRED',
      }, { status: 422 });
    }

    if (!matchedWallet) {
      return NextResponse.json({
        message: 'Kamu belum punya wallet. Buat wallet terlebih dahulu di aplikasi FinApp.',
        code: 'WALLET_NOT_FOUND',
      }, { status: 404 });
    }

    // ── 5. Resolusi Kategori pakai effectiveCat ───────────────────────
    // Harus cocok NAMA dan TIPE — tidak boleh lintas tipe (income/expense)
    let matchedCategory = effectiveCat
      ? (categories ?? []).find((c) => c.name.toLowerCase().includes(effectiveCat) && c.type === type)
      : null;

    // Fallback ke catQueryOrig kalau effectiveCat (diperluas) tidak ketemu
    if (!matchedCategory && effectiveCat !== catQueryOrig && catQueryOrig) {
      matchedCategory = (categories ?? []).find(
        (c) => c.name.toLowerCase().includes(catQueryOrig) && c.type === type
      );
    }

    // Fallback ke kategori pertama sesuai tipe HANYA jika tidak sebut kategori sama sekali
    if (!catQueryOrig && !walletQuery && !matchedCategory) {
      matchedCategory = (categories ?? []).find((c) => c.type === type);
    }

    // Jika disebutkan tapi tidak ketemu → error + daftar kategori yang tersedia
    if (!matchedCategory) {
      const available = (categories ?? [])
        .filter((c) => c.type === type)
        .map((c) => c.name)
        .join(', ') || '(kosong)';
      const typeLabel = type === 'expense' ? 'pengeluaran' : 'pemasukan';
      return NextResponse.json({
        message: `Kategori "${effectiveCat || catQueryOrig}" tidak ditemukan untuk ${typeLabel}. Kategori ${typeLabel} kamu: ${available}.`,
        code: 'CATEGORY_NOT_FOUND',
      }, { status: 404 });
    }


    // ── 5. Cek saldo cukup (khusus expense) ──────────────────────
    if (type === 'expense') {
      const currentBalance = Number(matchedWallet.balance);
      if (currentBalance < Number(amount)) {
        return NextResponse.json({
          message: `Saldo tidak cukup! Saldo ${matchedWallet.name}: ${rp(currentBalance)}, dibutuhkan: ${rp(Number(amount))}.`,
          code: 'INSUFFICIENT_BALANCE',
        }, { status: 422 });
      }
    }

    // ── 6. Insert transaksi ──────────────────────────────────────
    // Gunakan backdate jika dikirim bot, atau tanggal WIB hari ini
    const todayWIB = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().split('T')[0];
    const txDate   = backdateParam && /^\d{4}-\d{2}-\d{2}$/.test(backdateParam) ? backdateParam : todayWIB;
    const { data: tx, error: txErr } = await supabase
      .from('transactions')
      .insert({
        user_id:     userId,
        wallet_id:   matchedWallet.id,
        category_id: matchedCategory.id,
        type,
        amount:      Number(amount),
        description: description ?? category_query ?? null,
        date:        txDate,
      })
      .select('*, category:categories(name), wallet:wallets(name)')
      .single();

    if (txErr) throw txErr;

    // ── 6. Recalculate saldo wallet ──────────────────────────────
    const newBalance = await recalculateWalletBalance(supabase, matchedWallet.id);

    return NextResponse.json({
      success: true,
      transaction: tx,
      wallet_name:    matchedWallet.name,
      category_name:  matchedCategory.name,
      new_balance:    newBalance,
    }, { status: 201 });

  } catch {
    return NextResponse.json({ message: 'Server error.' }, { status: 500 });
  }
}

/**
 * GET /api/bot/transaction?phone=62812xxxx
 * Dipakai bot untuk ambil ringkasan saldo semua wallet user
 */
export async function GET(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-bot-api-key');
    if (!apiKey || apiKey !== process.env.BOT_API_KEY) {
      return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
    }

    const phone = req.nextUrl.searchParams.get('phone');
    if (!phone) return NextResponse.json({ message: 'phone wajib ada.' }, { status: 422 });

    // Service role client: bypass RLS karena bot tidak punya session user
    const supabase = supabaseAdmin;
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone_number', phone)
      .single();

    if (!profile) {
      return NextResponse.json({ message: 'Nomor WA tidak terdaftar.', code: 'PHONE_NOT_REGISTERED' }, { status: 404 });
    }

    const { data: wallets } = await supabase
      .from('wallets')
      .select('id, name, balance, icon, wallet_type')
      .eq('user_id', profile.id)
      .order('balance', { ascending: false });

    const { data: categories } = await supabase
      .from('categories')
      .select('id, name, type')
      .eq('user_id', profile.id)
      .order('name');

    return NextResponse.json({ wallets: wallets ?? [], categories: categories ?? [] });
  } catch {
    return NextResponse.json({ message: 'Server error.' }, { status: 500 });
  }
}
