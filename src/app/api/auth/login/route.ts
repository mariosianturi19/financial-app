import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return NextResponse.json(
        { message: 'Email atau password salah.' },
        { status: 422 }
      );
    }

    const user = {
      id:    data.user.id,
      name:  data.user.user_metadata?.name ?? data.user.email,
      email: data.user.email,
    };

    // Session + cookies sudah di-set otomatis oleh @supabase/ssr
    return NextResponse.json({ user }, { status: 200 });
  } catch {
    return NextResponse.json({ message: 'Server error.' }, { status: 500 });
  }
}
