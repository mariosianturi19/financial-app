import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/supabase/helpers';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    if (!await getAuthUser(supabase)) return NextResponse.json({ message: 'Unauthenticated.' }, { status: 401 });

    const { data, error } = await supabase.from('categories').select('*').eq('id', id).single();
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
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    ['name', 'type', 'icon', 'color'].forEach(k => { if (body[k] !== undefined) updates[k] = body[k]; });

    const { data, error } = await supabase.from('categories').update(updates).eq('id', id).select().single();
    if (error) return NextResponse.json({ message: 'Not found.' }, { status: 404 });
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

    // Cek apakah kategori default — tidak bisa dihapus
    const { data: cat } = await supabase.from('categories').select('is_default').eq('id', id).single();
    if (cat?.is_default) {
      return NextResponse.json({ message: 'Kategori default tidak bisa dihapus.' }, { status: 403 });
    }

    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) return NextResponse.json({ message: 'Not found.' }, { status: 404 });
    return NextResponse.json({ message: 'Kategori dihapus.' });
  } catch {
    return NextResponse.json({ message: 'Server error.' }, { status: 500 });
  }
}
