import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/supabase/helpers';

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    if (!await getAuthUser(supabase)) return NextResponse.json({ message: 'Unauthenticated.' }, { status: 401 });

    const body = await req.json();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    // Hanya izinkan update 'amount' dan/atau 'month'
    if (body.amount !== undefined) updates.amount = Number(body.amount);
    if (body.month  !== undefined) updates.month  = body.month;

    if (Object.keys(updates).length === 1) {
      return NextResponse.json({ message: 'Tidak ada data yang diupdate.' }, { status: 422 });
    }

    const { data, error } = await supabase
      .from('budgets')
      .update(updates)
      .eq('id', id)
      .select('*, category:categories(*)')
      .single();

    if (error) return NextResponse.json({ message: 'Budget tidak ditemukan.' }, { status: 404 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ message: 'Server error.' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    if (!await getAuthUser(supabase)) return NextResponse.json({ message: 'Unauthenticated.' }, { status: 401 });

    const { error } = await supabase.from('budgets').delete().eq('id', id);
    if (error) return NextResponse.json({ message: 'Not found.' }, { status: 404 });
    return NextResponse.json({ message: 'Budget dihapus.' });
  } catch {
    return NextResponse.json({ message: 'Server error.' }, { status: 500 });
  }
}
