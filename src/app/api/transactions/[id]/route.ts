import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser, recalculateWalletBalance } from '@/lib/supabase/helpers';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    if (!await getAuthUser(supabase)) return NextResponse.json({ message: 'Unauthenticated.' }, { status: 401 });

    const { data, error } = await supabase
      .from('transactions')
      .select('*, category:categories(*), wallet:wallets(*)')
      .eq('id', id)
      .single();

    if (error) return NextResponse.json({ message: 'Not found.' }, { status: 404 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ message: 'Server error.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    if (!await getAuthUser(supabase)) return NextResponse.json({ message: 'Unauthenticated.' }, { status: 401 });

    // Ambil wallet_id lama sebelum update
    const { data: oldTx } = await supabase.from('transactions').select('wallet_id').eq('id', id).single();
    const oldWalletId = oldTx?.wallet_id;

    const body = await req.json();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    ['wallet_id', 'category_id', 'type', 'amount', 'description', 'date'].forEach(k => {
      if (body[k] !== undefined) updates[k] = body[k];
    });

    const { data: tx, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select('*, category:categories(*), wallet:wallets(*)')
      .single();

    if (error) return NextResponse.json({ message: 'Not found.' }, { status: 404 });

    // Recalculate wallet lama
    if (oldWalletId) await recalculateWalletBalance(supabase, oldWalletId);
    // Recalculate wallet baru jika berbeda
    if (body.wallet_id && body.wallet_id !== oldWalletId) {
      await recalculateWalletBalance(supabase, body.wallet_id);
    }

    return NextResponse.json(tx);
  } catch {
    return NextResponse.json({ message: 'Server error.' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    if (!await getAuthUser(supabase)) return NextResponse.json({ message: 'Unauthenticated.' }, { status: 401 });

    const { data: tx } = await supabase.from('transactions').select('wallet_id').eq('id', id).single();
    const walletId = tx?.wallet_id;

    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) return NextResponse.json({ message: 'Not found.' }, { status: 404 });

    if (walletId) await recalculateWalletBalance(supabase, walletId);

    return NextResponse.json({ message: 'Transaksi dihapus.' });
  } catch {
    return NextResponse.json({ message: 'Server error.' }, { status: 500 });
  }
}
