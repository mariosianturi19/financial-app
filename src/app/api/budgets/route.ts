import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/supabase/helpers';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getAuthUser(supabase);
    if (!user) return NextResponse.json({ message: 'Unauthenticated.' }, { status: 401 });

    const month = req.nextUrl.searchParams.get('month') ?? new Date().toISOString().substring(0, 7);
    const [y, m] = month.split('-').map(Number);

    const { data: budgets, error } = await supabase
      .from('budgets')
      .select('*, category:categories(*)')
      .eq('month', month);

    if (error) throw error;

    const monthStart = new Date(y, m - 1, 1).toISOString().split('T')[0];
    const monthEnd   = new Date(y, m, 0).toISOString().split('T')[0];

    // Fetch semua transaksi bulan ini untuk hitung spent per kategori
    const { data: txs } = await supabase
      .from('transactions')
      .select('category_id, amount')
      .eq('type', 'expense')
      .gte('date', monthStart)
      .lte('date', monthEnd);

    const spentMap: Record<number, number> = {};
    (txs ?? []).forEach(tx => {
      spentMap[tx.category_id] = (spentMap[tx.category_id] ?? 0) + Number(tx.amount);
    });

    const result = (budgets ?? []).map(b => ({
      ...b,
      spent: spentMap[b.category_id] ?? 0,
    }));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ message: 'Server error.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getAuthUser(supabase);
    if (!user) return NextResponse.json({ message: 'Unauthenticated.' }, { status: 401 });

    const { category_id, amount, month } = await req.json();
    if (!category_id || !amount || !month) {
      return NextResponse.json({ message: 'Field wajib tidak lengkap.' }, { status: 422 });
    }

    // Upsert (sama seperti updateOrCreate di Laravel)
    const { data, error } = await supabase
      .from('budgets')
      .upsert(
        { user_id: user.id, category_id, amount, month, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,category_id,month' }
      )
      .select('*, category:categories(*)')
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ message: 'Server error.' }, { status: 500 });
  }
}
