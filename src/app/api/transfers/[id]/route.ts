import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser, recalculateWalletBalance } from '@/lib/supabase/helpers';

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    if (!await getAuthUser(supabase)) return NextResponse.json({ message: 'Unauthenticated.' }, { status: 401 });

    // Ambil wallet IDs sebelum hapus (untuk recalculate)
    const { data: transfer } = await supabase
      .from('transfers')
      .select('from_wallet_id, to_wallet_id')
      .eq('id', id)
      .single();

    if (!transfer) return NextResponse.json({ message: 'Transfer tidak ditemukan.' }, { status: 404 });

    const { error } = await supabase.from('transfers').delete().eq('id', id);
    if (error) return NextResponse.json({ message: 'Gagal menghapus transfer.' }, { status: 500 });

    // Recalculate kedua wallet setelah transfer dihapus
    await Promise.all([
      recalculateWalletBalance(supabase, transfer.from_wallet_id),
      recalculateWalletBalance(supabase, transfer.to_wallet_id),
    ]);

    return NextResponse.json({ message: 'Transfer dihapus.' });
  } catch {
    return NextResponse.json({ message: 'Server error.' }, { status: 500 });
  }
}
