import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { recalculateWalletBalance, getTransferAdminFee } from '@/lib/supabase/helpers';

/**
 * POST /api/bot/transfer
 * Transfer antar wallet via WA Bot.
 * Body: { phone, amount, from_query, to_query, notes? }
 * Diamankan dengan header x-bot-api-key.
 */
export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-bot-api-key');
    if (!apiKey || apiKey !== process.env.BOT_API_KEY) {
      return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
    }

    const supabase = supabaseAdmin;
    const body = await req.json();
    const { phone, amount, from_query, to_query, notes } = body;

    if (!phone || !amount || !from_query || !to_query) {
      return NextResponse.json({
        message: 'phone, amount, from_query, dan to_query wajib ada.',
      }, { status: 422 });
    }

    const transferAmount = Number(amount);
    if (transferAmount <= 0) {
      return NextResponse.json({ message: 'Jumlah transfer harus lebih dari 0.' }, { status: 422 });
    }

    const rp = (n: number) =>
      new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

    // ── 1. Temukan user ───────────────────────────────────────────
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

    // ── 2. Ambil semua wallet user ────────────────────────────────
    const { data: wallets } = await supabase
      .from('wallets')
      .select('id, name, balance, wallet_type')
      .eq('user_id', profile.id);

    const wList = wallets ?? [];
    const walletNames = wList.map((w) => w.name).join(', ') || 'belum ada wallet';

    if (wList.length < 2) {
      return NextResponse.json({
        message: `Transfer membutuhkan minimal 2 wallet. Wallet kamu saat ini: ${walletNames}.`,
        code: 'NOT_ENOUGH_WALLETS',
      }, { status: 422 });
    }

    // ── 3. Resolusi wallet sumber & tujuan ────────────────────────
    const fromQ = from_query.toLowerCase().trim();
    const toQ   = to_query.toLowerCase().trim();

    const fromWallet = wList.find((w) => w.name.toLowerCase().includes(fromQ));
    const toWallet   = wList.find((w) => w.name.toLowerCase().includes(toQ));

    if (!fromWallet) {
      return NextResponse.json({
        message: `Wallet sumber "${from_query}" tidak ditemukan. Wallet kamu: ${walletNames}.`,
        code: 'WALLET_NOT_FOUND',
      }, { status: 404 });
    }
    if (!toWallet) {
      return NextResponse.json({
        message: `Wallet tujuan "${to_query}" tidak ditemukan. Wallet kamu: ${walletNames}.`,
        code: 'WALLET_NOT_FOUND',
      }, { status: 404 });
    }
    if (fromWallet.id === toWallet.id) {
      return NextResponse.json({
        message: 'Wallet sumber dan tujuan tidak boleh sama.',
        code: 'SAME_WALLET',
      }, { status: 422 });
    }

    // ── 4. Hitung biaya admin dan cek saldo ───────────────────────
    const adminFee     = getTransferAdminFee(fromWallet.wallet_type ?? '', toWallet.wallet_type ?? '');
    const totalDeducted = transferAmount + adminFee;

    if (Number(fromWallet.balance) < totalDeducted) {
      return NextResponse.json({
        message: `Saldo tidak cukup!\nSaldo ${fromWallet.name}: ${rp(Number(fromWallet.balance))}\nDibutuhkan: ${rp(transferAmount)} + admin fee ${rp(adminFee)} = ${rp(totalDeducted)}`,
        code: 'INSUFFICIENT_BALANCE',
      }, { status: 422 });
    }

    // ── 5. Insert record transfer ─────────────────────────────────
    const todayWIB = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { data: transfer, error: tfErr } = await supabase
      .from('transfers')
      .insert({
        user_id:        profile.id,
        from_wallet_id: fromWallet.id,
        to_wallet_id:   toWallet.id,
        amount:         transferAmount,
        admin_fee:      adminFee,
        total_deducted: totalDeducted,
        notes:          notes ?? `Transfer via WA Bot`,
        date:           todayWIB,
      })
      .select('id')
      .single();

    if (tfErr) throw tfErr;

    // ── 6. Recalculate saldo kedua wallet ─────────────────────────
    const [newFromBalance, newToBalance] = await Promise.all([
      recalculateWalletBalance(supabase, fromWallet.id),
      recalculateWalletBalance(supabase, toWallet.id),
    ]);

    return NextResponse.json({
      success:          true,
      transfer_id:      transfer.id,
      from_wallet_name: fromWallet.name,
      to_wallet_name:   toWallet.name,
      amount:           transferAmount,
      admin_fee:        adminFee,
      total_deducted:   totalDeducted,
      from_balance:     newFromBalance,
      to_balance:       newToBalance,
    }, { status: 201 });

  } catch {
    return NextResponse.json({ message: 'Server error.' }, { status: 500 });
  }
}
