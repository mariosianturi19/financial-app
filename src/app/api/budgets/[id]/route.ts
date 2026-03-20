import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/supabase/helpers';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
