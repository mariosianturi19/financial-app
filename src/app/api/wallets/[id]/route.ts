import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser, recalculateWalletBalance } from '@/lib/supabase/helpers';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    if (!await getAuthUser(supabase)) return NextResponse.json({ message: 'Unauthenticated.' }, { status: 401 });

    const { data, error } = await supabase.from('wallets').select('*').eq('id', id).single();
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

    const body = await req.json();

    // Fields yang boleh diedit user
    const allowed = ['name', 'currency', 'icon', 'color'];
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    allowed.forEach(k => { if (body[k] !== undefined) updates[k] = body[k]; });

    // Jika user mengedit 'balance' (saldo awal baru), update initial_balance juga
    // lalu recalculate balance aktual dari initial_balance + transaksi
    const balanceEdited = body.balance !== undefined;
    if (balanceEdited) {
      updates.initial_balance = Number(body.balance);
      // balance aktual akan dihitung ulang di bawah
    }

    const { data, error } = await supabase
      .from('wallets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ message: 'Not found.' }, { status: 404 });

    // Selalu recalculate setelah edit untuk menjaga konsistensi
    await recalculateWalletBalance(supabase, Number(id));

    // Kembalikan data wallet terbaru setelah recalculate
    const { data: fresh } = await supabase.from('wallets').select('*').eq('id', id).single();
    return NextResponse.json(fresh ?? data);
  } catch {
    return NextResponse.json({ message: 'Server error.' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    if (!await getAuthUser(supabase)) return NextResponse.json({ message: 'Unauthenticated.' }, { status: 401 });

    const { error } = await supabase.from('wallets').delete().eq('id', id);
    if (error) return NextResponse.json({ message: 'Not found.' }, { status: 404 });
    return NextResponse.json({ message: 'Dompet dihapus.' });
  } catch {
    return NextResponse.json({ message: 'Server error.' }, { status: 500 });
  }
}
