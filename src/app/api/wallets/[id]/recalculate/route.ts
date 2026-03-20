import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser, recalculateWalletBalance } from '@/lib/supabase/helpers';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    if (!await getAuthUser(supabase)) return NextResponse.json({ message: 'Unauthenticated.' }, { status: 401 });

    const newBalance = await recalculateWalletBalance(supabase, Number(id));

    const { data } = await supabase.from('wallets').select('*').eq('id', id).single();
    return NextResponse.json({ message: 'Saldo berhasil dihitung ulang.', wallet: data });
  } catch {
    return NextResponse.json({ message: 'Server error.' }, { status: 500 });
  }
}
