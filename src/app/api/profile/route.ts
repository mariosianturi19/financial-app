import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthUser } from '@/lib/supabase/helpers';

/** GET /api/profile — ambil profil user saat ini (termasuk phone_number) */
export async function GET() {
  try {
    const supabase = await createClient();
    const user = await getAuthUser(supabase);
    if (!user) return NextResponse.json({ message: 'Unauthenticated.' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('phone_number')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      id:           user.id,
      name:         user.user_metadata?.name ?? user.email,
      email:        user.email,
      phone_number: profile?.phone_number ?? null,
    });
  } catch {
    return NextResponse.json({ message: 'Server error.' }, { status: 500 });
  }
}

/** PUT /api/profile — update phone_number user */
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getAuthUser(supabase);
    if (!user) return NextResponse.json({ message: 'Unauthenticated.' }, { status: 401 });

    const body = await req.json();
    let phone = (body.phone_number ?? '').replace(/\D/g, ''); // strip non-digit

    // Normalisasi: 08xx → 628xx
    if (phone.startsWith('0')) phone = '62' + phone.slice(1);

    if (phone && !/^62\d{8,13}$/.test(phone)) {
      return NextResponse.json({ message: 'Format nomor tidak valid. Contoh: 08123456789 atau 628123456789.' }, { status: 422 });
    }

    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, phone_number: phone || null, updated_at: new Date().toISOString() })
      .select('phone_number')
      .single();

    if (error) throw error;
    return NextResponse.json({ phone_number: data.phone_number });
  } catch {
    return NextResponse.json({ message: 'Server error.' }, { status: 500 });
  }
}
