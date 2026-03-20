import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/supabase/helpers';

export async function GET() {
  try {
    const supabase = await createClient();
    if (!await getAuthUser(supabase)) return NextResponse.json({ message: 'Unauthenticated.' }, { status: 401 });

    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ message: 'Server error.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getAuthUser(supabase);
    if (!user) return NextResponse.json({ message: 'Unauthenticated.' }, { status: 401 });

    const body = await req.json();
    const { name, balance = 0, currency = 'IDR', icon, color = '#10b981' } = body;

    if (!name) return NextResponse.json({ message: 'Nama wajib diisi.' }, { status: 422 });

    const { data, error } = await supabase
      .from('wallets')
      .insert({ user_id: user.id, name, balance, currency, icon, color })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ message: 'Server error.' }, { status: 500 });
  }
}
