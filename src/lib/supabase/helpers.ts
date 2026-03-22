import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Hitung ulang saldo wallet:
 * balance = initial_balance
 *         + SUM(income transactions)
 *         - SUM(expense transactions)
 *         + SUM(amount dari transfers masuk ke wallet ini)
 *         - SUM(total_deducted dari transfers keluar dari wallet ini)
 */
export async function recalculateWalletBalance(
  supabase: SupabaseClient,
  walletId: number
): Promise<number> {
  // Ambil initial_balance dari wallet
  const { data: wallet } = await supabase
    .from('wallets')
    .select('initial_balance')
    .eq('id', walletId)
    .single();

  const initialBalance = Number(wallet?.initial_balance ?? 0);

  // Jumlahkan semua transaksi
  const { data: txList } = await supabase
    .from('transactions')
    .select('type, amount')
    .eq('wallet_id', walletId);

  const txDelta = (txList ?? []).reduce(
    (sum: number, tx: { type: string; amount: string | number }) => {
      const amt = Number(tx.amount);
      return sum + (tx.type === 'income' ? amt : -amt);
    },
    0
  );

  // Jumlahkan transfer masuk (amount diterima)
  const { data: transfersIn } = await supabase
    .from('transfers')
    .select('amount')
    .eq('to_wallet_id', walletId);
  const inDelta = (transfersIn ?? []).reduce((s: number, t: { amount: string | number }) => s + Number(t.amount), 0);

  // Jumlahkan transfer keluar (total_deducted = amount + admin_fee)
  const { data: transfersOut } = await supabase
    .from('transfers')
    .select('total_deducted')
    .eq('from_wallet_id', walletId);
  const outDelta = (transfersOut ?? []).reduce((s: number, t: { total_deducted: string | number }) => s + Number(t.total_deducted), 0);

  const balance = initialBalance + txDelta + inDelta - outDelta;

  await supabase
    .from('wallets')
    .update({ balance, updated_at: new Date().toISOString() })
    .eq('id', walletId);

  return balance;
}

/**
 * Ambil authenticated user dari Supabase server client.
 * Return null jika tidak ada session.
 */
export async function getAuthUser(supabase: SupabaseClient) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

/**
 * Biaya admin transfer berdasarkan tipe wallet sumber dan tujuan
 */
export function getTransferAdminFee(fromType: string, toType: string): number {
  if (fromType === 'bank'    && toType === 'ewallet') return 1000;
  if (fromType === 'ewallet' && toType === 'bank')    return 2500;
  return 0; // bank→bank atau ewallet→ewallet gratis
}
