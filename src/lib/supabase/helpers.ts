import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Hitung ulang saldo wallet berdasarkan initial_balance + semua transaksi.
 *
 * Formula: balance = initial_balance + SUM(income) - SUM(expense)
 *
 * Ini memastikan saldo awal yang diinputkan user saat buat wallet
 * selalu menjadi basis perhitungan, bukan nol.
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

  const balance = initialBalance + txDelta;

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
