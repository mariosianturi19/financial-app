import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Hitung ulang saldo wallet dari nol berdasarkan semua transaksi.
 * Sama persis dengan Wallet::recalculateBalance() di Laravel.
 */
export async function recalculateWalletBalance(
  supabase: SupabaseClient,
  walletId: number
): Promise<number> {
  const { data } = await supabase
    .from('transactions')
    .select('type, amount')
    .eq('wallet_id', walletId);

  const balance = (data ?? []).reduce((sum: number, tx: { type: string; amount: string | number }) => {
    const amt = Number(tx.amount);
    return sum + (tx.type === 'income' ? amt : -amt);
  }, 0);

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
