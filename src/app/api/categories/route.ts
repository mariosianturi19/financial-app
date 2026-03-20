import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/supabase/helpers';

export async function GET() {
  try {
    const supabase = await createClient();
    if (!await getAuthUser(supabase)) return NextResponse.json({ message: 'Unauthenticated.' }, { status: 401 });

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('is_default', { ascending: false })
      .order('name');

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

    const { name, type, icon, color = '#6366f1' } = await req.json();
    if (!name || !type) return NextResponse.json({ message: 'Nama dan type wajib diisi.' }, { status: 422 });
    if (!['income', 'expense'].includes(type)) return NextResponse.json({ message: 'Type harus income atau expense.' }, { status: 422 });

    const { data, error } = await supabase
      .from('categories')
      .insert({ user_id: user.id, name, type, icon, color, is_default: false })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ message: 'Server error.' }, { status: 500 });
  }
}
