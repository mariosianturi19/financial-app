import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const LARAVEL_API = process.env.LARAVEL_API_URL || 'http://localhost:8000/api';

export async function GET(_req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ message: 'Unauthenticated.' }, { status: 401 });
    }

    const laravelRes = await fetch(`${LARAVEL_API}/me`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!laravelRes.ok) {
      // Token tidak valid — hapus cookie dan return 401
      cookieStore.delete('auth_token');
      return NextResponse.json({ message: 'Unauthenticated.' }, { status: 401 });
    }

    const user = await laravelRes.json();
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
