import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser, recalculateWalletBalance } from '@/lib/supabase/helpers';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    if (!await getAuthUser(supabase)) return NextResponse.json({ message: 'Unauthenticated.' }, { status: 401 });

    const sp = req.nextUrl.searchParams;
    const perPage    = Math.min(Math.max(parseInt(sp.get('per_page') ?? '20'), 5), 100);
    const page       = Math.max(parseInt(sp.get('page') ?? '1'), 1);
    const offset     = (page - 1) * perPage;

    let query = supabase
      .from('transactions')
      .select('*, category:categories(*), wallet:wallets(*)', { count: 'exact' });

    if (sp.get('type'))        query = query.eq('type', sp.get('type')!);
    if (sp.get('wallet_id'))   query = query.eq('wallet_id', sp.get('wallet_id')!);
    if (sp.get('category_id')) query = query.eq('category_id', sp.get('category_id')!);
    if (sp.get('start_date') && sp.get('end_date')) {
      query = query.gte('date', sp.get('start_date')!).lte('date', sp.get('end_date')!);
    }

    const { data, count, error } = await query
      .order('date', { ascending: false })
      .order('id', { ascending: false })
      .range(offset, offset + perPage - 1);

    if (error) throw error;

    const total     = count ?? 0;
    const lastPage  = Math.ceil(total / perPage);

    return NextResponse.json({
      data:         data ?? [],
      current_page: page,
      last_page:    lastPage,
      per_page:     perPage,
      total,
      has_more:     page < lastPage,
    });
  } catch {
    return NextResponse.json({ message: 'Server error.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getAuthUser(supabase);
    if (!user) return NextResponse.json({ message: 'Unauthenticated.' }, { status: 401 });

    const { wallet_id, category_id, type, amount, description, date } = await req.json();

    if (!wallet_id || !category_id || !type || !amount || !date) {
      return NextResponse.json({ message: 'Field wajib tidak lengkap.' }, { status: 422 });
    }
    if (!['income', 'expense'].includes(type)) {
      return NextResponse.json({ message: 'Type harus income atau expense.' }, { status: 422 });
    }

    const { data: tx, error } = await supabase
      .from('transactions')
      .insert({ user_id: user.id, wallet_id, category_id, type, amount, description, date })
      .select('*, category:categories(*), wallet:wallets(*)')
      .single();

    if (error) throw error;

    // Recalculate balance sebagai safety net
    await recalculateWalletBalance(supabase, wallet_id);

    return NextResponse.json(tx, { status: 201 });
  } catch {
    return NextResponse.json({ message: 'Server error.' }, { status: 500 });
  }
}
