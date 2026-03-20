import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ message: 'Unauthenticated.' }, { status: 401 });
    }

    return NextResponse.json({
      id:    user.id,
      name:  user.user_metadata?.name ?? user.email,
      email: user.email,
    });
  } catch {
    return NextResponse.json({ message: 'Server error.' }, { status: 500 });
  }
}
