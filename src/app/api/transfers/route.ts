import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser, recalculateWalletBalance, getTransferAdminFee } from '@/lib/supabase/helpers';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getAuthUser(supabase);
    if (!user) return NextResponse.json({ message: 'Unauthenticated.' }, { status: 401 });

    const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '50'), 100);

    const { data, error } = await supabase
      .from('transfers')
      .select('*, from_wallet:wallets!transfers_from_wallet_id_fkey(*), to_wallet:wallets!transfers_to_wallet_id_fkey(*)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch {
    return NextResponse.json({ message: 'Server error.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getAuthUser(supabase);
    if (!user) return NextResponse.json({ message: 'Unauthenticated.' }, { status: 401 });

    const body = await req.json();
    const { from_wallet_id, to_wallet_id, amount, notes } = body;
    const transferAmount = Number(amount);

    // Validasi field
    if (!from_wallet_id || !to_wallet_id || !transferAmount) {
      return NextResponse.json({ message: 'from_wallet_id, to_wallet_id, dan amount wajib diisi.' }, { status: 422 });
    }
    if (from_wallet_id === to_wallet_id) {
      return NextResponse.json({ message: 'Wallet sumber dan tujuan tidak boleh sama.' }, { status: 422 });
    }
    if (transferAmount <= 0) {
      return NextResponse.json({ message: 'Jumlah transfer harus lebih dari 0.' }, { status: 422 });
    }

    // Ambil kedua wallet + validasi kepemilikan
    const { data: fromWallet } = await supabase
      .from('wallets')
      .select('id, balance, wallet_type, name')
      .eq('id', from_wallet_id)
      .single();

    const { data: toWallet } = await supabase
      .from('wallets')
      .select('id, balance, wallet_type, name')
      .eq('id', to_wallet_id)
      .single();

    if (!fromWallet || !toWallet) {
      return NextResponse.json({ message: 'Wallet tidak ditemukan.' }, { status: 404 });
    }

    // Hitung biaya admin
    const adminFee     = getTransferAdminFee(fromWallet.wallet_type, toWallet.wallet_type);
    const totalDeducted = transferAmount + adminFee;

    // Cek saldo cukup
    if (Number(fromWallet.balance) < totalDeducted) {
      return NextResponse.json({
        message: `Saldo tidak cukup. Dibutuhkan Rp${totalDeducted.toLocaleString('id-ID')} (transfer + admin fee Rp${adminFee.toLocaleString('id-ID')}), saldo tersedia Rp${Number(fromWallet.balance).toLocaleString('id-ID')}.`,
      }, { status: 422 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Buat record transfer
    const { data: transfer, error: txErr } = await supabase
      .from('transfers')
      .insert({
        user_id:        user.id,
        from_wallet_id: Number(from_wallet_id),
        to_wallet_id:   Number(to_wallet_id),
        amount:         transferAmount,
        admin_fee:      adminFee,
        total_deducted: totalDeducted,
        notes:          notes ?? null,
        date:           today,
      })
      .select('*, from_wallet:wallets!transfers_from_wallet_id_fkey(*), to_wallet:wallets!transfers_to_wallet_id_fkey(*)')
      .single();

    if (txErr) throw txErr;

    // Recalculate kedua wallet
    const [newFromBalance, newToBalance] = await Promise.all([
      recalculateWalletBalance(supabase, Number(from_wallet_id)),
      recalculateWalletBalance(supabase, Number(to_wallet_id)),
    ]);

    return NextResponse.json({
      transfer,
      from_wallet_balance: newFromBalance,
      to_wallet_balance:   newToBalance,
      admin_fee:           adminFee,
      total_deducted:      totalDeducted,
    }, { status: 201 });
  } catch {
    return NextResponse.json({ message: 'Server error.' }, { status: 500 });
  }
}
